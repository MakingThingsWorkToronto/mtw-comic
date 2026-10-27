"""Small external fixtures for batch preflight, exact preservation and one real catalog call."""
import argparse
import copy
import json
from pathlib import Path
import tempfile
from PIL import Image
import import_native_batch as batch
from test_visual_review import synthetic_contract, rebind


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);args=ap.parse_args()
    repo=Path(args.repo).resolve();fixture=Path(tempfile.mkdtemp(prefix='mtw-comic-batch-'));lib=fixture/'library';lib.mkdir()
    for name in ('index.html','browser.js','library.css','.gitattributes'):(lib/name).write_text('fixture\n')
    (lib/'manifest.json').write_text(json.dumps({'schemaVersion':1,'name':'Synthetic test only','records':[],'files':[],
        'styleNames':{'svg-flat':'SVG Flat','svg-outline':'SVG Outline','holographic':'Holographic','photorealistic':'Photorealistic'}}))
    art=batch.art;art.REPO=repo;art.LIB=lib;art.COMIC=lib/'assets/scenes/comic-b';art.WORK=fixture/'work'
    art.HELPER=repo/'.codex/skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py'
    story=fixture/'story.ts';story.write_text('export const story = '+json.dumps({'id':'test','scenes':[
        {'id':'synthetic','panels':[{'img':'box-one'}]}]})+';\n',encoding='utf-8')
    guide=fixture/'layout-caf\u00e9.png';Image.new('RGB',(16,10),(30,40,60)).save(guide)
    entries=[]
    def write(path,value):path.write_text(json.dumps(value));return str(path)
    for version in (1,2):
        d=fixture/f'v{version}';d.mkdir();src=d/'master.png';Image.new('RGB',(16,10),(10,version*20,30)).save(src)
        prompt=d/'prompt.txt';prompt.write_text('Synthetic fixture only.\n')
        brief,review=synthetic_contract('test-page',src,story,guide,story_id='test')
        brief['storySourceSha256']=art.sha(story);rebind(brief,review)
        inputs=[{'path':str(guide),'role':'synthetic geometry guide','sha256':art.sha(guide)}]
        e={'id':'test-page','version':version,'selected':version==2,'master':str(src),'prompt':str(prompt),
           'brief':write(d/'brief.json',[brief]),'inputs':write(d/'inputs.json',inputs),
           'generation':write(d/'generation.json',{'tool':'synthetic-fixture','model':None,'outputSha256':art.sha(src)}),
           'originalReview':write(d/'original-review.json',{'status':'rejected' if version==1 else 'selected','observations':'fixture'}),
           'layoutGuide':str(guide)}
        if version==2:e['review']=write(d/'review.json',review)
        entries.append(e)
    def snap():return {p.relative_to(lib).as_posix():art.sha(p) for p in lib.rglob('*') if p.is_file()}
    initial=snap();checks=[]
    def refusal(fn,label):
        try:fn()
        except SystemExit:pass
        else:raise AssertionError('Expected rejection: '+label)
        assert snap()==initial,label+' mutated canonical files';checks.append(label)
    # A late invalid reference rejects the entire packet after the first valid item.
    ip=Path(entries[1]['inputs']);valid=ip.read_bytes();bad=json.loads(valid);bad[0]['sha256']='0'*64;ip.write_text(json.dumps(bad))
    refusal(lambda:batch.preflight(entries),'late invalid reference leaves library byte-identical');ip.write_bytes(valid)
    rp=Path(entries[1]['review']);valid=rp.read_bytes();bad=json.loads(valid);bad['storySha256']='0'*64;rp.write_text(json.dumps(bad))
    refusal(lambda:batch.preflight(entries),'stale reviewed story leaves library byte-identical');rp.write_bytes(valid)
    bad=json.loads(valid);bad.pop('visualReview');rp.write_text(json.dumps(bad))
    refusal(lambda:batch.preflight(entries),'selected image cannot omit detailed visual contract; no library writes');rp.write_bytes(valid)
    bp=Path(entries[1]['brief']);brief_raw=bp.read_bytes();bad=json.loads(brief_raw);bad[0].pop('visualInventory');bp.write_text(json.dumps(bad))
    refusal(lambda:batch.preflight(entries),'selected image cannot omit expected caller inventory; no library writes');bp.write_bytes(brief_raw)
    plan=batch.preflight(entries);original=story.read_bytes();story.write_text('changed after preflight')
    refusal(lambda:batch.apply_batch(plan,fixture/'receipts'),'story changed after preflight refused before copies');story.write_bytes(original)
    # A reference can be used for review without also being a generation input.
    style=fixture/'review-style.png';Image.new('RGB',(16,10),(80,30,60)).save(style)
    b=json.loads(brief_raw);b[0]['visualInventory']['references'][0].update(path=str(style),sha256=art.sha(style))
    r=json.loads(valid);r['visualReview']['references'][0]['sha256']=art.sha(style);rebind(b[0],r)
    bp.write_text(json.dumps(b));rp.write_text(json.dumps(r));plan=batch.preflight(entries);style_raw=style.read_bytes();style.write_bytes(style_raw+b'changed')
    refusal(lambda:batch.apply_batch(plan,fixture/'receipts'),'review-only reference changed after preflight refused before copies')
    style.write_bytes(style_raw);bp.write_bytes(brief_raw);rp.write_bytes(valid)
    plan=batch.preflight(entries);calls=[];run=batch.subprocess.run
    def counted(*a,**kw):calls.append(a[0]);return run(*a,**kw)
    batch.subprocess.run=counted
    result=batch.apply_batch(plan,fixture/'receipts');batch.subprocess.run=run
    assert len(calls)==1 and result['catalogRegisterCalls']==1 and calls[0][2]=='register'
    catalog=json.loads((lib/'manifest.json').read_text(encoding='utf-8'));rows=catalog['records'];current=next(r for r in rows if r['id']=='comic-b-test-page')
    assert current['treatments']['comic-ink']['path'].endswith('test-page-v2.png')
    guide_record=next(r for r in rows if r['id']=='comic-b-input-'+art.sha(guide))
    assert guide_record['title']=='Comic B input - '+guide.name
    assert '\u00c2\u00b7' not in guide_record['title']
    checks.append('registered guide title preserves Unicode filename with plain hyphen separator')
    assert any(r.get('retainedFrom')=='comic-b-test-page' and r['treatments']['comic-ink']['path'].endswith('test-page-v1.png') for r in rows)
    for e in entries:
        target=lib/f'assets/scenes/comic-b/pages/test-page-v{e["version"]}.png';assert target.read_bytes()==Path(e['master']).read_bytes()
        rd=lib/f'records/comic-b-test-page/comic-ink/v{e["version"]}'
        assert (rd/'submitted-prompt.txt').read_bytes()==Path(e['prompt']).read_bytes()
        assert (rd/'original-review.json').read_bytes()==Path(e['originalReview']).read_bytes()
        refs=json.loads((rd/'canonical-inputs.json').read_text(encoding='utf-8'));assert (lib/refs[0]['canonicalPath']).read_bytes()==guide.read_bytes()
    assert any((lib/'records/comic-b-test-page/content-review').glob('v2-*/content-review.json'))
    checks.append('one real catalog register retains both exact masters, prior version, guide, rejected review and hash-bound selected review')
    initial=snap();refusal(lambda:batch.preflight(entries),'existing version collision leaves library byte-identical')
    result={'status':'pass','checks':checks,'fixture':str(fixture),'limits':'Synthetic import/retention validation only; no production art or browser review.'}
    (fixture/'test-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))


if __name__=='__main__':main()
