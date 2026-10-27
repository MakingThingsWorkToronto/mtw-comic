"""Offline checks for the shared box-defect prompt block; synthetic briefs, no generation and no pixel inspection.
Run from the repo root: python -B .codex/skills/mtw-comic-story/scripts/art/test_box_prompt.py
"""
import copy
import json
import re
import comic_art as art

f = art.fragments()
block = f.get('box-defects', '')
checks = []
ids = re.findall(r'^D(\d+) ', block, re.M)
assert ids == [str(i) for i in range(1, 16)], ids
checks.append('fragment box-defects carries D1-D15 in order')
review = (art.HERE.parent.parent / 'references' / 'box-defects.md').read_text(encoding='utf-8')
for i in range(1, 16): assert f'| D{i} |' in review, f'review checklist lacks D{i}'
checks.append('review checklist names the same D1-D15 IDs')

view = {'id': 'single', 'digitalAgents': [{'id': 'codex', 'referenceId': 'cast', 'colourState': 'accepted blue'}],
        'humans': [{'id': 'sam', 'referenceId': 'cast'}],
        'surfaces': [{'id': 'laptop', 'kind': 'device', 'object': 'laptop', 'informationSide': 'screen', 'reader': 'sam', 'camera': 'side',
                      'shows': 'the quote table with the wrong desk count highlighted.'},
                     {'id': 'phone', 'kind': 'device', 'object': 'phone', 'informationSide': 'blank', 'reader': None, 'camera': 'back'},
                     {'id': 'report', 'kind': 'paper', 'object': 'printed report', 'informationSide': 'reader-facing-paper', 'reader': 'sam', 'camera': 'front',
                      'shows': 'a bar chart with one red bar.'}]}
brief = {'id': 'fixture', 'visualInventory': {'images': [{'id': 'fixture', 'panels': [{'id': 'box-one', 'views': [view]}]}]}}
lines = art.box_defect_lines(brief, f)
text = '\n'.join(lines)
assert lines[0].startswith('Box defects') and block in lines[0]
assert 'laptop screen faces sam' in text and 'the quote table with the wrong desk count highlighted.' in text
assert 'phone shows the camera only its plain rear casing' in text
assert 'printed report printed face faces sam' in text and 'a bar chart with one red bar.' in text
assert 'codex is a digital agent in colour state accepted blue' in text and 'sam is a solid cartoon human' in text
checks.append('every surface, agent and human gets an explicit line')
assert art.box_defect_lines({'id': 'legacy'}, f) == lines[:1]
checks.append('legacy brief without visualInventory still gets the shared block')

# The fast box prompt formerly lost the concrete reserves even though D3
# mentioned them. Exercise the same producer used by both prompt routes.
composed = copy.deepcopy(brief)
composed['clearZones'] = ['upper left, clear of Sam', 'bottom-right caption reserve']
composed['speakers'] = {'sam': {'mouth': [0.64, 0.42], 'face': [0.5, 0.22, 0.22, 0.3]}}
composition_text = '\n'.join(art.box_defect_lines(composed, f))
assert 'upper left, clear of Sam; bottom-right caption reserve' in composition_text
assert 'Speaker sam: planned mouth [0.64, 0.42] and protected face [0.5, 0.22, 0.22, 0.3]' in composition_text
assert 'actual returned pixels before integration' in composition_text
assert 'laptop screen faces sam' in composition_text
checks.append('fast and scene prompt producer retain concrete lettering reserves, speaker geometry and surfaces')
for label, change in [
        ('pixel-space mouth', {'mouth': [640, 420], 'face': [0.5, 0.22, 0.22, 0.3]}),
        ('face outside source', {'mouth': [0.64, 0.42], 'face': [0.9, 0.22, 0.22, 0.3]}),
        ('empty face', {'mouth': [0.64, 0.42], 'face': [0.5, 0.22, 0, 0.3]}),
        ('nonfinite mouth', {'mouth': [float('nan'), 0.42], 'face': [0.5, 0.22, 0.22, 0.3]})]:
    invalid = copy.deepcopy(composed)
    invalid['speakers']['sam'] = change
    try: art.box_defect_lines(invalid, f)
    except SystemExit as error:
        assert 'speakers.sam' in str(error)
        checks.append(label + ' rejected before generation')
    else: raise AssertionError(label + ' accepted')


def refuses(label, mutate, fragment):
    b = copy.deepcopy(brief); mutate(b['visualInventory']['images'][0]['panels'][0]['views'][0]['surfaces'])
    try: art.box_defect_lines(b, f)
    except SystemExit as e: assert fragment in str(e), (label, str(e)); checks.append(label); return
    raise AssertionError(label + ' unexpectedly accepted')


refuses('content screen without shows refused (missing UI)', lambda s: s[0].pop('shows'), 'shows')
refuses('blank-looking shows refused', lambda s: s[0].update(shows='  '), 'shows')
refuses('paper evidence without shows refused (missing graphic)', lambda s: s[2].pop('shows'), 'shows')
refuses('missing camera face refused', lambda s: s[0].pop('camera'), 'camera')
refuses('camera on the back of a content surface refused (wrong side)', lambda s: s[2].update(camera='back'), 'informationSide blank')
refuses('content surface without reader refused', lambda s: s[0].update(reader=None), 'reader')
try: art.box_defect_lines(brief, {})
except SystemExit: checks.append('missing shared fragment refused')
else: raise AssertionError('missing fragment accepted')
print(json.dumps({'status': 'pass', 'checks': checks, 'limitations': 'Prompt text only; generation and visual inspection are separate.'}, indent=2))
