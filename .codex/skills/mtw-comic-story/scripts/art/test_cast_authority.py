"""Offline canonical selection escape cases. Synthetic bytes are not artwork."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from cast_authority import (assert_binding, brief_bindings, cast_reference_errors,
                            resolve_cast, validate_inputs)


def make_repo(root):
    root = Path(root)
    home = root / 'wiki/image-library'
    (home / 'assets/models').mkdir(parents=True)
    characters = []
    records = []
    for who, name in [('ruth', 'Ruth Orr'), ('joan', 'Joan Mikita'), ('potvin', 'Ryan Potvin'),
                      ('second-brain', 'The second brain'), ('codex', 'Codex'), ('matt', 'Matt')]:
        rel = f'assets/models/{who}-selected-v1.png'
        (home / rel).write_bytes(('synthetic ' + who).encode())
        characters.append({'id': who, 'name': name, 'aliases': [name], 'role': 'Synthetic role ' + who,
                           'signature': 'Synthetic signature ' + who, 'modelRecord': 'chosen-' + who})
        records.append({'id': 'chosen-' + who, 'treatments': {'comic-ink': {'path': rel,
                        'sha256': hashlib.sha256((home / rel).read_bytes()).hexdigest(), 'status': 'unreviewed-preview'}}})
    (root / 'wiki/comics-library').mkdir(parents=True)
    (root / 'wiki/comics-library/characters.json').write_text(json.dumps({'characters': characters}), encoding='utf-8')
    (home / 'manifest.json').write_text(json.dumps({'records': records}), encoding='utf-8')
    return root


class CastAuthority(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.repo = make_repo(Path(self.temp.name) / 'repo')

    def edit(self, rel, callback):
        file = self.repo / rel; data = json.loads(file.read_text(encoding='utf-8')); callback(data)
        file.write_text(json.dumps(data), encoding='utf-8')

    def binding(self, who='ruth'): return resolve_cast(self.repo, who)
    def input(self, who):
        binding = self.binding(who)
        return {'path': str(self.repo / binding['path']), 'sha256': binding['sha256'],
                'role': 'Identity only', 'castBinding': binding}
    def resolver(self, p): return Path(p) if Path(p).is_absolute() else self.repo / p
    def inventory(self, actor='ruth', ref='ruth'):
        binding = self.binding(ref)
        return {'references': [{'id': 'identity', 'path': binding['path'], 'sha256': binding['sha256'], 'role': 'cast', 'castBinding': binding}],
                'images': [{'id': 'page', 'panels': [{'id': 'box', 'views': [{'id': 'single',
                 'humans': [{'id': actor, 'referenceId': 'identity'}], 'digitalAgents': []}]}]}]}

    def test_actual_selected_reference_wins_over_newer_filename(self):
        (self.repo / 'wiki/image-library/assets/models/ruth-dedicated-v99.png').write_bytes(b'unselected newer draft')
        self.assertTrue(self.binding()['path'].endswith('ruth-selected-v1.png'))
        self.assertEqual(self.binding()['status'], 'unreviewed-preview')

    def test_alias_and_second_different_character_resolve_current_models(self):
        self.assertEqual(self.binding('Joan Mikita')['characterId'], 'joan')
        self.assertEqual(self.binding('Ryan Potvin')['recordId'], 'chosen-potvin')
        self.assertEqual(self.binding('The second brain')['characterId'], 'second-brain')
        self.assertEqual(cast_reference_errors(self.repo, self.inventory('joan', 'joan'), self.resolver), [])

    def test_ruth_cannot_use_joan_even_with_coherent_ref_hash(self):
        errors = cast_reference_errors(self.repo, self.inventory('ruth', 'joan'), self.resolver)
        self.assertTrue(any('another canonical cast' in error for error in errors))

    def test_visual_cast_binding_required_and_same_byte_fact_changes_refused(self):
        inventory = self.inventory()
        inventory['references'][0].pop('castBinding')
        self.assertTrue(any('binding required' in e for e in cast_reference_errors(self.repo, inventory, self.resolver)))
        inventory = self.inventory()
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(signature='new current signature'))
        self.assertTrue(any('Stale' in e for e in cast_reference_errors(self.repo, inventory, self.resolver)))

    def test_visual_same_byte_status_and_model_record_changes_refused(self):
        inventory = self.inventory()
        self.edit('wiki/image-library/manifest.json', lambda d: d['records'][0]['treatments']['comic-ink'].update(status='rejected'))
        self.assertTrue(any('Stale' in e for e in cast_reference_errors(self.repo, inventory, self.resolver)))
        inventory = self.inventory()
        def change_record(d):
            record = copy.deepcopy(d['records'][0]); record['id'] = 'chosen-ruth-remapped'; d['records'].append(record)
        self.edit('wiki/image-library/manifest.json', change_record)
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(modelRecord='chosen-ruth-remapped'))
        self.assertTrue(any('Stale' in e for e in cast_reference_errors(self.repo, inventory, self.resolver)))

    def test_missing_mapping_and_shared_mapping_refuse_group_fallback(self):
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(modelRecord=None))
        with self.assertRaisesRegex(ValueError, 'modelRecord'): self.binding()
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(modelRecord='chosen-joan'))
        with self.assertRaisesRegex(ValueError, 'Shared'): self.binding()

    def test_unknown_and_ambiguous_aliases_refused(self):
        with self.assertRaisesRegex(ValueError, 'Unknown'): self.binding('invented-helper')
        self.edit('wiki/comics-library/characters.json', lambda d: [c.update(aliases=['common']) for c in d['characters'][:2]])
        with self.assertRaisesRegex(ValueError, 'ambiguous'): self.binding('common')

    def test_hash_mismatch_and_library_escape_refused(self):
        selected = self.binding(); (self.repo / selected['path']).write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'hash differs'): self.binding()
        self.edit('wiki/image-library/manifest.json', lambda d: d['records'][0]['treatments']['comic-ink'].update(path='../../outside.png'))
        with self.assertRaisesRegex(ValueError, 'escapes'): self.binding()

    def test_mapping_change_refused_when_old_source_bytes_unchanged(self):
        binding = self.binding(); old = (self.repo / binding['path']).read_bytes()
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(signature='Changed canonical signature'))
        self.assertEqual((self.repo / binding['path']).read_bytes(), old)
        with self.assertRaisesRegex(ValueError, 'Stale'): assert_binding(self.repo, binding)

    def test_new_model_record_choice_refuses_preserved_old_reference(self):
        binding = self.binding(); old = (self.repo / binding['path']).read_bytes()
        path = 'assets/models/ruth-selected-v2.png'
        file = self.repo / 'wiki/image-library' / path; file.write_bytes(b'different valid canonical Ruth image')
        record = {'id':'chosen-ruth-v2','treatments':{'comic-ink':{'path':path,
                  'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'status':'unreviewed-preview'}}}
        self.edit('wiki/image-library/manifest.json', lambda d: d['records'].append(record))
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(modelRecord='chosen-ruth-v2'))
        self.assertEqual((self.repo / binding['path']).read_bytes(), old)
        self.assertEqual(self.binding()['recordId'], 'chosen-ruth-v2')
        with self.assertRaisesRegex(ValueError, 'Stale'): assert_binding(self.repo, binding)

    def test_visible_actor_not_silently_dropped_or_suppressed(self):
        brief = {'cast': [], 'visualInventory': self.inventory('joan', 'joan')}
        self.assertEqual(brief_bindings(self.repo, brief)[0]['characterId'], 'joan')
        brief['noSheetFor'] = ['joan']
        with self.assertRaisesRegex(ValueError, 'suppress'): brief_bindings(self.repo, brief)

    def test_direct_actual_inputs_and_omitted_identity(self):
        rows = [self.input('ruth'), self.input('joan')]
        bindings = [row['castBinding'] for row in rows]
        self.assertEqual(validate_inputs(self.repo, bindings, rows, self.resolver), bindings)
        with self.assertRaisesRegex(ValueError, 'exact declared'): validate_inputs(self.repo, bindings, rows[:1], self.resolver)

    def test_contact_sheet_explicit_sources_and_stale_member(self):
        members = [self.binding('joan'), self.binding('potvin')]
        sheet = self.repo / 'contact.png'; sheet.write_bytes(b'synthetic montage, not inspected')
        row = {'path': str(sheet), 'role': 'Explicit compound identity', 'sha256': hashlib.sha256(sheet.read_bytes()).hexdigest(),
               'castMembers': members, 'composition': {'sources': members, 'layout': {'rows': 1, 'columns': 2}}}
        row['composition']['outputSha256'] = row['sha256']
        self.assertEqual(validate_inputs(self.repo, members, [row], self.resolver), members)
        bad = copy.deepcopy(row); bad['composition'].pop('layout')
        with self.assertRaisesRegex(ValueError, 'composition'): validate_inputs(self.repo, members, [bad], self.resolver)
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][1].update(signature='changed by canonical source'))
        with self.assertRaisesRegex(ValueError, 'Stale'): validate_inputs(self.repo, members, [row], self.resolver)

    def test_prompt_and_provider_boundary_resolve_same_current_authority(self):
        import comic_art as art
        row = self.input('ruth'); brief = {'id': 'test', 'cast': ['ruth'], 'kind': 'page'}
        workspace = self.repo / 'work/test'; workspace.mkdir(parents=True)
        (workspace / 'inputs.json').write_text(json.dumps([row]), encoding='utf-8')
        self.edit('wiki/comics-library/characters.json', lambda d: d['characters'][0].update(signature='new Studio selection facts'))
        with patch.object(art, 'REPO', self.repo), patch.object(art, 'COMIC', self.repo / 'canonical'), \
             patch.object(art, 'WORK', self.repo / 'work'), patch.object(art, 'brief', return_value=brief), \
             patch.object(art.subprocess, 'run', side_effect=AssertionError('Provider must not be called')):
            with self.assertRaisesRegex(SystemExit, 'Stale'): art.stage_generate('test', 1)
        self.assertFalse((workspace / 'gen-v1').exists())


    def test_prompt_attaches_current_canonical_identity_and_facts(self):
        import comic_art as art
        brief = {'id':'test','cast':['Joan Mikita','potvin'],'kind':'page','aspect':'16:10','prompt':'Synthetic event only'}
        fragments = {key: 'synthetic' for key in ('style95','black-teal','cinematography','darkness','depth','movement',
                     'ink-plate','full-bleed','page-frame','sheet-frame','page-frame-dark','copy-rules','avoid')}
        with patch.object(art, 'REPO', self.repo), patch.object(art, 'WORK', self.repo / 'work'), \
             patch.object(art, 'brief', return_value=brief), patch.object(art, 'fragments', return_value=fragments), \
             patch.object(art, 'cfg', return_value={'palette':{'teal':[26,155,161]}}), \
             patch.object(art, 'style_inputs', return_value=[]), patch.object(art, 'villain_words', return_value=''), \
             patch.object(art, 'box_defect_lines', return_value=['Synthetic defects only']):
            art.stage_prompt('test', 1)
        inputs = json.loads((self.repo / 'work/test/inputs.json').read_text())
        self.assertEqual([row['castBinding']['characterId'] for row in inputs], ['joan','potvin'])
        prompt = (self.repo / 'work/test/prompt.txt').read_text()
        self.assertIn('Synthetic signature joan', prompt)
        self.assertIn('unreviewed-preview', prompt)
        self.assertNotIn('model-operators', prompt)


if __name__ == '__main__': unittest.main()
