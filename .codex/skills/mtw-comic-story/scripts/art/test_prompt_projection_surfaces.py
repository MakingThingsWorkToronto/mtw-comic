"""Offline prompt inclusion and surface escape checks; no image generation or approval."""
import copy
import json
import re
from pathlib import Path
import comic_art as art

# Uses this edition's owning fragments, including when run from an ignored packet.
art.FRAGMENTS = Path(__file__).with_name('prompt-fragments.default.md')
f = art.fragments()
view = {'id': 'operator', 'digitalAgents': [{'id': 'codex', 'colourState': 'teal', 'referenceId': 'canonical-codex'}],
        'humans': [{'id': 'matt', 'referenceId': 'canonical-matt'}],
        'surfaces': [
            {'id': 'screen', 'kind': 'device', 'object': 'monitor', 'camera': 'front', 'informationSide': 'screen', 'reader': 'matt', 'shows': '2026 / Discount none / Labour 40h'},
            {'id': 'sheet', 'kind': 'paper', 'object': 'paper', 'camera': 'front', 'informationSide': 'reader-facing-paper', 'reader': 'matt', 'shows': 'the same checked 2026 / none / 40h fields'},
            {'id': 'rear', 'kind': 'device', 'object': 'phone', 'camera': 'back', 'informationSide': 'blank', 'reader': None}]}
b = {'id': 'fixture', 'visualInventory': {'images': [{'id': 'fixture', 'panels': [{'id': 'box', 'views': [view]}]}]}}
assembled = '\n'.join(art.box_defect_lines(b, f))
checks = []
critical = {
    'opaque native actor interiors': 'opaque full-colour RGB interiors',
    'no baked scene': 'zero baked skyline/buildings/room',
    'opaque canonical identity reference': 'Use opaque canonical models, never prior translucent scenes',
    'real foreground depth': 'scene-specific renderer transmission and foreground depth occlusion',
    'separate RGBA and actor mask': 'isolated transparent RGBA planes',
    'comic information-face integration': 'comic ink, face perspective, coherent lighting and occlusion',
    'no pasted UI': 'no flat pasted UI, vector sticker',
    'actual responsive fit': 'all responsive layouts',
    'no black matte': 'No black mattes',
    'no fake blur fill': 'fake blur fill',
    'evidence survives fill': 'never cover/clip required evidence',
    'intended writing contact': 'actual pen-tip contact with the intended field or signature area',
}
def check_requirement(text, label, phrase):
    assert phrase in text, (label, phrase)
for label, phrase in critical.items():
    check_requirement(assembled, label, phrase)
    # A caller dropping this requirement must fail the same actual assembled contract.
    missing = assembled.replace(phrase, '')
    try:
        check_requirement(missing, label, phrase)
    except AssertionError:
        pass
    else:
        raise AssertionError('omitted critical requirement escaped: ' + label)
    checks.append(label + ' included; omission escape detected')

def require(label, text, phrases):
    for phrase in phrases:
        assert phrase in text, (label, phrase)
    checks.append(label)
require('actual box prompt includes crisp full-colour projection and separate mask contract', assembled,
        ['crisp full-colour comic projection', 'readable faces/costume centres', 'scene-specific renderer transmission', 'opaque full-colour RGB interiors', 'zero baked skyline/buildings/room', 'isolated transparent RGBA planes', 'actor-only mask', 'scan/dot fabrication', 'never pale ghost fade'])
require('surface craft reaches actual box prompt without losing authored fields/readers', assembled,
        ['comic ink, face perspective, coherent lighting and occlusion', 'no flat pasted UI, vector sticker', 'Keep evidence readable and physical paper solid', '2026 / Discount none / Labour 40h', 'monitor screen faces matt', 'paper printed face faces matt'])
require('human solidity and plain rear surface survive', assembled,
        ['matt is a solid cartoon human', 'phone shows the camera only its plain rear casing'])
assert re.findall(r'^D(\d+) ', assembled, re.M) == [str(i) for i in range(1, 16)]
checks.append('all fifteen shared defect IDs survive in order')
require('normal scene style fragment includes independent overlay preparation without whole-scene haze', f['style95'],
        ['genuinely isolated transparent RGBA planes', 'moving scan lines or dot-matrix fabrication', 'not pale ghosts', 'Native agent planes must have opaque full-colour RGB interiors', 'NEVER a generated translucent/ghost scene', 'concrete parapet must block', 'No flat pasted UI, vector sticker or floating evidence panel'])
legacy = '\n'.join(art.box_defect_lines({'id': 'legacy'}, f))
require('legacy inventory-free prompt still receives new safeguards', legacy,
        ['isolated transparent RGBA planes', 'comic ink, face perspective'])
for surface_index in (0, 1):
    wrong = copy.deepcopy(b)
    wrong['visualInventory']['images'][0]['panels'][0]['views'][0]['surfaces'][surface_index]['camera'] = 'back'
    try:
        art.box_defect_lines(wrong, f)
    except SystemExit as error:
        assert 'informationSide blank' in str(error)
        checks.append('wrong-facing ' + str(surface_index) + ' rejected before prompt')
    else:
        raise AssertionError('content on back accepted')
print(json.dumps({'status': 'pass', 'checks': checks, 'limitations': 'Prompt contract only; real image/alpha/composition/native reader review and approval remain pending.'}, indent=2))
