"""Read-only Studio cast authority. No provider calls or human approval claims."""
import hashlib
import json
from pathlib import Path


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode('utf-8')).hexdigest()


def resolve_cast(repo, identity):
    repo = Path(repo).resolve()
    characters = json.loads((repo / 'wiki/comics-library/characters.json').read_text(encoding='utf-8'))['characters']
    if not isinstance(identity, str) or not identity.strip():
        raise ValueError('Canonical cast identity required')
    exact = [c for c in characters if c['id'] == identity]
    matches = exact or [c for c in characters if identity.casefold() in
                       [str(v).casefold() for v in [c.get('name', ''), *c.get('aliases', [])]]]
    if len(matches) != 1:
        raise ValueError('Unknown or ambiguous canonical cast identity: ' + identity)
    character = matches[0]
    record_id = character.get('modelRecord')
    if not record_id:
        raise ValueError('Missing canonical modelRecord for ' + character['id'])
    if sum(c.get('modelRecord') == record_id for c in characters) != 1:
        raise ValueError('Shared modelRecord is not a dedicated cast identity: ' + record_id)
    records = json.loads((repo / 'wiki/image-library/manifest.json').read_text(encoding='utf-8'))['records']
    matches = [r for r in records if r['id'] == record_id]
    if len(matches) != 1:
        raise ValueError('Missing or ambiguous canonical image record: ' + record_id)
    # Studio's maintained build-comics-library.mjs asset() selects comic-ink.
    treatment = matches[0].get('treatments', {}).get('comic-ink')
    if not isinstance(treatment, dict):
        raise ValueError('Missing Studio comic-ink treatment: ' + record_id)
    home = (repo / 'wiki/image-library').resolve()
    path = (home / treatment.get('path', '')).resolve()
    try:
        path.relative_to(home / 'assets')
    except ValueError:
        raise ValueError('Canonical cast image escapes library assets')
    if not path.is_file():
        raise ValueError('Missing canonical cast image: ' + str(path))
    actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if treatment.get('sha256') != actual_hash:
        raise ValueError('Canonical cast image hash differs from manifest: ' + record_id)
    return {'characterId': character['id'], 'name': character['name'],
            'role': character.get('role'), 'signature': character.get('signature'),
            'characterSha256': digest(character), 'recordId': record_id, 'style': 'comic-ink',
            'path': path.relative_to(repo).as_posix(), 'sha256': actual_hash,
            'status': treatment.get('status')}


def assert_binding(repo, binding):
    if not isinstance(binding, dict):
        raise ValueError('Exact canonical cast binding required')
    current = resolve_cast(repo, binding.get('characterId'))
    if binding != current:
        raise ValueError('Stale or substituted Studio cast binding: ' + current['characterId'])
    return current


def actors_in_brief(brief):
    actors = list(brief.get('cast', []))
    visible = []
    for image in brief.get('visualInventory', {}).get('images', []):
        for panel in image.get('panels', []):
            for view in panel.get('views', []):
                visible.extend(a['id'] for key in ('humans', 'digitalAgents') for a in view.get(key, []))
    suppressed = brief.get('noSheetFor', [])
    if any(a in suppressed for a in visible):
        raise ValueError('noSheetFor cannot suppress a visibly declared cast member')
    return list(dict.fromkeys([a for a in actors if a not in suppressed] + visible))


def brief_bindings(repo, brief):
    if brief.get('sheets'):
        raise ValueError('Filename sheets are obsolete; resolve canonical cast identities')
    return [resolve_cast(repo, identity) for identity in actors_in_brief(brief)]


def cast_reference_errors(repo, inventory, resolve):
    errors = []
    references = inventory.get('references')
    refs = {r.get('id'): r for r in references if isinstance(r, dict)} if isinstance(references, list) else {}
    images = inventory.get('images')
    for image in images if isinstance(images, list) else []:
        if not isinstance(image, dict): continue
        for panel in image.get('panels', []) if isinstance(image.get('panels'), list) else []:
            if not isinstance(panel, dict): continue
            for view in panel.get('views', []) if isinstance(panel.get('views'), list) else []:
                if not isinstance(view, dict): continue
                for key in ('humans', 'digitalAgents'):
                    for actor in view.get(key, []) if isinstance(view.get(key), list) else []:
                        if not isinstance(actor, dict): continue
                        try:
                            selected = resolve_cast(repo, actor.get('id'))
                            ref = refs.get(actor.get('referenceId'))
                            if not ref or ref.get('role') != 'cast':
                                raise ValueError('Canonical cast reference missing')
                            # Freeze all canonical identity facts, mapping and catalog status in
                            # the hashed visual inventory, not just unchanged image bytes.
                            binding = assert_binding(repo, ref.get('castBinding'))
                            if binding != selected:
                                raise ValueError('Reference binding belongs to another canonical cast member')
                            if Path(resolve(ref.get('path', ''))).resolve() != (Path(repo) / selected['path']).resolve() or ref.get('sha256') != selected['sha256']:
                                raise ValueError('Reference is not Studio modelRecord/comic-ink for ' + selected['characterId'])
                        except (ValueError, OSError, KeyError, TypeError) as error:
                            errors.append('visual canonical cast: ' + str(error))
    return errors


def validate_inputs(repo, bindings, inputs, resolve):
    """Require each current identity as an actual input or explicit composed member.

    Composed inputs retain their derived file hash plus each exact source binding.
    This proves declared provenance, never the montage's pixels or approval.
    """
    current = [assert_binding(repo, b) for b in bindings]
    attached = {}
    for row in inputs:
        if row.get('castBinding'):
            binding = assert_binding(repo, row['castBinding'])
            if Path(resolve(row['path'])).resolve() != (Path(repo) / binding['path']).resolve() or row.get('sha256') != binding['sha256']:
                raise ValueError('Cast input file differs from its canonical binding')
            attached[binding['characterId']] = binding
        if row.get('castMembers'):
            composition = row.get('composition')
            if not isinstance(composition, dict) or composition.get('outputSha256') != row.get('sha256') or not composition.get('layout'):
                raise ValueError('Explicit contact-sheet composition hash/layout required')
            members = [assert_binding(repo, member) for member in row['castMembers']]
            if composition.get('sources') != members:
                raise ValueError('Contact-sheet source bindings differ')
            if len({m['characterId'] for m in members}) != len(members):
                raise ValueError('Duplicate contact-sheet cast member')
            attached.update({m['characterId']: m for m in members})
    if set(attached) != {b['characterId'] for b in current}:
        raise ValueError('Actual reference inputs do not cover the exact declared Studio cast')
    return current
