"""One Fish audition: offline plan/cache first; explicit single-call generation only."""
import argparse, datetime, hashlib, json, os, re, shutil, subprocess, sys, urllib.error, urllib.request
from pathlib import Path

ENDPOINT = 'https://api.fish.audio/v1/tts'
MODEL = 's2.1-pro-free'
SETTINGS = {'format': 'mp3', 'temperature': 0.7, 'top_p': 0.7,
            'prosody': {'speed': 1, 'volume': 0, 'normalize_loudness': True},
            'sample_rate': 44100, 'mp3_bitrate': 128, 'normalize': True, 'latency': 'normal'}

class SafeError(Exception):
    pass

def digest(data):
    return hashlib.sha256(data).hexdigest()

def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def write_new(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    assert json.loads(raw.decode('utf-8')) == value
    with path.open('xb') as handle:
        handle.write(raw)

def within(root, path, homes):
    if not isinstance(path, str) or '\\' in path or any(p in ['.', '..'] for p in path.split('/')):
        raise SafeError('Unsafe canonical path')
    root = Path(root).resolve(); target = (root / path).resolve()
    if not any(target.is_relative_to(root / home) for home in homes):
        raise SafeError('Path leaves its declared canonical library home')
    return target

def media_path(root, value):
    if value.startswith('assets/'):
        value = 'wiki/comics-library/' + value  # retained legacy recordings only
    elif value.startswith('../soundtrack-library/'):
        value = 'wiki/soundtrack-library/' + value.removeprefix('../soundtrack-library/')
    return within(root, value, ['wiki/comics-library/assets/voices', 'wiki/soundtrack-library/assets/voices', 'wiki/soundtrack-library/assets/speech'])

def receipt_path(root, value):
    if value.startswith('records/'):
        value = 'wiki/comics-library/' + value
    elif value.startswith('../soundtrack-library/'):
        value = 'wiki/soundtrack-library/' + value.removeprefix('../soundtrack-library/')
    return within(root, value, ['wiki/comics-library/records', 'wiki/soundtrack-library/records'])

SPOKEN_TEXT_NORMALIZATION = 'layout-whitespace-v1'


def spoken_request(expected):
    """Keep exact authored text as authority; formatting whitespace is not prosody."""
    spoken = ' '.join(expected['text'].split())
    return {**expected, 'settings': {**expected['settings'], 'text': spoken},
            'spokenText': spoken, 'spokenTextSha256': digest(spoken.encode('utf-8')),
            'spokenTextNormalization': SPOKEN_TEXT_NORMALIZATION}


def recipe(value, home_speech=False):
    if value.get('provider') != 'Fish Audio' or value.get('modelId') != MODEL:
        raise SafeError('Recipe must explicitly name Fish Audio and s2.1-pro-free; no model fallback')
    cid, sid, vid = value.get('characterId', ''), value.get('scriptId', ''), value.get('voiceId', '')
    if not all(re.fullmatch('[a-z0-9][a-z0-9-]{0,63}', item) for item in [cid, sid]):
        raise SafeError('Character/script IDs must be stable safe slugs')
    if not re.fullmatch('[a-f0-9]{32}', vid):
        raise SafeError('Fish voice IDs are exact lowercase 32-hex IDs, not ElevenLabs IDs')
    text = value.get('text')
    if not isinstance(text, str) or not text.strip() or len(text.encode('utf-8')) > 512:
        raise SafeError('One evaluation sample needs 1 to 512 UTF-8 bytes')
    if not value.get('scriptSource'):
        raise SafeError('Exact named script or audition-only comparison source is required')
    if value.get('textSha256', digest(text.encode('utf-8'))) != digest(text.encode('utf-8')):
        raise SafeError('Recipe text hash does not match exact UTF-8 text')
    if cid == 'second-brain' and not home_speech and not ('comparison' in value['scriptSource'].lower() or value.get('auditionOnly') is True):
        raise SafeError('Second Brain remains non-speaking; its sample is comparison-only')
    body = value.get('settings', {**SETTINGS, 'text': text, 'reference_id': vid})
    mode = value.get('spokenTextNormalization')
    if mode not in [None, SPOKEN_TEXT_NORMALIZATION]:
        raise SafeError('Unknown spoken text normalization')
    spoken = ' '.join(text.split()) if mode else text
    if mode and (value.get('spokenText') != spoken or value.get('spokenTextSha256') != digest(spoken.encode('utf-8'))):
        raise SafeError('Spoken text/hash differs from exact layout-whitespace normalization')
    if not isinstance(body, dict) or body.get('text') != spoken or body.get('reference_id') != vid:
        raise SafeError('Request text/reference ID must equal the declared script/voice')
    allowed = set(SETTINGS) | {'text', 'reference_id'}
    if set(body) != allowed or body['format'] != 'mp3' or body['sample_rate'] != 44100 or body['mp3_bitrate'] != 128 or body['latency'] != 'normal':
        raise SafeError('Use the finite recorded MP3 request shape; no hidden/default model parameters')
    for key in ['temperature', 'top_p']:
        if type(body[key]) not in [int, float] or not 0 <= body[key] <= 1:
            raise SafeError('Sampling setting leaves provider bounds')
    pro = body['prosody']
    if set(pro) != {'speed', 'volume', 'normalize_loudness'} or not 0.5 <= pro['speed'] <= 2 or not -20 <= pro['volume'] <= 20 or type(pro['normalize_loudness']) is not bool or type(body['normalize']) is not bool:
        raise SafeError('Invalid explicit delivery settings')
    result = {'provider': 'Fish Audio', 'characterId': cid, 'scriptId': sid, 'scriptSource': value['scriptSource'],
            'voiceId': vid, 'voiceName': value.get('voiceName', vid), 'modelId': MODEL, 'text': text,
            'textSha256': digest(text.encode('utf-8')), 'settings': body, 'licensed': value.get('licensed'),
            'candidateOnly': True, 'productionApproved': False, 'productionRights': 'not verified'}
    return spoken_request(result) if mode else result

def same_request(a, b):
    return all(a.get(k) == b.get(k) for k in ['provider', 'characterId', 'scriptId', 'voiceId', 'modelId', 'text', 'settings'])

def container(data):
    if len(data) >= 4 and (data[:3] == b'ID3' or data[0] == 255 and data[1] & 224 == 224):
        return 'mp3'
    if len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WAVE':
        return 'wav'
    return 'unknown'

def probe(path):
    try:
        run = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate', '-of', 'json', str(path)], capture_output=True, text=True, encoding='utf-8', timeout=15, check=True)
        data = json.loads(run.stdout); duration = float(data['format']['duration'])
        if duration <= 0 or data['streams'][0]['codec_name'] != 'mp3':
            raise SafeError('Audio decoder did not establish a positive MP3 duration')
        return duration
    except SafeError:
        raise
    except Exception:
        raise SafeError('ffprobe missing or saved audio failed decoding') from None

def validate_saved(root, record, expected, decoder=probe):
    if record.get('status') != 'saved' or not same_request(record, expected):
        raise SafeError('Saved receipt does not bind this exact character/voice/script/model/request')
    asset = record.get('savedAsset', {}); path = media_path(root, asset.get('path', ''))
    data = path.read_bytes()
    if digest(data) != asset.get('sha256') or len(data) != asset.get('bytes') or container(data) != 'mp3':
        raise SafeError('Cached audio hash/size/container mismatch; do not regenerate automatically')
    if record.get('textSha256') != expected['textSha256']:
        raise SafeError('Saved script hash differs')
    return {'path': str(path), 'sha256': digest(data), 'bytes': len(data), 'durationSeconds': decoder(path)}

def find_cache(root, expected, decoder=probe, transport_root=None):
    root = Path(root); profile = read_json(root / 'wiki/comics-library/voices.json')
    current = next((p for p in profile['profiles'] if p['characterId'] == expected['characterId']), None)
    if current is None:
        raise SafeError('Character has no canonical reusable voice profile')
    script = next((s for s in current.get('auditionScripts', []) if s['id'] == expected['scriptId']), None)
    if not expected.get('speechBinding') and (not script or script['text'] != expected['text'] or script['source'] != expected['scriptSource']):
        raise SafeError('Recipe must bind the current canonical named script; update source direction first')
    matches = []
    homes = [(root, h) for h in ['wiki/comics-library/records', 'wiki/soundtrack-library/records/fish', 'wiki/soundtrack-library/records/home-voiceover-20261010']]
    if transport_root and Path(transport_root).resolve() != root.resolve():
        homes.append((Path(transport_root), 'wiki/soundtrack-library/records/home-voiceover-20261010'))
    for record_root, home in homes:
        for file in sorted((record_root / home).glob('**/*.json')):
            record = read_json(file)
            if not isinstance(record, dict) or not same_request(record, expected):
                continue
            matches.append((file, record, record_root))
    for file, record, record_root in matches:
        if record.get('status') == 'saved':
            saved = validate_saved(record_root, record, expected, decoder)
            return {'receipt': str(file), 'receiptSha256': digest(file.read_bytes()), 'asset': saved}
    if matches:
        raise SafeError('An exact request has an unresolved/rejected attempt; reconcile it before another take')
    return None

def studio_choice(root, expected, required=False, production=False):
    """Resolve Studio's choice through the same canonical authority as generation."""
    request = {'action': 'resolve', 'root': str(root), 'characterId': expected['characterId'],
               'provider': expected['provider'], 'voiceId': expected['voiceId'],
               'required': required, 'allowHeld': not production}
    try:
        result = subprocess.run(['node', str(Path(root) / 'site/scripts/comic-speech-approval.mjs')],
                                input=json.dumps(request, ensure_ascii=False), capture_output=True,
                                text=True, encoding='utf-8', timeout=20, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as error:
        raise SafeError(error.stderr.strip() or 'Studio voice selection resolution failed') from None
    except Exception:
        raise SafeError('Studio voice selection resolution failed') from None


def plan(root, expected, version, decoder=probe):
    if not re.fullmatch('v[1-9][0-9]*', version):
        raise SafeError('Take version must be v1, v2, ...')
    cache = find_cache(root, expected, decoder)
    if not cache:
        expected = spoken_request(expected)
        cache = find_cache(root, expected, decoder)
    if not cache:
        studio_choice(root, expected)  # reject stale locked identities; retain offline unchosen discovery
    clip = 'fish-' + version + '-' + expected['scriptId']
    asset = 'wiki/soundtrack-library/assets/voices/' + expected['characterId'] + '/' + clip + '.mp3'
    result = 'wiki/soundtrack-library/records/fish/' + expected['characterId'] + '/' + clip + '.json'
    start = result.removesuffix('.json') + '-started.json'
    for value in [asset, result, start]:
        target = within(root, value, ['wiki/soundtrack-library/assets/voices', 'wiki/soundtrack-library/records/fish'])
        if not cache and target.exists():
            raise SafeError('A planned output/attempt already exists; retain and reconcile, never overwrite/retry')
    return {'mode': 'reuse' if cache else 'plan', 'clipId': clip, 'request': expected,
            'cache': cache, 'asset': asset, 'receipt': result, 'startedReceipt': start,
            'requests': 0 if cache else 1, 'automaticRetries': 0, 'maxTextUtf8Bytes': 512,
            'paidFallback': False, 'estimatedUsd': None, 'chargeEvidence': 'not exposed; recheck current free-model availability before a new request'}

def credential(root):
    key = os.environ.get('FISH_AUDIO_API_KEY')
    if not key:
        try:
            for line in (Path(root) / '.env.local').read_text(encoding='utf-8-sig').splitlines():
                if line.strip().startswith('#') or '=' not in line:
                    continue
                name, value = line.split('=', 1)
                if name.strip() == 'FISH_AUDIO_API_KEY':
                    key = value.strip().strip('\"\'')
        except FileNotFoundError:
            pass
    if not key or '\n' in key or '\r' in key:
        raise SafeError('Configure FISH_AUDIO_API_KEY privately in process env or repo .env.local')
    return key

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SafeError('Provider redirected the request; no credential forwarding or retry')

def send_once(body, key):
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body, ensure_ascii=False).encode('utf-8'), method='POST',
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'model': MODEL})
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=45) as response:
        data = response.read(5 * 1024 * 1024 + 1)
        if len(data) > 5 * 1024 * 1024:
            raise SafeError('Provider response exceeds the finite sample limit')
        return data, response.status, {k: response.headers[k] for k in ['Content-Type', 'x-request-id', 'request-id', 'model'] if response.headers.get(k)}

