"""In-memory separator fixtures: current teal templates/detection and retained legacy inputs."""
import io
import json
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageDraw
import page_tools

PAGE = {'id': 'separator-fixture', 'size': [1000, 600], 'margin': [.05, .05], 'gutter': .02,
        'boxes': [{'id': 'left', 'rect': [0, 0, .5, 1]}, {'id': 'right', 'rect': [.5, 0, .5, 1]}]}


class PageSeparators(unittest.TestCase):
    def test_template_uses_teal_for_outer_margin_gutter_and_frame(self):
        captured = []
        with patch.object(Image.Image, 'save', lambda image, *a, **k: captured.append(image.copy())), redirect_stdout(io.StringIO()):
            page_tools.template(PAGE, 'not-written.png')
        image = captured[0]
        for point in [(0, 0), (500, 300), (50, 100)]:
            self.assertEqual(image.getpixel(point), (26, 155, 161))
        self.assertEqual(image.getpixel((100, 100)), (58, 64, 68))

    def check_detected_shift(self, colour):
        image = Image.new('RGB', PAGE['size'], colour)
        draw = ImageDraw.Draw(image)
        draw.rectangle([50, 30, 499, 569], fill=(11, 20, 25))
        draw.rectangle([520, 30, 949, 569], fill=(11, 20, 25))
        draw.rectangle([100, 100, 250, 250], fill=(26, 155, 161))  # ordinary teal art on either page
        captured = []
        with patch.object(Image, 'open', return_value=image), patch.object(Image.Image, 'save'), \
             patch.object(Path, 'write_text', lambda path, text, **k: captured.append(json.loads(text))), redirect_stdout(io.StringIO()):
            page_tools.detect(PAGE, 'in-memory', 'not-written.json')
        left, right = captured[0]['regions']
        self.assertAlmostEqual(left['rect'][0] + left['rect'][2], .5, places=3)
        self.assertAlmostEqual(right['rect'][0], .52, places=3)

    def test_detects_shifted_teal_separator(self):
        self.check_detected_shift((26, 155, 161))

    def test_preserves_detection_of_retained_legacy_white_page(self):
        self.check_detected_shift((242, 242, 239))


if __name__ == '__main__':
    unittest.main()
