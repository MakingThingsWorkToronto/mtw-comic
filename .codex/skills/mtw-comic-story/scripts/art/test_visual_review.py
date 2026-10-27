"""Offline escape cases; synthetic claims are NOT production pixel inspection.

All sources, records and outputs stay in a retained external fixture directory.
Run: python -B test_visual_review.py --repo .
"""
import argparse
import copy
import json
from pathlib import Path
import tempfile
import types
import comic_art as art
from visual_review import AGENT_CHECKS, CONTRACT, VIEW_CHECKS, contract_hash
from test_cast_authority import make_repo


def synthetic_contract(pid, master, story, reference, story_id='fixture', scene_id='synthetic', panel_ids=None):
    """Build explicitly synthetic test data only, shared by native import fixtures."""
    panel_ids = panel_ids or ['box-one']
    refs = [{'id':'style','path':str(reference),'sha256':art.sha(reference),'role':'comic-style'},
            {'id':'cast','path':str(reference),'sha256':art.sha(reference),'role':'cast'}]
    inventory = {'images':[{'id':pid,'panels':[
        {'id':panel,'views':[{'id':'single','digitalAgents':[],'humans':[],'surfaces':[]}]} for panel in panel_ids
    ]}], 'references':refs}
    brief = {'id':pid,'kind':'page','story':story_id,'storySource':str(story),'storySceneId':scene_id,'visualInventory':inventory}
    visual = {'contract':CONTRACT,'briefSha256':contract_hash(brief),'inventorySha256':contract_hash(inventory),
              'references':[{'id':r['id'],'sha256':r['sha256']} for r in refs],
              'images':[{'id':pid,'sha256':art.sha(master),'panels':[
                  {'id':panel,'views':[{'id':'single','checks':{k:True for k in VIEW_CHECKS},
                   'observations':'Synthetic fixture claim only; no actual art inspection.',
                   'digitalAgents':[],'humans':[],'surfaces':[]}]} for panel in panel_ids]}]}
    review = {'pageId':pid,'masterSha256':art.sha(master),'storySha256':art.sha(story),'reviewer':'Synthetic fixture only',
              'observations':'Synthetic test data, not production visual inspection.',
              'checks':{k:True for k in art.CONTENT_CHECKS},'unresolved':[],'visualReview':visual}
    return brief, review


