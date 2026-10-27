"""Bounded native Comic B import/delivery smoke. Synthetic assets stay in a new external temporary directory.
Run from repo root: python .codex/skills/mtw-comic-story/scripts/art/test_native_import.py --repo .
No browser, generation, website build or writes to the real library. Fixture directory is retained and printed.
"""
import argparse, json, tempfile, types, hashlib, sys
from pathlib import Path
from PIL import Image
from test_visual_review import synthetic_contract, rebind

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);args=ap.parse_args()
    repo=Path(args.repo).resolve(); here=Path(__file__).resolve().parent
    code=(here/'comic_art.py').read_text(encoding='utf-8'); ns={'__name__':'comic_art_fixture','__file__':str(here/'comic_art.py')}
    exec(compile(code,str(here/'comic_art.py'),'exec'),ns)
    fixture=Path(tempfile.mkdtemp(prefix='mtw-comic-native-')); lib=fixture/'library';lib.mkdir()
    for name in ['index.html','browser.js','library.css','.gitattributes']:(lib/name).write_text('fixture\n',encoding='utf-8')
    (lib/'manifest.json').write_text(json.dumps({'schemaVersion':1,'name':'Synthetic test only','records':[],'files':[],'styleNames':{'svg-flat':'SVG Flat','svg-outline':'SVG Outline','holographic':'Holographic','photorealistic':'Photorealistic'}}),encoding='utf-8')
    (fixture/'story.ts').write_text('export const story = '+json.dumps({'id':'fixture','scenes':[
        {'id':'synthetic','panels':[{'img':'box-one'}]}]})+';\n',encoding='utf-8')
    src=fixture/'native.png';Image.new('RGB',(16,10),(8,38,42)).save(src)
    ref=fixture/'reference.png';Image.new('RGB',(16,10),(14,79,85)).save(ref)
    sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
    (fixture/'prompt.txt').write_text('Synthetic fixture. Not comic artwork.\n',encoding='utf-8')
    roles=[{'path':str(ref),'role':'synthetic test reference','sha256':sha(ref)}]
    (fixture/'inputs.json').write_text(json.dumps(roles),encoding='utf-8')
    (fixture/'generation.json').write_text(json.dumps({'tool':'synthetic-test-fixture','model':None,'outputSha256':sha(src)}),encoding='utf-8')
    fake_here=fixture/'skill/scripts/art';fake_here.mkdir(parents=True);(fixture/'skill/assets').mkdir()
    (fixture/'skill/assets/page-constants.json').write_text(json.dumps({'page':{'artWidths':[32,48,64]}}),encoding='utf-8')
    config=fixture/'config.json';config.write_text(json.dumps({'deliver':'raster','raster':{'print':{'enabled':True},'webpQuality':80,'avifQuality':50}}),encoding='utf-8')
    b,_=synthetic_contract('fixture-page',src,fixture/'story.ts',ref)
    b.update(aspect='16:10',cast=[],prompt='test only')
    brief=fixture/'brief.json';brief.write_text(json.dumps([b]),encoding='utf-8')
    ns.update(REPO=repo,LIB=lib,COMIC=lib/'assets/scenes/comic-b',SITE=fixture/'site/public/comic',WORK=fixture/'work',CONFIG=config,HERE=fake_here,NODE_MODULES=repo/'site/node_modules',HELPER=repo/'.codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py')
    a=types.SimpleNamespace(brief=str(brief),source=str(src),prompt_file=str(fixture/'prompt.txt'),inputs_file=str(fixture/'inputs.json'),generation_record=str(fixture/'generation.json'),retrace=None,review_file=None)
    ns['ARGS']=a
    checks=[]
    def expect_failure(fn,label):
        try:fn()
        except SystemExit:checks.append(label);return
        raise AssertionError('Expected refusal: '+label)
    original_src=src.read_bytes()
    # Refuse changed input before any canonical mutation.
    bad=[dict(roles[0],sha256='0'*64)];(fixture/'inputs.json').write_text(json.dumps(bad),encoding='utf-8')
    expect_failure(lambda:ns['stage_import']('fixture-page',1),'changed reference rejected')
    assert not (lib/'assets').exists()
    (fixture/'inputs.json').write_text(json.dumps(roles),encoding='utf-8')
    ns['stage_import']('fixture-page',1)
    master=ns['master_path']('fixture-page',1);assert master.read_bytes()==original_src and src.read_bytes()==original_src
    assert master.name=='fixture-page-v1.png' # native output must not require a print derivative
    catalog=json.loads((lib/'manifest.json').read_text(encoding='utf-8'));assert any(r['id']=='comic-b-fixture-page' for r in catalog['records'])
    assert (lib/'records/comic-b-fixture-page/comic-ink/v1/submitted-prompt.txt').read_bytes()==(fixture/'prompt.txt').read_bytes()
    checks.append('exact source preserved, provenance retained, real maintenance helper registration succeeds')
    registration=lib/'records/comic-b-fixture-page/comic-ink/v1'
    payload=json.loads((registration/'registration-payload.json').read_text(encoding='utf-8'))
    note=payload['treatments']['comic-ink']['note']; readme=(registration/'README.md').read_text(encoding='utf-8')
    for text in (note,readme):
        assert 'discussion/' not in text and 'style scores' not in text
        assert 'browser verification' in text and 'approval' in text
    assert 'Not approved by Matt' in note and 'Records: records/' in note
    checks.append('new registration prose retains local evidence and separate review/approval states')
    expect_failure(lambda:ns['stage_import']('fixture-page',1),'duplicate version refused')
    assert ns['gate']('fixture-page',1);checks.append('unreviewed master blocked')
    _,review=synthetic_contract('fixture-page',master,fixture/'story.ts',ref)
    rebind(b,review);review['legacyStyleScore']=0
    a.review_file=str(fixture/'review.json');Path(a.review_file).write_text(json.dumps(review),encoding='utf-8')
    legacy=dict(review);legacy.pop('visualReview');Path(a.review_file).write_text(json.dumps(legacy),encoding='utf-8')
    expect_failure(lambda:ns['stage_judge']('fixture-page',1),'legacy review rejected at actual judge before new acceptance')
    Path(a.review_file).write_text(json.dumps(review),encoding='utf-8')
    ns['stage_judge']('fixture-page',1);assert not ns['gate']('fixture-page',1);checks.append('exact story-box coverage passes without numerical style gate; synthetic observations only')
    # Durable canonical record works without the ephemeral current-review cache.
    cache=fixture/'work/fixture-page/content-review-v1.json';cache.unlink();assert not ns['gate']('fixture-page',1);checks.append('canonical review survives absent work cache')
    original_story=(fixture/'story.ts').read_bytes();(fixture/'story.ts').write_text('changed story',encoding='utf-8')
    assert ns['gate']('fixture-page',1);(fixture/'story.ts').write_bytes(original_story);checks.append('stale story review blocked')
    bad_review=dict(review,checks={**review['checks'],'castIdentity':False});assert ns['content_review_errors']('fixture-page',1,bad_review);checks.append('wrong-cast review blocked')
    master_bytes=master.read_bytes();master.write_bytes(master_bytes+b'changed');assert ns['gate']('fixture-page',1);master.write_bytes(master_bytes);checks.append('changed master blocked')
    ns['stage_integrate']('fixture-page',1)
    # No upscales: the 16px master is narrower than every slot, so only the smallest slot is written, at 16px.
    for ext in ['avif','webp']:
        with Image.open(fixture/f'site/public/comic/fixture/fixture-page-32.{ext}') as im:
            im.load();assert im.width==16 and im.height>0
        for w in [48,64]: assert not (fixture/f'site/public/comic/fixture/fixture-page-{w}.{ext}').exists()
    receipt=json.loads((fixture/'work/fixture-page/integration-v1.json').read_text());assert receipt['sourceWidth']==16 and not any(o['upscaled'] for o in receipt['outputs']) and receipt['skippedSlots']==[48,64] and receipt['browserStatus']=='pending'
    assert receipt['encoder']['options']['avif']=={'quality':50,'effort':2}
    assert receipt['encoder']['options']['webp']=={'quality':80,'smartSubsample':True}
    assert receipt['encoder']['kernel']=='lanczos3' and receipt['encoder']['sharpVersion']
    for output in receipt['outputs']:
        f=Path(output['file'])
        assert output['bytes']==f.stat().st_size and output['encodeMs']>=0
        assert output['format']==f.suffix[1:]
        with Image.open(f) as im:
            im.load();assert [im.width,im.height]==[output['width'],output['height']]
    checks.append('configured derivatives fully decode; receipts match actual dimensions/bytes, effort 2, qualities and elapsed encode time')
    assert not (fixture/'site/public/comic/fixture/fixture-page.svg').exists();checks.append('no placeholder SVG emitted')
    # The bulk shortcut must not bring back the retired automatic print/measure/score loop.
    called=[];old_stages=ns['STAGES'];ns['STAGES']={name:(lambda pid,v,n=name:called.append(n)) for name in old_stages}
    assert ns['run_all']('fixture-page',1) is None and called==['prompt','generate']
    called.clear();a.retrace=1
    assert ns['run_all']('fixture-page',1) is None and called==['trace']
    ns['STAGES']=old_stages;a.retrace=None
    checks.append('all generates only raw master; explicit retrace stays bounded')
    result={'status':'pass','checks':checks,'fixture':str(fixture),'limits':'Synthetic import/registration/gate/encoding smoke only. No production art or browser/semantic review.'}
    (fixture/'smoke-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
