#!/usr/bin/env python3
"""Actual MTW brief regressions using canonical inputs; historical cards stay immutable."""
import argparse
import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import compile_scene_brief as compiler
from compile_scene_brief import BriefError, compile_brief

PARSER = argparse.ArgumentParser()
PARSER.add_argument('--repo', type=Path, required=True)
PARSER.add_argument('--cases', type=Path, default=Path(__file__).resolve().parents[1] / 'references/scene-brief-cases.json')
ARGS, REST = PARSER.parse_known_args()
CASES = {x['caseId']: x['brief'] for x in json.loads(ARGS.cases.read_text(encoding='utf-8'))}
ROOT = ARGS.repo.resolve()
LIBRARY = ROOT / 'wiki/image-library'
CATALOG = json.loads((LIBRARY / 'manifest.json').read_text(encoding='utf-8-sig'))


class ActualBriefTests(unittest.TestCase):
    def case(self, name):
        return copy.deepcopy(CASES[name])

    def canonical_reference(self, source_path):
        """Translate a historical locator, never its hash or its source identity."""
        prefix = 'discussion/references/'
        if not source_path.startswith(prefix):
            return source_path
        matches = [r for r in CATALOG['records'] if r.get('collection') == 'originals'
                   and r.get('sourceName') == source_path.removeprefix(prefix)]
        if len(matches) != 1:
            raise BriefError('historical source must resolve to exactly one canonical original')
        # Resolve independently of the diagram so the compiler still detects a
        # wrong source, including one whose bytes have a valid matching hash.
        return (Path('wiki/image-library') / matches[0]['treatments']['original']['path']).as_posix()

    def vector(self, logical_id):
        matches = [r for r in CATALOG['records'] if r.get('collection') == 'diagrams'
                   and r.get('logicalId', r['id']) == logical_id]
        self.assertEqual(len(matches), 1)
        return matches[0]['treatments']['svg-flat']

    def check(self, brief):
        # The fixture file retains its exact historical evidence. This suite
        # tests today's resolver using an in-memory path adaptation only.
        adapted = copy.deepcopy(brief)
        adapted['registrationContract']={'canonicalDestination':f"wiki/image-library/assets/diagrams/{adapted['treatment']}/{adapted['id']}-contract-fixture-v999.png",
         'recordId':adapted['id'],'style':adapted['treatment'],'version':'v999',
         'provenanceDestination':f"wiki/image-library/records/{adapted['id']}/{adapted['treatment']}/v999",'registrar':'fixture-registrar',
         'requestedStatus':'pending-review','bytePreserveImport':True,'register':True,'verify':True,'completionStage':'registered'}
        adapted['reference']['path'] = self.canonical_reference(adapted['reference']['path'])
        return compile_brief(adapted, ROOT)

    def selected_brief(self, logical_id, source_path):
        source_path = self.canonical_reference(source_path)
        source = ROOT / source_path
        return {'id': logical_id, 'treatment': 'photorealistic', 'part': 3,
                'referenceKind': 'selected-reference',
                'reference': {'path': source_path, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()},
                'sourceLabels': [], 'labels': []}

    def denied_brief(self):
        # Tests only route handling; empty labels do not represent a production RBAC prompt.
        b = self.selected_brief('rbac-03-secured-by-groups',
                                'discussion/references/previews-roles-access/02.png')
        b['routes'] = [{'name': 'Guest denied', 'start': 'Guest', 'end': 'M365 scope boundary',
                        'relationship': 'guest-denied', 'confirmedAgainstReference': True}]
        return b

    def test_critical_routes_alias_cannot_silently_drop_constraints(self):
        for keep_routes in (False, True):
            with self.subTest(keep_routes=keep_routes):
                b = self.denied_brief()
                b["routes"][0]["deniedStop"] = "the protected M365 boundary"
                b["criticalRoutes"] = copy.deepcopy(b["routes"])
                if not keep_routes:
                    del b["routes"]
                with self.assertRaisesRegex(BriefError, "criticalRoutes.*use routes"):
                    self.check(b)

    def test_new_svg_retains_actual_rbac_column_headings(self):
        for logical_id, headers in [
            ('rbac-01-overview', ['Microsoft Entra ID', 'Access assignments', 'Authorized resources']),
            ('rbac-02-access-scenarios', ['Who needs access?', 'What is assigned?', 'What becomes available?'])
        ]:
            with self.subTest(diagram=logical_id):
                treatment = self.vector(logical_id)
                relative = (Path('wiki/image-library') / treatment['path']).as_posix()
                metadata = json.loads((LIBRARY / treatment['metadata']).read_text(encoding='utf-8'))
                labels = list(dict.fromkeys(e['text'] for e in metadata['elements'] if e['type'] == 'text'))
                b = {'id': logical_id, 'treatment': 'holographic', 'part': 2, 'referenceKind': 'new-svg',
                     'reference': {'path': relative, 'sha256': hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()},
                     'sourceLabels': labels, 'labels': labels}
                result = self.check(b)
                self.assertEqual(result['titlePolicy'], {'removeOverallTitle': False, 'preserveInternalLabels': True})
                self.assertIn('no overall image title to remove', result['promptBlock'])
                for label in headers:
                    self.assertIn(label, labels)
                    self.assertIn(json.dumps(label), result['promptBlock'])

    def test_selected_reference_removes_only_overall_title(self):
        result = self.check(self.case('why-holographic'))
        self.assertEqual(result['titlePolicy'], {'removeOverallTitle': True, 'preserveInternalLabels': True})
        self.assertIn('Remove only an overall image title.', result['promptBlock'])
        self.assertIn('4. Review', result['promptBlock'])

    def test_all_five_real_prior_briefs_compile(self):
        for name in CASES:
            with self.subTest(case=name):
                result = self.check(self.case(name))
                self.assertEqual(result['id'], CASES[name]['id'])
                self.assertEqual(result['inputAuthority']['path'], 'wiki/image-library/manifest.json')

    def test_each_required_label_field_and_both_missing_are_rejected(self):
        for missing in [('sourceLabels',), ('labels',), ('sourceLabels', 'labels')]:
            with self.subTest(missing=missing):
                b = self.case('enterprise-photo')
                for key in missing: del b[key]
                with self.assertRaisesRegex(BriefError, missing[0] + ': field required'):
                    self.check(b)

    def test_explicit_empty_labels_are_valid_for_brain_only_art(self):
        b = self.selected_brief('brain-cortex',
                                'discussion/references/preview-brain/reference/brain-04-translucent-cortex.png')
        result = self.check(b)
        self.assertIn('Only readable labels: none.', result['promptBlock'])
        self.assertNotIn('Floating captions:', result['promptBlock'])

    def test_enterprise_head_locations_derived_from_current_metadata(self):
        result = self.check(self.case('enterprise-photo'))
        routes = {x['name']: x for x in result['routes']}
        self.assertEqual(routes['Efficient reads']['heads'], ['end'])
        self.assertIn('Scoped MCP', routes['Efficient reads']['end'])
        self.assertIn('operator', routes['Efficient reads']['start'])
        self.assertEqual(routes['Scoped file access']['heads'], ['start', 'end'])
        self.assertEqual(routes['Project context fan']['heads'], [])
        self.assertIn('zero arrowheads at the right-side expert operator screen', result['promptBlock'])
        # Zero-head, dashed one-way, and bidirectional routes are not denials.
        for route in routes.values():
            self.assertIs(route['denied'], False)
            self.assertIsNone(route['deniedStop'])

    def test_known_blocked_relationship_requires_a_nonempty_stop(self):
        for value in [None, '', '   ', False]:
            with self.subTest(value=value):
                b = self.denied_brief()
                b['routes'][0]['deniedStop'] = value
                with self.assertRaisesRegex(BriefError, 'deniedStop: expected nonempty text'):
                    self.check(b)
        with self.assertRaisesRegex(BriefError, 'deniedStop: expected nonempty text'):
            self.check(self.denied_brief())

    def test_known_blocked_stop_is_preserved_in_prompt_and_contract(self):
        b = self.denied_brief()
        b['routes'][0]['deniedStop'] = '  M365 scope boundary  '
        result = self.check(b)
        route = result['routes'][0]
        self.assertIs(route['denied'], True)
        self.assertEqual(route['deniedStop'], 'M365 scope boundary')
        self.assertEqual(route['heads'], [])
        self.assertIn('red #ff4d4d dashed line stops at a solid X before M365 scope boundary, with no continuation', result['promptBlock'])

    def test_blocked_outcome_and_error_status_each_preserve_denial(self):
        metadata_path = LIBRARY / self.vector('rbac-03-secured-by-groups')['metadata']
        original = json.loads(metadata_path.read_text(encoding='utf-8'))
        real_reader = compiler.read_json
        for outcome, role in [('blocked', None), (None, 'error')]:
            with self.subTest(outcome=outcome, statusRole=role):
                metadata = copy.deepcopy(original)
                rel = next(r for r in metadata['relationships'] if r.get('id') == 'guest-denied')
                rel.update(outcome=outcome, statusRole=role)
                # Isolated in-memory metadata mutation; no source file is edited.
                with patch('compile_scene_brief.read_json', side_effect=lambda path:
                           metadata if Path(path) == metadata_path else real_reader(path)):
                    with self.assertRaisesRegex(BriefError, 'deniedStop'):
                        self.check(self.denied_brief())

    def test_rejects_injected_second_head_without_ignoring_metadata(self):
        b = self.case('enterprise-photo')
        b['routes'][0]['heads'] = ['start', 'end']
        with self.assertRaisesRegex(BriefError, 'not both'):
            self.check(b)

    def test_rejects_unconfirmed_raster_mapping_and_unknown_relation(self):
        for change in ({'confirmedAgainstReference':False}, {'relationship':'invented'}):
            b = self.case('enterprise-photo')
            b['routes'][0].update(change)
            with self.assertRaises(BriefError): self.check(b)

    def test_part3_why_removal_does_not_leak_into_holographic(self):
        b = self.case('why-photo')
        b.update(treatment='holographic', part=2)
        with self.assertRaisesRegex(BriefError, 'leaks into Part 2'): self.check(b)
        b['labelOmissions'] = []
        with self.assertRaisesRegex(BriefError, 'omitted internal label'): self.check(b)
        holo = self.check(self.case('why-holographic'))
        self.assertEqual(len(holo['routes']), 3)
        self.assertIn('4. Review', holo['promptBlock'])

    def test_organize_explicit_override_is_supported_without_new_approval(self):
        b = self.case('organize-holographic')
        self.assertEqual(sum(x['count'] for x in b['people']), 15)
        self.assertIn('no separate oval', self.check(b)['promptBlock'])
        del b['labelOmissions'][0]['authority']
        with self.assertRaisesRegex(BriefError, 'authority'): self.check(b)

    def test_captions_and_existing_surfaces_have_distinct_instructions(self):
        b = self.case('sharepoint-photo')
        result = self.check(b)
        self.assertIn('No caption rectangle, halo or backplate', result['promptBlock'])
        self.assertIn('Label-only callouts stay bare text; do not illustrate them with new props, icons or object clusters.', result['promptBlock'])
        self.assertIn('On existing Site agent answer pane: Q:; A:', result['promptBlock'])
        self.assertNotIn('no separate oval', result['promptBlock'])
        b['surfaceLabels'][0]['labels'] = ['Invented caption']
        with self.assertRaisesRegex(BriefError, 'unknown or repeated'): self.check(b)

    def test_mark_rules_are_instance_specific_and_reject_color_and_fill(self):
        b = self.case('enterprise-photo')
        out = self.check(b)['promptBlock']
        self.assertIn('Mark Claude at left managed-agent panel', out)
        self.assertIn('Mark Microsoft Copilot at left managed-agent panel', out)
        self.assertIn('Mark Codex at right operator screen: exact text only', out)
        for change in ({'color':'#ff8c00'}, {'form':'filled'}):
            b = self.case('enterprise-photo')
            b['marks'][0].update(change)
            with self.assertRaises(BriefError): self.check(b)

    def test_optional_rules_do_not_leak_into_unrelated_subject(self):
        b = self.case('why-holographic')
        self.assertNotIn('People:', self.check(b)['promptBlock'])
        b.pop('marks'); b.pop('foregroundLinks')
        result = self.check(b)['promptBlock']
        self.assertNotIn('Mark ', result)
        self.assertNotIn('Software controls', result)
        self.assertNotIn('Foreground links', result)
        self.assertNotIn('denied', result)

    def test_source_lineage_and_wrong_treatment_fail(self):
        for change in ({'sha256':'0'*64}, {'path':'discussion/references/previews-second-brain/01.png'}):
            b = self.case('enterprise-photo'); b['reference'].update(change)
            with self.assertRaises(BriefError): self.check(b)
        # A valid original hash does not make that source valid for another ID.
        b = self.case('enterprise-photo')
        b['reference'] = copy.deepcopy(self.case('why-photo')['reference'])
        with self.assertRaisesRegex(BriefError, 'not a selected canonical source'):
            self.check(b)
        b = self.case('why-holographic'); b['part'] = 3
        with self.assertRaisesRegex(BriefError, 'requires Appendix A Part 2'): self.check(b)

    def test_explicit_reference_route_and_denied_termination(self):
        b = self.case('why-holographic')
        b['routes'] = [{'name':'review return','start':'Improve with use','end':'brain','heads':['end'],
                        'confirmedAgainstReference':True,'evidence':'Source-visible return arrow; absent from simplified SVG relationship set'}]
        self.assertEqual(self.check(b)['routes'][0]['heads'], ['end'])
        # Hypothetical mutation tests the compiler branch; not a claim about Why artwork.
        b['routes'][0]['deniedStop'] = 'access boundary'
        with self.assertRaisesRegex(BriefError, 'X, not an arrowhead'): self.check(b)
        b['routes'][0]['heads'] = []
        result = self.check(b)
        self.assertIn('stops at a solid X before access boundary', result['promptBlock'])
        self.assertIs(result['routes'][0]['denied'], True)
        self.assertEqual(result['routes'][0]['deniedStop'], 'access boundary')


if __name__ == '__main__':
    unittest.main(argv=[sys.argv[0], *REST], verbosity=2)
