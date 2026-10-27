"""Phone photographs saved as multi-picture JPEG (MPO) register under their .jpg/.jpeg name (2026-09-25 escape check)."""
import importlib.util
import tempfile
from pathlib import Path
import unittest

from PIL import Image

spec = importlib.util.spec_from_file_location("library_helper", Path(__file__).with_name("maintain_library.py"))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class ImageFormats(unittest.TestCase):
    def test_mpo_keeps_jpeg_extension(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "phone.jpeg"
            frames = [Image.new("RGB", (8, 8), c) for c in ((10, 20, 30), (40, 50, 60))]
            frames[0].save(path, format="MPO", save_all=True, append_images=frames[1:])
            with Image.open(path) as im:
                self.assertEqual(im.format, "MPO")
            self.assertEqual(helper.image_details(path)["format"], "MPO")

    def test_real_mismatch_still_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "wrong.jpeg"
            Image.new("RGB", (8, 8)).save(path, format="PNG")
            with self.assertRaises(ValueError):
                helper.image_details(path)

    def test_svg_embedded_raster_allowed_external_rejected(self):
        # Site Glass (2026-09-26) embeds its brain as a data: URI; an external href is still a dependency.
        png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        with tempfile.TemporaryDirectory() as tmp:
            ok = Path(tmp) / "glass.svg"
            ok.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="data:image/webp;base64,'
                          + png + '" width="1" height="1"/><use href="#a"/><path id="a" d="M0 0H1"/></svg>', encoding="utf-8")
            self.assertEqual(helper.image_details(ok)["format"], "SVG")
            bad = Path(tmp) / "external.svg"
            bad.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="brain.webp" width="1" height="1"/></svg>',
                           encoding="utf-8")
            with self.assertRaises(ValueError):
                helper.image_details(bad)
            remote = Path(tmp) / "remote.svg"
            remote.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="data:text/html;base64,PGI+"/></svg>',
                              encoding="utf-8")
            with self.assertRaises(ValueError):
                helper.image_details(remote)


if __name__ == "__main__":
    unittest.main()
