"""Adapt hash-bound source inputs to catalog ID links before registration."""
from copy import deepcopy
from pathlib import PurePosixPath

# Matches portable-gallery maintain_library.IMAGES; the regression checks that
# producer contract directly, without importing its expensive image dependencies.
IMAGE_EXTENSIONS = {".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".tif", ".tiff", ".bmp", ".ico"}

def validate_artwork_paths(payload):
    """Reject non-art treatments before reference resolution or derivation.

    Source/support inputs remain untouched. Metadata-only record patches may
    omit treatments; an explicitly missing treatment may omit its file.
    The producer still checks safe paths, actual containers, bytes and hashes.
    """
    for record in payload['records']:
        for style, treatment in record.get('treatments', {}).items():
            if not isinstance(treatment, dict):
                raise ValueError(f"Invalid treatment: {record['id']}/{style}")
            name = treatment.get('path')
            if not name:
                if treatment.get('status') != 'missing':
                    raise ValueError(f"A treatment without a file must be explicitly missing: {record['id']}/{style}")
                continue
            if not isinstance(name, str) or not name.startswith('assets/') or PurePosixPath(name).suffix.lower() not in IMAGE_EXTENSIONS:
                raise ValueError(f"Browser artwork must be an image under assets/: {name}")


def normalize_reference_links(payload, catalog):
    validate_artwork_paths(payload)
    result = deepcopy(payload)
    ids = {r['id'] for r in catalog['records']} | {r['id'] for r in result['records']}
    for record in result['records']:
        links = []
        for item in record.get('references', []):
            if isinstance(item, str):
                if item not in ids:
                    raise ValueError('Unknown reference ID: ' + item)
                links.append(item)
                continue
            if not isinstance(item, dict) or not item.get('path') or not item.get('sha256'):
                raise ValueError('A source input needs an exact path and hash')
            path = item['path'].removeprefix('wiki/image-library/')
            matches = [r['id'] for r in catalog['records'] if r['collection'] != 'earlier'
                       and any(t.get('path') == path and t.get('sha256') == item['sha256']
                               for t in r['treatments'].values())]
            if len(matches) != 1:
                raise ValueError('Source input must resolve to one current record: ' + path)
            record.setdefault('sourceInputs', []).append(deepcopy(item))
            links.append(matches[0])
        if 'references' in record:
            record['references'] = list(dict.fromkeys(links))
        for item in record.get('relatedDiagrams', []):
            if not isinstance(item, str) or item not in ids:
                raise ValueError('relatedDiagrams requires existing catalog IDs')
    return result