def generate(root, prepared, transport=send_once, decoder=probe, credential_root=None):
    if prepared['cache']:
        return prepared
    root = Path(root); authority = Path(credential_root or root); expected = spoken_request(prepared['request'])
    studio_choice(authority, expected, required=True, production=not bool(prepared.get('sessionAuthorizationPath')))  # session gate below rechecks exact current direction
    approved_review = human_approval(authority, prepared)  # before any credential read or provider request
    key = credential(authority)
    binary = shutil.which('ffprobe')
    if not binary:
        raise SafeError('ffprobe is required before spending a generation request')
    dependencies = {'helperSha256': digest(Path(__file__).read_bytes()), 'pythonVersion': sys.version.split()[0],
                    'stdlibTransport': 'urllib.request', 'decoder': 'ffprobe', 'decoderSha256': digest(Path(binary).read_bytes()) if binary else None,
                    'voiceProfilesSha256': digest((authority / 'wiki/comics-library/voices.json').read_bytes()), 'endpoint': ENDPOINT}
    start = {**expected, 'status': 'started', 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
             'attempts': 1, 'automaticRetry': False, 'dependencies': dependencies,
             ('sessionGenerationAuthorization' if prepared.get('sessionAuthorizationPath') else 'humanSpeechReview'): approved_review,
             'reproduction': 'Reuse exact saved bytes; stochastic generation is not byte-identical.'}
    write_new(root / prepared['startedReceipt'], start)  # immutable attempt evidence before the one call
    result = {**start, 'actualCharge': 'not exposed', 'generationId': None, 'requestId': None}
    try:
        data, status, headers = transport(expected['settings'], key)
        result.update(httpStatus=status, responseHeaders=headers)
        if status != 200 or container(data) != 'mp3':
            result.update(status='unvalidated-response', responseSha256=digest(data), responseBytes=len(data))
        else:
            target = root / prepared['asset']; target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as handle:
                handle.write(data)
            result.update(status='saved-unvalidated', savedAsset={'path': prepared['asset'], 'sha256': digest(data), 'bytes': len(data)})
            duration = decoder(target); result['savedAsset']['durationSeconds'] = duration
            result.update(status='saved', nativePlayback='pending', listeningReview='pending')
    except urllib.error.HTTPError as error:
        result.update(status='rejected', httpStatus=error.code)  # no provider body/header/request/key dump
        error.close()
    except Exception:
        if result.get('status') != 'saved-unvalidated':
            result['status'] = 'unknown'
        result['error'] = 'Single request or validation did not complete; inspect retained attempt/output; no retry.'
    result['endedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    write_new(root / prepared['receipt'], result)
    return result

def registration(root, saved, prepared):
    if saved.get('status') != 'saved':
        raise SafeError('Only validated saved audio can enter a registration proposal')
    asset = saved['savedAsset']; path = asset['path']; receipt = prepared['receipt']
    relative = lambda p: '../soundtrack-library/' + p.removeprefix('wiki/soundtrack-library/')
    clip = {'id': prepared['clipId'], 'title': 'Fish Audio - ' + saved['voiceName'] + ' - audition',
            'path': relative(path), 'canonicalPath': path, 'provider': 'Fish Audio', 'voiceId': saved['voiceId'], 'status': 'candidate',
            'sha256': asset['sha256'], 'durationSeconds': asset['durationSeconds'], 'text': saved['text'],
            'settings': {'modelId': MODEL, 'request': saved['settings'], 'scriptSource': saved['scriptSource'], 'takes': 1},
            'receipt': relative(receipt), 'receiptCanonicalPath': receipt, 'scriptId': saved['scriptId']}
    record = {'id': 'voice-' + saved['characterId'] + '-' + prepared['clipId'], 'type': 'speech-audition',
              'title': clip['title'], 'characterId': saved['characterId'], 'provider': 'Fish Audio', 'voiceId': saved['voiceId'],
              'media': {'path': path, 'href': path.removeprefix('wiki/soundtrack-library/'), 'sha256': asset['sha256']},
              'receipt': {'path': receipt, 'href': receipt.removeprefix('wiki/soundtrack-library/'), 'sha256': digest((Path(root) / receipt).read_bytes())},
              'durationSeconds': asset['durationSeconds'], 'text': saved['text'], 'settings': clip['settings'],
              'status': 'candidate', 'productionApproved': False, 'rights': 'not verified', 'hearingReview': 'pending'}
    return {'characterId': saved['characterId'], 'comicClip': clip, 'soundtrackRecord': record,
            'stage': 'proposal only; integrator merges additively and refreshes both maintained producers; no catalog overwrite'}

def human_approval(repo, prepared):
    expected = prepared['request']
    request = {'root':str(repo), 'approvalId':prepared['clipId'], 'characterId':expected['characterId'],
               'provider':expected['provider'], 'voiceId':expected['voiceId'], 'text':expected['text']}
    if prepared.get('sessionAuthorizationPath'):
        request['sessionAuthorizationPath'] = prepared['sessionAuthorizationPath']
    try:
        result = subprocess.run(['node', str(Path(repo) / 'site/scripts/comic-speech-approval.mjs')],
                                input=json.dumps(request, ensure_ascii=False), capture_output=True,
                                text=True, encoding='utf-8', timeout=20, check=True)
        approval = json.loads(result.stdout)
        if not approval.get('sessionAuthorization') and (not approval.get('review') or not approval.get('approvalManifestSha256')):
            raise ValueError('Incomplete human review binding')
        return approval
    except Exception:
        raise SafeError('Generation blocked: exact human speech review and approved selected voice required') from None

def home_speech_plan(repo, plan_file, line_id, output_root=None, decoder=probe):
    repo = Path(repo); output = Path(output_root or repo)
    authored = read_json(plan_file)
    if authored.get('storyId') != 'home' or authored.get('generation', {}).get('fishModel') != MODEL:
        raise SafeError('Only the explicitly authorized Home POC/free model plan is supported')
    for name in ['site/src/data/comic-stories/home.ts', 'site/src/data/comic-stories/retime.ts', 'wiki/comics-library/voices.json', 'wiki/comics-library/provider-voices.json']:
        if authored.get('sourceGuards', {}).get(name) != digest((repo / name).read_bytes()):
            raise SafeError('Home script/casting guard changed; refresh its exact line plan')
    if 'Homepage character voiceover and speaking Second Brain' not in (repo / 'discussion/spec.md').read_text(encoding='utf-8'):
        raise SafeError('Home narration authorization is absent from current spec')
    line = next((r for r in authored['rows'] if r['id'] == line_id), None)
    if not line or line.get('provider') != 'Fish Audio' or line.get('storyId') != 'home':
        raise SafeError('Named line is not a bound Home Fish speech request')
    studio_choice(repo, line, required=True)  # held human choices may be planned, never generated
    if line['textSha256'] != digest(line['text'].encode('utf-8')):
        raise SafeError('Home line exact text hash differs')
    narration = line['kind'] in ['caption', 'place']
    if narration and line['characterId'] != 'second-brain':
        raise SafeError('Home captions must use Second Brain and its current Studio-selected voice')
    body = {**SETTINGS, 'text': line['text'], 'reference_id': line['voiceId']}
    expected = recipe({'provider':'Fish Audio', 'modelId':MODEL, 'characterId':line['characterId'],
                       'scriptId':line['id'], 'scriptSource':'wiki/comics-library/records/home-voiceover-20261010-plan.json#' + line['id'],
                       'voiceId':line['voiceId'], 'voiceName':line['characterId'], 'text':line['text'], 'settings':body}, home_speech=narration)
    expected['speechBinding'] = {k:line[k] for k in ['storyId','sceneId','panelId','panelIndex','balloonIndex','kind','authoredWho']}
    expected['planSha256'] = digest(Path(plan_file).read_bytes()); expected['delivery'] = line.get('delivery', '')
    cache = find_cache(repo, expected, decoder, transport_root=output)
    raw, receipt = line['rawCanonicalPath'], line['receiptCanonicalPath']
    started = receipt.removesuffix('.json') + '-started.json'
    for value in [raw, receipt, started]:
        target = within(output, value, ['wiki/soundtrack-library/assets/speech/home-20261010', 'wiki/soundtrack-library/records/home-voiceover-20261010'])
        if not cache and target.exists():
            raise SafeError('Home first-take output/attempt already exists; no overwrite or retry')
    prepared = {'mode':'reuse' if cache else 'plan','clipId':line['id'],'request':expected,'cache':cache,
            'asset':raw,'receipt':receipt,'startedReceipt':started,'requests':0 if cache else 1,
            'automaticRetries':0,'paidFallback':False,'scope':'Home POC only','outputRoot':str(output)}
    try:
        studio_choice(repo, expected, required=True, production=True)
        human_approval(repo, prepared); prepared['generationAllowed'] = True
    except SafeError:
        prepared['generationAllowed'] = False; prepared['blockedBy'] = 'An eligible Studio-selected voice and exact human speech-bubble review are required before creating a take.'
    return prepared

def main():
    sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--repo', type=Path, default=Path.cwd()); source = ap.add_mutually_exclusive_group(required=True)
    source.add_argument('--recipe', type=Path); source.add_argument('--speech-plan', type=Path)
    ap.add_argument('--line-id'); ap.add_argument('--output-root', type=Path)
    ap.add_argument('--version', required=True); mode = ap.add_mutually_exclusive_group()
    mode.add_argument('--plan', action='store_true'); mode.add_argument('--generate', action='store_true')
    args = ap.parse_args()
    try:
        if args.speech_plan:
            prepared = home_speech_plan(args.repo, args.speech_plan, args.line_id, args.output_root); expected = prepared['request']
        else:
            expected = recipe(read_json(args.recipe)); prepared = plan(args.repo, expected, args.version)
        if not args.generate or prepared['cache']:
            print(json.dumps(prepared, ensure_ascii=False, indent=2)); return 0
        result = generate(args.output_root or args.repo, prepared, credential_root=args.repo)
        if result.get('status') == 'saved' and not args.speech_plan:
            proposal = registration(args.repo, result, prepared)
            target = args.repo / 'wiki/comics-library/records/fish' / expected['characterId'] / (prepared['clipId'] + '-registration.json')
            write_new(target, proposal)
        print(json.dumps({'status': result['status'], 'receipt': prepared['receipt'], 'requests': 1, 'automaticRetries': 0}))
        return 0 if result.get('status') == 'saved' else 1
    except Exception as error:
        print(str(error) if isinstance(error, SafeError) else 'Local preflight failed; inspect inputs privately.', file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
