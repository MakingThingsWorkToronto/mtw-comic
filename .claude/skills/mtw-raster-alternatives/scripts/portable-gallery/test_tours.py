"""Tour associations preserve version identity; review updates do not rewrite data."""
import copy
import importlib.util
from pathlib import Path
import unittest
import json
import tempfile

spec = importlib.util.spec_from_file_location("library_helper", Path(__file__).with_name("maintain_library.py"))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

def catalog():
    return {"records": [{"id": "test", "logicalId": "test", "collection": "diagrams", "title": "Test", "description": "Test", "service": "Test", "category": "Test", "treatments": {"svg-flat": {"path": "assets/test.svg", "status": "needs-review"}}, "tour": {"id": "test", "currentVersion": 1, "versions": [{"version": 1, "data": "assets/tours/test/v1/tour.json", "sha256": "old", "preview": "assets/tours/test/v1/index.html", "geometry": {"svg-flat": "old"}, "review": {"browser": "unperformed"}}]}}]}

class TourPreservation(unittest.TestCase):
    def test_keep_exact_version(self):
        before = catalog()
        helper.preserve_previous(before, copy.deepcopy(before))

    def test_cannot_drop_association(self):
        before = catalog(); after = copy.deepcopy(before)
        del after["records"][0]["tour"]
        with self.assertRaises(ValueError): helper.preserve_previous(before, after)

    def test_cannot_drop_version(self):
        before = catalog(); after = copy.deepcopy(before)
        after["records"][0]["tour"]["versions"] = []
        with self.assertRaises(ValueError): helper.preserve_previous(before, after)

    def test_cannot_change_geometry(self):
        before = catalog(); after = copy.deepcopy(before)
        after["records"][0]["tour"]["versions"][0]["geometry"] = {"svg-flat": "different"}
        with self.assertRaises(ValueError): helper.preserve_previous(before, after)

    def test_new_version_retains_old(self):
        before = catalog(); after = copy.deepcopy(before)
        tour = after["records"][0]["tour"]
        version = copy.deepcopy(tour["versions"][0]); version.update(version=2, data="assets/tours/test/v2/tour.json", sha256="new")
        tour["versions"].append(version); tour["currentVersion"] = 2
        helper.preserve_previous(before, after)

    def test_review_update_preserves_definition(self):
        before = catalog(); after = copy.deepcopy(before)
        after["records"][0]["tour"]["versions"][0]["review"]["playback"] = "generated"
        helper.preserve_previous(before, after)


    def variant_catalog(self):
        value = catalog()
        row = value["records"][0]
        variant = copy.deepcopy(row["tour"])
        variant["id"] = "test-b"
        variant["versions"][0].update(data="assets/tours/test-b/v1/tour.json", preview="assets/tours/test-b/v1/index.html")
        row["tourVariants"] = [variant]
        return value

    def test_variant_revision_retains_primary_and_previous_bytes(self):
        before = self.variant_catalog(); after = copy.deepcopy(before)
        variant = after["records"][0]["tourVariants"][0]
        version = copy.deepcopy(variant["versions"][0])
        version.update(version=2, data="assets/tours/test-b/v2/tour.json", sha256="new")
        variant["versions"].append(version); variant["currentVersion"] = 2
        helper.preserve_previous(before, after)
        self.assertEqual(before["records"][0]["tour"], after["records"][0]["tour"])

    def test_cannot_drop_variant_association_or_version(self):
        for drop in ["association", "version"]:
            before = self.variant_catalog(); after = copy.deepcopy(before)
            if drop == "association": after["records"][0]["tourVariants"] = []
            else: after["records"][0]["tourVariants"][0]["versions"] = []
            with self.assertRaises(ValueError): helper.preserve_previous(before, after)

    def test_cannot_change_retained_variant_definition_or_geometry(self):
        for key, replacement in [("sha256", "changed"), ("data", "changed.json"), ("geometry", {"svg-glass": "changed"})]:
            before = self.variant_catalog(); after = copy.deepcopy(before)
            after["records"][0]["tourVariants"][0]["versions"][0][key] = replacement
            with self.assertRaises(ValueError): helper.preserve_previous(before, after)

    def test_variant_review_update_preserves_definition(self):
        before = self.variant_catalog(); after = copy.deepcopy(before)
        after["records"][0]["tourVariants"][0]["versions"][0]["review"]["playback"] = "generated"
        helper.preserve_previous(before, after)

    def test_variant_ids_reject_primary_duplicates_and_bad_ids(self):
        for bad in ["test", "Bad Id", None]:
            value = self.variant_catalog(); value["records"][0]["tourVariants"][0]["id"] = bad
            with self.assertRaises(ValueError): helper.tour_associations(value["records"][0])
        value = self.variant_catalog(); value["records"][0]["tourVariants"] *= 2
        with self.assertRaises(ValueError): helper.tour_associations(value["records"][0])

    def real_catalog(self):
        # Bounded external fixtures are retained as evidence; no repo file is written.
        root = Path(tempfile.mkdtemp(prefix="mtw-library-tour-" )).resolve()
        value = self.variant_catalog()
        (root / "assets").mkdir()
        (root / "assets/test.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"></svg>', encoding="utf-8")
        for tour in helper.tour_associations(value["records"][0]):
            version = tour["versions"][0]
            data = root / version["data"]
            data.parent.mkdir(parents=True)
            data.write_text(json.dumps({"diagram": "test"}), encoding="utf-8")
            version["sha256"] = helper.sha(data)
        return root, value

    def test_derive_accepts_variant_revision_after_register_merge(self):
        root, before = self.real_catalog()
        row = copy.deepcopy(before["records"][0]); variant = row["tourVariants"][0]
        version = copy.deepcopy(variant["versions"][0])
        version.update(version=2, data="assets/tours/test-b/v2/tour.json", preview="assets/tours/test-b/v2/index.html")
        data = root / version["data"]; data.parent.mkdir(parents=True); data.write_text('{"diagram":"test"}', encoding="utf-8")
        version["sha256"] = helper.sha(data)
        variant["versions"].append(version); variant["currentVersion"] = 2
        after, retained = helper.register_records(before, {"records": [row]})
        derived = helper.derive(root, after, before)
        self.assertEqual(derived["records"][0]["tourVariants"][0]["currentVersion"], 2)
        self.assertEqual(before["records"][0]["tour"], derived["records"][0]["tour"])

    def test_derive_rejects_bad_variant_hash_and_generated_preview(self):
        for failure in ["hash", "preview"]:
            root, value = self.real_catalog()
            version = value["records"][0]["tourVariants"][0]["versions"][0]
            if failure == "hash": version["sha256"] = "changed"
            else: version["review"]["playback"] = "generated"
            with self.assertRaises(ValueError): helper.derive(root, value, None)

    def test_generated_index_retains_variant_playback_link(self):
        root, value = self.real_catalog()
        for tour in helper.tour_associations(value["records"][0]):
            version = tour["versions"][0]
            (root / version["preview"]).write_text("<html></html>", encoding="utf-8")
            version["review"]["playback"] = "generated"
        derived = helper.derive(root, value, None)
        page = helper.generated_files(derived)["all-files.html"].decode("utf-8")
        self.assertIn('assets/tours/test-b/v1/index.html', page)
        self.assertIn('assets/tours/test/v1/index.html', page)


    def test_return_bridge_is_static_and_validates_its_target(self):
        root, value = self.real_catalog()
        outputs = helper.generated_files(helper.derive(root, value, None))
        bridge = outputs["index.html"].decode("utf-8")
        self.assertIn('content="0;url=all-files.html"', bridge)
        self.assertIn('href="all-files.html"', bridge)
        self.assertNotIn("<script", bridge)
        self.assertNotIn("browser.js", bridge)
        self.assertNotIn("library.css", bridge)
        self.assertNotIn("browser.js", outputs)
        self.assertNotIn("library.css", outputs)
        self.assertIn("index.html", helper.DERIVED)
        helper.validate_links(root, outputs)
        with self.assertRaisesRegex(ValueError, "index.html -> all-files.html"):
            helper.validate_links(root, {"index.html": outputs["index.html"]})

    def test_two_refreshes_preserve_primary_and_variant_legacy_previews(self):
        import io
        from contextlib import redirect_stdout
        from unittest.mock import patch
        import sys
        root, value = self.real_catalog()
        before = {}
        for tour in helper.tour_associations(value["records"][0]):
            version = tour["versions"][0]
            preview = root / version["preview"]
            preview.write_bytes(b'<html><a href="../../../../index.html" data-library-back>Back</a></html>')
            version["review"]["playback"] = "generated"
            before[version["preview"]] = preview.read_bytes()
        (root / "manifest.json").write_bytes(helper.json_bytes(value))
        receipts = root.parent / (root.name + "-receipts")
        for phase in ["refresh", "refresh", "verify"]:
            args = ["maintain_library.py", phase, "--library", str(root), "--receipt-dir", str(receipts / phase)]
            with patch.object(sys, "argv", args), redirect_stdout(io.StringIO()):
                helper.main()
            self.assertTrue((root / "index.html").is_file())
            self.assertTrue((root / "all-files.html").is_file())
            for name, original in before.items():
                self.assertEqual((root / name).read_bytes(), original)
                self.assertTrue(((root / name).parent / "../../../../index.html").resolve().is_file())
            self.assertFalse((root / "browser.js").exists())
            self.assertFalse((root / "library.css").exists())

if __name__ == "__main__": unittest.main()
