"""Validate declared Comic B visual observations; this does not inspect pixels.

New acceptance always requires this contract. Historical records remain readable,
and uninspected/failed images may be retained as drafts, never accepted by omission.
The caller owns the expected inventory; review coverage cannot define its own scope.
"""
import hashlib
import json
from pathlib import Path
import subprocess
from cast_authority import cast_reference_errors

CONTRACT = 'comic-visual-v1'
VIEW_CHECKS = ('cartoonConsistency', 'noPhotorealism', 'noPainterlyRealism', 'noCinematic3D')
AGENT_CHECKS = ('identityPreserved', 'colourPreserved', 'subtleProjection', 'comicTreatment', 'noRepositoryHologram')


def contract_hash(value):
    """Canonical JSON bytes, independent of whitespace and key ordering."""
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode('utf-8')).hexdigest()


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def visual_review_errors(pid, src, story, review, expected_brief, resolve, repo):
    """Read-only exact coverage/content claim validation against brief and live refs."""
    errors = []
    def error(where, message): errors.append(f'visual {where}: {message}')
    def text(value): return isinstance(value, str) and bool(value.strip())
    def rows(value, where, nonempty=False):
        if not isinstance(value, list):
            error(where, 'explicit array required'); return []
        if nonempty and not value: error(where, 'coverage must not be empty')
        ids = []
        valid = []
        for row in value:
            if not isinstance(row, dict) or not text(row.get('id')):
                error(where, 'each entry needs a nonempty id'); continue
            if row['id'] in ids: error(where, f'duplicate id {row["id"]}')
            ids.append(row['id']); valid.append(row)
        return valid
    def paired(expected, observed, where, nonempty=False):
        wanted = rows(expected, where + ' expected', nonempty)
        actual = rows(observed, where + ' observed', nonempty)
        if [r['id'] for r in actual] != [r['id'] for r in wanted]:
            error(where, 'missing, unexpected or out-of-order coverage')
        # Duplicate coverage is already rejected; do not let dictionary merging hide it.
        by_id = {r['id']: r for r in actual}
        return [(r, by_id[r['id']]) for r in wanted if r['id'] in by_id]
    def observations(row, where):
        if not text(row.get('observations')): error(where, 'actual visual observations missing')
    def checks(row, names, where):
        values = row.get('checks')
        if not isinstance(values, dict): error(where, 'checks must be an object'); return
        for name in names:
            if values.get(name) is not True: error(where, f'failed or missing {name}')
    if not isinstance(expected_brief, dict): return ['visual expected brief missing']
    if expected_brief.get('id') != pid: error('brief', 'pageId does not match caller brief')
    inventory = expected_brief.get('visualInventory')
    if not isinstance(inventory, dict): return ['visual expected inventory missing from brief']
    visual = review.get('visualReview') if isinstance(review, dict) else None
    if not isinstance(visual, dict): return ['visual detailed review missing; legacy review is not new acceptance']
    if visual.get('contract') != CONTRACT: error('contract', 'current contract required')
    if visual.get('briefSha256') != contract_hash(expected_brief): error('brief', 'review does not match expected brief')
    if visual.get('inventorySha256') != contract_hash(inventory): error('inventory', 'review does not match expected inventory')
    refs = rows(inventory.get('references'), 'references expected', True)
    refs_by_id = {r['id']: r for r in refs}
    if not any(r.get('role') == 'comic-style' for r in refs): error('references', 'approved comic-style reference required')
    for ref in refs:
        where = f'reference {ref["id"]}'
        digest = ref.get('sha256')
        if not text(ref.get('path')) or not isinstance(digest, str) or len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
            error(where, 'exact path and lower-case sha256 required'); continue
        if ref.get('role') not in ('comic-style', 'cast'): error(where, 'role must be comic-style or cast')
        path = Path(resolve(ref['path']))
        if not path.is_file() or file_hash(path) != digest: error(where, 'reference missing or changed')
    for ref, observed in paired(refs, visual.get('references'), 'references', True):
        if observed.get('sha256') != ref.get('sha256'): error(f'reference {ref["id"]}', 'review reference hash mismatch')
    errors.extend(cast_reference_errors(repo, inventory, resolve))
    images = rows(inventory.get('images'), 'images expected', True)
    # This single-master caller runs once for each returned image. Extra images cannot
    # be claimed reviewed using this master's hash; batch callers enumerate each entry.
    if len(images) != 1 or images[0]['id'] != pid: error('images', 'expected exactly the returned image matching pageId')
    scene_id = expected_brief.get('storySceneId')
    if not text(scene_id): error('story', 'storySceneId required to bind all actual rendered boxes')
    else:
        try:
            result = subprocess.run(['node', str(Path(__file__).with_name('story_inventory.mjs')), str(story), scene_id],
                                    capture_output=True, text=True, encoding='utf-8', timeout=20)
            if result.returncode: error('story', 'cannot resolve actual story scene: ' + result.stderr[-600:])
            else:
                actual_story = json.loads(result.stdout)
                if actual_story.get('storyId') != expected_brief.get('story'): error('story', 'brief belongs to another story')
                actual_panels = actual_story.get('panels')
                if expected_brief.get('kind', 'panel') == 'page':
                    if 'storyPanelId' in expected_brief: error('story', 'page output cannot select a storyPanelId subset')
                    wanted_panels = actual_panels
                elif expected_brief.get('kind', 'panel') == 'panel':
                    panel_id = expected_brief.get('storyPanelId')
                    if not text(panel_id) or actual_panels.count(panel_id) != 1:
                        error('story', 'standalone panel needs exact storyPanelId resolving to one actual box')
                    wanted_panels = [panel_id]
                else:
                    error('story', 'only page or exact standalone panel output can receive story acceptance')
                    wanted_panels = []
                if len(images) == 1:
                    declared_panels = rows(images[0].get('panels'), 'story panels expected', True)
                    if [p['id'] for p in declared_panels] != wanted_panels:
                        error('story', 'expected panels must cover every actual story box in scope and order')
        except (OSError, subprocess.TimeoutExpired, ValueError, TypeError):
            error('story', 'actual story panel inventory unavailable')
    for image, observed_image in paired(images, visual.get('images'), 'images', True):
        where_image = f'image {image["id"]}'
        if observed_image.get('sha256') != file_hash(src): error(where_image, 'review image hash mismatch')
        for panel, observed_panel in paired(image.get('panels'), observed_image.get('panels'), where_image + ' panels', True):
            where_panel = f'{where_image} panel {panel["id"]}'
            for view, observed_view in paired(panel.get('views'), observed_panel.get('views'), where_panel + ' views', True):
                where = f'{where_panel} view {view["id"]}'
                observations(observed_view, where); checks(observed_view, VIEW_CHECKS, where)
                for agent, observed in paired(view.get('digitalAgents'), observed_view.get('digitalAgents'), where + ' digital agents'):
                    label = where + ' agent ' + agent['id']
                    if not text(agent.get('colourState')): error(label, 'expected authored colour state missing')
                    reference = refs_by_id.get(agent.get('referenceId')) if text(agent.get('referenceId')) else None
                    if not reference or reference.get('role') != 'cast': error(label, 'accepted cast reference missing')
                    for name in ('referenceId', 'colourState'):
                        if observed.get(name) != agent.get(name): error(label, f'{name} mismatch')
                    observations(observed, label); checks(observed, AGENT_CHECKS, label)
                for human, observed in paired(view.get('humans'), observed_view.get('humans'), where + ' humans'):
                    label = where + ' human ' + human['id']
                    reference = refs_by_id.get(human.get('referenceId')) if text(human.get('referenceId')) else None
                    if not reference or reference.get('role') != 'cast': error(label, 'accepted cast reference missing')
                    if observed.get('referenceId') != human.get('referenceId'): error(label, 'referenceId mismatch')
                    if observed.get('solid') is not True: error(label, 'solid human failed or missing')
                    observations(observed, label)
                for surface, observed in paired(view.get('surfaces'), observed_view.get('surfaces'), where + ' surfaces'):
                    label = where + ' surface ' + surface['id']
                    kind = surface.get('kind'); side = surface.get('informationSide'); reader = surface.get('reader')
                    valid_sides = {'paper': ('reader-facing-paper', 'blank'), 'device': ('screen', 'blank')}
                    if not isinstance(kind, str) or kind not in valid_sides or side not in valid_sides.get(kind, ()):
                        error(label, 'expected information side invalid; no content on backs, lids or edges')
                    if 'reader' not in surface or 'reader' not in observed or (side == 'blank' and reader is not None) or (side != 'blank' and not text(reader)):
                        error(label, 'exact reader required for content; blank side reader must be null')
                    for name in ('kind', 'reader'):
                        if observed.get(name) != surface.get(name): error(label, f'{name} mismatch')
                    if observed.get('observedInformationSide') != side: error(label, 'wrong paper/device information side')
                    names = [('noBackLidEdgeUI' if kind == 'device' else 'noReverseSideCopy')]
                    if side != 'blank': names.append('facesReader')
                    else: names.append('blankSurface')
                    observations(observed, label); checks(observed, names, label)
    return errors
