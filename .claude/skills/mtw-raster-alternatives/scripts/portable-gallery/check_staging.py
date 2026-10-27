#!/usr/bin/env python3
"""Exercise the gallery's external-output guard without copying artwork."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_missing_canonical(helper, workspace):
    """Reject absent authority before reading historical inputs or writing output."""
    checks = []
    for case in ['absent-library', 'historical-inputs-present']:
        fixture = workspace / case / 'repo'
        fixture.mkdir(parents=True, exist_ok=False)
        if case == 'historical-inputs-present':
            # Invalid historical JSON is deliberate: a fallback would try to read it.
            files = {
                'site/src/assets/library/manifest.json': b'historical vector input must remain unread\n',
                'discussion/svg-generation-progress.json': b'historical progress must remain unread\n',
                'wiki/image-library/all-files.html': b'<!-- retained canonical file-index fixture -->\n',
            }
            for name, content in files.items():
                path = fixture / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
        before = {p.relative_to(fixture).as_posix(): sha(p) for p in fixture.rglob('*') if p.is_file()}
        for mode in ['plan', 'export']:
            output = workspace / case / (mode + '-output')
            records = output.with_name(output.name + '.records')
            command = [sys.executable, '-B', str(helper / 'build_gallery.py'), '--repo', str(fixture), '--output', str(output)]
            if mode == 'plan':
                command.append('--plan-only')
            result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
            unchanged = before == {p.relative_to(fixture).as_posix(): sha(p) for p in fixture.rglob('*') if p.is_file()}
            gate = result.returncode != 0 and 'Canonical image library is required' in result.stderr and 'Check --repo' in result.stderr
            checks.append({'check': case + '-' + mode, 'pass': gate and unchanged and not output.exists() and not records.exists(),
                           'canonicalGate': gate, 'fixtureFilesUnchanged': unchanged, 'outputCreated': output.exists(),
                           'recordsCreated': records.exists(), 'exitCode': result.returncode, 'stderr': result.stderr})
    (workspace / 'missing-canonical-check.json').write_text(json.dumps({'checks': checks}, indent=2) + '\n', encoding='utf-8')
    assert all(check['pass'] for check in checks), 'Missing-canonical guard failed; see missing-canonical-check.json'
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--workspace', required=True, type=Path)
    args = parser.parse_args()
    repo = args.repo.resolve(strict=True)
    workspace = args.workspace.resolve()
    helper = Path(__file__).resolve().parent
    for protected in [repo, helper]:
        if workspace == protected or protected in workspace.parents or workspace in protected.parents:
            raise ValueError('The check workspace must be outside and separate from the repo/helper')
    workspace.mkdir(parents=True, exist_ok=True)
    before = {p.relative_to(helper).as_posix(): sha(p) for p in helper.rglob('*') if p.is_file()}
    command = [sys.executable, '-B', str(helper / 'build_gallery.py'), '--repo', str(repo), '--plan-only']
    checks = []
    for name, target in [('repo-output', repo / 'wiki/image-library'), ('helper-output', helper / 'output'), ('ancestor-output', repo.parent)]:
        result = subprocess.run(command + ['--output', str(target)], capture_output=True, text=True, encoding='utf-8')
        assert result.returncode != 0 and 'Output must' in result.stderr, result.stderr
        checks.append({'check': name, 'rejected': True, 'exitCode': result.returncode})
    checks.extend(check_missing_canonical(helper, workspace))
    target = workspace / 'external-plan'
    result = subprocess.run(command + ['--output', str(target)], capture_output=True, text=True, encoding='utf-8')
    assert result.returncode == 0, result.stderr
    records = target.with_name(target.name + '.records')
    assert (records / 'copy-plan.json').is_file()
    assert not target.exists(), 'Plan-only created the shareable output'
    after = {p.relative_to(helper).as_posix(): sha(p) for p in helper.rglob('*') if p.is_file()}
    assert before == after, 'The maintained helper package was changed by execution'
    checks.append({'check': 'external-plan', 'pass': True, 'helperFilesUnchanged': len(before), 'records': str(records)})
    evidence = {'checks': checks, 'builderSha256': sha(helper / 'build_gallery.py'), 'artworkCopies': 0,
                'browserReview': 'not-performed; this is an output-ownership guard check'}
    (workspace / 'staging-check.json').write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(evidence))


if __name__ == '__main__':
    main()
