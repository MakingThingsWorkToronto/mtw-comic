"""MTW generation completion: canonical destinations and real producer artifacts."""
from pathlib import Path, PurePosixPath
import hashlib, json, re

def canonical_path(repo, value, home):
    if not isinstance(value, str) or not value or any(c in value for c in '\\:%?#'):
        raise ValueError('Exact repo-relative canonical destination required')
    parts = PurePosixPath(value).parts
    if PurePosixPath(value).is_absolute() or '..' in parts or '.' in value.split('/') or '//' in value:
        raise ValueError('Unsafe canonical destination')
    root = Path(repo).resolve()
    path = (root / value).resolve()
    if not path.is_relative_to((root / home).resolve()) or path == root / home:
        raise ValueError('Destination must be inside ' + home)
    return path

def validate_registration_contract(contract, repo, require_absent=False):
    if not isinstance(contract, dict):
        raise ValueError('MTW generation requires registrationContract before the provider call')
    for key in ('canonicalDestination', 'recordId', 'style', 'version', 'provenanceDestination', 'registrar', 'requestedStatus'):
        if not isinstance(contract.get(key), str) or not contract[key].strip():
            raise ValueError('registrationContract requires ' + key)
    for key in ('bytePreserveImport', 'register', 'verify'):
        if contract.get(key) is not True:
            raise ValueError('registrationContract requires mandatory ' + key)
    if contract.get('completionStage') != 'registered':
        raise ValueError('Only actual registered completion is allowed')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', contract['recordId']):
        raise ValueError('Stable registration recordId required')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', contract['style']):
        raise ValueError('Explicit registration style required')
    if not re.fullmatch(r'v[1-9][0-9]*', contract['version']):
        raise ValueError('Explicit retained vN registration version required')
    if contract['requestedStatus'].strip().lower() == 'approved':
        raise ValueError('Generation contract cannot infer human approval')
    image = canonical_path(repo, contract['canonicalDestination'], 'wiki/image-library/assets')
    if image.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.tif', '.tiff', '.bmp'}:
        raise ValueError('Canonical generated raster destination required')
    version = contract['version']
    if version not in image.parts and not image.stem.endswith('-' + version):
        raise ValueError('Canonical destination must identify its retained version')
    provenance = canonical_path(repo, contract['provenanceDestination'], 'wiki/image-library/records')
    expected = Path(repo).resolve() / 'wiki/image-library/records' / contract['recordId'] / contract['style'] / version
    if provenance != expected.resolve():
        raise ValueError('Provenance destination must bind exact record/style/version')
    if require_absent and image.exists():
        raise ValueError('Refusing an existing generation destination; retain a new version')
    return dict(contract)

def read_hashed_artifact(repo, binding):
    if not isinstance(binding, dict) or not isinstance(binding.get('path'), str) or not binding['path']:
        raise ValueError('Hashed actual maintained producer artifact required')
    path = (Path(repo) / binding['path']).resolve(strict=True)
    if not path.is_file():
        raise ValueError('Actual maintained producer artifact file required')
    data = path.read_bytes()
    if binding.get('sha256') != hashlib.sha256(data).hexdigest():
        raise ValueError('Stale maintained producer artifact hash')
    return json.loads(data.decode('utf-8-sig'))

def validate_producer_steps(result, repo, library, image, digest):
    """Check real register/verify artifacts, without deriving/scanning the library."""
    manifest_hashes = []
    for operation in ('register', 'verify'):
        step = result.get(operation)
        if not isinstance(step, dict) or type(step.get('code')) is not int or step['code'] != 0:
            raise ValueError('Successful maintained register and verify receipts required')
        terminal = read_hashed_artifact(repo, step.get('terminal'))
        if (terminal.get('state') != 'terminal' or terminal.get('operation') != operation
                or type(terminal.get('actualExitCode')) is not int or terminal['actualExitCode'] != 0
                or not terminal.get('finishedUtc') or not terminal.get('exitBasis')
                or 'maintain_library.py' not in ' '.join(terminal.get('command', []))):
            raise ValueError('Actual maintained producer terminal success required')
        checks = read_hashed_artifact(repo, step.get('maintenanceChecks'))
        package = read_hashed_artifact(repo, step.get('packageFiles'))
        if (checks.get('operation') != operation or Path(checks.get('library', '')).resolve() != library
                or checks.get('hashesAndRelativeReferences') != 'pass' or checks.get('artworkMutation') != 'none'
                or Path(package.get('root', '')).resolve() != library):
            raise ValueError('Maintained producer receipt operation/library/protection mismatch')
        entries = package.get('files')
        if not isinstance(entries, list):
            raise ValueError('Actual producer package-files inventory required')
        relative = image.relative_to(library).as_posix()
        selected = [entry for entry in entries if entry.get('path') == relative]
        if len(selected) != 1 or selected[0].get('sha256') != digest or selected[0].get('bytes') != image.stat().st_size:
            raise ValueError('Producer receipt does not register the retained image bytes')
        manifests = [entry for entry in entries if entry.get('path') == 'manifest.json']
        if len(manifests) != 1 or manifests[0].get('sha256') != checks.get('manifestSha256'):
            raise ValueError('Producer artifacts do not bind their actual catalog revision')
        manifest_hashes.append(checks['manifestSha256'])
    if len(set(manifest_hashes)) != 1:
        raise ValueError('Register and verify artifacts must describe the same completed revision')
    # Later unrelated registrations may change the whole manifest. The calling
    # validator checks this image's current selected record/path/hash instead.