def rebind(brief, review):
    review['visualReview']['briefSha256'] = contract_hash(brief)
    review['visualReview']['inventorySha256'] = contract_hash(brief['visualInventory'])


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--repo',required=True);args=parser.parse_args()
    art.REPO=Path(args.repo).resolve()
    fixture=Path(tempfile.mkdtemp(prefix='mtw-comic-visual-'))
    master=fixture/'master.png';master.write_bytes(b'not real artwork; hash fixture only')
    ref=fixture/'reference.png';ref.write_bytes(b'not real comic reference; hash fixture only')
    story=fixture/'story.ts';story.write_text('export const story = '+json.dumps({'id':'fixture','scenes':[
        {'id':'synthetic','panels':[{'img':'box-one'},{'img':'box-two'}]}]})+';\n',encoding='utf-8')
    brief, review=synthetic_contract('fixture-page',master,story,ref,panel_ids=['box-one','box-two'])
    expected=brief['visualInventory']['images'][0]['panels'][0]['views'][0]
    observed=review['visualReview']['images'][0]['panels'][0]['views'][0]
    expected['digitalAgents']=[{'id':'codex','referenceId':'cast','colourState':'accepted blue'}]
    observed['digitalAgents']=[{**expected['digitalAgents'][0],'checks':{k:True for k in AGENT_CHECKS},
        'observations':'Synthetic agent coverage only; pixels not inspected.'}]
    expected['humans']=[{'id':'matt','referenceId':'cast'}]
    observed['humans']=[{**expected['humans'][0],'solid':True,'observations':'Synthetic solid-human claim only.'}]
    expected['surfaces']=[{'id':'report','kind':'paper','informationSide':'reader-facing-paper','reader':'matt'},
        {'id':'laptop','kind':'device','informationSide':'screen','reader':'matt'},
        {'id':'closed-phone','kind':'device','informationSide':'blank','reader':None}]
    observed['surfaces']=[{'id':s['id'],'kind':s['kind'],'reader':s['reader'],'observedInformationSide':s['informationSide'],
        'checks':{('noReverseSideCopy' if s['kind']=='paper' else 'noBackLidEdgeUI'):True,
                  ('blankSurface' if s['informationSide']=='blank' else 'facesReader'):True},
        'observations':'Synthetic surface observation, no actual pixels inspected.'} for s in expected['surfaces']]
    # A multi-image box must inspect every ordered view, not just its final pose.
    for vid in ['operator-perspective','final-shock']:
        expected_view=copy.deepcopy(expected);expected_view['id']=vid
        observed_view=copy.deepcopy(observed);observed_view['id']=vid
        brief['visualInventory']['images'][0]['panels'][0]['views'].append(expected_view)
        review['visualReview']['images'][0]['panels'][0]['views'].append(observed_view)
    # Synthetic canonical cast lives only in the isolated fixture repo.
    cast_repo = fixture / 'cast-repo'; make_repo(cast_repo)
    art.REPO = cast_repo
    bindings = {who: art.resolve_cast(cast_repo, who) for who in ('codex', 'matt')}
    brief['visualInventory']['references'] = [brief['visualInventory']['references'][0]] + [
        {'id':who,'path':str(cast_repo / binding['path']),'sha256':binding['sha256'],'role':'cast','castBinding':binding}
        for who,binding in bindings.items()]
    for view in brief['visualInventory']['images'][0]['panels'][0]['views']:
        view['digitalAgents'][0]['referenceId']='codex';view['humans'][0]['referenceId']='matt'
    for view in review['visualReview']['images'][0]['panels'][0]['views']:
        view['digitalAgents'][0]['referenceId']='codex';view['humans'][0]['referenceId']='matt'
    review['visualReview']['references'] = [{'id':r['id'],'sha256':r['sha256']} for r in brief['visualInventory']['references']]
    rebind(brief,review)
    def validate(b,r): return art.content_review_errors_for('fixture-page',master,story,r,b)
    assert validate(brief,review)==[],validate(brief,review)
    checks=['complete two-box/three-view synthetic coverage validates hashes and claims only']
    def reject(label, mutate, expected_fragment=None):
        b=copy.deepcopy(brief);r=copy.deepcopy(review);mutate(b,r)
        errors=validate(b,r)
        assert errors,label+' unexpectedly accepted'
        if expected_fragment: assert any(expected_fragment in e for e in errors),(label,errors)
        checks.append(label)
    def rv(r):return r['visualReview']['images'][0]['panels'][0]['views'][0]
    reject('cast reference cannot omit exact canonical binding',lambda b,r:(b['visualInventory']['references'][1].pop('castBinding'),rebind(b,r)),'binding required')
    reject('cast reference cannot substitute different canonical binding',lambda b,r:(b['visualInventory']['references'][1].update(castBinding=bindings['matt']),rebind(b,r)),'another canonical cast')
    def change_canonical(label, file, mutate):
        original=file.read_bytes(); data=json.loads(original); mutate(data); file.write_text(json.dumps(data),encoding='utf-8')
        try:
            errors=validate(brief,review); assert any('Stale' in e for e in errors),(label,errors); checks.append(label)
        finally: file.write_bytes(original)
    change_canonical('canonical signature changed with same image bytes rejects reviewed inventory',cast_repo/'wiki/comics-library/characters.json',lambda d:d['characters'][4].update(signature='changed identity'))
    change_canonical('catalog status changed with same image bytes rejects reviewed inventory',cast_repo/'wiki/image-library/manifest.json',lambda d:d['records'][4]['treatments']['comic-ink'].update(status='rejected'))
    def remap_record(d):
        record=copy.deepcopy(d['records'][4]);record['id']='changed-record-same-file';d['records'].append(record)
    manifest_file=cast_repo/'wiki/image-library/manifest.json';original_manifest=manifest_file.read_bytes();data=json.loads(original_manifest);remap_record(data);manifest_file.write_text(json.dumps(data),encoding='utf-8')
    try: change_canonical('modelRecord changed with same image bytes rejects reviewed inventory',cast_repo/'wiki/comics-library/characters.json',lambda d:d['characters'][4].update(modelRecord='changed-record-same-file'))
    finally: manifest_file.write_bytes(original_manifest)
    reject('legacy boolean-only review cannot opt out',lambda b,r:r.pop('visualReview'),'legacy')
    reject('missing expected inventory cannot opt out',lambda b,r:b.pop('visualInventory'),'inventory')
    reject('missing current contract cannot opt out',lambda b,r:r['visualReview'].pop('contract'),'contract')
    reject('brief page id mismatch rejected',lambda b,r:b.update(id='another-page'),'pageId')
    reject('empty expected panels rejected',lambda b,r:(b['visualInventory']['images'][0].update(panels=[]),rebind(b,r)),'coverage')
    reject('fabricated convenient panel subset rejected even when rehashed',lambda b,r:(b['visualInventory']['images'][0]['panels'].pop(),r['visualReview']['images'][0]['panels'].pop(),rebind(b,r)),'every actual story box')
    reject('invented panel ids rejected even when rehashed',lambda b,r:(b['visualInventory']['images'][0]['panels'][0].update(id='invented'),r['visualReview']['images'][0]['panels'][0].update(id='invented'),rebind(b,r)),'every actual story box')
    reject('missing scene binding rejected',lambda b,r:b.pop('storySceneId'),'storySceneId')
    reject('wrong actual story rejected',lambda b,r:b.update(story='wrong-story'),'another story')
    reject('page cannot opt into a convenient storyPanelId subset',lambda b,r:(b.update(storyPanelId='box-one'),rebind(b,r)),'cannot select')
    reject('malformed expected panels object fails cleanly',lambda b,r:(b['visualInventory']['images'][0].update(panels={'id':'box-one'}),rebind(b,r)),'explicit array')
    reject('malformed expected panels null fails cleanly',lambda b,r:(b['visualInventory']['images'][0].update(panels=None),rebind(b,r)),'explicit array')
    reject('duplicate expected panel rejected',lambda b,r:(b['visualInventory']['images'][0]['panels'].append(copy.deepcopy(b['visualInventory']['images'][0]['panels'][0])),rebind(b,r)),'duplicate')
    reject('missing returned image rejected',lambda b,r:r['visualReview'].update(images=[]),'coverage')
    reject('mismatched returned image hash rejected',lambda b,r:r['visualReview']['images'][0].update(sha256='0'*64),'image hash')
    reject('duplicate returned image rejected',lambda b,r:r['visualReview']['images'].append(copy.deepcopy(r['visualReview']['images'][0])),'duplicate')
    reject('missing observed panel rejected',lambda b,r:r['visualReview']['images'][0]['panels'].pop(),'coverage')
    reject('missing intermediate view rejected',lambda b,r:r['visualReview']['images'][0]['panels'][0]['views'].pop(1),'coverage')
    reject('duplicate observed view rejected',lambda b,r:r['visualReview']['images'][0]['panels'][0]['views'].append(copy.deepcopy(rv(r))),'duplicate')
    reject('generic whole-page notes cannot replace per-view observations',lambda b,r:rv(r).pop('observations'),'observations')
    for check in VIEW_CHECKS:
        reject('style failure '+check+' rejected',lambda b,r,k=check:rv(r)['checks'].update({k:False}),check)
    for check in AGENT_CHECKS:
        reject('agent failed/missing '+check+' rejected',lambda b,r,k=check:rv(r)['digitalAgents'][0]['checks'].pop(k),check)
    reject('agent colour state mismatch rejected',lambda b,r:rv(r)['digitalAgents'][0].update(colourState='wrong red'),'colourState')
    reject('missing eligible digital agent rejected',lambda b,r:rv(r).update(digitalAgents=[]),'coverage')
    reject('digital agent observation missing rejected',lambda b,r:rv(r)['digitalAgents'][0].pop('observations'),'observations')
    reject('non-solid human rejected',lambda b,r:rv(r)['humans'][0].update(solid=False),'solid human')
    reject('missing human coverage rejected',lambda b,r:rv(r).pop('humans'),'explicit array')
    reject('unlisted human stop palm in digital plane rejected',lambda b,r:rv(r)['humans'].append({'id':'matt-stop-palm','referenceId':rv(r)['humans'][0]['referenceId'],'observations':'Actual bare human palm unexpectedly attached to digital gauntlet','solid':True}),'coverage')
    reject('misassigned stop-hand action rejected',lambda b,r:r['checks'].update(storyAction=False),'storyAction')
    reject('wrong paper information side rejected',lambda b,r:rv(r)['surfaces'][0].update(observedInformationSide='back'),'information side')
    reject('wrong device information side rejected',lambda b,r:rv(r)['surfaces'][1].update(observedInformationSide='lid'),'information side')
    reject('UI on back/lid/edge rejected',lambda b,r:rv(r)['surfaces'][1]['checks'].update(noBackLidEdgeUI=False),'noBackLidEdgeUI')
    reject('paper reverse-side copy rejected',lambda b,r:rv(r)['surfaces'][0]['checks'].update(noReverseSideCopy=False),'noReverseSideCopy')
    reject('content not facing actual reader rejected',lambda b,r:rv(r)['surfaces'][0]['checks'].update(facesReader=False),'facesReader')
    reject('wrong actual reader rejected',lambda b,r:rv(r)['surfaces'][0].update(reader='codex'),'reader mismatch')
    reject('blank-back with UI rejected',lambda b,r:rv(r)['surfaces'][2]['checks'].update(blankSurface=False),'blankSurface')
    reject('missing information surface rejected',lambda b,r:rv(r)['surfaces'].pop(),'coverage')
    reject('duplicate information surface rejected',lambda b,r:rv(r)['surfaces'].append(copy.deepcopy(rv(r)['surfaces'][0])),'duplicate')
    reject('invalid expected content side rejected even rehashed',lambda b,r:(b['visualInventory']['images'][0]['panels'][0]['views'][0]['surfaces'][0].update(informationSide='back'),rebind(b,r)),'side invalid')
    reject('reference review coverage omitted rejected',lambda b,r:r['visualReview'].update(references=[]),'coverage')
    reject('reference review hash mismatch rejected',lambda b,r:r['visualReview']['references'][0].update(sha256='0'*64),'reference hash')
    reject('brief hash mismatch rejected',lambda b,r:r['visualReview'].update(briefSha256='0'*64),'expected brief')
    reject('inventory hash mismatch rejected',lambda b,r:r['visualReview'].update(inventorySha256='0'*64),'expected inventory')
    original=ref.read_bytes();ref.write_bytes(b'changed reference');assert validate(brief,review);ref.write_bytes(original)
    checks.append('changed live reference bytes rejected')
    original=story.read_bytes();story.write_bytes(original+b'// changed source\n');assert validate(brief,review);story.write_bytes(original)
    checks.append('changed story bytes rejected')
    original=master.read_bytes();master.write_bytes(original+b' changed');assert validate(brief,review);master.write_bytes(original)
    checks.append('changed master bytes rejected')
    b=copy.deepcopy(brief);r=copy.deepcopy(review);b.update(kind='panel',storyPanelId='box-one')
    b['visualInventory']['images'][0]['panels']=b['visualInventory']['images'][0]['panels'][:1]
    r['visualReview']['images'][0]['panels']=r['visualReview']['images'][0]['panels'][:1];rebind(b,r)
    assert validate(b,r)==[],validate(b,r);checks.append('exact standalone story panel accepted with all authored views')
    b.pop('kind');rebind(b,r);assert validate(b,r)==[];checks.append('default panel kind accepts exact standalone storyPanelId')
    b.pop('storyPanelId');rebind(b,r);assert validate(b,r);checks.append('standalone panel without exact storyPanelId refused')
    b['storyPanelId']='invented-box';rebind(b,r);assert validate(b,r);checks.append('standalone panel with nonexistent storyPanelId refused')
    # Legacy demo has real rendered boxes with no img IDs; exact source index
    # anchors preserve that source and still require the complete page inventory.
    legacy_story=fixture/'legacy-demo.ts';legacy_story.write_text('export const story = '+json.dumps({'id':'demo','scenes':[
        {'id':'p1','panels':[{'alt':'first actual box'},{'alt':'second actual box'}]}]})+';\n',encoding='utf-8')
    lb,lr=synthetic_contract('demo-page',master,legacy_story,ref,story_id='demo',scene_id='p1',panel_ids=['p1:box-0','p1:box-1'])
    assert art.content_review_errors_for('demo-page',master,legacy_story,lr,lb)==[]
    checks.append('retained unnamed demo boxes bind exact scene/index source anchors without source edits')
    # Exercise actual judge and gate/integrate callers without canonical registration/encoding.
    brief_path=fixture/'brief.json';brief_path.write_text(json.dumps([brief]),encoding='utf-8')
    old=(art.ARGS,art.LIB,art.WORK,art.master_path,art.story_source)
    art.ARGS=types.SimpleNamespace(brief=str(brief_path),review_file=str(fixture/'review.json'))
    art.LIB=fixture/'library';art.WORK=fixture/'work'
    art.master_path=lambda pid,v:master;art.story_source=lambda pid:story
    legacy=copy.deepcopy(review);legacy.pop('visualReview')
    Path(art.ARGS.review_file).write_text(json.dumps(legacy),encoding='utf-8')
    cache=art.WORK/'fixture-page/content-review-v1.json';cache.parent.mkdir(parents=True);cache.write_text(json.dumps(legacy),encoding='utf-8')
    for fn,label in [(lambda:art.stage_judge('fixture-page',1),'actual stage_judge refuses legacy omission'),
                     (lambda:art.stage_integrate('fixture-page',1),'actual integrate refuses legacy omission before derivatives')]:
        try:fn()
        except SystemExit:checks.append(label)
        else:raise AssertionError(label)
    assert art.gate('fixture-page',1);checks.append('actual gate refuses cached legacy record')
    assert json.loads(cache.read_text())==legacy;checks.append('historical record remains readable and unmodified')
    art.ARGS,art.LIB,art.WORK,art.master_path,art.story_source=old
    result={'status':'pass','checks':checks,'fixture':str(fixture),
        'limitations':'Offline synthetic coverage/hash/caller checks only. No pixel inspection, production media, browser/build, model API, real catalog or Matt approval. Actual next eligible output inspection remains awaiting-next-output.'}
    (fixture/'test-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))


if __name__=='__main__':main()
