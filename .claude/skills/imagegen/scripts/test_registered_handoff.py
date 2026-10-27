import copy, hashlib, json, tempfile, unittest
from pathlib import Path
from PIL import Image
from validate_builtin_request import validate_registered_handoff

class RegisteredHandoff(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.library=self.root/'wiki/image-library'
        self.image=self.library/'assets/scene-v2.png';self.image.parent.mkdir(parents=True)
        Image.new('RGBA',(3,2),(12,100,130,253)).save(self.image)
        self.digest=hashlib.sha256(self.image.read_bytes()).hexdigest()
        self.catalog={'records':[{'id':'scene','treatments':{'comic-ink':{'path':'assets/scene-v2.png','sha256':self.digest,'status':'unreviewed-preview'}}}]}
        self.save_catalog()
        self.receipt=self.root/'register-result.json'
        self.contract={'canonicalDestination':'wiki/image-library/assets/scene-v2.png','recordId':'scene','style':'comic-ink','version':'v2',
          'provenanceDestination':'wiki/image-library/records/scene/comic-ink/v2','registrar':'fixture-registrar','requestedStatus':'unreviewed-preview',
          'bytePreserveImport':True,'register':True,'verify':True,'completionStage':'registered'}
        self.steps={operation:self.producer_step(operation) for operation in ('register','verify')}
        self.save_receipt({'registrar':'fixture-registrar',**self.steps})
        self.handoff={'stage':'registered','humanApproval':False,'images':[{'path':'wiki/image-library/assets/scene-v2.png','recordId':'scene','style':'comic-ink','version':'v2','sha256':self.digest,'registration':self.registration()}]}
        self.handoff['images'][0]['registrationContract']=self.contract
    def save_catalog(self):(self.library/'manifest.json').write_text(json.dumps(self.catalog),encoding='utf-8')
    def save_receipt(self,value):self.receipt.write_text(json.dumps(value),encoding='utf-8')
    def registration(self):return {'receiptPath':'register-result.json','receiptSha256':hashlib.sha256(self.receipt.read_bytes()).hexdigest()}
    def artifact(self,name,value):
        file=self.root/name;file.write_text(json.dumps(value),encoding='utf-8')
        return {'path':name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    def producer_step(self,operation):
        manifest_sha=hashlib.sha256((self.library/'manifest.json').read_bytes()).hexdigest()
        return {'code':0,'terminal':self.artifact(operation+'-terminal.json',{'state':'terminal','operation':operation,'actualExitCode':0,
          'finishedUtc':'2026-10-12T04:00:00Z','exitBasis':'fixture terminal child wait','command':['python','maintain_library.py',operation]}),
          'maintenanceChecks':self.artifact(operation+'-maintenance-checks.json',{'operation':operation,'library':str(self.library.resolve()),
          'manifestSha256':manifest_sha,'hashesAndRelativeReferences':'pass','artworkMutation':'none'}),
          'packageFiles':self.artifact(operation+'-package-files.json',{'root':str(self.library.resolve()),'files':[
          {'path':'assets/scene-v2.png','sha256':self.digest,'bytes':self.image.stat().st_size},
          {'path':'manifest.json','sha256':manifest_sha,'bytes':(self.library/'manifest.json').stat().st_size}]})}
    def check(self):return validate_registered_handoff(self.handoff,self.root)
    def test_actual_catalog_and_receipt(self):
        result=self.check();self.assertEqual(result['images'][0]['catalogStatus'],'unreviewed-preview');self.assertFalse(result['humanApproval'])
    def test_transport_is_not_completion(self):
        self.handoff['stage']='pending-registration'
        with self.assertRaisesRegex(ValueError,'registered stage'):self.check()
    def test_no_inferred_approval(self):
        self.handoff['humanApproval']=True
        with self.assertRaisesRegex(ValueError,'separate human'):self.check()
    def test_missing_catalog_record(self):
        self.catalog['records']=[];self.save_catalog()
        with self.assertRaisesRegex(ValueError,'not registered'):self.check()
    def test_false_version_label(self):
        self.handoff['images'][0]['version']='v9'
        with self.assertRaisesRegex(ValueError,'generation registration contract'):self.check()
    def test_changed_retained_bytes(self):
        Image.new('RGBA',(3,2),(255,1,1,253)).save(self.image)
        with self.assertRaisesRegex(ValueError,'retained catalog bytes'):self.check()
    def test_different_selected_path(self):
        alternate=self.image.parent/'other.png';alternate.write_bytes(self.image.read_bytes())
        self.catalog['records'][0]['treatments']['comic-ink']['path']='assets/other.png';self.save_catalog()
        with self.assertRaisesRegex(ValueError,'retained catalog bytes'):self.check()
    def test_failing_verify_cannot_complete(self):
        self.save_receipt({'registrar':'fixture-registrar',**self.steps,'verify':{'code':1}});self.handoff['images'][0]['registration']=self.registration()
        with self.assertRaisesRegex(ValueError,'register and verify'):self.check()
    def test_unlaunched_verify_cannot_complete(self):
        self.save_receipt({'registrar':'fixture-registrar',**self.steps,'verify':None});self.handoff['images'][0]['registration']=self.registration()
        with self.assertRaisesRegex(ValueError,'register and verify'):self.check()
    def test_stale_receipt(self):
        self.save_receipt({'register':{'code':0},'verify':{'code':1}})
        with self.assertRaisesRegex(ValueError,'receipt hash'):self.check()
    def test_destination_escape(self):
        outside=self.root/'outside.png';outside.write_bytes(self.image.read_bytes());self.handoff['images'][0]['path']='outside.png'
        with self.assertRaisesRegex(ValueError,'canonical'):self.check()
    def test_duplicate_handoff_entry(self):
        self.handoff['images'].append(copy.deepcopy(self.handoff['images'][0]))
        with self.assertRaisesRegex(ValueError,'Distinct'):self.check()
    def test_forged_zero_exit_json_is_not_producer_evidence(self):
        self.save_receipt({'registrar':'fixture-registrar','register':{'code':0},'verify':{'code':0}})
        self.handoff['images'][0]['registration']=self.registration()
        with self.assertRaisesRegex(ValueError,'actual maintained producer artifact'):self.check()
    def test_pending_terminal_with_zero_summary_is_refused(self):
        self.steps['verify']['terminal']=self.artifact('verify-terminal.json',{'state':'running','operation':'verify','actualExitCode':0})
        self.save_receipt({'registrar':'fixture-registrar',**self.steps});self.handoff['images'][0]['registration']=self.registration()
        with self.assertRaisesRegex(ValueError,'terminal success'):self.check()
    def test_unrelated_catalog_addition_keeps_completed_handoff_reusable(self):
        self.catalog['records'].append({'id':'unrelated','treatments':{}});self.save_catalog()
        self.assertEqual(self.check()['stage'],'registered')

if __name__=='__main__':unittest.main()
