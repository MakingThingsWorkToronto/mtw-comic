"""The producer's `remove` operation drops only declared, already-deleted files; every other drop stays refused."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HELPER = Path(__file__).with_name("maintain_library.py")
spec = importlib.util.spec_from_file_location("remove_helper", HELPER)
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="{n}" height="1"/></svg>'


def record(ident, paths, collection="experiments", **extra):
    return {"id": ident, "logicalId": None, "collection": collection, "title": ident, "description": "Fixture",
            "service": "Fixture", "category": "Fixture",
            "treatments": {style: {"path": p, "status": "needs-review"} for style, p in paths.items()}, **extra}


class Remove(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name).resolve()
        self.root, self.receipts = base / "library", base / "receipts"
        (self.root / "assets/experiments").mkdir(parents=True)
        for n, name in enumerate(["gone", "kept", "two-a", "two-b"], 1):
            (self.root / f"assets/experiments/{name}.svg").write_text(SVG.format(n=n), encoding="utf-8")
        rows = [record("gone", {"experimental": "assets/experiments/gone.svg"}),
                record("kept", {"experimental": "assets/experiments/kept.svg"}, references=["gone"]),
                record("two", {"experimental": "assets/experiments/two-a.svg", "alt": "assets/experiments/two-b.svg"})]
        (self.root / "manifest.json").write_text(json.dumps({"records": rows}), encoding="utf-8")
        self.run_op("refresh")

    def tearDown(self):
        self.tmp.cleanup()

    def run_op(self, operation, payload=None, ok=True):
        args = [sys.executable, str(HELPER), operation, "--library", str(self.root), "--receipt-dir", str(self.receipts / operation)]
        if payload is not None:
            file = self.root.parent / "payload.json"
            file.write_text(json.dumps(payload), encoding="utf-8")
            args += ["--payload", str(file)]
        result = subprocess.run(args, capture_output=True, text=True)
        if ok:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def manifest(self):
        return json.loads((self.root / "manifest.json").read_text(encoding="utf-8"))

    def payload(self, *entries):
        digest = hashlib.sha256((self.root / "manifest.json").read_bytes()).hexdigest()
        return {"expectedManifestSha256": digest, "remove": list(entries)}

    def entry(self, name, ids):
        path = f"assets/experiments/{name}.svg"
        return {"path": path, "sha256": helper.sha(self.root / path), "recordIds": ids, "archivedTo": f"C:/archive/{path}"}

    def test_drops_declared_treatment_record_link_and_file_row_then_verifies(self):
        gone, half = self.entry("gone", ["gone"]), self.entry("two-b", ["two"])
        payload = self.payload(gone, half)
        (self.root / gone["path"]).unlink()
        (self.root / half["path"]).unlink()
        receipt = json.loads(self.run_op("remove", payload).stdout)
        self.assertEqual(receipt["removed"]["records"], ["gone"])
        self.assertEqual(receipt["removed"]["treatments"], ["gone/experimental", "two/alt"])
        after = self.manifest()
        rows = {r["id"]: r for r in after["records"]}
        self.assertNotIn("gone", rows)
        self.assertEqual(list(rows["two"]["treatments"]), ["experimental"])
        self.assertEqual(rows["kept"].get("references"), [])
        destinations = {f["destination"] for f in after["files"]}
        self.assertFalse({gone["path"], half["path"]} & destinations)
        self.assertNotRegex((self.root / "data.js").read_text(encoding="utf-8"), r'"id":\s*"gone"')
        self.assertRegex((self.root / "data.js").read_text(encoding="utf-8"), r'"id":\s*"kept"')
        self.assertNotIn(gone["path"], (self.root / "all-files.html").read_text(encoding="utf-8"))
        self.run_op("verify")
        self.run_op("refresh")

    def test_refuses_stale_hash_existing_file_and_undeclared_record(self):
        gone = self.entry("gone", ["gone"])
        before = (self.root / "manifest.json").read_bytes()
        self.assertIn("still exists", self.run_op("remove", self.payload(gone), ok=False).stderr)
        (self.root / gone["path"]).unlink()
        stale = self.payload(gone)
        stale["expectedManifestSha256"] = "0" * 64
        self.assertIn("expectedManifestSha256", self.run_op("remove", stale, ok=False).stderr)
        self.assertIn("does not declare record", self.run_op("remove", self.payload(self.entry_for_missing("gone", ["kept"])), ok=False).stderr)
        self.assertEqual((self.root / "manifest.json").read_bytes(), before)

    def entry_for_missing(self, name, ids):
        return {"path": f"assets/experiments/{name}.svg", "recordIds": ids}

    def test_undeclared_drops_are_still_refused(self):
        previous = self.manifest()
        current = {**previous, "records": [r for r in previous["records"] if r["id"] != "gone"]}
        with self.assertRaisesRegex(ValueError, "Dropping a registered record is not allowed: gone"):
            helper.preserve_previous(previous, current)
        allowed = {"records": {"gone"}, "treatments": {("gone", "experimental")}, "paths": set()}
        current["records"] = [dict(r, references=[]) if r["id"] == "kept" else r for r in current["records"]]
        helper.preserve_previous(previous, current, allowed)
        other = {**current, "records": [r for r in current["records"] if r["id"] != "two"]}
        with self.assertRaisesRegex(ValueError, "Dropping a registered record is not allowed: two"):
            helper.preserve_previous(previous, other, allowed)

    def test_operation_is_advertised_for_studio(self):
        self.assertRegex(HELPER.read_text(encoding="utf-8"), r'add_argument\("operation", choices=\[[^\]]*"remove"')


if __name__ == "__main__":
    unittest.main()
