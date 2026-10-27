"""Canonical lookup/storage regression fixtures; no generated or production art."""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from compile_scene_brief import BriefError, compile_brief


class CanonicalBriefTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="mtw-canonical-brief-")
        self.addCleanup(self.temporary.cleanup)
        self.repo = Path(self.temporary.name)
        self.library = self.repo / "wiki/image-library"
        self.manifest = {"schemaVersion": 1, "records": [], "files": []}
        self.diagram = {"id": "diagram", "logicalId": "fixture", "collection": "diagrams",
                        "treatments": {}, "references": ["original-source"]}
        self.manifest["records"].append(self.diagram)
        for style, head in (("svg-flat", True), ("svg-outline", False)):
            svg = f"assets/vector/diagrams/{style}/fixture.svg"
            metadata = f"assets/vector/metadata/{style}/fixture.json"
            art = self.save(svg, b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"/>')
            data = {"id": "fixture", "viewBox": [0, 0, 1600, 900],
                    "sources": ["discussion/old-missing.png"],
                    "relationships": [{"id": "route", "startArrow": False, "endArrow": head}]}
            self.save(metadata, json.dumps(data).encode())
            self.diagram["treatments"][style] = {"path": svg, "sha256": art, "metadata": metadata}
        original = "assets/originals/fixture.png"
        digest = self.save(original, b"unchanged original fixture bytes")
        self.manifest["records"].append({"id": "original-source", "collection": "originals",
            "treatments": {"original": {"path": original, "sha256": digest}}})
        self.flush()

    def save(self, relative, data):
        path = self.library / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        digest = hashlib.sha256(data).hexdigest()
        self.manifest["files"].append({"destination": relative, "sha256": digest})
        return digest

    def flush(self):
        (self.library / "manifest.json").write_text(json.dumps(self.manifest), encoding="utf-8")

    def brief(self, style="svg-flat", selected=False):
        row = (self.manifest["records"][1]["treatments"]["original"] if selected
               else self.diagram["treatments"][style])
        return {"id": "fixture", "treatment": "holographic", "part": 2,
                "registrationContract": {"canonicalDestination":"wiki/image-library/assets/diagrams/holographic/fixture-v2.png",
                 "recordId":"fixture", "style":"holographic", "version":"v2", "provenanceDestination":"wiki/image-library/records/fixture/holographic/v2",
                 "registrar":"fixture-registrar", "requestedStatus":"pending-review", "bytePreserveImport":True,"register":True,"verify":True,"completionStage":"registered"},
                "referenceKind": "selected-reference" if selected else "new-svg",
                "vectorTreatment": style,
                "reference": {"path": "wiki/image-library/" + row["path"], "sha256": row["sha256"]},
                "sourceLabels": ["Internal"], "labels": ["Internal"],
                "routes": [{"name": "bound route", "start": "source", "end": "target",
                            "relationship": "route", "confirmedAgainstReference": True}]}

    def test_new_svg_uses_each_treatments_metadata_without_discussion(self):
        self.assertFalse((self.repo / "discussion").exists())
        for style, heads in (("svg-flat", ["end"]), ("svg-outline", [])):
            result = compile_brief(self.brief(style), self.repo)
            self.assertEqual(result["routes"][0]["heads"], heads)
            self.assertEqual(result['registrationContract']['completionStage'],'registered')
            self.assertEqual(result["inputAuthority"]["vectorTreatment"], style)
            self.assertIn(f"metadata/{style}/fixture.json", result["metadata"]["path"])
            self.assertIn("are not error statuses", result["promptBlock"])

    def test_missing_completion_contract_refused(self):
        brief=self.brief();brief.pop('registrationContract')
        with self.assertRaisesRegex(ValueError,'registrationContract'):compile_brief(brief,self.repo)

    def test_selected_original_uses_reference_record_without_discussion(self):
        result = compile_brief(self.brief(selected=True), self.repo)
        self.assertTrue(result["titlePolicy"]["removeOverallTitle"])
        self.assertIn("assets/originals/fixture.png", result["source"]["path"])

    def test_wrong_vector_treatment_is_not_silently_flat_metadata(self):
        brief = self.brief("svg-outline")
        brief["vectorTreatment"] = "svg-flat"
        with self.assertRaisesRegex(BriefError, "declared canonical SVG"):
            compile_brief(brief, self.repo)

    def test_unlinked_original_is_not_selected(self):
        self.diagram["references"] = []
        self.flush()
        with self.assertRaisesRegex(BriefError, "selected canonical source"):
            compile_brief(self.brief(selected=True), self.repo)

    def test_artwork_and_metadata_hash_guards(self):
        row = self.diagram["treatments"]["svg-flat"]
        for field, message in (("path", "canonical SVG hash"), ("metadata", "canonical metadata hash")):
            with self.subTest(field=field):
                path = self.library / row[field]
                before = path.read_bytes()
                path.write_bytes(before + b" ")
                brief = self.brief(selected=True)
                with self.assertRaisesRegex(BriefError, message):
                    compile_brief(brief, self.repo)
                path.write_bytes(before)

    def test_retired_discussion_replay_cannot_select_another_authority(self):
        with self.assertRaisesRegex(BriefError, "retired.*canonical"):
            compile_brief(self.brief(), self.repo, legacy_discussion=True)

    def test_missing_declared_input_does_not_fall_back(self):
        (self.library / self.diagram["treatments"]["svg-flat"]["metadata"]).unlink()
        with self.assertRaisesRegex(BriefError, "missing canonical input"):
            compile_brief(self.brief(), self.repo)

    def test_metadata_cannot_escape_library(self):
        self.diagram["treatments"]["svg-flat"]["metadata"] = "../../outside.json"
        self.flush()
        with self.assertRaisesRegex(BriefError, "stay within canonical"):
            compile_brief(self.brief(), self.repo)

    def test_hash_valid_metadata_still_must_match_id_viewbox_and_treatment(self):
        row = self.diagram["treatments"]["svg-flat"]
        path = self.library / row["metadata"]
        before = path.read_bytes()
        for field, value in (("id", "wrong"), ("viewBox", [0, 0, 100, 100]), ("treatment", "outline")):
            with self.subTest(field=field):
                data = json.loads(before)
                data[field] = value
                path.write_text(json.dumps(data), encoding="utf-8")
                row["metadataSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
                self.flush()
                with self.assertRaisesRegex(BriefError, "canonical metadata"):
                    compile_brief(self.brief(), self.repo)
        path.write_bytes(before)

    def test_duplicate_record_or_logical_id_is_rejected(self):
        duplicate = copy.deepcopy(self.diagram)
        self.manifest["records"].append(duplicate)
        self.flush()
        with self.assertRaisesRegex(BriefError, "duplicate canonical record"):
            compile_brief(self.brief(), self.repo)
        duplicate["id"] = "different"
        self.flush()
        with self.assertRaisesRegex(BriefError, "exactly one canonical record"):
            compile_brief(self.brief(), self.repo)

    def test_changed_original_hash_is_rejected(self):
        path = self.library / self.manifest["records"][1]["treatments"]["original"]["path"]
        path.write_bytes(b"different")
        brief = self.brief(selected=True)
        brief["reference"]["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        with self.assertRaisesRegex(BriefError, "canonical original hash"):
            compile_brief(brief, self.repo)

    def invoke(self, output):
        card = self.repo / "card.json"
        card.write_text(json.dumps(self.brief()), encoding="utf-8")
        return subprocess.run([sys.executable, "-B", str(Path(__file__).with_name("compile_scene_brief.py")),
            str(card), "--repo", str(self.repo), "--out", str(output / "contract.json"),
            "--prompt-out", str(output / "prompt.txt")], capture_output=True, text=True)

    def test_cli_rejects_new_discussion_evidence_before_write(self):
        output = self.repo / "discussion/new-evidence"
        result = self.invoke(output)
        self.assertEqual(result.returncode, 2)
        self.assertIn("never discussion", result.stderr)
        self.assertFalse(output.exists())

    def test_cli_saves_durable_records_and_never_overwrites(self):
        output = self.library / "records/fixture/holographic/attempt-01"
        result = self.invoke(output)
        self.assertEqual(result.returncode, 0, result.stderr)
        before = (output / "contract.json").read_bytes()
        self.assertEqual(self.invoke(output).returncode, 2)
        self.assertEqual((output / "contract.json").read_bytes(), before)


if __name__ == "__main__":
    unittest.main(verbosity=2)
