import hashlib,tempfile,unittest,json
from PIL import Image
from pathlib import Path
from validate_builtin_request import validate
class Inputs(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.files=[]
  for n in range(6):
   p=Path(self.temp.name)/f'ref-{n}.png';Image.new('RGB',(2,2),(n,0,0)).save(p);self.files.append(str(p))
 def case(self,n=5):
  paths=self.files[:n];return {'prompt':'Exact café prompt.\n','referenced_image_paths':paths},{'inputs':[{'path':p,'role':f'identity-{i}','sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()}for i,p in enumerate(paths)]}
 def test_five(self):
  q,r=self.case();self.assertEqual(validate(q,r)['referenceCount'],5)
 def test_six_refused(self):
  q,r=self.case(6)
  with self.assertRaisesRegex(ValueError,'at most 5'):validate(q,r)
 def test_roles_required(self):
  q,r=self.case();r['inputs'].pop()
  with self.assertRaisesRegex(ValueError,'ordered role'):validate(q,r)
 def test_order(self):
  q,r=self.case();r['inputs'].reverse()
  with self.assertRaisesRegex(ValueError,'order/path'):validate(q,r)
 def test_stale_hash(self):
  q,r=self.case();r['inputs'][0]['sha256']='0'*64
  with self.assertRaisesRegex(ValueError,'Stale'):validate(q,r)
 def test_duplicate(self):
  q,r=self.case(1);q['referenced_image_paths']*=2;r['inputs']*=2
  with self.assertRaisesRegex(ValueError,'Distinct'):validate(q,r)
 def test_missing_file(self):
  q,r=self.case();Path(q['referenced_image_paths'][0]).unlink()
  with self.assertRaises(FileNotFoundError):validate(q,r)
 def test_empty_role(self):
  q,r=self.case();r['inputs'][0]['role']=' '
  with self.assertRaisesRegex(ValueError,'purpose'):validate(q,r)
 def test_no_ref_new_image(self):self.assertEqual(validate({'prompt':'new illustration'},[])['referenceCount'],0)
 def assert_invalid_image(self,name,data):
  p=Path(self.temp.name)/name;p.write_bytes(data);q,r=self.case(1)
  q['referenced_image_paths']=[str(p)];r['inputs'][0].update(path=str(p),sha256=hashlib.sha256(data).hexdigest())
  with self.assertRaisesRegex(ValueError,'valid raster image bytes'):validate(q,r)
 def test_css_with_exact_hash_is_not_image(self):self.assert_invalid_image('style.css',b'body { color: teal; }')
 def test_png_name_does_not_make_css_an_image(self):self.assert_invalid_image('spoof.png',b'body { color: teal; }')
 def test_png_header_without_pixels_is_not_image(self):self.assert_invalid_image('truncated.png',b'\x89PNG\r\n\x1a\n')
 def test_truncated_real_png_with_exact_hash_is_not_image(self):
  self.assert_invalid_image('cut.png',Path(self.files[0]).read_bytes()[:40])
 def test_jpeg_and_webp_real_images(self):
  for fmt,extension in [('JPEG','jpg'),('WEBP','webp')]:
   p=Path(self.temp.name)/('actual.'+extension);Image.new('RGB',(2,2)).save(p,format=fmt)
   q,r=self.case(1);q['referenced_image_paths']=[str(p)];r['inputs'][0].update(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest())
   self.assertEqual(validate(q,r)['referenceCount'],1)
 def test_mutually_exclusive(self):
  q,r=self.case();q['num_last_images_to_include']=1
  with self.assertRaisesRegex(ValueError,'never both'):validate(q,r)
 def test_prompt_exact_character_boundary(self):
  result=validate({'prompt':'x'*32000},[]);self.assertEqual(result['promptCharacters'],32000);self.assertEqual(result['maximumPromptCharacters'],32000)
 def test_prompt_unicode_characters_not_utf8_bytes(self):
  self.assertEqual(validate({'prompt':'é'*32000},[])['promptCharacters'],32000)
 def test_prompt_one_over_boundary_before_reference_io(self):
  with self.assertRaisesRegex(ValueError,'32000 characters'):validate({'prompt':'x'*32001,'referenced_image_paths':['absent.png']},{'inputs':[]})
 def test_actual_rejected_prompt_size(self):
  with self.assertRaisesRegex(ValueError,'32000 characters'):validate({'prompt':'x'*41502},[])

 def test_prompt_newline_identity(self):
  q,r=self.case();a=validate(q,r)['submittedPromptSha256'];q['prompt']=q['prompt'].replace('\n','\r\n');self.assertNotEqual(a,validate(q,r)['submittedPromptSha256'])

class CompletionRequests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.repo=Path(self.temp.name);(self.repo/'wiki/image-library').mkdir(parents=True)
  self.contract={'canonicalDestination':'wiki/image-library/assets/new-scene-v1.png','recordId':'new-scene','style':'comic-ink','version':'v1',
   'provenanceDestination':'wiki/image-library/records/new-scene/comic-ink/v1','registrar':'named-registrar','requestedStatus':'pending-review',
   'bytePreserveImport':True,'register':True,'verify':True,'completionStage':'registered'}
 def test_new_no_reference_mtw_request_requires_contract(self):
  with self.assertRaisesRegex(ValueError,'registrationContract'):validate({'prompt':'A scene'}, {'inputs':[]}, self.repo)
 def test_valid_complete_contract_permits_native_preflight_without_catalog_slot(self):
  result=validate({'prompt':'A scene'}, {'inputs':[],'registrationContract':self.contract}, self.repo)
  self.assertEqual(result['registrationContract'],self.contract);self.assertFalse(result['providerRequestPerformed'])
 def test_missing_registrar_refused(self):
  self.contract.pop('registrar')
  with self.assertRaisesRegex(ValueError,'registrar'):validate({'prompt':'A scene'},{'inputs':[],'registrationContract':self.contract},self.repo)
 def test_pending_completion_refused(self):
  self.contract['completionStage']='pending-registration'
  with self.assertRaisesRegex(ValueError,'registered completion'):validate({'prompt':'A scene'},{'inputs':[],'registrationContract':self.contract},self.repo)
 def test_byte_preserving_import_is_mandatory(self):
  self.contract['bytePreserveImport']=False
  with self.assertRaisesRegex(ValueError,'bytePreserveImport'):validate({'prompt':'A scene'},{'inputs':[],'registrationContract':self.contract},self.repo)

class ComicInputs(unittest.TestCase):
 def setUp(self):
  import sys
  sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'mtw-comic-story/scripts/art'))
  from test_cast_authority import make_repo
  from cast_authority import resolve_cast
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.repo=make_repo(Path(self.temp.name)/'repo')
  manifest=self.repo/'wiki/image-library/manifest.json';data=json.loads(manifest.read_text())
  for record in data['records']:
   treatment=record['treatments']['comic-ink'];path=self.repo/'wiki/image-library'/treatment['path']
   Image.new('RGB',(2,2),(0,0,0)).save(path);treatment['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
  manifest.write_text(json.dumps(data));self.binding=resolve_cast(self.repo,'Joan Mikita')
  self.path=str(self.repo/self.binding['path'])
  self.request={'scope':'mtw-comic','prompt':'Exact comic identity prompt.\n','referenced_image_paths':[self.path]}
  self.roles={'scope':'mtw-comic','comicCast':{'characters':[self.binding]},'inputs':[
   {'path':self.path,'role':'Canonical Joan identity only','sha256':self.binding['sha256'],'castBinding':self.binding}]}
  self.roles['registrationContract']={'canonicalDestination':'wiki/image-library/assets/scenes/comic-b/fixture-v2.png',
   'recordId':'fixture-generated','style':'comic-ink','version':'v2',
   'provenanceDestination':'wiki/image-library/records/fixture-generated/comic-ink/v2',
   'registrar':'fixture-registrar','requestedStatus':'pending-review','bytePreserveImport':True,'register':True,'verify':True,'completionStage':'registered'}
 def test_canonical_alias_resolved_before_direct_call(self):
  self.assertEqual(validate(self.request,self.roles,self.repo)['referenceCount'],1)
 def test_mtw_missing_registration_contract_refused(self):
  self.roles.pop('registrationContract')
  with self.assertRaisesRegex(ValueError,'registrationContract'):validate(self.request,self.roles,self.repo)
 def test_missing_comic_contract_refused(self):
  self.roles.pop('comicCast')
  with self.assertRaisesRegex(ValueError,'comicCast'):validate(self.request,self.roles,self.repo)
 def test_named_comic_request_cannot_drop_scope_and_binding_contract(self):
  self.request.pop('scope');self.roles.pop('scope');self.roles.pop('comicCast')
  self.roles['inputs'][0].pop('castBinding');self.request['prompt']='Comic B exact scene edit'
  with self.assertRaisesRegex(ValueError,'comicCast'):validate(self.request,self.roles,self.repo)
 def test_arbitrary_cast_role_does_not_supply_identity(self):
  self.roles['inputs'][0].pop('castBinding')
  with self.assertRaisesRegex(ValueError,'exact declared'):validate(self.request,self.roles,self.repo)
 def test_same_old_image_bytes_after_cast_mapping_change_refused(self):
  import json
  file=self.repo/'wiki/comics-library/characters.json';data=json.loads(file.read_text())
  data['characters'][1]['signature']='New canonical signature';file.write_text(json.dumps(data))
  with self.assertRaisesRegex(ValueError,'Stale'):validate(self.request,self.roles,self.repo)
 def test_explicit_contact_sheet_members_and_derived_bytes(self):
  from cast_authority import resolve_cast
  members=[self.binding,resolve_cast(self.repo,'potvin')]
  sheet=self.repo/'sheet.png';Image.new('RGB',(4,2),(0,0,0)).save(sheet)
  digest=hashlib.sha256(sheet.read_bytes()).hexdigest();self.request['referenced_image_paths']=[str(sheet)]
  self.roles['comicCast']['characters']=members
  self.roles['inputs']=[{'path':str(sheet),'role':'Compound identity only','sha256':digest,'castMembers':members,
   'composition':{'outputSha256':digest,'sources':members,'layout':{'columns':2}}}]
  self.assertEqual(validate(self.request,self.roles,self.repo)['referenceCount'],1)
  self.roles['inputs'][0]['composition'].pop('sources')
  with self.assertRaisesRegex(ValueError,'source bindings'):validate(self.request,self.roles,self.repo)

if __name__=='__main__':unittest.main()
