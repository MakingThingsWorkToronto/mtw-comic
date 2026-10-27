"""Portable filename collision checks remain Unicode-aware with linear normalization work."""
import importlib.util
from collections import Counter
from copy import deepcopy
import sys
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location("scan_helper", Path(__file__).with_name("maintain_library.py"))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

class CountedName(str):
    calls = 0
    def casefold(self):
        type(self).calls += 1
        return super().casefold()

class Entry:
    suffix = ".txt"
    def __init__(self, name): self.name = CountedName(name)
    def __lt__(self, other): return self.name < other.name
    def is_file(self): return True
    def relative_to(self, root): return self
    def as_posix(self): return self.name
    def stat(self): return SimpleNamespace(st_size=1)

class FixtureRoot:
    def __init__(self, names): self.entries = [Entry(name) for name in names]
    def rglob(self, pattern): return self.entries

def synthetic_scan(module, names):
    with patch.object(module, "local_path", return_value=None), patch.object(module, "file_identity", return_value=None), patch.object(module, "sha", return_value="fixture-hash"):
        return module.derive(FixtureRoot(names), {"records": []}, None)

class PhysicalScan(unittest.TestCase):
    def setUp(self):
        self.cache = patch.object(helper, "_HASHES", helper.VerifiedHashes())
        self.cache.start()
        self.addCleanup(self.cache.stop)
    def test_linear_casefold_work(self):
        for count in (40, 1000):
            CountedName.calls = 0
            result = synthetic_scan(helper, [f"records/file-{i:05d}.txt" for i in range(count)])
            self.assertEqual(len(result["files"]), count)
            self.assertLessEqual(CountedName.calls, count * 2)

    def test_case_and_unicode_collisions_still_rejected(self):
        # A synthetic directory can represent names that Windows itself will not allow side by side.
        for names in (("records/A.txt", "records/a.txt"), ("records/Straße.txt", "records/STRASSE.txt")):
            with self.assertRaisesRegex(ValueError, "Conflicting portable filename"):
                synthetic_scan(helper, names)

    def test_order_and_nonconflicting_unicode_preserved(self):
        names = ["records/é.txt", "records/z.txt", "records/A.txt"]
        result = synthetic_scan(helper, names)
        self.assertEqual([f["destination"] for f in result["files"]], sorted(names))
        self.assertEqual(result["counts"]["copiedBytes"], 3)

    def test_real_files_keep_hash_and_immutability_validation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            (root / "records").mkdir()
            for i in range(12): (root / "records" / f"note-{i}.txt").write_text(f"evidence {i}", encoding="utf-8")
            first = helper.derive(root, {"records": []}, None)
            self.assertEqual(first["counts"]["copiedFiles"], 12)
            for row in first["files"]: self.assertEqual(row["sha256"], helper.sha(root / row["destination"]))
            self.assertEqual(helper.derive(root, first, first), first)
            (root / "records/note-0.txt").write_text("tampered", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Registered hash conflict"):
                helper.derive(root, first, first)


    def real_inventory(self, root):
        (root / "records").mkdir()
        for i in range(4):
            (root / "records" / f"note-{i}.txt").write_text(f"evidence {i}", encoding="utf-8")
        return helper.derive(root, {"records": []}, None)

    def test_shared_inventory_reuses_verified_hash_for_final_inventory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.real_inventory(root)
            with patch.object(helper, "sha", wraps=helper.sha) as measured:
                after = helper.derive(root, before, deepcopy(before))
            self.assertEqual(after, before)
            counts = Counter(call.args[0].relative_to(root).as_posix() for call in measured.call_args_list)
            self.assertEqual(counts, {row["destination"]: 1 for row in before["files"]})

    def test_conflicting_inventory_expectations_rejected_in_either_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            good = self.real_inventory(root)
            bad = deepcopy(good)
            bad["files"][0]["sha256"] = "0" * 64
            for current, previous in ((good, bad), (bad, good)):
                with self.subTest(current_bad=current is bad):
                    with self.assertRaisesRegex(ValueError, "Registered hash conflict"):
                        helper.derive(root, current, previous)

    def test_duplicate_and_missing_entries_rejected_in_either_inventory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            good = self.real_inventory(root)
            for failure in ("duplicate", "missing"):
                bad = deepcopy(good)
                if failure == "duplicate": bad["files"].append(deepcopy(bad["files"][0]))
                else: bad["files"][0]["destination"] = "records/absent.txt"
                message = "Duplicate registered filename" if failure == "duplicate" else "Missing registered file"
                for current, previous in ((good, bad), (bad, good)):
                    with self.subTest(failure=failure, current_bad=current is bad):
                        with self.assertRaisesRegex(ValueError, message):
                            helper.derive(root, current, previous)

    def test_inventory_measurements_reset_each_operation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.real_inventory(root)
            with patch.object(helper, "sha", wraps=helper.sha) as measured:
                helper.derive(root, before, before)
                helper.derive(root, before, before)
            self.assertEqual(measured.call_count, len(before["files"]) * 2)
            # Same-length changed bytes must not reuse the preceding operation's hash.
            (root / "records/note-0.txt").write_text("changed! 0", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Registered hash conflict"):
                helper.derive(root, before, before)

    def shared_treatment_inventory(self, root):
        (root / "assets").mkdir()
        (root / "assets/shared.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>', encoding="utf-8")
        rows = [{"id": name, "collection": "earlier", "title": name, "description": "Fixture",
                 "service": "Fixture", "category": "Fixture", "treatments": {
                     "svg-flat": {"path": "assets/shared.svg", "status": "needs-review"}}}
                for name in ("first", "second")]
        return helper.derive(root, {"records": rows}, None)

    def test_shared_treatment_hash_is_lazy_but_all_assertions_remain(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.shared_treatment_inventory(root)
            with patch.object(helper, "sha", wraps=helper.sha) as measured:
                self.assertEqual(helper.derive(root, before, before), before)
            # Shared validation and final inventory keep checking stable identity.
            self.assertEqual(measured.call_count, 1)
            bad = deepcopy(before)
            bad["records"][1]["treatments"]["svg-flat"]["sha256"] = "0" * 64
            with self.assertRaisesRegex(ValueError, "Treatment hash conflict"):
                helper.derive(root, bad, None)
            # No expected hashes: a later derivation must measure new source bytes.
            fresh = deepcopy(before)
            fresh.pop("files")
            for row in fresh["records"]: row["treatments"]["svg-flat"].pop("sha256")
            art = root / "assets/shared.svg"
            art.write_bytes(art.read_bytes() + b"\n")
            after = helper.derive(root, fresh, None)
            self.assertNotEqual(after["records"][0]["treatments"]["svg-flat"]["sha256"],
                                before["records"][0]["treatments"]["svg-flat"]["sha256"])

    def test_receipt_rehashes_actual_files_independently(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp).resolve()
            root = folder / "library"; root.mkdir()
            before = self.real_inventory(root)
            helper.derive(root, before, before)
            (root / "manifest.json").write_bytes(helper.json_bytes(before))
            changed = root / "records/note-0.txt"
            changed.write_text("changed! 0", encoding="utf-8")
            with patch.object(helper, "sha", wraps=helper.sha) as measured:
                helper.receipt(root, folder / "receipts", "fixture")
            counts = Counter(call.args[0].relative_to(root).as_posix() for call in measured.call_args_list)
            self.assertEqual(counts, {**{row["destination"]: 1 for row in before["files"]}, "manifest.json": 2})
            receipt = helper.read_json(folder / "receipts/package-files.json")
            actual = next(row for row in receipt["files"] if row["path"] == "records/note-0.txt")
            self.assertEqual(actual["sha256"], helper.sha(changed))
            self.assertNotEqual(actual["sha256"], before["files"][0]["sha256"])

    def test_stale_payload_and_prewrite_manifest_guards_remain(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp).resolve()
            root = folder / "library"; root.mkdir()
            manifest = root / "manifest.json"
            manifest.write_bytes(helper.json_bytes({"records": []}))
            payload = folder / "payload.json"
            payload.write_bytes(helper.json_bytes({"expectedManifestSha256": "0" * 64, "records": []}))
            args = ["maintain_library.py", "register", "--library", str(root), "--receipt-dir", str(folder / "receipts"), "--payload", str(payload)]
            with patch.object(sys, "argv", args), patch.object(helper, "derive") as derive:
                with self.assertRaisesRegex(ValueError, "Stale registration payload"):
                    helper.main()
                derive.assert_not_called()
            def changed_manifest(*args):
                manifest.write_bytes(helper.json_bytes({"records": [], "concurrent": True}))
                return {"records": []}
            args = ["maintain_library.py", "refresh", "--library", str(root), "--receipt-dir", str(folder / "receipts")]
            with patch.object(sys, "argv", args), patch.object(helper, "derive", side_effect=changed_manifest), \
                 patch.object(helper, "generated_files", return_value={}), patch.object(helper, "validate_links"), \
                 patch.object(helper, "atomic_write") as write:
                with self.assertRaisesRegex(ValueError, "Concurrent manifest change"):
                    helper.main()
                write.assert_not_called()


    def shared_art_metadata_tour_inventory(self, root):
        before = self.shared_treatment_inventory(root)
        (root / "assets/shared.json").write_text('{"label":"fixture"}', encoding="utf-8")
        (root / "assets/tour.json").write_text('{"diagram":"first"}', encoding="utf-8")
        first = before["records"][0]
        first.update(collection="diagrams", logicalId="first", tour={"id":"first", "currentVersion":1,
            "versions":[{"version":1,"data":"assets/tour.json","sha256":helper.sha(root / "assets/tour.json"),"preview":"assets/index.html"}]})
        for row in before["records"]: row["treatments"]["svg-flat"]["metadata"] = "assets/shared.json"
        return helper.derive(root, before, None)

    def test_validation_reused_for_art_metadata_and_tour_with_identical_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.shared_art_metadata_tour_inventory(root)
            with patch.object(helper, "sha", wraps=helper.sha) as measured:
                after = helper.derive(root, before, deepcopy(before))
            self.assertEqual(helper.json_bytes(after), helper.json_bytes(before))
            self.assertEqual(helper.generated_files(after), helper.generated_files(before))
            counts = Counter(call.args[0].relative_to(root).as_posix() for call in measured.call_args_list)
            self.assertEqual(counts, {x["destination"]:1 for x in before["files"]})

    def test_shared_metadata_and_tour_hash_assertions_remain_independent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            good = self.shared_art_metadata_tour_inventory(root)
            bad = deepcopy(good)
            bad["records"][1]["treatments"]["svg-flat"]["metadataSha256"] = "0" * 64
            with self.assertRaisesRegex(ValueError, "Metadata hash conflict"):
                helper.derive(root, bad, None)
            bad = deepcopy(good)
            bad["records"][0]["tour"]["versions"][0]["sha256"] = "0" * 64
            with self.assertRaisesRegex(ValueError, "Tour data identity mismatch"):
                helper.derive(root, bad, None)

    def test_stat_change_between_inventory_and_treatment_forces_fresh_hash(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.shared_art_metadata_tour_inventory(root)
            art = root / "assets/shared.svg"
            original_sha = helper.sha
            changed = False
            def mutate_after_other_validation(path):
                nonlocal changed
                value = original_sha(path)
                if path.name == "tour.json" and not changed:
                    changed = True
                    stamp = art.stat()
                    art.write_bytes(art.read_bytes().replace(b"10 10", b"20 10"))
                    os.utime(art, ns=(stamp.st_atime_ns, stamp.st_mtime_ns + 1000000000))
                return value
            with patch.object(helper, "sha", side_effect=mutate_after_other_validation) as measured:
                with self.assertRaisesRegex(ValueError, "Treatment hash conflict"):
                    helper.derive(root, before, before)
            self.assertTrue(changed)
            self.assertEqual(sum(call.args[0] == art for call in measured.call_args_list), 2)

    def test_source_changed_during_validation_hash_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            before = self.shared_treatment_inventory(root)
            original_sha = helper.sha
            def mutate_during_hash(path):
                value = original_sha(path)
                path.write_bytes(path.read_bytes() + b"\n")
                return value
            with patch.object(helper, "sha", side_effect=mutate_during_hash):
                with self.assertRaisesRegex(ValueError, "Source changed during validation hash"):
                    helper.derive(root, before, before)


    def test_metadata_and_tour_stat_drift_after_inventory_rechecks_assertions(self):
        for relative, message in (("assets/shared.json", "Metadata hash conflict"), ("assets/tour.json", "Tour data identity mismatch")):
            with self.subTest(relative=relative), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp).resolve()
                before = self.shared_art_metadata_tour_inventory(root)
                target = root / relative
                original_details = helper.image_details
                changed = False
                def details_then_mutate(path):
                    nonlocal changed
                    result = original_details(path)
                    if not changed:
                        changed = True
                        stamp = target.stat()
                        original = target.read_bytes()
                        target.write_bytes(original.replace(b"fixture", b"changed").replace(b"first", b"other"))
                        os.utime(target, ns=(stamp.st_atime_ns, stamp.st_mtime_ns + 1000000000))
                    return result
                with patch.object(helper, "image_details", side_effect=details_then_mutate), patch.object(helper, "sha", wraps=helper.sha) as measured:
                    with self.assertRaisesRegex(ValueError, message):
                        helper.derive(root, before, before)
                self.assertTrue(changed)
                self.assertEqual(sum(call.args[0] == target for call in measured.call_args_list), 2)

    def test_records_arrival_after_planning_stops_before_any_derived_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp).resolve()
            root = folder / "library"; root.mkdir()
            (root / "records").mkdir()
            (root / "manifest.json").write_bytes(helper.json_bytes({"records": []}))
            original_generate = helper.generated_files
            def generate_then_arrival(catalog):
                outputs = original_generate(catalog)
                (root / "records/new-evidence.txt").write_text("arrival", encoding="utf-8")
                return outputs
            args = ["maintain_library.py", "refresh", "--library", str(root), "--receipt-dir", str(folder / "receipts")]
            with patch.object(sys, "argv", args), patch.object(helper, "generated_files", side_effect=generate_then_arrival), \
                 patch.object(helper, "atomic_write", wraps=helper.atomic_write) as write:
                with self.assertRaisesRegex(ValueError, "Concurrent library input membership change.*records/new-evidence.txt"):
                    helper.main()
                write.assert_not_called()
            self.assertEqual(helper.read_json(root / "manifest.json"), {"records": []})

    def test_asset_arrival_and_record_removal_at_final_boundary_stop_before_writes(self):
        for mutation in ("asset-arrival", "record-removal"):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as tmp:
                folder = Path(tmp).resolve()
                root = folder / "library"; root.mkdir()
                (root / "assets").mkdir(); (root / "records").mkdir()
                evidence = root / "records/kept.txt"
                evidence.write_text("kept", encoding="utf-8")
                (root / "manifest.json").write_bytes(helper.json_bytes({"records": []}))
                original_validate = helper.validate_links
                def validate_then_mutate(*args):
                    original_validate(*args)
                    if mutation == "asset-arrival":
                        (root / "assets/new.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>', encoding="utf-8")
                    else:
                        evidence.unlink()
                args = ["maintain_library.py", "refresh", "--library", str(root), "--receipt-dir", str(folder / "receipts")]
                with patch.object(sys, "argv", args), patch.object(helper, "validate_links", side_effect=validate_then_mutate), \
                     patch.object(helper, "atomic_write", wraps=helper.atomic_write) as write:
                    with self.assertRaisesRegex(ValueError, "Concurrent library input membership change"):
                        helper.main()
                    write.assert_not_called()

    def test_unchanged_membership_and_decision_log_allow_valid_refresh(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp).resolve()
            root = folder / "library"; root.mkdir()
            (root / "records").mkdir()
            evidence = root / "records/kept.txt"
            evidence.write_text("kept", encoding="utf-8")
            (root / "manifest.json").write_bytes(helper.json_bytes({"records": []}))
            original_generate = helper.generated_files
            def generate_then_decision(catalog):
                outputs = original_generate(catalog)
                (root / "decisions.jsonl").write_text('{"pendingHuman":true}\n', encoding="utf-8")
                return outputs
            args = ["maintain_library.py", "refresh", "--library", str(root), "--receipt-dir", str(folder / "receipts")]
            with patch.object(sys, "argv", args), patch.object(helper, "generated_files", side_effect=generate_then_decision), \
                 patch.object(helper, "atomic_write", wraps=helper.atomic_write) as write:
                helper.main()
                self.assertTrue(write.called)
            self.assertEqual(evidence.read_text(encoding="utf-8"), "kept")
            self.assertTrue(all((root/name).is_file() for name in helper.DERIVED))
            self.assertEqual(helper.input_membership(root), {"records/kept.txt"})

    def test_persistent_hot_cache_avoids_bytes_but_rechecks_real_change_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp); source = folder / "source.bin"; source.write_bytes(b"a" * 128)
            first = helper.VerifiedHashes(folder / "state/cache.sqlite3")
            expected = first.sha(source); first.close()
            second = helper.VerifiedHashes(folder / "state/cache.sqlite3")
            try:
                with patch.object(helper, "_file_sha", wraps=helper._file_sha) as measured:
                    self.assertEqual(second.sha(source), expected)
                    self.assertEqual(measured.call_count, 0 if helper.file_identity(source) is not None else 1)
                old = source.stat()
                source.write_bytes(b"b" * 128)
                os.utime(source, ns=(old.st_atime_ns, old.st_mtime_ns))
                self.assertNotEqual(second.sha(source), expected)
            finally: second.close()

    def test_replaced_file_with_same_size_and_restored_mtime_cannot_hit_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.bin"; source.write_bytes(b"a" * 128)
            cache = helper.VerifiedHashes(); expected = cache.sha(source); old = source.stat()
            replacement = source.with_suffix(".new"); replacement.write_bytes(b"b" * 128)
            os.utime(replacement, ns=(old.st_atime_ns, old.st_mtime_ns)); replacement.replace(source)
            self.assertNotEqual(cache.sha(source), expected)

    def test_mutation_during_read_is_rejected_and_never_cached(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.bin"; source.write_bytes(b"a" * 128)
            cache = helper.VerifiedHashes(); raw = helper._file_sha; old = source.stat()
            def dirty(path):
                value = raw(path); source.write_bytes(b"b" * 128)
                os.utime(source, ns=(old.st_atime_ns, old.st_mtime_ns))
                return value
            with patch.object(helper, "_file_sha", side_effect=dirty):
                if helper.file_identity(source) is None:
                    self.skipTest("No robust change-time signature on this filesystem")
                with self.assertRaisesRegex(ValueError, "Source changed during hash"):
                    cache.sha(source)
            self.assertEqual(cache.memory, {})

    def test_unknown_signature_disables_all_reuse(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.bin"; source.write_bytes(b"a" * 128)
            cache = helper.VerifiedHashes(Path(tmp) / "state/cache.sqlite3")
            with patch.object(helper, "file_identity", return_value=None), patch.object(helper, "_file_sha", wraps=helper._file_sha) as measured:
                cache.sha(source); cache.sha(source)
                self.assertEqual(measured.call_count, 2)
            self.assertFalse((Path(tmp) / "state/cache.sqlite3").exists())

    @unittest.skipUnless(os.name == "nt", "Windows live-writer sharing test")
    def test_live_writer_disables_reuse_until_metadata_and_journal_close(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "source.bin"; source.write_bytes(b"a" * 128)
            cache = helper.VerifiedHashes(); cache.sha(source)
            with source.open("r+b") as writer:
                self.assertIsNone(helper.file_identity(source))
                writer.write(b"b" * 128); writer.flush()
                with patch.object(helper, "_file_sha", wraps=helper._file_sha) as measured:
                    self.assertEqual(cache.sha(source), helper.hashlib.sha256(b"b" * 128).hexdigest())
                    self.assertEqual(measured.call_count, 1)

    def test_fabricated_cache_digest_and_corrupt_database_are_misses(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp); source = folder / "source.bin"; source.write_bytes(b"a" * 128)
            database = folder / "state/cache.sqlite3"; cache = helper.VerifiedHashes(database)
            expected = cache.sha(source)
            if cache.db is None: self.skipTest("No persistent cache on this filesystem")
            cache.db.execute("UPDATE verified SET digest=?", ("0" * 64,)); cache.close()
            fresh = helper.VerifiedHashes(database)
            try:
                with patch.object(helper, "_file_sha", wraps=helper._file_sha) as measured:
                    self.assertEqual(fresh.sha(source), expected); self.assertEqual(measured.call_count, 1)
            finally: fresh.close()
            database.write_bytes(b"not a database")
            broken = helper.VerifiedHashes(database)
            try: self.assertEqual(broken.sha(source), expected)
            finally: broken.close()

if __name__ == "__main__": unittest.main()
