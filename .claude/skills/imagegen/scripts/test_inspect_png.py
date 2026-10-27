"""Technical alpha-erasure escape checks; synthetic fixtures are not art acceptance."""
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from inspect_png import inspect

class AlphaSelectionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
    def fixture(self, name, alpha):
        image = Image.new('RGBA', (4, 3), (0, 0, 0, 0))
        image.putpixel((1, 1), (0, 0, 0, alpha))
        image.putpixel((2, 1), (70, 90, 130, 255))
        image.putpixel((3, 1), (30, 50, 70, 80))
        path = self.root / name
        image.save(path)
        return path
    def test_opaque_black_removed_prop_rejected_despite_global_alpha(self):
        result = inspect(self.fixture('failed.png', 255), require_transparency=True,
                         transparent_samples=[('removed-monitor', 1, 1)])
        self.assertGreater(result['fullyTransparentPixels'], 0)
        self.assertEqual(result['technicalFlags'], ['Expected fully transparent sample remains visible: removed-monitor'])
    def test_partial_prop_ghost_rejected(self):
        result = inspect(self.fixture('ghost.png', 1), transparent_samples=[('removed-book', 1, 1)])
        self.assertEqual(len(result['technicalFlags']), 1)
    def test_valid_erasure_preserves_opaque_hand_and_partial_halo(self):
        result = inspect(self.fixture('valid.png', 0), require_transparency=True,
                         samples=[('retained-hand', 2, 1), ('retained-halo', 3, 1)],
                         transparent_samples=[('removed-monitor', 1, 1)])
        self.assertEqual(result['technicalFlags'], [])
        samples = {x['name']: x['rgba'] for x in result['samples']}
        self.assertEqual(samples['retained-hand'], [70, 90, 130, 255])
        self.assertEqual(samples['retained-halo'], [30, 50, 70, 80])
        self.assertEqual(result['visualReview'], 'not-performed-by-this-tool')
    def test_existing_sample_only_api_remains_read_only(self):
        result = inspect(self.fixture('ordinary.png', 255), samples=[('reported', 1, 1)])
        self.assertEqual(result['technicalFlags'], [])
        self.assertEqual(result['expectedTransparentSamples'], [])
    def test_bad_coordinate_rejected(self):
        with self.assertRaisesRegex(ValueError, 'outside image'):
            inspect(self.fixture('outside.png', 0), transparent_samples=[('bad', 4, 1)])

if __name__ == '__main__':
    unittest.main()
