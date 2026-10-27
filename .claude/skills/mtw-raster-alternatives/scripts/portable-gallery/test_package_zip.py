#!/usr/bin/env python3
"""ZIP preservation/long-path regression; keeps tiny external fixtures for audit."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

sys.dont_write_bytecode = True
import package_zip as helper

WORKSPACE = None
BASELINE = None
RUNS = []


def fixture_path(path):
    """Create fixture inputs independently of the helper under test."""
    name = os.path.abspath(os.fspath(path))
    if os.name == 'nt':
        name = '\\\\?\\UNC\\' + name[2:] if name.startswith('\\\\') else '\\\\?\\' + name
    return Path(name)


def write_fixture(path, content):
    target = fixture_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.area = Path(tempfile.mkdtemp(prefix=self._testMethodName + '-', dir=WORKSPACE))

    def package(self, long_source=False):
        root = self.area / 'package'
        if long_source:
            root = root / ('source-' + 's' * 70) / ('root-' + 'r' * 70)
            # Temp prefixes vary; exercise an actually long root on every run.
            while len(str(root)) <= 260:
                root = root / ('depth-' + 'd' * 32)
        art = 'assets/vector/diagram.svg'
        meta = 'records/' + ('depth-' + 'd' * 64 + '/' if long_source else '') + 'diagram.metadata.json'
        data = {
            art: b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>\n',
            meta: b'{"status":"retained; no new visual review"}\n',
            'all-files.html': ('<a href="manifest.json">Catalog</a><img src="' + art + '">\n').encode(),
            'manifest.json': json.dumps({'records': [{'treatments': {'svg-flat': {'path': art, 'metadata': meta}}}],
                                         'counts': {'imageFiles': 1}}).encode(),
        }
        for name, value in data.items():
            write_fixture(root / name, value)
        manifest = self.area / 'files.json'
        manifest.write_text(json.dumps({'files': [{'path': name, 'bytes': len(value),
                                                 'sha256': hashlib.sha256(value).hexdigest()} for name, value in data.items()]}), encoding='utf-8')
        return root, manifest, data

    def run_helper(self, root, manifest, label='after', long_extract=False, script=None, destination=None):
        output = self.area / label
        if long_extract:
            output = output / ('extract-' + 'e' * 70) / ('root-' + 'r' * 70)
        archive = destination or self.area / (label + '.zip')
        report = self.area / (label + '.json')
        command = [sys.executable, '-B', '-X', 'utf8', str(script or Path(helper.__file__)),
                   '--package', str(root), '--file-manifest', str(manifest), '--zip', str(archive),
                   '--extract-check', str(output), '--report', str(report)]
        run = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
        RUNS.append({'test': self._testMethodName, 'helper': str(script or Path(helper.__file__)),
                     'command': command, 'exitCode': run.returncode, 'stdout': run.stdout, 'stderr': run.stderr,
                     'archive': str(archive), 'extraction': str(output), 'report': str(report)})
        return run, archive, output, report

    def assert_roundtrip(self, root, data, run, archive, output, report):
        self.assertEqual(run.returncode, 0, run.stderr)
        result = json.loads(fixture_path(report).read_text(encoding='utf-8'))
        self.assertEqual(result['files'], len(data))
        self.assertEqual(result['extractedHashMatches'], len(data))
        self.assertFalse(result['sourcePackage'].startswith('\\\\?\\'))
        with ZipFile(fixture_path(archive)) as zipped:
            self.assertEqual(set(zipped.namelist()), {'MTW-image-library/' + name for name in data})
            self.assertEqual(len(zipped.namelist()), len(data))
            for name, original in data.items():
                self.assertEqual(zipped.read('MTW-image-library/' + name), original)
                self.assertEqual(fixture_path(root / name).read_bytes(), original)
                self.assertEqual(fixture_path(output / 'MTW-image-library' / name).read_bytes(), original)

    def test_normal_roundtrip(self):
        root, manifest, data = self.package()
        self.assert_roundtrip(root, data, *self.run_helper(root, manifest))

    def test_long_source_root_and_files_roundtrip(self):
        root, manifest, data = self.package(long_source=True)
        self.assertGreater(len(str(root)), 260)
        self.assertGreater(max(len(str(root / name)) for name in data), 350)
        self.assert_roundtrip(root, data, *self.run_helper(root, manifest))

    def test_long_extraction_before_and_after_same_bytes(self):
        root, manifest, data = self.package()
        if BASELINE:
            baseline = self.run_helper(root, manifest, label='before', long_extract=True, script=BASELINE)
            # Record the observed old behavior without assuming every platform
            # has Windows' legacy path limit enabled.
            RUNS[-1]['observation'] = 'reproduced-failure' if baseline[0].returncode else 'not-reproduced-on-this-platform'
        checked = self.run_helper(root, manifest, long_extract=True)
        self.assertGreater(len(str(checked[2] / 'MTW-image-library' / next(iter(data)))), 260)
        self.assert_roundtrip(root, data, *checked)

    def test_relative_traversal_absolute_ads_and_device_names_rejected(self):
        root, _, _ = self.package()
        for name in ('../escape', '/absolute', 'C:/absolute', 'assets\\escape', 'a/../escape',
                     'a//b', 'a/./b', 'a:stream', 'assets/CON.txt', 'assets/NUL', '', 'a/.. ', 'a/*', 'a/\x00'):
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    helper.local_path(root, name)

    def test_resolved_link_escape_remains_rejected(self):
        root, _, _ = self.package()
        real_resolve = helper.resolved_path

        def resolve(path, strict=False):
            if Path(path).name == 'linked.svg':
                return self.area / 'outside.svg'
            return real_resolve(path, strict)

        with patch.object(helper, 'resolved_path', resolve):
            with self.assertRaisesRegex(ValueError, 'escapes package'):
                helper.local_path(root, 'linked.svg')

    def test_output_inside_package_rejected_before_writing(self):
        root, manifest, _ = self.package()
        target = root / 'forbidden.zip'
        run, _, _, _ = self.run_helper(root, manifest, destination=target)
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('separate from the source package', run.stderr)
        self.assertFalse(fixture_path(target).exists())

    def test_unlisted_file_and_changed_bytes_rejected(self):
        root, manifest, data = self.package()
        write_fixture(root / 'unlisted.json', b'new context')
        run, archive, _, _ = self.run_helper(root, manifest, label='unlisted')
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('complete source package', run.stderr)
        self.assertFalse(fixture_path(archive).exists())
        fixture_path(root / 'unlisted.json').unlink()
        write_fixture(root / next(iter(data)), b'changed image bytes')
        run, archive, _, _ = self.run_helper(root, manifest, label='mutation')
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('Source differs from manifest', run.stderr)
        self.assertFalse(fixture_path(archive).exists())

    def test_existing_archive_is_not_replaced(self):
        root, manifest, _ = self.package()
        archive = self.area / 'existing.zip'
        original = b'untouched earlier archive'
        archive.write_bytes(original)
        run, _, _, _ = self.run_helper(root, manifest, destination=archive)
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('existing files are never replaced', run.stderr)
        self.assertEqual(archive.read_bytes(), original)

    def test_io_paths_require_absolute_normalized_names(self):
        with self.assertRaises(ValueError):
            helper.disk_path(Path('relative'))
        with self.assertRaises(ValueError):
            helper.disk_path(self.area / '..' / 'outside')
        if os.name == 'nt':
            name = Path(r'\\server\share\folder\file.json')
            self.assertEqual(str(helper.disk_path(name)), r'\\?\UNC\server\share\folder\file.json')
            self.assertEqual(helper.logical_path(helper.disk_path(name)), name)


def main():
    global WORKSPACE, BASELINE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', required=True, type=Path)
    parser.add_argument('--baseline', type=Path)
    args = parser.parse_args()
    WORKSPACE = args.workspace.resolve()
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    BASELINE = args.baseline.resolve() if args.baseline else None
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(PackageTests))
    summary = {'tests': result.testsRun, 'passed': result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped),
               'failures': len(result.failures), 'errors': len(result.errors), 'skipped': len(result.skipped),
               'helperSha256': hashlib.sha256(Path(helper.__file__).read_bytes()).hexdigest(),
               'baselineSha256': hashlib.sha256(BASELINE.read_bytes()).hexdigest() if BASELINE else None,
               'runs': RUNS, 'scope': 'Fixture byte/path checks; production corpus and browser review are separate.',
               'cleanup': 'Fixtures retained outside the repository. No recursive deletion.'}
    (WORKSPACE / 'regression-report.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in summary.items() if k != 'runs'}))
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(main())
