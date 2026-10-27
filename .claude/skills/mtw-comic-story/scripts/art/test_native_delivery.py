"""Tiny registered-native adapter regression; only a fresh ignored fixture tree is mutated.
Run: python .../test_native_delivery.py --repo . --fixtures .codex/worktrees/<task>/native-delivery-fixtures
No providers/build/browser/real-library mutations. Tiny8/16px real encodes verify default/additive behavior; PNG-only invokes no encoder.
"""
import argparse, ast, copy, hashlib, json, sys, types
from pathlib import Path
from PIL import Image

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--fixtures',required=True);a=ap.parse_args();repo=Path(a.repo).resolve();here=Path(__file__).resolve().parent
 live=repo/'.codex/skills/mtw-comic-story/scripts/art';sys.path.insert(0,str(live));from test_visual_review import synthetic_contract,rebind
 fixture=Path(a.fixtures).resolve();assert fixture.is_relative_to((repo/'.codex/worktrees').resolve()) and not fixture.exists();fixture.mkdir(parents=True)
 source=here/'comic_art.py';ns={'__name__':'native_delivery_fixture','__file__':str(source)};exec(compile(source.read_text(encoding='utf-8'),str(source),'exec'),ns)
 lib=fixture/'wiki/image-library';lib.mkdir(parents=True);assets=lib/'assets/scenes/native';assets.mkdir(parents=True);native=assets/'master-v2.png';Image.new('RGBA',(16,10),(8,38,42,93)).save(native);sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();original=native.read_bytes()
 ref=fixture/'style.png';Image.new('RGB',(16,10),(15,79,85)).save(ref);story=fixture/'story.ts';story.write_text('export const story = '+json.dumps({'id':'fixture','scenes':[{'id':'synthetic','panels':[{'img':'box-one'}]}]})+';\n',encoding='utf-8')
 b,review=synthetic_contract('fixture-page',native,story,ref);brief=fixture/'brief.json';brief.write_text(json.dumps([b]),encoding='utf-8');rf=fixture/'review.json';rf.write_text(json.dumps(review),encoding='utf-8')
 record={'id':'registered-native','treatments':{'comic-ink':{'path':native.relative_to(lib).as_posix(),'sha256':sha(native),'status':'draft'}}};catalog={'records':[record]};manifest=lib/'manifest.json';manifest.write_text(json.dumps(catalog),encoding='utf-8')
 fakehere=fixture/'skill/scripts/art';fakehere.mkdir(parents=True);(fixture/'skill/assets').mkdir();(fixture/'skill/assets/page-constants.json').write_text(json.dumps({'page':{'artWidths':[8,16,32]}}),encoding='utf-8');config=fixture/'config.json';config.write_text(json.dumps({'deliver':'raster','raster':{'print':{'enabled':False},'webpQuality':80,'avifQuality':50}}),encoding='utf-8')
 transport=fixture/'.codex/worktrees/receipts';stem=fixture/'site/public/comic/fixture/scene-one/v2/master-v2';args=types.SimpleNamespace(stage='integrate',brief=str(brief),registered_master=str(native),catalog_record='registered-native',catalog_treatment='comic-ink',master_sha256=sha(native),public_stem=str(stem),review_file=str(rf),receipt_output=str(transport/'integration-v2.json'),review_output=str(transport/'review-v2.json'),retrace=None)
 ns.update(REPO=fixture,LIB=lib,COMIC=lib/'assets/scenes/comic-b',SITE=fixture/'site/public/comic',WORK=fixture/'legacy-work',CONFIG=config,HERE=fakehere,NODE_MODULES=repo/'site/node_modules',ARGS=args)
 checks=[]
 def refusal(fn,label):
  try:fn()
  except SystemExit:checks.append(label);return
  raise AssertionError('Expected refusal: '+label)
 def changedattr(name,value,label):
  previous=getattr(args,name);setattr(args,name,value);refusal(lambda:ns['registered_delivery']('fixture-page',2),label);setattr(args,name,previous)
 selected=ns['registered_delivery']('fixture-page',2);assert selected['sourceBytes']==original and not stem.parent.exists() and not transport.exists();checks.append('nested exact canonical master basename validates exact bytes without outputs')
 # A name mismatch must reject before reading the native PNG or creating output/encoder files.
 previous_stem=args.public_stem;original_read_bytes=Path.read_bytes
 def guarded_read_bytes(path):
  if path.resolve()==native.resolve():raise AssertionError('Mismatched public basename read native bytes')
  return original_read_bytes(path)
 args.public_stem=str(stem.parent/'home-quote-regenerated-master-v2');Path.read_bytes=guarded_read_bytes
 try:
  try:ns['registered_delivery']('fixture-page',2)
  except SystemExit as exc:assert 'basename must equal' in str(exc)
  else:raise AssertionError('Expected mismatched canonical basename refusal')
 finally:args.public_stem=previous_stem;Path.read_bytes=original_read_bytes
 assert not stem.parent.exists() and not transport.exists()
 checks.append('bogus public prefix refused before native read and all output/encoder IO')
 changedattr('catalog_record','missing','unregistered record refused')
 changedattr('catalog_treatment','missing','unregistered treatment refused')
 changedattr('master_sha256',None,'partial selection refused')
 changedattr('master_sha256','0'*64,'catalog/source hash mismatch refused')
 changedattr('stage','import','registered flags cannot select mutating import route')
 outside=fixture/'outside.png';outside.write_bytes(original);changedattr('registered_master',str(outside),'master outside canonical assets refused')
 previous=copy.deepcopy(catalog);catalog['records'][0]['treatments']['comic-ink']['path']='../../outside.png';manifest.write_text(json.dumps(catalog));refusal(lambda:ns['registered_delivery']('fixture-page',2),'catalog path escape refused');catalog=previous;manifest.write_text(json.dumps(catalog))
 native.write_bytes(original+b'changed');refusal(lambda:ns['registered_delivery']('fixture-page',2),'stale native bytes refused');native.write_bytes(original)
 previous=copy.deepcopy(catalog);native.write_bytes(b'not png');args.master_sha256=sha(native);catalog['records'][0]['treatments']['comic-ink']['sha256']=args.master_sha256;manifest.write_text(json.dumps(catalog));refusal(lambda:ns['registered_delivery']('fixture-page',2),'registered corrupt native decode refused');native.write_bytes(original);args.master_sha256=sha(native);catalog=previous;manifest.write_text(json.dumps(catalog))
 changedattr('public_stem',str(fixture/'site/public/comic/other/master-v2'),'other story output refused')
 changedattr('public_stem',str(fixture/'outside-output'),'public path escape refused')
 changedattr('public_stem',str(stem)+'.png','public filename extension refused')
 changedattr('receipt_output',str(lib/'records/receipt.json'),'canonical metadata mutation refused; explicit transport only')
 changedattr('receipt_output',None,'implicit metadata destination refused')
 previous=copy.deepcopy(review);review.pop('visualReview');rf.write_text(json.dumps(review));refusal(lambda:ns['registered_delivery']('fixture-page',2),'legacy whole-page review omission refused');review=previous;rf.write_text(json.dumps(review))
 previous=copy.deepcopy(review);review['visualReview']['images'][0]['panels']=[];rf.write_text(json.dumps(review));refusal(lambda:ns['registered_delivery']('fixture-page',2),'missing actual box coverage refused');review=previous;rf.write_text(json.dumps(review))
 previous=copy.deepcopy(review);review['checks']['sharpness']=False;rf.write_text(json.dumps(review));refusal(lambda:ns['registered_delivery']('fixture-page',2),'failed source sharpness refused');review=previous;rf.write_text(json.dumps(review))
 storyraw=story.read_bytes();story.write_bytes(storyraw+b'changed');refusal(lambda:ns['registered_delivery']('fixture-page',2),'stale story review refused');story.write_bytes(storyraw)
 # Symbolic links are exercised if Windows permits creating them; path guards resolve actual ancestors.
 link=fixture/'site/public/comic/fixture';link.parent.mkdir(parents=True,exist_ok=True);elsewhere=fixture/'external-public';elsewhere.mkdir()
 try:link.symlink_to(elsewhere,target_is_directory=True)
 except OSError:checks.append('symlink fixture unavailable; lexical escapes covered')
 else:refusal(lambda:ns['registered_delivery']('fixture-page',2),'owned story symlink escape refused');link.unlink()
 assert not stem.parent.exists() and not transport.exists()
 transport.mkdir(parents=True);existing=transport/'existing.json';existing.write_text('retained');changedattr('receipt_output',str(existing),'existing transport receipt overwrite refused')
 stem.parent.mkdir(parents=True);occupied=stem.parent/(stem.name+'-8.webp');occupied.write_bytes(b'keep');refusal(lambda:ns['registered_delivery']('fixture-page',2),'existing derivative overwrite refused');occupied.unlink()
 # Judge creates ONLY explicit transport review; it cannot rewrite the registered catalog or native master.
 catalogbytes=manifest.read_bytes();args.stage='judge';ns['stage_judge']('fixture-page',2);assert manifest.read_bytes()==catalogbytes and native.read_bytes()==original and Path(args.review_output).is_file();checks.append('judge writes explicit new transport only; catalog/source unchanged')
 args.stage='integrate';ns['stage_integrate']('fixture-page',2);receipt=json.loads(Path(args.receipt_output).read_text());assert receipt['catalogRecord']=='registered-native' and receipt['catalogTreatment']=='comic-ink' and receipt['masterSha256']==sha(native) and Path(receipt['exactByteSnapshot']).read_bytes()==original
 assert receipt['skippedSlots']==[32] and receipt['sourceWidth']==16 and receipt['browserStatus']=='pending' and receipt['humanApproval'] is False
 for output in receipt['outputs']:
  with Image.open(output['file'])as im:im.load();assert im.width in[8,16]and im.width<=16
  assert output['upscaled']is False and output['bytes']==Path(output['file']).stat().st_size
 assert receipt['encoder']['options']['avif']=={'quality':50,'effort':2} and receipt['encoder']['kernel']=='lanczos3';assert manifest.read_bytes()==catalogbytes and native.read_bytes()==original;checks.append('four8/16px real derivative decodes use existing effort2/no-upscale encoder, exact snapshot/catalog provenance')
 refusal(lambda:ns['registered_delivery']('fixture-page',2),'repeated registered delivery refuses existing outputs')
 # The exact encoder literal is retained; no duplicate scratch encoder or new alternate acceptance gate.
 def encoder_literal(path):
  return next(n.value for n in ast.walk(ast.parse(path.read_text(encoding='utf-8')))if isinstance(n,ast.Constant)and isinstance(n.value,str)and 'const [, , , src, base, widths, q, qa]'in n.value)
 assert encoder_literal(source)==encoder_literal(live/'comic_art.py');checks.append('maintained encoder literal unchanged')
 # PNG-only requires all registered flags and explicit alias; old routes cannot silently copy.
 args.public_stem=str(fixture/'site/public/comic/fixture/png-only/v2/master-v2');args.receipt_output=str(transport/'png-only.json');args.native_png_public_alias=str(Path(args.public_stem).with_suffix('.png'));args.native_png_only=True
 png=Path(args.native_png_public_alias)
 previous_args=ns['ARGS'];ns['ARGS']=types.SimpleNamespace(stage='integrate',brief=str(brief),native_png_public_alias=str(png),native_png_only=False,retrace=None)
 refusal(lambda:ns['registered_delivery']('fixture-page',2),'PNG alias-only legacy route refuses missing all registered flags');ns['ARGS']=previous_args
 changedattr('registered_master',None,'PNG alias refuses unregistered partial source')
 changedattr('native_png_public_alias',None,'PNG-only refuses missing explicit alias')
 changedattr('native_png_public_alias',str(png.parent/'other.png'),'PNG alias refuses different canonical filename')
 changedattr('native_png_public_alias',str(fixture/'outside/master-v2.png'),'PNG alias refuses path escape')
 changedattr('stage','judge','PNG alias refuses judge route')
 previous=copy.deepcopy(review);review['checks']['sharpness']=False;rf.write_text(json.dumps(review));refusal(lambda:ns['stage_integrate']('fixture-page',2),'PNG-only refuses failed source grade before all copy IO');review=previous;rf.write_text(json.dumps(review));assert not png.parent.exists() and not Path(args.receipt_output).exists()
 story.write_bytes(storyraw+b'changed');refusal(lambda:ns['stage_integrate']('fixture-page',2),'PNG-only refuses stale story before all copy IO');story.write_bytes(storyraw)
 native.write_bytes(original+b'changed');refusal(lambda:ns['stage_integrate']('fixture-page',2),'PNG-only refuses stale native source bytes before all copy IO');native.write_bytes(original)
 previous=copy.deepcopy(catalog);disguised=assets/'master-v2.jpg';Image.new('RGB',(16,10),(8,38,42)).save(disguised);args.registered_master=str(disguised);args.master_sha256=sha(disguised);catalog['records'][0]['treatments']['comic-ink'].update(path=disguised.relative_to(lib).as_posix(),sha256=args.master_sha256);manifest.write_text(json.dumps(catalog));refusal(lambda:ns['registered_delivery']('fixture-page',2),'PNG alias refuses registered non-PNG source');args.registered_master=str(native);args.master_sha256=sha(native);catalog=previous;manifest.write_text(json.dumps(catalog))
 png.parent.mkdir(parents=True);png.write_bytes(b'retain conflicting PNG');collision=png.read_bytes();refusal(lambda:ns['stage_integrate']('fixture-page',2),'PNG-only refuses conflicting public PNG without overwrite');assert png.read_bytes()==collision and not Path(args.receipt_output).exists();png.rename(png.with_name('retained-collision.png'))
 original_run=ns['subprocess'].run
 def no_encoder(*a,**k):
  command=a[0];assert Path(command[1]).name=='story_inventory.mjs','PNG-only invoked encoder/unexpected subprocess'
  return original_run(*a,**k)
 ns['subprocess'].run=no_encoder
 try:ns['stage_integrate']('fixture-page',2)
 finally:ns['subprocess'].run=original_run
 copy_receipt=json.loads(Path(args.receipt_output).read_text());assert png.read_bytes()==original and copy_receipt['masterSha256']==sha(native) and len(copy_receipt['outputs'])==1 and 'encoder' not in copy_receipt
 output=copy_receipt['outputs'][0];assert output['format']=='png' and output['operation']=='exact-native-copy' and output['sha256']==sha(png)==sha(native) and output['alphaPreserved'] and output['alphaPresent'] and output['sourceMode']=='RGBA' and output['width']==16 and output['height']==10 and output['bytes']==len(original) and not output['upscaled'] and 'encodeMs' not in output
 with Image.open(png)as im:im.load();assert im.mode=='RGBA' and im.getpixel((0,0))==(8,38,42,93)
 assert not Path(args.receipt_output).with_suffix('.encode.cjs').exists() and not Path(args.receipt_output).with_suffix('.master.png').exists() and list(png.parent.glob('*.avif'))==[] and list(png.parent.glob('*.webp'))==[]
 assert manifest.read_bytes()==catalogbytes and native.read_bytes()==original;checks.append('PNG-only actual exact RGBA byte/hash/pixel roundtrip, one outputs entry, no encoder/snapshot/derivatives')
 refusal(lambda:ns['stage_integrate']('fixture-page',2),'PNG-only repeated output refuses overwrite')
 args.public_stem=str(fixture/'site/public/comic/fixture/png-additive/v2/master-v2');args.native_png_public_alias=str(Path(args.public_stem).with_suffix('.png'));args.native_png_only=False;args.receipt_output=str(transport/'png-additive.json')
 ns['stage_integrate']('fixture-page',2);combined=json.loads(Path(args.receipt_output).read_text());assert len(combined['outputs'])==5 and combined['nativePngAlias']['sha256']==sha(native) and len([o for o in combined['outputs'] if o['format']=='png'])==1 and Path(args.native_png_public_alias).read_bytes()==original
 assert combined['encoder']['options']['avif']=={'quality':50,'effort':2};checks.append('optional additive PNG copy accompanies unchanged four tiny AVIF/WebP outputs with real copy lineage')
 legacy=types.SimpleNamespace(brief=str(brief),retrace=None);ns['ARGS']=legacy;assert ns['registered_delivery']('fixture-page',2)is None and ns['master_path']('fixture-page',2)==lib/'assets/scenes/comic-b/pages/fixture-page-v2.png' and ns['site_path'](b)==fixture/'site/public/comic/fixture/fixture-page.svg';checks.append('legacy CLI path defaults retained')
 result={'status':'pass','checks':checks,'fixture':str(fixture),'limitations':'Synthetic guard/tiny encode test only; no production image quality/native reader/listening/Matt approval.'};(fixture/'results.json').write_bytes((json.dumps(result,indent=2)+'\n').encode());print(json.dumps(result,indent=2))

if __name__=='__main__':main()
