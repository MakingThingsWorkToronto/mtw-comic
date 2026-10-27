import unittest
import ast
from pathlib import Path
from copy import deepcopy
from catalog_reference_links import normalize_reference_links, IMAGE_EXTENSIONS

class ReferenceLinks(unittest.TestCase):
    def setUp(self):
        self.catalog = {'records': [{'id':'model-a','collection':'scenes',
          'treatments':{'comic-ink':{'path':'assets/a.png','sha256':'abc'}}}]}
        self.payload = {'records':[{'id':'new','references':[
          {'path':'assets/a.png','sha256':'abc','role':'identity'}]}]}
    def test_actual_input_shape_retains_lineage_and_resolves_id(self):
        r=normalize_reference_links(self.payload,self.catalog)
        self.assertEqual(r['records'][0]['references'],['model-a'])
        self.assertEqual(r['records'][0]['sourceInputs'],self.payload['records'][0]['references'])
        self.assertIsInstance(self.payload['records'][0]['references'][0],dict)
    def test_different_existing_id_remains(self):
        self.payload['records'][0]['references']=['model-a']
        self.assertEqual(normalize_reference_links(self.payload,self.catalog),self.payload)
    def test_stale_hash_refused(self):
        self.payload['records'][0]['references'][0]['sha256']='stale'
        with self.assertRaises(ValueError):normalize_reference_links(self.payload,self.catalog)
    def test_ambiguous_current_path_refused(self):
        self.catalog['records'].append({**self.catalog['records'][0],'id':'other'})
        with self.assertRaises(ValueError):normalize_reference_links(self.payload,self.catalog)
    def test_unknown_id_refused(self):
        self.payload['records'][0]['references']=['missing']
        with self.assertRaises(ValueError):normalize_reference_links(self.payload,self.catalog)
    def test_related_object_refused(self):
        self.payload['records'][0]['relatedDiagrams']=[{'id':'model-a'}]
        with self.assertRaises(ValueError):normalize_reference_links(self.payload,self.catalog)

class ArtworkPaths(unittest.TestCase):
    def setUp(self):
        self.catalog = {'records': []}
        self.payload = {'records': [{'id': 'new', 'treatments': {'comic-ink': {
            'path': 'assets/scenes/plane.png', 'status': 'candidate'}}}]}

    def test_actual_json_mask_receipt_rejected_before_reference_resolution(self):
        row = self.payload['records'][0]
        row['treatments']['comic-ink']['path'] = 'assets/scenes/comic-b/layers/data-migrations-repair/live-v1/agents-source-exclusion-v2-mask-receipt.json'
        row['references'] = ['also-invalid']
        before = deepcopy(self.payload)
        with self.assertRaisesRegex(ValueError, 'Browser artwork must be an image'):
            normalize_reference_links(self.payload, self.catalog)
        self.assertEqual(self.payload, before)

    def test_all_producer_formats_and_uppercase_preserved(self):
        for ext in IMAGE_EXTENSIONS:
            with self.subTest(extension=ext):
                self.payload['records'][0]['treatments']['comic-ink']['path'] = 'assets/scenes/art' + ext.upper()
                self.assertEqual(normalize_reference_links(self.payload, self.catalog), self.payload)

    def test_every_treatment_checked(self):
        self.payload['records'][0]['treatments']['other'] = {'path': 'assets/mask.json'}
        with self.assertRaisesRegex(ValueError, 'Browser artwork must be an image'):
            normalize_reference_links(self.payload, self.catalog)

    def test_explicit_missing_treatment_still_allowed(self):
        self.payload['records'][0]['treatments']['other'] = {'status': 'missing'}
        self.assertEqual(normalize_reference_links(self.payload, self.catalog), self.payload)

    def test_missing_path_without_missing_status_rejected(self):
        self.payload['records'][0]['treatments']['other'] = {'status': 'candidate'}
        with self.assertRaisesRegex(ValueError, 'explicitly missing'):
            normalize_reference_links(self.payload, self.catalog)

    def test_support_json_is_preserved_outside_treatment(self):
        self.payload['records'][0]['supportFiles'] = [{'path': 'assets/mask-receipt.json', 'sha256': 'abc'}]
        self.assertEqual(normalize_reference_links(self.payload, self.catalog), self.payload)

    def test_image_path_requires_assets_home(self):
        self.payload['records'][0]['treatments']['comic-ink']['path'] = 'records/proof.png'
        with self.assertRaisesRegex(ValueError, 'Browser artwork must be an image'):
            normalize_reference_links(self.payload, self.catalog)

    def test_exact_producer_extension_contract_both_editions(self):
        for edition in ('.codex', '.claude'):
            producer = Path.cwd() / edition / 'skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py'
            tree = ast.parse(producer.read_text(encoding='utf-8'))
            values = [ast.literal_eval(node.value) for node in tree.body
                if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'IMAGES' for t in node.targets)]
            self.assertEqual(values, [IMAGE_EXTENSIONS])

if __name__=='__main__':unittest.main()
