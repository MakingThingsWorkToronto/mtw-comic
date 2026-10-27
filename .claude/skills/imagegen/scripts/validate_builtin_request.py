"""Offline preflight for built-in image_gen: validates exact ordered file inputs."""
from pathlib import Path
import argparse,hashlib,json,importlib.util,os,re
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from completion_contract import validate_registration_contract, validate_producer_steps

MAX_REFERENCES=5
MAX_PROMPT_CHARACTERS=32000
def validate_registered_handoff(handoff,repo):
    """One completed-art handoff check; producer receipts and retained catalog bytes are authority."""
    root=Path(repo).resolve(strict=True)
    library=(root/'wiki/image-library').resolve(strict=True)
    if handoff.get('stage')!='registered' or handoff.get('humanApproval') is not False:
        raise ValueError('Completed image handoff requires registered stage and separate human approval')
    images=handoff.get('images')
    if not isinstance(images,list) or not images:raise ValueError('Registered image entries required')
    catalog=json.loads((library/'manifest.json').read_text(encoding='utf-8'))
    records={row['id']:row for row in catalog['records']}
    checked=[];seen=set()
    for row in images:
        if not isinstance(row,dict):raise ValueError('Image handoff entry required')
        contract=validate_registration_contract(row.get('registrationContract'),root)
        for name in ('path','recordId','style','version','sha256'):
            if not isinstance(row.get(name),str) or not row[name].strip():raise ValueError('Image handoff requires '+name)
        path=(root/row['path']).resolve(strict=True)
        if not path.is_relative_to(library/'assets') or path in seen:raise ValueError('Distinct canonical image assets required')
        seen.add(path)
        if (contract['canonicalDestination']!=row['path'] or
            any(contract[key]!=row[key] for key in ('recordId','style','version'))):
            raise ValueError('Image handoff differs from its generation registration contract')
        treatment=records.get(row['recordId'],{}).get('treatments',{}).get(row['style'])
        if not treatment:raise ValueError('Image handoff record/style is not registered')
        registered=(library/treatment['path']).resolve(strict=True)
        if row['version'] not in path.parts and not path.stem.endswith('-'+row['version']):
            raise ValueError('Image handoff version must identify its retained versioned path')
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        if registered!=path or treatment.get('sha256')!=digest or row['sha256']!=digest:
            raise ValueError('Image handoff differs from retained catalog bytes')
        registration=row.get('registration',{})
        receipt=(root/registration.get('receiptPath','')).resolve(strict=True)
        if not receipt.is_file():raise ValueError('Actual producer receipt required')
        data=receipt.read_bytes()
        if registration.get('receiptSha256')!=hashlib.sha256(data).hexdigest():raise ValueError('Stale producer receipt hash')
        result=json.loads(data.decode('utf-8'))
        if result.get('registrar')!=contract['registrar']:
            raise ValueError('Producer handoff must name the contracted serialized registrar')
        validate_producer_steps(result,root,library,path,digest)
        checked.append({'path':path.relative_to(root).as_posix(),'recordId':row['recordId'],'style':row['style'],
                        'version':row['version'],'sha256':digest,'catalogStatus':treatment.get('status'),
                        'registration':registration,'registrar':contract['registrar']})
    return {'stage':'registered','images':checked,'humanApproval':False,'visualQuality':'not established by registration'}

