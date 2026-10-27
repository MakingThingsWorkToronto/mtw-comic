"""Offline behavioral checks. Never calls a provider or reads a real API key."""
import copy, io, json, os, tempfile, unittest, urllib.error
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch
import audition as a

class AuditionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.root = Path(self.temp.name)
        self.approval = patch.object(a, 'human_approval', return_value={'test':'Offline injected approval; never canonical or provider evidence'}); self.approval.start()
        self.raw = {'provider':'Fish Audio','modelId':a.MODEL,'characterId':'matt','scriptId':'character-read',
                    'scriptSource':'wiki/site/comic-story.md','voiceId':'0b74ead073f2474a904f69033535b98e',
                    'voiceName':'Matt — “plain”','text':'Ask them first. — Don’t guess.'}
        self.expected = a.recipe(self.raw); self.audio = b'ID3' + bytes(128)
        self.profiles = {'profiles':[{'characterId':'matt','delivery':'Fewest words.', 'auditionScripts':[
            {'id':'character-read','text':self.raw['text'],'source':self.raw['scriptSource']}]}]}
        self.profiles['profiles'][0].update(provider='Fish Audio', voiceId=self.raw['voiceId'])
        self.choose('matt', self.raw['voiceId'])
        repo = Path(os.environ['MTW_TEST_REPO']) if os.environ.get('MTW_TEST_REPO') else next(p for p in Path(__file__).resolve().parents if (p/'AGENTS.md').exists())
        for rel in ['site/scripts/comic-speech-approval.mjs', 'scripts/comics/voice-casting.mjs']:
            target = self.root/rel; target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((repo/rel).read_bytes())
        a.write_new(self.root/'wiki/comics-library/characters.json', {'characters':[{'id':'matt'},{'id':'second-brain'}]})
        self.catalog = {'voices':[{'provider':'Fish Audio','voiceId':self.raw['voiceId']}]}
        a.write_new(self.root/'wiki/comics-library/provider-voices.json', self.catalog)
    def choose(self, cid, vid, provider='Fish Audio', held=False):
        p = next((p for p in self.profiles['profiles'] if p['characterId']==cid), None)
        if p is None:
            p={'characterId':cid}; self.profiles['profiles'].append(p)
        p.update(provider=provider,voiceId=vid,casting={'selectedVoice':{'provider':provider,'voiceId':vid,
            'status':'approved','selectedBy':'Matt Stark','selectedAt':'2026-10-11T00:00:00Z','productionHold':held}})
        file=self.root/'wiki/comics-library/voices.json';file.parent.mkdir(parents=True,exist_ok=True)
        file.write_text(json.dumps(self.profiles),encoding='utf-8')
    def catalog_voice(self, vid, provider='Fish Audio'):
        self.catalog['voices'].append({'provider':provider,'voiceId':vid})
        (self.root/'wiki/comics-library/provider-voices.json').write_text(json.dumps(self.catalog),encoding='utf-8')
    def tearDown(self): self.approval.stop(); self.temp.cleanup()
    def prepared(self): return a.plan(self.root,self.expected,'v2',decoder=lambda _:1.2)
    def saved(self, home='legacy'):
        path = 'assets/voices/matt/fish-v1-character-read.mp3' if home=='legacy' else 'wiki/soundtrack-library/assets/voices/matt/fish-v1-character-read.mp3'
        file = a.media_path(self.root,path); file.parent.mkdir(parents=True,exist_ok=True); file.write_bytes(self.audio)
        receipt = {**self.expected,'status':'saved','savedAsset':{'path':path,'sha256':a.digest(self.audio),'bytes':len(self.audio)}}
        record = self.root/'wiki/comics-library/records/saved.json'; a.write_new(record,receipt)
        return receipt,record,file
    def test_plan_reads_no_key_and_calls_no_network(self):
        with patch.object(a,'credential',side_effect=AssertionError), patch.object(a,'send_once',side_effect=AssertionError):
            planned=self.prepared()
        self.assertEqual(planned['requests'],1); self.assertFalse(planned['paidFallback']); self.assertEqual(planned['automaticRetries'],0)
        self.assertFalse((self.root/planned['receipt']).exists())
    def test_new_request_separates_layout_breaks_from_authorized_words(self):
        raw = {**self.raw, 'text': 'Keep **every**\r\nword.\n\n[calm] Don’t\tguess.'}
        exact = a.recipe(raw)
        spoken = a.spoken_request(exact)
        self.assertEqual(spoken['text'], raw['text'])
        self.assertEqual(spoken['textSha256'], a.digest(raw['text'].encode('utf-8')))
        self.assertEqual(spoken['settings']['text'], 'Keep **every** word. [calm] Don’t guess.')
        self.assertEqual(spoken['text'].split(), spoken['spokenText'].split())
        self.assertEqual(spoken['spokenTextSha256'], a.digest(spoken['settings']['text'].encode('utf-8')))
        self.assertEqual(a.recipe(spoken)['settings'], spoken['settings'])
        changed = copy.deepcopy(spoken); changed['settings']['text'] = 'Keep different words.'
        with self.assertRaises(a.SafeError): a.recipe(changed)
    def test_generation_normalizes_manual_prepared_request_without_changing_authority(self):
        raw = {**self.raw, 'text':'Ask them\nfirst. — Don’t\nguess.'}
        exact = a.recipe(raw)
        self.profiles['profiles'][0]['auditionScripts'][0]['text'] = raw['text']
        self.choose('matt', raw['voiceId'])
        planned = a.plan(self.root, exact, 'v2', decoder=lambda _:1.2)
        planned['request'] = exact  # old plan shape must also normalize at transport boundary
        calls=[]
        with patch.dict(os.environ,{'FISH_AUDIO_API_KEY':'PRIVATE_TEST_KEY'}):
            result=a.generate(self.root,planned,transport=lambda body,key:(calls.append(body) or self.audio,200,{}),decoder=lambda _:1.2)
        self.assertEqual(calls[0]['text'], 'Ask them first. — Don’t guess.')
        self.assertEqual(result['text'], raw['text'])
        self.assertNotEqual(result['textSha256'], result['spokenTextSha256'])
    def test_old_newline_receipt_still_reuses_exact_retained_bytes(self):
        self.raw['text'] = 'Ask them\nfirst.'; self.expected = a.recipe(self.raw)
        self.profiles['profiles'][0]['auditionScripts'][0]['text'] = self.raw['text']
        self.choose('matt',self.raw['voiceId'])
        self.saved()
        planned=self.prepared()
        self.assertEqual(planned['requests'],0)
        self.assertEqual(planned['request']['settings']['text'],'Ask them\nfirst.')
    def test_exact_cache_reuses_legacy_and_canonical_bytes(self):
        for home in ['legacy','canonical']:
            with self.subTest(home=home):
                receipt,record,file=self.saved(home); planned=self.prepared()
                self.assertEqual(planned['requests'],0); self.assertEqual(planned['cache']['asset']['sha256'],a.digest(self.audio))
                with patch.object(a,'credential',side_effect=AssertionError): self.assertEqual(a.generate(self.root,planned),planned)
                record.unlink(); file.unlink()
    def test_unresolved_attempt_blocks_new_version(self):
        for status in ['started','unknown','rejected','saved-unvalidated']:
            file=self.root/'wiki/comics-library/records/attempt.json'; a.write_new(file,{**self.expected,'status':status})
            with self.assertRaises(a.SafeError): self.prepared()
            file.unlink()
    def test_voice_namespace_model_text_hash_and_delivery(self):
        for changed in [{'voiceId':'ElevenLabsId'},{'modelId':'s2.1-pro'},{'textSha256':'0'*64}]:
            with self.assertRaises(a.SafeError): a.recipe({**self.raw,**changed})
        changed=copy.deepcopy(self.expected); changed['settings']['reference_id']='0'*32
        with self.assertRaises(a.SafeError): a.recipe(changed)
        changed=copy.deepcopy(self.expected); changed['settings']['prosody']['speed']=4
        with self.assertRaises(a.SafeError): a.recipe(changed)
    def test_current_script_must_match_exact_unicode_and_source(self):
        for field,value in [('text','Different.'),('scriptSource','other.md')]:
            changed=copy.deepcopy(self.expected); changed[field]=value
            with self.assertRaises(a.SafeError): a.plan(self.root,changed,'v2',decoder=lambda _:1)
    def test_cache_hash_container_and_size_fail_without_retry(self):
        receipt,record,file=self.saved()
        for data in [b'ID3wrong',b'RIFF1234WAVE' + bytes(119)]:
            file.write_bytes(data)
            with self.assertRaises(a.SafeError): self.prepared()
    def test_canonical_paths_cannot_escape(self):
        for path in ['wiki/soundtrack-library/assets/voices/matt/../../other.mp3','C:/secret.mp3','assets/voices/matt\\other.mp3','wiki/image-library/other.mp3']:
            with self.assertRaises(a.SafeError): a.media_path(self.root,path)
        self.assertEqual(a.media_path(self.root,'../soundtrack-library/assets/voices/matt/test.mp3'),self.root/'wiki/soundtrack-library/assets/voices/matt/test.mp3')
    def test_single_mock_request_retains_dependencies_unicode_and_registration(self):
        planned=self.prepared(); calls=[]
        def send(body,key): calls.append((body,key)); return self.audio,200,{'Content-Type':'audio/mpeg'}
        with patch.dict(os.environ,{'FISH_AUDIO_API_KEY':'PRIVATE_TEST_KEY'}):
            result=a.generate(self.root,planned,transport=send,decoder=lambda _:1.2)
        self.assertEqual(len(calls),1); self.assertEqual(result['status'],'saved')
        self.assertEqual(result['text'],self.raw['text']); self.assertEqual(result['voiceName'],self.raw['voiceName'])
        self.assertEqual(result['dependencies']['helperSha256'],a.digest(Path(a.__file__).read_bytes()))
        self.assertTrue(result['dependencies']['decoderSha256']); self.assertIn('pythonVersion',result['dependencies'])
        raw=(self.root/planned['receipt']).read_bytes(); self.assertNotIn(b'PRIVATE_TEST_KEY',raw)
        self.assertEqual(json.loads(raw.decode('utf-8'))['text'],self.raw['text'])
        proposal=a.registration(self.root,result,planned)
        self.assertEqual(proposal['comicClip']['canonicalPath'],proposal['soundtrackRecord']['media']['path'])
        self.assertEqual(proposal['comicClip']['sha256'],proposal['soundtrackRecord']['media']['sha256'])
        self.assertEqual(proposal['comicClip']['receiptCanonicalPath'],proposal['soundtrackRecord']['receipt']['path'])
        self.assertTrue(proposal['comicClip']['path'].startswith('../soundtrack-library/'))
        self.assertEqual(self.prepared()['requests'],0)
    def test_unknown_exception_never_logs_key_and_never_retries(self):
        planned=self.prepared(); calls=[]
        def fail(body,key): calls.append(1); raise RuntimeError('provider echoed '+key)
        output=io.StringIO()
        with patch.dict(os.environ,{'FISH_AUDIO_API_KEY':'PRIVATE_TEST_KEY'}),redirect_stdout(output),redirect_stderr(output):
            result=a.generate(self.root,planned,transport=fail,decoder=lambda _:1)
        self.assertEqual(len(calls),1); self.assertEqual(result['status'],'unknown')
        self.assertNotIn('PRIVATE_TEST_KEY',output.getvalue()+json.dumps(result))
        with self.assertRaises(a.SafeError): self.prepared()
    def test_rejected_response_retained_once(self):
        planned=self.prepared(); calls=[]
        def fail(body,key): calls.append(1); raise urllib.error.HTTPError(a.ENDPOINT,429,'limited',{},None)
        with patch.dict(os.environ,{'FISH_AUDIO_API_KEY':'PRIVATE_TEST_KEY'}):
            result=a.generate(self.root,planned,transport=fail,decoder=lambda _:1)
        self.assertEqual(result['status'],'rejected'); self.assertEqual(result['httpStatus'],429); self.assertEqual(len(calls),1)
        with self.assertRaises(a.SafeError): self.prepared()
    def test_missing_decoder_stops_before_network_or_attempt(self):
        planned=self.prepared()
        with patch.dict(os.environ,{'FISH_AUDIO_API_KEY':'PRIVATE_TEST_KEY'}),patch.object(a.shutil,'which',return_value=None):
            with self.assertRaises(a.SafeError): a.generate(self.root,planned,transport=lambda *_:self.fail())
        self.assertFalse((self.root/planned['startedReceipt']).exists())
    def test_missing_human_review_blocks_before_key_attempt_and_provider(self):
        planned=self.prepared()
        with patch.object(a,'human_approval',side_effect=a.SafeError('Human review required')), patch.object(a,'credential',side_effect=AssertionError('Key must not be read')):
            with self.assertRaises(a.SafeError): a.generate(self.root,planned,transport=lambda *_:self.fail('Provider must not be called'))
        self.assertFalse((self.root/planned['startedReceipt']).exists())
    def test_normalizer_hash_bounds_and_no_overwrite_before_encoder(self):
        import normalize_speech as n
        raw=self.root/'wiki/comics-library/assets/voices/matt/source.mp3';raw.parent.mkdir(parents=True,exist_ok=True);raw.write_bytes(self.audio)
        row={'reuse':{'path':'wiki/comics-library/assets/voices/matt/source.mp3','sha256':'0'*64},'normalizedCanonicalPath':'wiki/soundtrack-library/assets/speech/home-20261010/test.mp3','normalizationReceiptCanonicalPath':'wiki/soundtrack-library/records/home-voiceover-20261010/test.json'}
        with patch.object(n,'run',side_effect=AssertionError('No encode')):
            with self.assertRaises(ValueError):n.normalize(self.root,self.root,row)
            row['reuse']['sha256']=a.digest(self.audio);dest=self.root/row['normalizedCanonicalPath'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b'retained')
            with self.assertRaises(ValueError):n.normalize(self.root,self.root,row)
        with self.assertRaises(ValueError):n.safe(self.root,'wiki/soundtrack-library/assets/speech/../escape.mp3',['wiki/soundtrack-library/assets/speech'])
        self.assertEqual(raw.read_bytes(),self.audio);self.assertEqual(dest.read_bytes(),b'retained')
    def test_write_never_overwrites(self):
        path=self.root/'version.json'; a.write_new(path,{'text':'— “Don’t”'})
        with self.assertRaises(FileExistsError): a.write_new(path,{'text':'replacement'})
        self.assertEqual(a.read_json(path)['text'],'— “Don’t”')
    def test_studio_choice_rejects_stale_locked_recipe_before_new_plan(self):
        changed='b'*32; self.catalog_voice(changed); self.choose('matt',changed)
        with patch.object(a,'credential',side_effect=AssertionError), patch.object(a,'send_once',side_effect=AssertionError):
            with self.assertRaisesRegex(a.SafeError,'matching approved voice'): self.prepared()
    def test_generation_rechecks_changed_selection_before_key_or_provider(self):
        planned=self.prepared(); changed='c'*32; self.catalog_voice(changed); self.choose('matt',changed)
        with patch.object(a,'credential',side_effect=AssertionError('No key')):
            with self.assertRaisesRegex(a.SafeError,'matching approved voice'):
                a.generate(self.root,planned,transport=lambda *_:self.fail('No provider'))
        self.assertFalse((self.root/planned['startedReceipt']).exists())
    def test_historical_cache_remains_reuse_without_changing_selection(self):
        self.saved(); changed='d'*32; self.catalog_voice(changed); self.choose('matt',changed)
        planned=self.prepared();self.assertEqual(planned['requests'],0)
        with patch.object(a,'credential',side_effect=AssertionError):self.assertEqual(a.generate(self.root,planned),planned)
        self.assertEqual(a.read_json(self.root/'wiki/comics-library/voices.json')['profiles'][0]['voiceId'],changed)
    def test_unchosen_discovery_is_offline_only(self):
        self.profiles['profiles'][0].pop('casting');(self.root/'wiki/comics-library/voices.json').write_text(json.dumps(self.profiles),encoding='utf-8')
        planned=self.prepared()
        with patch.object(a,'credential',side_effect=AssertionError):
            with self.assertRaisesRegex(a.SafeError,'voice'):a.generate(self.root,planned,transport=lambda *_:self.fail())
    def test_hold_blocks_generic_generation_and_provider_mismatch_blocks_plan(self):
        self.choose('matt',self.raw['voiceId'],held=True);planned=self.prepared()
        with patch.object(a,'credential',side_effect=AssertionError):
            with self.assertRaisesRegex(a.SafeError,'hold'):a.generate(self.root,planned,transport=lambda *_:self.fail())
        self.catalog_voice(self.raw['voiceId'],'ElevenLabs');self.choose('matt',self.raw['voiceId'],'ElevenLabs')
        with self.assertRaisesRegex(a.SafeError,'matching approved voice'):self.prepared()
    def home_fixture(self, vid='e'*32, held=False):
        self.catalog_voice(vid);self.choose('second-brain',vid,held=held)
        for rel in ['site/src/data/comic-stories/home.ts','site/src/data/comic-stories/retime.ts','discussion/spec.md']:
            f=self.root/rel;f.parent.mkdir(parents=True,exist_ok=True)
            f.write_text('Homepage character voiceover and speaking Second Brain',encoding='utf-8')
        line={'id':'home-test-b1','storyId':'home','characterId':'second-brain','provider':'Fish Audio','voiceId':vid,
              'text':'A different current narrator.','kind':'caption','sceneId':'test','panelId':'test','panelIndex':0,
              'balloonIndex':0,'authoredWho':'narrator','rawCanonicalPath':'wiki/soundtrack-library/assets/speech/home-20261010/test.mp3',
              'receiptCanonicalPath':'wiki/soundtrack-library/records/home-voiceover-20261010/test.json'}
        line['textSha256']=a.digest(line['text'].encode())
        plan={'storyId':'home','generation':{'fishModel':a.MODEL},'rows':[line], 'sourceGuards':{rel:a.digest((self.root/rel).read_bytes()) for rel in
              ['site/src/data/comic-stories/home.ts','site/src/data/comic-stories/retime.ts','wiki/comics-library/voices.json','wiki/comics-library/provider-voices.json']}}
        file=self.root/'home-plan.json';file.write_text(json.dumps(plan),encoding='utf-8');return file,plan,line
    def test_home_narrator_uses_different_current_studio_id(self):
        file,plan,line=self.home_fixture();result=a.home_speech_plan(self.root,file,line['id'])
        self.assertEqual(result['request']['voiceId'],'e'*32)
        self.assertEqual(result['request']['settings']['reference_id'],'e'*32)
        self.assertTrue(result['generationAllowed'])  # fake human gate only; no approval inference
    def test_home_previous_mk_identity_is_rejected_by_current_selection(self):
        file,plan,line=self.home_fixture();line['voiceId']='d13f84b987ad4f22b56d2b47f4eb838e';file.write_text(json.dumps(plan),encoding='utf-8')
        with self.assertRaisesRegex(a.SafeError,'matching approved voice'):a.home_speech_plan(self.root,file,line['id'])
    def test_home_hold_can_plan_but_never_generate(self):
        file,plan,line=self.home_fixture(held=True);result=a.home_speech_plan(self.root,file,line['id'])
        self.assertFalse(result['generationAllowed'])
        with patch.object(a,'credential',side_effect=AssertionError):
            with self.assertRaisesRegex(a.SafeError,'hold'):a.generate(self.root,result,transport=lambda *_:self.fail())
    def test_home_source_guard_rejects_changed_choice(self):
        file,plan,line=self.home_fixture();self.choose('second-brain','e'*32,held=True)
        with self.assertRaisesRegex(a.SafeError,'guard changed'):a.home_speech_plan(self.root,file,line['id'])
    def test_home_narration_cannot_route_to_other_character(self):
        file,plan,line=self.home_fixture();line['characterId']='matt';line['voiceId']=self.raw['voiceId'];file.write_text(json.dumps(plan),encoding='utf-8')
        with self.assertRaisesRegex(a.SafeError,'Second Brain'):a.home_speech_plan(self.root,file,line['id'])

    def test_second_brain_is_comparison_only(self):
        with self.assertRaises(a.SafeError): a.recipe({**self.raw,'characterId':'second-brain'})
        value=a.recipe({**self.raw,'characterId':'second-brain','scriptId':'comparison-read','scriptSource':'audition-only comparison'})
        self.assertFalse(value['productionApproved'])

if __name__=='__main__': unittest.main(verbosity=2)
