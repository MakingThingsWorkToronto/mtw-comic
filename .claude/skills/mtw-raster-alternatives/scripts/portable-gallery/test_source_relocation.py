#!/usr/bin/env python3
"""Behavior regressions using retained fixtures under an explicit workspace.

python test_source_relocation.py --workspace C:/external/relocation-fixtures
No real repository files are changed; fixture directories are retained for audit.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
import check_source_relocation as guard

WORKSPACE = None


class RelocationTests(unittest.TestCase):
    def setUp(self):
        self.area = Path(tempfile.mkdtemp(prefix=self._testMethodName + "-", dir=WORKSPACE))
        self.repo = self.area / "repo"
        self.library = self.repo / "wiki/image-library"
        self.library.mkdir(parents=True)
        self.plan = {"schemaVersion": 1, "scopes": ["discussion/references", "discussion/references-svg"], "files": []}
        for scope in self.plan["scopes"]:
            (self.repo / scope).mkdir(parents=True)
        self.add("discussion/references/a.png", "assets/originals/a.png", b"original image bytes", "artwork")
        self.add("discussion/references-svg/copy.png", "assets/originals/a.png", b"original image bytes", "artwork")
        self.add("discussion/references-svg/review.json", "records/import/review.json", b'{"review":"unperformed"}', "evidence")
        self.add("discussion/references/recipe.py", "records/import/recipe.py", b"print('retained recipe')\n", "support")

    def add(self, source, destination, data, kind):
        for path in (self.repo / source, self.library / destination):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        self.plan["files"].append({"source": source, "destination": destination,
                                   "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "kind": kind})

    def run_guard(self, phase="before", plan=None):
        return guard.verify(self.repo, self.plan if plan is None else plan, phase)

    def assertFails(self, report, code=None):
        self.assertEqual(report["status"], "fail", report)
        if code:
            self.assertIn(code, {e["code"] for e in report["errors"]}, report)

    def remove_sources(self):
        for item in self.plan["files"]:
            (self.repo / item["source"]).unlink()

    def cli(self, *extra, phase="before"):
        plan_path = self.area / "plan.json"
        plan_path.write_text(json.dumps(self.plan), encoding="utf-8")
        run = subprocess.run([sys.executable, "-B", str(Path(guard.__file__)), "--repo", str(self.repo),
                              "--plan", str(plan_path), "--phase", phase, *map(str, extra)],
                             capture_output=True, text=True, encoding="utf-8")
        return run, json.loads(run.stdout)

    def test_duplicate_bytes_multiple_sources_evidence_and_support(self):
        report = self.run_guard()
        self.assertEqual(report["status"], "pass", report)
        self.assertEqual(report["checkedSourceFiles"], 4)
        self.assertEqual(report["checkedDestinationFiles"], 3)
        self.assertEqual(report["kinds"], {"artwork": 2, "evidence": 1, "support": 1})

    def test_after_requires_zero_files_but_accepts_empty_directories(self):
        self.remove_sources()
        (self.repo / "discussion/references/nested/empty").mkdir(parents=True)
        report = self.run_guard("after")
        self.assertEqual(report["status"], "pass", report)
        self.assertEqual(report["remainingFiles"], [])
        self.assertEqual(report["checkedDestinationFiles"], 3)

    def test_exact_file_scope_moves_only_named_file_and_preserves_sibling(self):
        self.plan["scopes"].append("discussion/svg-generation.md")
        self.add("discussion/svg-generation.md", "records/import/svg-generation.md", b"retained authoring context", "support")
        sibling = self.repo / "discussion/unrelated-notes.md"
        sibling.write_bytes(b"keep outside scope")
        self.assertEqual(self.run_guard()["status"], "pass")
        self.remove_sources()
        self.assertEqual(self.run_guard("after")["status"], "pass")
        self.assertEqual(sibling.read_bytes(), b"keep outside scope")

    def test_unlisted_exact_file_scope_fails_before_and_leftover_fails_after(self):
        self.plan["scopes"].append("discussion/svg-generation.md")
        (self.repo / "discussion/svg-generation.md").write_bytes(b"unlisted context")
        self.assertFails(self.run_guard(), "unlisted-source")
        self.remove_sources()
        self.assertFails(self.run_guard("after"), "leftover-source")

    def test_missing_exact_file_scope_fails_before(self):
        self.plan["scopes"].append("discussion/svg-generation.md")
        self.add("discussion/svg-generation.md", "records/import/svg-generation.md", b"retained context", "support")
        (self.repo / "discussion/svg-generation.md").unlink()
        self.assertFails(self.run_guard(), "source-scope")

    def test_exact_file_scope_must_be_absent_not_replaced_with_directory(self):
        self.plan["scopes"].append("discussion/svg-generation.md")
        self.add("discussion/svg-generation.md", "records/import/svg-generation.md", b"retained context", "support")
        self.remove_sources()
        (self.repo / "discussion/svg-generation.md").mkdir()
        self.assertFails(self.run_guard("after"), "source-scope")

    def test_missing_canonical_file_fails_both_phases(self):
        (self.library / "records/import/recipe.py").unlink()
        self.assertFails(self.run_guard(), "destination-unreadable")
        self.remove_sources()
        self.assertFails(self.run_guard("after"), "destination-unreadable")

    def test_source_mutation_same_size_is_detected(self):
        source = self.repo / self.plan["files"][0]["source"]
        source.write_bytes(b"X" * source.stat().st_size)
        self.assertFails(self.run_guard(), "source-mismatch")

    def test_canonical_mutation_same_size_is_detected_both_phases(self):
        path = self.library / "assets/originals/a.png"
        path.write_bytes(b"Y" * path.stat().st_size)
        self.assertFails(self.run_guard(), "destination-mismatch")
        self.remove_sources()
        self.assertFails(self.run_guard("after"), "destination-mismatch")

    def test_unlisted_hidden_ignored_file_is_not_filtered(self):
        path = self.repo / "discussion/references/.cache/.hidden"
        path.parent.mkdir(parents=True)
        path.write_bytes(b"new unlisted support")
        (self.repo / ".gitignore").write_text(".cache/\n", encoding="utf-8")
        self.assertFails(self.run_guard(), "unlisted-source")

    def test_omitted_source_is_detected(self):
        self.plan["files"].pop()
        self.assertFails(self.run_guard(), "unlisted-source")

    def test_leftover_support_and_new_hidden_file_fail_after(self):
        for item in self.plan["files"][:3]:
            (self.repo / item["source"]).unlink()
        (self.repo / "discussion/references-svg/.late-file").write_bytes(b"late")
        report = self.run_guard("after")
        self.assertFails(report, "leftover-source")
        self.assertEqual(len(report["remainingFiles"]), 2)

    def test_duplicate_source_is_rejected(self):
        self.plan["files"].append(deepcopy(self.plan["files"][0]))
        self.assertFails(self.run_guard(), "invalid-plan-or-root")

    def test_conflicting_destination_is_rejected(self):
        self.plan["files"][1]["sha256"] = "0" * 64
        self.assertFails(self.run_guard(), "invalid-plan-or-root")

    def test_case_alias_destination_is_rejected(self):
        self.plan["files"][1]["destination"] = "assets/originals/A.png"
        self.assertFails(self.run_guard(), "invalid-plan-or-root")

    def test_traversal_absolute_ads_and_wildcards_are_rejected(self):
        for field, value in [("source", "discussion/references/../other/a.png"),
                             ("destination", "../outside.png"), ("destination", "/absolute.png"),
                             ("destination", "C:/absolute.png"), ("destination", "assets/a.png:stream"),
                             ("destination", "assets/CON.txt"), ("source", "discussion/references/*")]:
            with self.subTest(field=field, value=value):
                plan = deepcopy(self.plan)
                plan["files"][0][field] = value
                self.assertFails(self.run_guard(plan=plan), "invalid-plan-or-root")

    def test_source_outside_scopes_is_rejected(self):
        self.plan["files"][0]["source"] = "discussion/verification/a.png"
        self.assertFails(self.run_guard(), "invalid-plan-or-root")

    def test_empty_broad_external_and_overlapping_scopes_are_rejected(self):
        for scopes in ([], ["discussion"], ["wiki/image-library"], ["discussion/references", "discussion/references/nested"]):
            with self.subTest(scopes=scopes):
                plan = deepcopy(self.plan)
                plan["scopes"] = scopes
                self.assertFails(self.run_guard(plan=plan), "invalid-plan-or-root")

    def test_invalid_sizes_kinds_and_hashes_are_rejected(self):
        for field, value in [("bytes", True), ("bytes", -1), ("sha256", "missing"), ("kind", "unknown"), ("kind", [])]:
            with self.subTest(field=field):
                plan = deepcopy(self.plan)
                plan["files"][0][field] = value
                self.assertFails(self.run_guard(plan=plan), "invalid-plan-or-root")

    def test_missing_scope_before_fails_after_accepts_removed_empty_scope(self):
        self.remove_sources()
        (self.repo / "discussion/references").rmdir()
        self.assertFails(self.run_guard(), "source-scope")
        self.assertEqual(self.run_guard("after")["status"], "pass")

    def test_reparse_attribute_is_rejected_without_following_target(self):
        real_lstat = Path.lstat
        victim = self.repo / "discussion/references"

        def mocked(path, *args, **kwargs):
            value = real_lstat(path, *args, **kwargs)
            if path != victim:
                return value
            class ReparseStat:
                st_mode = value.st_mode
                st_file_attributes = guard.REPARSE
            return ReparseStat()

        with patch.object(Path, "lstat", mocked):
            report = self.run_guard()
        self.assertFails(report, "source-scope")
        self.assertTrue(any("Symlink/reparse" in e["message"] for e in report["errors"]))

    def test_real_symlink_escape_is_rejected(self):
        linked = self.repo / "discussion/references/linked"
        outside = self.area / "outside"
        outside.mkdir()
        (outside / "private.txt").write_bytes(b"outside")
        try:
            linked.symlink_to(outside, target_is_directory=True)
        except (OSError, NotImplementedError) as exc:
            self.skipTest(f"OS does not permit test symlink: {exc}")
        self.assertFails(self.run_guard(), "source-scope")

    def test_cli_stdout_and_external_report_are_read_only(self):
        before = {p.relative_to(self.repo).as_posix(): p.read_bytes() for p in self.repo.rglob("*") if p.is_file()}
        report_path = self.area / "result.json"
        run, report = self.cli("--report", report_path)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(report, json.loads(report_path.read_text(encoding="utf-8")))
        self.assertEqual(len(report["planSha256"]), 64)
        after = {p.relative_to(self.repo).as_posix(): p.read_bytes() for p in self.repo.rglob("*") if p.is_file()}
        self.assertEqual(before, after)

    def test_cli_rejects_report_inside_repo_and_over_plan(self):
        for report_path in (self.repo / "result.json", self.area / "plan.json"):
            with self.subTest(report=str(report_path)):
                run, report = self.cli("--report", report_path)
                self.assertEqual(run.returncode, 2, run.stderr)
                self.assertEqual(report["status"], "fail")
        self.assertFalse((self.repo / "result.json").exists())

    def test_cli_failure_exit_code_and_report(self):
        self.plan["files"].pop()
        run, report = self.cli()
        self.assertEqual(run.returncode, 1, run.stderr)
        self.assertFails(report, "unlisted-source")


def main():
    global WORKSPACE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True, type=Path)
    args = parser.parse_args()
    WORKSPACE = args.workspace.resolve()
    if WORKSPACE == Path(guard.__file__).parent.resolve() or Path(guard.__file__).resolve().is_relative_to(WORKSPACE):
        parser.error("Use a dedicated fixture workspace separate from the helper package")
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(RelocationTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    summary = {"tests": result.testsRun, "failures": len(result.failures), "errors": len(result.errors),
               "skipped": len(result.skipped), "workspace": str(WORKSPACE),
               "fixtures": "Retained; no recursive deletion is performed."}
    print(json.dumps(summary))
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
