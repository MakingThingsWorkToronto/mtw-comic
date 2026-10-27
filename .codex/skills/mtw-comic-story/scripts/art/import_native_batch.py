"""Validate and import a bounded native Comic B packet with one catalog registration.

python import_native_batch.py --imports imports.json --receipt-dir OUTSIDE [--check]
No generation, encoders, browser, numeric scoring or changes to single-item commands.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import types
import comic_art as art


def load_helper():
    spec = importlib.util.spec_from_file_location('comic_batch_library', art.HELPER)
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    return helper


def raw_json(value):
    return (json.dumps(value, indent=2) + '\n').encode('utf-8')


def preflight(entries):
    """Read everything and reject invalid/stale inputs before creating any library file."""
    if not isinstance(entries, list) or not entries:
        raise SystemExit('imports must be a nonempty array')
    catalog_path = art.LIB / 'manifest.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    helper = load_helper()
    helper.indexed_records(catalog)
    manifest_hash = art.sha(catalog_path)
    planned = []; seen = set(); selected_ids = set(); watched = {}
    # Match external aliases of existing references by exact bytes; do not duplicate art.
    canonical = {}
    for record in catalog['records']:
        for treatment in record.get('treatments', {}).values():
            if treatment.get('sha256') and treatment.get('path'):
                canonical[treatment['sha256']] = art.LIB / treatment['path']
    def watch(path):
        path = Path(path).resolve(); watched[path] = art.sha(path); return path
    for entry in entries:
        pid = entry.get('id'); version = entry.get('version')
        if not isinstance(pid, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*', pid):
            raise SystemExit('Invalid page id')
        if type(version) is not int or version < 1 or (pid, version) in seen:
            raise SystemExit(f'Duplicate/invalid artwork version: {pid}/{version}')
        if type(entry.get('selected')) is not bool:
            raise SystemExit(f'{pid}: selected must be boolean')
        seen.add((pid, version))
        if entry['selected']:
            if pid in selected_ids: raise SystemExit(f'Multiple selected versions: {pid}')
            selected_ids.add(pid)
        args = types.SimpleNamespace(brief=entry['brief'], source=entry['master'], prompt_file=entry['prompt'],
                                     inputs_file=entry['inputs'], generation_record=entry['generation'], retrace=None)
        art.ARGS = args
        brief = art.brief(pid)
        src, prompt, inputs, generation, digest = art.validate_native_import(args)
        for key in ('brief', 'master', 'prompt', 'inputs', 'generation'): watch(entry[key])
        for ref in inputs: watch(art.absp(ref['path']))
        story = watch(art.story_source(pid))
        expected_story = brief.get('storySourceSha256') or generation.get('storySha256')
        if expected_story and expected_story != watched[story]: raise SystemExit(f'{pid}: stale story brief/generation')
        if generation.get('promptSha256') and generation['promptSha256'] != hashlib.sha256(prompt).hexdigest():
            raise SystemExit(f'{pid}: submitted prompt hash mismatch')
        out = art.raster_dir(brief) / f'{pid}-v{version}.png'; rd = art.rec_dir(pid, 'comic-ink', version)
        if out.exists() or rd.exists(): raise SystemExit(f'{pid} v{version}: version exists; use a new version')
        review = None; review_raw = None; review_dir = None
        if entry['selected']:
            review_path = watch(entry['review']); review = json.loads(review_path.read_text(encoding='utf-8'))
            errors = art.content_review_errors_for(pid, src, story, review, brief)
            if errors: raise SystemExit(f'{pid}: ' + '; '.join(errors))
            for ref in brief['visualInventory']['references']: watch(art.absp(ref['path']))
            review_raw = (json.dumps(review, indent=2, sort_keys=True) + '\n').encode('utf-8')
            review_dir = art.rec_dir(pid, 'content-review', f'{version}-{hashlib.sha256(review_raw).hexdigest()[:12]}')
            if review_dir.exists(): raise SystemExit(f'{pid}: content review record already exists')
        extras = {}
        for key in ('geometry', 'originalReview', 'layoutGuide'):
            if entry.get(key): extras[key] = watch(entry[key])
        if 'geometry' in extras:
            geometry = json.loads(extras['geometry'].read_text(encoding='utf-8'))
            if geometry.get('masterSha256') and geometry['masterSha256'] != digest: raise SystemExit(f'{pid}: geometry belongs to another master')
        canonical[digest] = out
        planned.append(dict(entry=entry,args=args,brief=brief,src=src,prompt=prompt,inputs=inputs,generation=generation,
                            digest=digest,out=out,rd=rd,review=review,review_raw=review_raw,review_dir=review_dir,extras=extras))
    # Every external guide/reference is kept, with original ordered roles untouched and a separate canonical map.
    guides = {}
    for item in planned:
        refs = list(item['inputs'])
        if 'layoutGuide' in item['extras']:
            p = item['extras']['layoutGuide']; refs.append({'path':str(p),'sha256':watched[p],'role':'layout guide'})
        for ref in refs:
            digest = ref['sha256']; src = art.absp(ref['path']).resolve()
            if digest in canonical: continue
            try: src.relative_to(art.LIB.resolve()); canonical[digest] = src; continue
            except ValueError: pass
            # Only declared exact input files enter this bounded packet, never whole directories.
            out = art.COMIC / 'inputs' / f'{digest}{src.suffix.lower()}'
            if out.exists():
                if art.sha(out) != digest: raise SystemExit(f'Input destination conflict: {out}')
            guides[digest] = dict(src=src,out=out,role=ref['role'])
            canonical[digest] = out
    return dict(items=planned,guides=guides,canonical=canonical,watched=watched,catalog=catalog,
                manifest_hash=manifest_hash,helper=helper)


def apply_batch(plan, receipt_dir):
    """Caller coordinates catalog ownership; shared comic lock spans recheck/copy/register."""
    receipt_dir = Path(receipt_dir).resolve()
    try: receipt_dir.relative_to(art.LIB.resolve()); raise SystemExit('Receipt directory must be outside library')
    except ValueError: pass
    with art.REG_LOCK:
        if art.sha(art.LIB / 'manifest.json') != plan['manifest_hash']: raise SystemExit('Catalog changed after preflight')
        for path, digest in plan['watched'].items():
            if art.sha(path) != digest: raise SystemExit(f'Input changed after preflight: {path}')
        for item in plan['items']:
            if item['out'].exists() or item['rd'].exists() or (item['review_dir'] and item['review_dir'].exists()):
                raise SystemExit('Destination appeared after preflight')
        candidate = copy.deepcopy(plan['catalog'])
        def merge(payload):
            nonlocal candidate
            candidate, _ = plan['helper'].register_records(candidate, {'record':payload})
        for digest, guide in plan['guides'].items():
            dst = guide['out']; dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists(): shutil.copyfile(guide['src'], dst)
            if art.sha(dst) != digest: raise SystemExit('Input copy hash mismatch')
            merge({'id':'comic-b-input-'+digest,'logicalId':None,'collection':'experiments','title':'Comic B input - '+guide['src'].name,
                   'description':'Exact declared generation input; role: '+guide['role'],'service':'Comic B','category':'Comic B',
                   'treatments':{'original':{'path':dst.relative_to(art.LIB).as_posix(),'sha256':digest,'status':'draft',
                                              'sourceName':guide['src'].name,'note':'Preserved generation input; not selected reader artwork or approval.'}}})
        # Rejects first, selected last per page; the maintained merge retains each prior treatment verbatim.
        for item in sorted(plan['items'], key=lambda x:(x['entry']['id'],x['entry']['selected'],x['entry']['version'])):
            e=item['entry'];pid=e['id'];v=e['version'];art.ARGS=item['args'];out=item['out'];rd=item['rd']
            out.parent.mkdir(parents=True, exist_ok=True);rd.mkdir(parents=True, exist_ok=False)
            shutil.copyfile(item['src'],out)
            if art.sha(out) != item['digest']: raise SystemExit('Master copy hash mismatch')
            (rd/'submitted-prompt.txt').write_bytes(item['prompt'])
            (rd/'input-roles.json').write_bytes(raw_json(item['inputs']))
            (rd/'generation.json').write_bytes(raw_json(item['generation']))
            (rd/'brief.json').write_bytes(raw_json(item['brief']))
            for key,name in [('brief','submitted-brief.json'),('inputs','submitted-inputs.json'),('generation','submitted-generation.json')]:
                shutil.copyfile(e[key],rd/name)
            (rd/'canonical-inputs.json').write_bytes(raw_json([{**r,'canonicalPath':plan['canonical'][r['sha256']].relative_to(art.LIB).as_posix()} for r in item['inputs']]))
            for key,path in item['extras'].items():
                if key != 'layoutGuide': shutil.copyfile(path,rd/({'geometry':'geometry.json','originalReview':'original-review.json'}[key]))
            (rd/'optional-provenance.json').write_bytes(raw_json({key:{'source':str(path),'sha256':art.sha(path),**({'canonicalPath':plan['canonical'][art.sha(path)].relative_to(art.LIB).as_posix()} if key=='layoutGuide' else {})} for key,path in item['extras'].items()}))
            record={'master':art.rel(out),'sha256':item['digest'],'promptSha256':hashlib.sha256(item['prompt']).hexdigest(),
                    'source':str(item['src']),'method':'exact native-image batch import','browserStatus':'pending','selectedForReader':e['selected']}
            (rd/'import.json').write_bytes(raw_json(record))
            merge(art.prepare_registration(pid,v,'comic-ink',out,rd,f'Native raster master for Comic B {art.kind(item["brief"])} {pid}; not reviewed.',
                  'Exact built-in image output imported with submitted prompt, model/tool receipt and reference hashes. No approval is inferred.'))
            if item['review']:
                review_dir=item['review_dir'];review_dir.mkdir(parents=True,exist_ok=False)
                (review_dir/'content-review.json').write_bytes(item['review_raw'])
                shutil.copyfile(e['review'],review_dir/'submitted-review.json')
                merge(art.prepare_registration(pid,v,'comic-ink',out,review_dir,f'Comic B {art.kind(item["brief"])} {pid}: master content reviewed; reader verification pending.',
                      'Manual visual content review bound to master and story hashes. Browser crop, lettering and playback checks remain separate.'))
        before={r['id']:r for r in plan['catalog']['records']}
        changed=[r for r in candidate['records'] if before.get(r['id']) != r]
        payload={'expectedManifestSha256':plan['manifest_hash'],'records':changed}
        # No full-library scans above: one maintained register rebuilds/validates the actual catalog.
        receipt_dir.mkdir(parents=True,exist_ok=True);payload_path=receipt_dir/'registration-payload.json';payload_path.write_bytes(raw_json(payload))
        result=subprocess.run([sys.executable,str(art.HELPER),'register','--library',str(art.LIB),'--payload',str(payload_path),'--receipt-dir',str(receipt_dir)],capture_output=True,text=True)
        if result.returncode: raise SystemExit('Batch registration failed; retain staged artifacts and reconcile, do not overwrite: '+result.stdout[-1200:]+result.stderr[-1200:])
        summary={'masters':len(plan['items']),'contentReviews':sum(bool(i['review']) for i in plan['items']),'preservedInputs':len(plan['guides']),
                 'catalogRegisterCalls':1,'payloadRecords':len(changed),'browserStatus':'pending'}
        (receipt_dir/'batch-result.json').write_bytes(raw_json(summary))
        return summary


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--imports',type=Path,required=True);parser.add_argument('--receipt-dir',type=Path,required=True)
    parser.add_argument('--check',action='store_true',help='read-only complete preflight')
    args=parser.parse_args();plan=preflight(json.loads(args.imports.read_text(encoding='utf-8')))
    if args.check: print(json.dumps({'status':'valid','masters':len(plan['items']),'reviews':sum(bool(i['review']) for i in plan['items']),'libraryMutated':False}));return
    print(json.dumps(apply_batch(plan,args.receipt_dir)))


if __name__=='__main__': main()