def validate(request,roles,repo=None):
    prompt=request.get('prompt')
    if not isinstance(prompt,str) or not prompt.strip():raise ValueError('Nonempty prompt required')
    prompt.encode('utf-8',errors='strict')
    if len(prompt)>MAX_PROMPT_CHARACTERS:raise ValueError('Built-in prompt exceeds 32000 characters; compact duplicate metadata without dropping source/cast/box requirements')
    paths=request.get('referenced_image_paths',[])
    if not isinstance(paths,list) or len(paths)>MAX_REFERENCES:raise ValueError('Built-in accepts at most 5 reference paths')
    if request.get('num_last_images_to_include') is not None and paths:raise ValueError('Use paths or conversation images, never both')
    inputs=roles.get('inputs') if isinstance(roles,dict) else roles
    if not isinstance(inputs,list) or len(inputs)!=len(paths):raise ValueError('One ordered role/hash per actual reference required')
    seen=set();rows=[]
    for path,row in zip(paths,inputs):
        if not isinstance(path,str) or not isinstance(row,dict):raise ValueError('File reference required')
        p=Path(path).resolve(strict=True)
        if not p.is_file() or p in seen:raise ValueError('Distinct existing reference files required')
        seen.add(p)
        if Path(row.get('path','')).resolve()!=p:raise ValueError('Input role order/path mismatch')
        if not isinstance(row.get('role'),str) or not row['role'].strip():raise ValueError('Explicit reference purpose required')
        reference_bytes=p.read_bytes()
        digest=hashlib.sha256(reference_bytes).hexdigest()
        if row.get('sha256')!=digest:raise ValueError('Stale reference hash')
        try:
            with Image.open(BytesIO(reference_bytes)) as image:
                if image.format not in {'PNG','JPEG','WEBP','GIF','AVIF'}:
                    raise ValueError('Provider reference must be a supported raster image')
                image.verify()
            with Image.open(BytesIO(reference_bytes)) as image:
                image.load()
        except (OSError, UnidentifiedImageError, SyntaxError, ValueError) as error:
            raise ValueError(f'Provider reference must contain valid raster image bytes: {p.name}') from error
        rows.append({'path':str(p),'role':row['role'],'sha256':digest})
    comic = roles.get('comicCast') if isinstance(roles,dict) else None
    scoped = (request.get('scope') == 'mtw-comic' or (isinstance(roles,dict) and roles.get('scope') == 'mtw-comic')
              or re.search(r'\b(?:comic b|mtw comic)\b',prompt,re.I)
              or any('/wiki/image-library/assets/scenes/comic-b/models/' in str(path).replace('\\','/').lower() for path in paths))
    annotated = any(row.get('castBinding') or row.get('castMembers') for row in inputs)
    mtw_root=Path(repo or os.environ.get('MTW_REPO') or Path(__file__).resolve().parents[4]).resolve()
    mtw=(scoped or annotated or comic is not None or
         (isinstance(roles,dict) and ('registrationContract' in roles or str(roles.get('scope','')).startswith('mtw'))) or
         str(request.get('scope','')).startswith('mtw') or
         (repo is not None and (mtw_root/'wiki/image-library').is_dir()) or
         any('/wiki/image-library/' in str(path).replace('\\','/').lower() for path in paths))
    contract=None
    if mtw:
        contract=validate_registration_contract(roles.get('registrationContract') if isinstance(roles,dict) else None,mtw_root,require_absent=True)
    if scoped or annotated or comic is not None:
        if not isinstance(comic,dict) or not isinstance(comic.get('characters'),list):
            raise ValueError('MTW comic requests require exact comicCast.characters bindings')
        root = Path(repo or os.environ.get('MTW_REPO') or Path(__file__).resolve().parents[4]).resolve()
        helper = root / '.codex/skills/mtw-comic-story/scripts/art/cast_authority.py'
        if not helper.is_file():
            helper = Path(__file__).resolve().parents[2] / 'mtw-comic-story/scripts/art/cast_authority.py'
        spec = importlib.util.spec_from_file_location('mtw_cast_authority', helper)
        authority = importlib.util.module_from_spec(spec);spec.loader.exec_module(authority)
        authority.validate_inputs(root,comic['characters'],inputs,lambda path:Path(path).resolve())
        # Every contract field belongs to the exact submitted prompt provenance.
        rows = [{**row,**checked} for row,checked in zip(inputs,rows)]
    return {'referenceCount':len(rows),'maximumReferences':MAX_REFERENCES,'promptCharacters':len(prompt),'maximumPromptCharacters':MAX_PROMPT_CHARACTERS,'inputs':rows,'submittedPromptSha256':hashlib.sha256(prompt.encode('utf-8')).hexdigest(),'registrationContract':contract,'providerRequestPerformed':False}

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('request',nargs='?');a.add_argument('roles',nargs='?');a.add_argument('--repo');a.add_argument('--handoff');args=a.parse_args()
    if args.handoff:
        if not args.repo or args.request or args.roles:a.error('--handoff requires --repo and no provider-request arguments')
        result=validate_registered_handoff(json.loads(Path(args.handoff).read_text(encoding='utf-8')),args.repo)
    else:
        if not args.request or not args.roles:a.error('request and roles required')
        result=validate(json.loads(Path(args.request).read_text(encoding='utf-8')),json.loads(Path(args.roles).read_text(encoding='utf-8')),args.repo or Path(__file__).resolve().parents[4])
    print(json.dumps(result,ensure_ascii=False,indent=2))
