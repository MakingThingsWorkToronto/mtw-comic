"""Comic B art import, review and delivery. Current workflow:

  import --panel ID --brief FILE --version N --source PNG --prompt-file TXT --inputs-file JSON --generation-record JSON
  judge --panel ID --brief FILE --version N --review-file JSON
  integrate --panel ID --brief FILE --version N

Native output is preserved and registered, then a manual review binds the master and current story hashes to actual
cast, action, key-subject, accepted-style and sharpness observations. Integration emits the reader's configured raster
width variants for browser review. Browser crop/lettering checks remain required for delivery, separately from master
review. The retired numeric 95 gate is not used. Older optional generation/trace/score commands remain for provenance
and explicit analysis; they are not a calibration queue. See references/art-pipeline.md.
"""
import argparse, colorsys, gzip, hashlib, json, math, os, re, shutil, subprocess, sys, tempfile, threading, time, traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from visual_review import visual_review_errors
from cast_authority import resolve_cast, brief_bindings, cast_reference_errors, validate_inputs

HERE = Path(__file__).resolve().parent                     # <repo>/.<edition>/skills/mtw-comic-story/scripts/art
EDITION = HERE.parents[3]                                   # <repo>/.claude or <repo>/.codex
REPO = Path(os.environ.get('MTW_REPO') or HERE.parents[4])
LIB = REPO / 'wiki/image-library'
REFS = HERE.parents[1] / 'assets/reference-analysis/reference-analysis.md'
REF_MEASURES = HERE.parents[1] / 'assets/reference-analysis/reference-measurements.json'
REF_PAGES = REPO / 'wiki/image-library/assets/originals/comic-references'
COMIC = LIB / 'assets/scenes/comic-b'
SITE = REPO / 'site/public/comic'
NODE_MODULES = REPO / 'site/node_modules'
HELPER = EDITION / 'skills/mtw-raster-alternatives/scripts/portable-gallery/maintain_library.py'
CONFIG = HERE / 'trace.config.json'
LOCK = HERE / 'versions.lock.json'
FRAGMENTS = HERE / 'prompt-fragments.default.md'
ART_LOG = REPO / 'wiki/image-library/records/comic-b-art-log-20260928-20261002/art-log.md'
LOCAL = Path(os.environ.get('LOCALAPPDATA') or tempfile.gettempdir())
VENV = Path(os.environ.get('COMIC_ART_VENV') or LOCAL / 'mtw-comic-art' / 'venv')
WORK = Path(os.environ.get('COMIC_ART_WORK') or LOCAL / 'mtw-comic-art' / 'work')
SIZES = {'16:10': (2400, 1500), '16:9': (1672, 941), '21:9': (1904, 816), '1:1': (1254, 1254), '3:4': (1086, 1448), '9:16': (941, 1672), '4:3': (1448, 1086)}
ARGS = None


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def hexrgb(h): return [int(h[i:i + 2], 16) for i in (1, 3, 5)]
def rel(p):
    try: return Path(p).resolve().relative_to(REPO.resolve()).as_posix()
    except ValueError: return str(p)
def absp(p): return Path(p) if Path(p).is_absolute() else REPO / p
def hx(rgb): return '#%02x%02x%02x' % tuple(rgb)


class _RegLock:
    """Thread lock plus a lock file shared by every comic_art.py process: the library helper refuses to register while
    any file it tracks is mid-write or unregistered, and two registrations must never run at once."""
    def __init__(self): self.t = threading.Lock()
    def __enter__(self):
        self.t.acquire(); f = WORK / '_register.lock'; f.parent.mkdir(parents=True, exist_ok=True); t0 = time.time()
        while True:
            try: self.fd = os.open(f, os.O_CREAT | os.O_EXCL | os.O_WRONLY); os.write(self.fd, str(os.getpid()).encode()); return self
            except FileExistsError:
                if time.time() - t0 > 900: raise SystemExit(f'{f} held for 15 minutes; check the PID inside and remove it if that process is gone')
                time.sleep(2)
    def __exit__(self, *a):
        os.close(self.fd); os.remove(WORK / '_register.lock'); self.t.release()


REG_LOCK = _RegLock()


# ---------- inputs: brief, analysis, config ----------
def brief_rows():
    return json.loads(Path(ARGS.brief if ARGS and ARGS.brief else REPO / 'wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/art-brief.json').read_text(encoding='utf-8'))


def brief(pid):
    for row in brief_rows():
        if row['id'] == pid: return row
    raise SystemExit(f'No panel {pid} in the brief')


def kind(b): return b.get('kind', 'panel')
def raster_dir(b): return COMIC / {'model': 'models', 'calibration': 'calibration', 'page': 'pages'}.get(kind(b), 'panels/raster')
def vector_dir(b): return raster_dir(b) / 'svg' if kind(b) != 'panel' else COMIC / 'panels/svg'
def site_path(b): return SITE / {'model': '_models', 'calibration': '_calibration'}.get(kind(b), b.get('story', '')) / f'{b["id"]}.svg'
def work(pid): d = WORK / pid; d.mkdir(parents=True, exist_ok=True); return d
def raster_mode(): return json.loads(CONFIG.read_text())['deliver'] == 'raster'
def print_on(): return bool(json.loads(CONFIG.read_text())['raster'].get('print', {}).get('enabled'))
def master_name(pid, v):
    # An explicit, preserved print derivative may be selected; raw native delivery never requires generating one.
    printed = f'{pid}-v{v}-print.png'
    return printed if print_on() and (raster_dir(brief(pid)) / printed).is_file() else f'{pid}-v{v}.png'

def art_stem(pid, v): return master_name(pid, v) if raster_mode() and not (ARGS and ARGS.retrace) else svg_stem(pid, v)
def svg_stem(pid, v): return f'{pid}-v{v}' + (f'-t{ARGS.retrace}' if ARGS and ARGS.retrace else '')  # -tK: raster vN re-traced with a later config
def rec_dir(pid, treatment, v): return LIB / 'records' / f'comic-b-{pid}' / treatment / f'v{v}'


def analysis():
    """Palette, villain cues, halftone pitch and prompt fragments from the skill's assets/reference-analysis/reference-analysis.md."""
    if not REFS.exists(): return {}
    t = REFS.read_text(encoding='utf-8'); out = {'palette': {}, 'villains': {}}
    rows = {'Ink black': ['ink', 'ground'], 'Cyan': ['teal', 'tealLight'], 'Deep blue': ['deep1', 'deep2'],
            'Flesh': ['skinLight', 'skinMid', 'skinDark'], 'Yellow': ['ochre'], 'Red': ['red'], 'Paper': ['paper']}
    art = re.search(r'### \(a\) SVG art(.*?)\n### ', t, re.S)
    for line in (art.group(1) if art else t).splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')] if line.strip().startswith('|') else []
        if len(cells) < 2: continue
        for label, names in rows.items():
            if cells[0].startswith(label):
                for n, h in zip(names, re.findall(r'#[0-9a-fA-F]{6}', cells[1])): out['palette'][n] = hexrgb(h)
        v = re.sub(r'\W', '', cells[0]).lower()
        if v in ('slop', 'hallucination', 'snowball', 'blindspot', 'shadow', 'shelf', 'amnesia', 'rogueagent', 'overhead'):
            out['villains']['rogue' if v == 'rogueagent' else v] = [hexrgb(h) for h in re.findall(r'#[0-9a-fA-F]{6}', cells[1])]
    m = re.search(r'Pitch \W*([\d.]+)[–-]([\d.]+)% of panel width', t)
    if m: out['pitchPct'] = (float(m.group(1)) + float(m.group(2))) / 2
    m = re.search(r'dot diameter ([\d.]+)[–-]([\d.]+)% of pitch', t)
    if m: out['dotPct'] = (float(m.group(1)) + float(m.group(2))) / 2
    sec = re.search(r'### \(f\) Prompt fragments.*?\n(.*?)\n## ', t, re.S)
    if sec:
        for name, q in zip(['style', 'night', 'ink', 'clear', 'svg'], re.findall(r'"([^"]+)"', sec.group(1))):
            out.setdefault('fragments', {})[name] = q
    return out


def cfg(pid=None):
    """Config palette, then analysis colours not dropped or pinned, then every villain's cue colours for this panel."""
    c = json.loads(CONFIG.read_text(encoding='utf-8')); a = analysis()
    pal = {k: v for k, v in c['palette'].items() if not k.startswith('_')}
    keep = set(c.get('pinnedPalette', [])) | set(c.get('dropAnalysis', []))
    pal.update({k: v for k, v in a.get('palette', {}).items() if k not in keep})
    if pid:
        for vid in brief(pid).get('cast', []):
            for i, rgb in enumerate(a.get('villains', {}).get(vid, [])[:2]): pal[f'villain{i + 1}-{vid}'] = rgb
    c['palette'] = pal
    ht = c['halftone']; ht['pitchPctOfWidth'] = a.get('pitchPct', ht['pitchPctOfWidth']); ht['dotPctOfPitch'] = a.get('dotPct', ht['dotPctOfPitch'])
    fields = {}
    for k, v in ht['fields'].items():  # 'villain1' means the first cue colour of every villain in the panel
        for name in ([n for n in pal if n.startswith(k + '-')] if k.startswith('villain') else [k]):
            if name in pal and v['dot'] in pal: fields[name] = v
    ht['fields'] = fields
    L = c['layers']
    L['fig']['colours'] = [n for n in pal if n in L['fig']['colours'] or n.split('-')[0] in L['fig']['colours']]
    return c


def frozen(pid):
    """The config the trace stage used, so a config edit mid-run cannot mix settings between stages of one panel."""
    f = WORK / pid / 'effective-config.json'
    if not f.exists(): raise SystemExit(f'{pid}: run the trace stage first')
    return json.loads(f.read_text(encoding='utf-8'))


# ---------- tools ----------
def versions(strict=True):
    lock = json.loads(LOCK.read_text(encoding='utf-8'))
    from importlib.metadata import version
    found = {'python': '.'.join(map(str, sys.version_info[:3])), 'pillow': version('pillow'), 'vtracer': version('vtracer'),
             'potracer': version('potracer'), 'numpy': version('numpy'),
             'codex-cli': _run(['codex', '--version']).split()[-1], 'node': _run(['node', '-v']).lstrip('v'),
             'svgo': json.loads((NODE_MODULES / 'svgo/package.json').read_text())['version'],
             'sharp': json.loads((NODE_MODULES / 'sharp/package.json').read_text())['version']}
    drift = {k: (lock.get(k), v) for k, v in found.items() if lock.get(k) != v}
    if drift and strict and not ARGS.allow_version_drift:
        raise SystemExit(f'Tool versions differ from versions.lock.json: {drift}. Run setup, or pass --allow-version-drift (recorded).')
    return found, drift


def _run(cmd): return subprocess.run(cmd, capture_output=True, text=True, shell=(os.name == 'nt')).stdout.strip()
def venv_python(): return VENV / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def setup():
    lock = json.loads(LOCK.read_text(encoding='utf-8'))
    if not venv_python().exists():
        print('Creating', VENV, '(Python', lock['python'], ')'); subprocess.run([sys.executable, '-m', 'venv', str(VENV)], check=True)
    subprocess.run([str(venv_python()), '-m', 'pip', 'install', '-q', *(f'{p}=={lock[p]}' for p in ('vtracer', 'pillow', 'potracer', 'numpy'))], check=True)
    print(subprocess.run([str(venv_python()), str(Path(__file__)), 'check'], text=True).returncode == 0 and 'setup ok')


# ---------- stage 1: prompt ----------
def fragments():
    """The defaults file's ```fragment:<name>``` blocks, then any analyst fragment (reference-analysis.md (f)) whose name
    the defaults file does not define."""
    out = {}
    if FRAGMENTS.exists():
        for name, body in re.findall(r'```fragment:([\w-]+)\s*\n(.*?)```', FRAGMENTS.read_text(encoding='utf-8'), re.S): out[name] = body.strip()
    out.update({k: v for k, v in analysis().get('fragments', {}).items() if k not in out})
    return out


SURFACE_CAMERA = ('front', 'back', 'side')


def box_defect_lines(b, f):
    """Matt's recurring box defects (2026-10-11): the shared `box-defects` fragment plus one explicit line per surface,
    digital agent and human in the brief's visualInventory. A surface must say which way the camera sees it, and a
    content surface must say what it shows, or no prompt is written. The review checks the same D1-D15 IDs."""
    block = f.get('box-defects')
    if not block: raise SystemExit('prompt-fragments.default.md lacks fragment:box-defects')
    lines = ['Box defects (checked after generation with these IDs): ' + block]
    # Both full-scene and fast box prompts must retain authored lettering space.
    # D3 alone only says to leave declared areas clear; it never names those areas.
    if b.get('clearZones'):
        zones = b['clearZones']
        if not isinstance(zones, list) or any(not isinstance(z, str) or not z.strip() for z in zones):
            raise SystemExit('clearZones must name nonempty lettering areas')
        lines.append('Balloon clear zones: ' + '; '.join(zones) + '. Keep these areas empty of faces, acting hands and evidence; draw no lettering.')
    speakers = b.get('speakers') or {}
    if not isinstance(speakers, dict): raise SystemExit('speakers must map each cast ID to full-source mouth and face bounds')
    for speaker, anchor in speakers.items():
        if not isinstance(anchor, dict): raise SystemExit(f'speakers.{speaker}: expected mouth and face bounds')
        for key, size in (('mouth', 2), ('face', 4)):
            bounds = anchor.get(key)
            if (not isinstance(bounds, (list, tuple)) or len(bounds) != size or
                    any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= 1 for v in bounds)):
                raise SystemExit(f'speakers.{speaker}.{key}: use {size} finite normalized full-source coordinates')
        x, y, width, height = anchor['face']
        if width <= 0 or height <= 0 or x + width > 1 or y + height > 1:
            raise SystemExit(f'speakers.{speaker}.face: rectangle must be nonempty and inside the full source')
        lines.append(f'Speaker {speaker}: planned mouth {json.dumps(anchor["mouth"])} and protected face {json.dumps(anchor["face"])} '
                     'in normalized full-source coordinates. Keep this identity at its authored position, face clear of lettering; verify and rebind these bounds to the actual returned pixels before integration.')
    inv = b.get('visualInventory')
    if inv is None: return lines
    text = lambda v: isinstance(v, str) and bool(v.strip())
    for image in inv.get('images') or []:
        for panel in image.get('panels') or []:
            for view in panel.get('views') or []:
                where = f'Box {panel.get("id")} view {view.get("id")}'
                for s in view.get('surfaces') or []:
                    obj = s.get('object') or s.get('kind') or 'surface'; device = s.get('kind') == 'device'
                    face = 'screen' if device else 'printed face'; back = 'rear casing' if device else 'back'
                    camera = s.get('camera'); label = f'{where} surface {s.get("id")}'
                    if camera not in SURFACE_CAMERA: raise SystemExit(f'{label}: set camera to front, back or side (which face of the {obj} the camera sees) before generating')
                    if s.get('informationSide') == 'blank':
                        lines.append(f'{label}: the {obj} shows the camera only its plain {back}; no {"UI" if device else "print"} on any face we see.')
                        continue
                    if camera == 'back': raise SystemExit(f'{label}: the camera sees the back, so the {face} is unseen; declare informationSide blank and add a separate front view for the evidence')
                    if not text(s.get('shows')): raise SystemExit(f'{label}: state what the {obj} {face} shows (`shows`) before generating; a story surface is never blank')
                    if not text(s.get('reader')): raise SystemExit(f'{label}: name the reader the {face} faces')
                    lines.append(f'{label}: the {obj} {face} faces {s["reader"]} (toward their eyes; its {back} faces away from them and stays plain); '
                                 f'the camera sees it from the {camera}; it shows: {s["shows"].strip()} Draw that content as clear interface or graphic shapes on that face.')
                for a in view.get('digitalAgents') or []:
                    lines.append(f'{where}: {a.get("id")} is a digital agent in colour state {a.get("colourState")}, drawn as the agreed comic projection (accepted design, restrained partial translucency, crisp projected ink edge); not solid, not glass, glow or 3D.')
                for h in view.get('humans') or []:
                    lines.append(f'{where}: {h.get("id")} is a solid cartoon human, never translucent.')
    return lines


def stage_box_prompt(pid, v):
    """Print the box-defect block and this brief's surface/agent lines for an interactive or fix prompt (no files written)."""
    b = brief(pid)
    for binding in current_cast(b):
        print('Studio cast identity: ' + json.dumps(binding, ensure_ascii=False))
    print('\n'.join(box_defect_lines(b, fragments())))



def latest(folder, stem):
    vs = [p for p in folder.glob(f'{stem}-v*.png') if re.fullmatch(rf'{re.escape(stem)}-v\d+\.png', p.name)]
    return max(vs, key=lambda p: int(re.search(r'-v(\d+)\.png$', p.name).group(1))) if vs else None


def ref_png(name, crop=None):
    """A reference page (or a crop of one panel, [x, y, w, h] as fractions) as PNG in the work folder. Codex's image
    tool rejects some JPEG/WebP files. The copyrighted page never enters the repo; records list its path and hash."""
    from PIL import Image
    src = REF_PAGES / name
    tag = ('' if not crop else '-crop-' + '-'.join(f'{x:.3f}' for x in crop)) + '-w1024'  # small scans upscaled so Codex sees the line work
    dst = WORK / '_refs' / (Path(name).stem + tag + '.png'); dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        im = Image.open(src).convert('RGB')
        if crop:
            W, H = im.size; x, y, w, h = crop
            im = im.crop((round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)))
            if im.width < 768: im = im.resize((768, round(768 * im.height / im.width)), Image.LANCZOS)
        if im.width < 1024: im = im.resize((1024, round(1024 * im.height / im.width)), Image.LANCZOS)
        im.save(dst)
    return {'path': str(dst), 'source': rel(src) + (f' crop {crop}' if crop else ''), 'sourceSha256': sha(src)}


def box_ref_sheet(b):
    """One composition sheet for a page: each box's reference panel crop, in box order, numbered in the corner (numbers
    are guides; the prompt says so). Kept in the work folder: it is made from copyrighted pages."""
    from PIL import Image, ImageDraw, ImageFont
    crops = [Image.open(ref_png(x['ref'], x['crop'])['path']).convert('RGB') for x in b['boxRefs']]
    h = 360; row = [im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS) for im in crops]
    W = sum(im.width for im in row) + 12 * (len(row) + 1); sheet = Image.new('RGB', (W, h + 24), (255, 255, 255)); x = 12
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('arial.ttf', 28)
    except OSError: font = ImageFont.load_default()
    for i, im in enumerate(row, 1):
        sheet.paste(im, (x, 12)); d.rectangle([x, 12, x + 44, 50], fill=(255, 255, 0)); d.text((x + 8, 14), str(i), fill=(0, 0, 0), font=font); x += im.width + 12
    out = WORK / '_refs' / f'{b["id"]}-box-refs.png'; sheet.save(out)
    srcs = sorted({x['ref'] for x in b['boxRefs']})
    return {'path': str(out), 'source': 'panel crops of ' + ', '.join(srcs) + ': ' + '; '.join(f'box {x["box"]} = panel {x["panel"]} crop {x["crop"]}' for x in b['boxRefs']),
            'sourceSha256': ','.join(sha(REF_PAGES / s_) for s_ in srcs)}


def style_inputs(b, c):
    """Inputs that set style and composition, in priority order:
    1. 'after': the reference page the brief names for this image's composition, plus a crop of that panel;
    2. style anchors: our calibration remakes chosen in the config (not for the calibration pages themselves);
    3. the reference pages for this image ('refs', else the config's style set for 'styleSet')."""
    out = []; after = b.get('after')
    if b.get('boxRefs'):
        out.append({**box_ref_sheet(b), 'role': 'COMPOSITION SHEET: the reference panel each box must copy, in box order (the yellow numbers are box numbers, guides only): copy each panel\'s camera, framing, poses, gestures, placement, spotted blacks and motion with our characters, our setting and black and teal'})
    if after:
        crop = after.get('crop')
        if crop: out.append({**ref_png(after['ref'], crop), 'role': f'COMPOSITION REFERENCE (panel {after.get("panel", "")} of a 1980s comic page, cropped): copy this panel closely: camera angle, framing, poses, gestures, placement and scale of figures and shapes, the spotted blacks and hatching; replace its characters with ours and its colours with black and teal'})
        out.append({**ref_png(after['ref']), 'role': ('THE PAGE TO COPY (a 1980s comic page): our page transposes its layout into landscape (see the layout template); box n copies its panel n: camera, framing, poses, placement, spotted blacks and hatching; copy its drawing and printing closely, and its hand-inked panel borders' if kind(b) == 'page' else 'STYLE AND COMPOSITION SOURCE (the whole 1980s comic page that panel comes from): copy its drawing and printing style closely')})
    if kind(b) != 'calibration':
        for a in c['styleAnchors']:
            p = (COMIC / 'calibration' / a) if a.endswith('.png') else latest(COMIC / 'calibration', a)  # an exact file pins the best round
            if p: out.append({'path': rel(p), 'role': 'STYLE ANCHOR (our own remake of a 1980s page, in the exact target style): match its ink line, feathered hatching, spotted blacks, dot screens, flat print colour, black-and-teal night and paper grain; do not copy its story'})
    refs = b.get('refs') or ([] if after else c['styleSets'][b.get('styleSet', c['defaultStyleSet'])])
    for name in refs:
        role = ('THE PAGE TO COPY (a 1980s comic page): copy it closely: its page layout and panel shapes, each panel\'s composition, camera angle and poses, its line, feathered hatching, spotted blacks, dot screens and flat print colour handling. Change only the characters (ours), the setting (a modern office and night city), the palette (black and teal) and remove all text'
                if kind(b) == 'calibration' else
                'STYLE REFERENCE (a 1980s comic page): match its drawing and printing style at 95%: line, feathered hatching, spotted blacks, dot screens, flat print colour, newsprint grain')
        out.append({**ref_png(name), 'role': role})
    return out[:c['maxStyleInputs']]


def sheet_stem(identity):
    """Compatibility accessor: exact Studio-mapped file stem, never latest/fallback."""
    return Path(resolve_cast(REPO, identity)['path']).stem



def sheets_for(b):
    return [absp(binding['path']) for binding in brief_bindings(REPO, b)]



def current_cast(b):
    try:
        bindings = brief_bindings(REPO, b)
        inventory = b.get('visualInventory')
        errors = cast_reference_errors(REPO, inventory, absp) if inventory else []
        if errors: raise ValueError('; '.join(errors))
        return bindings
    except (ValueError, OSError, KeyError) as error:
        raise SystemExit(str(error))



def villain_words(b):
    a = analysis().get('villains', {}); names = [x for x in b.get('cast', []) if x in a]
    return ', '.join(f'the {n} ' + '/'.join(hx(x) for x in a[n]) for n in names)


def stage_prompt(pid, v):
    b, f, c = brief(pid), fragments(), cfg(pid)
    w, h = SIZES[b['aspect']]
    extra = [dict(x) for x in b.get('inputs', [])]
    inputs = (extra + style_inputs(b, c)) if b.get('inputsFirst') else (style_inputs(b, c) + extra)  # a page's layout template is image 1
    if c.get('refPageFirst'):  # the reference page itself as input image 1 is the strongest style anchor (coordinator, 2026-09-30)
        refp = [x for x in inputs if x.get('source', '').startswith(('wiki/image-library/assets/originals/comic-references/', 'discussion/reference-comics/')) and ' crop ' not in x.get('source', '')]
        inputs = refp[:1] + [x for x in inputs if x not in refp[:1]]
    bindings = current_cast(b)
    # Explicit compound inputs preserve each canonical member rather than
    # attaching redundant individual sheets and exceeding the tool's input cap.
    already_attached = {member['characterId'] for row in inputs
                        for member in ([row['castBinding']] if row.get('castBinding') else row.get('castMembers', []))}
    for binding in bindings:
        if binding['characterId'] in already_attached: continue
        inputs.append({'path': binding['path'], 'castBinding': binding,
                       'role': f"CAST IDENTITY for {binding['characterId']} ({binding['name']}): "
                               f"Studio {binding['recordId']}/comic-ink; role: {binding['role']}; "
                               f"signature: {binding['signature']}. Match this exact identity; do not transfer other characters. "
                               "Rendering/layout authority comes from the separately named style/layout input. "
                               f"Catalog status {binding['status']}; this is not Matt approval."})
    for row in inputs:
        row['sha256'] = sha(absp(row['path']))
    try: validate_inputs(REPO, bindings, inputs, absp)
    except (ValueError, OSError, KeyError) as error: raise SystemExit(str(error))
    roles = ' '.join(f'Input image {i + 1} ({Path(x["path"]).name}): {x["role"]}.' for i, x in enumerate(inputs))
    what = {'model': 'a character model sheet', 'calibration': 'a full comic page (a remake of the attached page)', 'panel': 'one comic panel (a single box)', 'page': 'one whole comic page, wide format, drawn box by box inside the layout template'}[kind(b)]
    vw = villain_words(b)
    parts = [
        'Use case: illustration (comic book art, 1980s American print)',
        f'Asset type: {what} for a dark comic series on a website, {b["aspect"]} ({w} x {h} px)',
        ('Input images: ' + roles) if inputs else 'Input images: none.',
        'Canonical cast authority (identity/facts override historical guide descriptors; rendering and authored colour state remain separate): ' + json.dumps(bindings, ensure_ascii=False),
        'Primary request: ' + b['prompt'],
        'Style (the most important instruction): ' + f['style95'],
        'Colour: ' + f['black-teal'] + (f' Villain colour cues in this image: {vw}.' if vw else ''),
        'Cinematography: ' + f['cinematography'],
        'Darkness: ' + f['darkness'],
        'Depth: ' + f['depth'],
        'Movement: ' + f['movement'],
        'Ink: ' + f['ink-plate'],
        'Framing: ' + {'panel': f['full-bleed'], 'calibration': f['page-frame'], 'model': f['sheet-frame'], 'page': f['page-frame-dark']}[kind(b)],
        'Colour palette (flat print colours; use only these): ' + ', '.join(f'{k} {hx(val)}' for k, val in c['palette'].items()) + '.',
        'Copying: ' + f['copy-rules'],
        'Text (verbatim): NONE.',
        'Avoid: ' + f['avoid'],
        *box_defect_lines(b, f),
    ]
    header = ('Use the imagegen skill with the built-in image_gen tool.' + (f' {len(inputs)} input image(s) are attached; their roles are described in the prompt.' if inputs else '') +
              f'\nGenerate exactly one image from the prompt below. Save it into the current working directory as {pid}-v{v}.png.'
              '\nRetain the exact output even if it is a draft. Do not replace existing images or create other files. The integrating caller will retain prompt/lineage records and register the image in the canonical library. Print the saved path and final prompt used.\n')
    d = work(pid)
    (d / 'prompt.txt').write_text(header + '\n' + '\n'.join(p for p in parts if p) + '\n', encoding='utf-8')
    (d / 'inputs.json').write_text(json.dumps([{**x, 'sha256': sha(absp(x['path']))} for x in inputs], indent=2), encoding='utf-8')
    print('prompt', pid, len(inputs), 'inputs')



# ---------- stage 2: generate (codex exec) ----------
def collect_native(events, since, home=None):
    """Fallback when Codex's shell is blocked: built-in generation still saved the file under
    <CODEX_HOME>/generated_images/<thread-id>/exec-<uuid>.png. Read the thread id from the `--json` events and return the
    single PNG created at or after `since` (epoch seconds), else None. The cache original is left in place."""
    tid = None
    for line in Path(events).read_text(encoding='utf-8', errors='replace').splitlines():
        try: ev = json.loads(line)
        except ValueError: continue
        if isinstance(ev, dict) and ev.get('type') == 'thread.started' and ev.get('thread_id'): tid = ev['thread_id']; break
    if not tid: return None
    root = Path(home or os.environ.get('CODEX_HOME') or Path.home() / '.codex') / 'generated_images' / tid
    new = [f for f in root.glob('*.png') if f.stat().st_mtime >= since - 2] if root.is_dir() else []
    return new[0] if len(new) == 1 else None


def stage_generate(pid, v):
    b = brief(pid); d = work(pid); out = raster_dir(b) / f'{pid}-v{v}.png'
    if out.exists(): raise SystemExit(f'{rel(out)} exists; use --version {v + 1}')
    inputs = json.loads((d / 'inputs.json').read_text())
    for i in inputs:
        if sha(absp(i['path'])) != i['sha256']: raise SystemExit(f'Input changed since the prompt stage: {i["path"]}')
    # Re-resolve Studio choices immediately before the provider boundary. Old
    # files may remain unchanged after Matt selects a different canonical model.
    try: validate_inputs(REPO, current_cast(b), inputs, absp)
    except (ValueError, OSError, KeyError) as error: raise SystemExit(str(error))
    gen = d / f'gen-v{v}'; staged = d / f'rec-raster-v{v}'
    if gen.exists() or staged.exists(): raise SystemExit('Generation transport exists; preserve it and use a new version')
    gen.mkdir(); staged.mkdir()
    shutil.copyfile(d / 'prompt.txt', staged / 'submitted-stdin.txt')
    # Reference pages and crops are recorded by source path and hash; their PNGs stay outside the repo.
    (staged / 'input-roles.json').write_text(json.dumps([{k: val for k, val in i.items() if k != 'path'} | {'input': i.get('source', i['path'])} for i in inputs], indent=2), encoding='utf-8')
    cmd = ['codex', 'exec', '--skip-git-repo-check', '--json', '-s', 'workspace-write', '-C', str(gen)]
    for i in inputs: cmd += ['-i', str(absp(i['path']))]
    cmd += ['-']
    t0 = time.time(); start = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    with open(staged / 'submitted-stdin.txt', 'rb') as stdin, open(staged / 'codex-exec.log', 'wb') as log, open(staged / 'codex-events.jsonl', 'wb') as events:
        rc = subprocess.run(cmd, stdin=stdin, stdout=events, stderr=log, timeout=1500, shell=(os.name == 'nt')).returncode
    found, _ = versions(strict=False)
    (staged / 'timing.txt').write_text(f'start={start}\nelapsed_s={time.time() - t0:.0f}\nexit={rc}\nversions={json.dumps(found)}\n', encoding='utf-8')
    made = gen / out.name
    if not made.exists():
        cand = sorted(gen.glob('*.png'))
        native = None if len(cand) == 1 else collect_native(staged / 'codex-events.jsonl', t0)
        if len(cand) == 1: made = cand[0]
        elif native:  # shell blocked: take the thread's own generated_images file, copy it, record where it came from
            made = gen / out.name; shutil.copyfile(native, made)
            (staged / 'native-cache-path.txt').write_text(str(native) + chr(10), encoding='utf-8')
        else:
            why = 'safety system' if 'safety system' in (staged / 'codex-exec.log').read_text(errors='replace') else f'exit {rc}'
            raise SystemExit(f'codex exec produced no {out.name} ({why}); see {staged / "codex-exec.log"}')
    with REG_LOCK:  # land image and records in the library and register them in one step
        out.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(made), out)
        rd = rec_dir(pid, 'comic-ink', v); rd.mkdir(parents=True, exist_ok=False)
        for record_file in staged.iterdir():
            if not record_file.is_file(): raise SystemExit('Unexpected record directory; exact files only')
            shutil.copyfile(record_file, rd / record_file.name)
        (rd / 'delivery-master.json').write_text(json.dumps({'master': out.name, 'sha256': sha(out), 'method': 'raw generated master; no automatic quantization'}), encoding='utf-8')
        register(pid, v, 'comic-ink', out, rd, f'Raster for Comic B {kind(b)} {pid} (source for its SVG plates).',
                 'Generated via Codex CLI codex exec -> built-in image_gen (model not reported) from the assembled prompt in submitted-stdin.txt; inputs, roles and hashes in input-roles.json (reference pages by source path and hash).')
    print('generate', pid, f'{time.time() - t0:.0f}s')



def validate_native_import(args):
    """Read-only validation shared by single and batch imports."""
    from PIL import Image
    for name in ('source', 'prompt_file', 'inputs_file', 'generation_record'):
        if not getattr(args, name, None): raise SystemExit(f'import needs --{name.replace("_", "-")}')
    src = Path(args.source).resolve(); prompt = Path(args.prompt_file).read_bytes()
    inputs = json.loads(Path(args.inputs_file).read_text(encoding='utf-8'))
    generation = json.loads(Path(args.generation_record).read_text(encoding='utf-8'))
    if not prompt.strip(): raise SystemExit('Submitted prompt is empty')
    if not isinstance(inputs, list): raise SystemExit('inputs-file must be an array with path, role and sha256')
    if not src.is_file(): raise SystemExit('Generated source file missing')
    with Image.open(src) as im:
        if im.format != 'PNG': raise SystemExit('Import requires the exact PNG master')
        im.verify()
    for item in inputs:
        if not isinstance(item, dict) or not all(item.get(k) for k in ('path', 'role', 'sha256')): raise SystemExit('Each input needs path, role and sha256')
        ref = absp(item['path'])
        if not ref.is_file() or sha(ref) != item['sha256']: raise SystemExit(f'Input hash mismatch: {item["path"]}')
    output_hash = sha(src)
    if generation.get('outputSha256') != output_hash: raise SystemExit('Generation receipt does not match exact output bytes')
    if not generation.get('tool') or 'model' not in generation: raise SystemExit('Generation receipt needs tool and model (null if not reported)')
    return src, prompt, inputs, generation, output_hash


def stage_import(pid, v):
    """Import native image-tool output with explicit provenance, without generation, conversion or review claims."""
    b = brief(pid)
    src, prompt, inputs, generation, output_hash = validate_native_import(ARGS)
    out = raster_dir(b) / f'{pid}-v{v}.png'; rd = rec_dir(pid, 'comic-ink', v)
    if out.exists() or rd.exists(): raise SystemExit('This artwork version exists; choose a new --version')
    with REG_LOCK:
        if out.exists() or rd.exists(): raise SystemExit('This artwork version appeared while waiting for registration')
        out.parent.mkdir(parents=True, exist_ok=True); rd.mkdir(parents=True, exist_ok=False)
        if sha(src) != output_hash: raise SystemExit('Source changed while waiting for registration')
        shutil.copyfile(src, out)  # preserve the native output and source; never move/delete transport folders
        if sha(out) != output_hash: raise SystemExit('Source changed during import; retain this draft and investigate')
        (rd / 'submitted-prompt.txt').write_bytes(prompt)
        (rd / 'input-roles.json').write_text(json.dumps(inputs, indent=2) + '\n', encoding='utf-8')
        (rd / 'generation.json').write_text(json.dumps(generation, indent=2) + '\n', encoding='utf-8')
        (rd / 'brief.json').write_text(json.dumps(b, indent=2) + '\n', encoding='utf-8')
        record = {'master': rel(out), 'sha256': output_hash, 'promptSha256': hashlib.sha256(prompt).hexdigest(), 'source': str(src), 'method': 'exact native-image import', 'browserStatus': 'pending'}
        (rd / 'import.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
        register(pid, v, 'comic-ink', out, rd, f'Native raster master for Comic B {kind(b)} {pid}; not reviewed.',
                 'Exact built-in image output imported with submitted prompt, model/tool receipt and reference hashes. No generation, print conversion, visual score or approval is inferred.')
        (work(pid) / f'native-v{v}.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print('import', pid, rel(out), 'registered draft')


# ---------- stage 3: trace (colour flats + halftone + ink plate) ----------
def nearest(pal, rgb): return min(pal, key=lambda n: sum((a - b) ** 2 for a, b in zip(pal[n], rgb)))


def ink_plate(im_l, c, rgb=None):
    """Dark pixels -> potrace paths (sharp, tapered brush ends, hatching kept). Returns (d, curve count)."""
    import numpy as np, potrace
    from PIL import Image, ImageFilter
    k = c['ink']; W, H = im_l.size; s = k['scale']
    big = im_l.resize((W * s, H * s), Image.LANCZOS) if s > 1 else im_l
    if k['blur']: big = big.filter(ImageFilter.GaussianBlur(k['blur']))
    a = np.array(big); bm = a < k['threshold']
    if k.get('maxChroma') is not None and rgb is not None:  # true ink is dark AND neutral: dark teal flats stay colour
        c3 = np.array(rgb.resize(big.size, Image.LANCZOS) if s > 1 else rgb).astype(np.int16)
        bm &= (c3.max(axis=2) - c3.min(axis=2)) <= k['maxChroma']
    # potracer traces the pixels that are False (checked 2026-09-28 on a test ring: a True ring came back as its
    # complement plus a frame around the image), so it gets the inverted mask.
    plist = potrace.Bitmap(~bm).trace(turdsize=k['turdsize'], turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                                     alphamax=k['alphamax'], opticurve=True, opttolerance=k['opttolerance'])
    f = lambda p: f'{p.x / s:.{k["precision"]}f} {p.y / s:.{k["precision"]}f}'
    parts = []
    def walk(curves):  # potracer nests holes (and islands in holes) as children: all of them go in the evenodd path
        for curve in curves or []:
            d = ['M' + f(curve.start_point)]
            for seg in curve.segments:
                d.append(('L' + f(seg.c) + ' ' + f(seg.end_point)) if seg.is_corner else ('C' + f(seg.c1) + ' ' + f(seg.c2) + ' ' + f(seg.end_point)))
            parts.append(''.join(d) + 'Z'); walk(curve.children)
    walk(plist)
    return ''.join(parts), len(parts)


def stage_print(pid, v):
    """Colour separation, as a 1980 print job did it: the Codex raster's colours are reduced to one limited set of flat
    colours (k-means, no dither), which removes the tonal gradients and glows the image model adds. Deterministic;
    the result is a new registered master (<id>-vN-print.png), and the Codex raster stays as its source."""
    from PIL import Image
    b = brief(pid); c = cfg(pid)['raster']['print']; src = raster_dir(b) / f'{pid}-v{v}.png'; out = raster_dir(b) / f'{pid}-v{v}-print.png'
    if out.exists(): raise SystemExit(f'{rel(out)} exists')
    d = work(pid); tmp = d / out.name
    im = Image.open(src).convert('RGB')
    if c.get('preScale', 1) < 1:  # generate-small-then-enlarge: drops the image model's digital micro-detail before separation
        W0, H0 = im.size; im = im.resize((round(W0 * c['preScale']), round(H0 * c['preScale'])), Image.LANCZOS).resize((W0, H0), Image.LANCZOS)
    im.quantize(colors=c['colours'], method=Image.Quantize.MAXCOVERAGE, kmeans=c['kmeans'], dither=Image.Dither.NONE).convert('RGB').save(tmp, optimize=True)
    with REG_LOCK:
        shutil.move(str(tmp), out)
        rd = rec_dir(pid, 'comic-ink-print', v); rd.mkdir(parents=True, exist_ok=False)
        (rd / 'print.json').write_text(json.dumps({'source': src.relative_to(LIB).as_posix(), 'sourceSha256': sha(src), **c,
            'method': 'Pillow quantize MAXCOVERAGE, kmeans refinement, no dither', 'pillow': versions(strict=False)[0]['pillow']}, indent=2), encoding='utf-8')
        register(pid, v, 'comic-ink-print', out, rd, f'Colour-separated master for Comic B {kind(b)} {pid} ({c["colours"]} flat colours) from its Codex raster.',
                 'Deterministic colour separation of the registered Codex raster (print.json).')
    print('print', pid, rel(out))


def stage_trace(pid, v):
    from PIL import Image, ImageFilter
    import vtracer
    b = brief(pid); c = cfg(pid); d = work(pid)
    c['configSha256'] = sha(CONFIG); (d / 'effective-config.json').write_text(json.dumps(c, indent=2), encoding='utf-8')
    src = Image.open(raster_dir(b) / f'{pid}-v{v}.png').convert('RGB'); W, H = src.size
    t0 = time.time()
    ink_d, ncurves = ink_plate(src.convert('L'), c, src)
    flat = src.filter(ImageFilter.MedianFilter(c['median'])) if c['median'] > 1 else src
    pal = list(c['palette'].values())
    pi = Image.new('P', (1, 1)); pi.putpalette([x for rgb in pal for x in rgb] + [0] * (768 - 3 * len(pal)))
    flat.quantize(palette=pi, dither=Image.Dither.NONE).convert('RGB').save(d / 'quantized.png')
    vt = c['vtracer']  # positional: vtracer 0.6.15 segfaults on keyword arguments under Python 3.14
    vtracer.convert_image_to_svg_py(str(d / 'quantized.png'), str(d / 'flats.svg'), vt['colormode'], vt['hierarchical'], vt['mode'],
        vt['filter_speckle'], vt['color_precision'], vt['layer_difference'], vt['corner_threshold'], vt['length_threshold'],
        vt['max_iterations'], vt['splice_threshold'], vt['path_precision'])
    L = c['layers']; groups = {k: [] for k in L['order']}
    has_fig = kind(b) != 'panel' or b.get('layers', {}).get('fig', 'x').strip().lower() not in ('none', '')
    for p in re.findall(r'<path[^>]*/>', (d / 'flats.svg').read_text()):
        name = nearest(c['palette'], hexrgb(re.search(r'fill="(#[0-9A-Fa-f]{6})"', p).group(1)))
        if name in c['inkColours']: continue  # the ink plate draws these; the ground rect shows through
        nums = [float(x) for x in re.findall(r'-?\d+\.?\d*', re.search(r' d="([^"]+)"', p).group(1))]
        t = re.search(r'translate\(([-\d.]+),([-\d.]+)\)', p); ox, oy = (float(t.group(1)), float(t.group(2))) if t else (0, 0)
        xs, ys = [ox + x for x in nums[0::2]], [oy + y for y in nums[1::2]]
        bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        edge = min(xs) < 4 or min(ys) < 4 or max(xs) > W - 4 or max(ys) > H - 4
        if name in L['light']: g = 'light'
        elif name in L['fx']['colours'] and bh > L['fx']['minAspect'] * bw and bw < L['fx']['maxWidth']: g = 'fx'
        elif has_fig and name in L['fig']['colours'] and not edge and bw * bh < 0.25 * W * H: g = 'fig'
        elif name in L['bg']: g = 'bg'
        else: g = 'mid'
        fill = f'url(#ht-{name})' if name in c['halftone']['fields'] else hx(c['palette'][name])
        groups[g].append(re.sub(r'fill="#[0-9A-Fa-f]{6}"', f'fill="{fill}"', p))
    pitch = round(W * c['halftone']['pitchPctOfWidth'] / 100, 1); r = round(pitch * c['halftone']['dotPctOfPitch'] / 200, 2)
    defs = ''.join(f'<pattern id="ht-{n}" patternUnits="userSpaceOnUse" width="{pitch}" height="{pitch}"><rect width="{pitch}" height="{pitch}" fill="{hx(c["palette"][n])}"/>'
                   f'<circle cx="{pitch / 2}" cy="{pitch / 2}" r="{round(r * h.get("scale", 1), 2)}" fill="{hx(c["palette"][h["dot"]])}"/></pattern>' for n, h in c['halftone']['fields'].items())
    grain = ''
    if c['grain']['enabled']:
        defs += (f'<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="{c["grain"]["frequency"]}" numOctaves="1" seed="7"/>'
                 f'<feColorMatrix values="0 0 0 0 0.95 0 0 0 0 0.93 0 0 0 0 0.88 0 0 0 {c["grain"]["opacity"]} 0"/></filter>')
        grain = f'<g data-layer="grain" data-depth="0"><rect width="{W}" height="{H}" filter="url(#grain)"/></g>'
    body = ''.join(f'<g data-layer="{k}" data-depth="{L["depth"][k]}"' + (' data-fx="rain"' if k == 'fx' else '') + f'>{"".join(val)}</g>' for k, val in groups.items())
    ink = f'<g data-layer="ink" data-depth="{L["depth"]["ink"]}"><path fill="{hx(c["palette"]["ink"])}" fill-rule="evenodd" d="{ink_d}"/></g>'
    (d / 'layered.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>{defs}</defs><rect width="{W}" height="{H}" fill="{hx(c["palette"]["ground"])}"/>{body}{ink}{grain}</svg>')
    counts = {**{k: len(val) for k, val in groups.items()}, 'inkCurves': ncurves, 'traceSeconds': round(time.time() - t0)}
    (d / 'layers.json').write_text(json.dumps(counts)); print('trace', pid, counts)
    optimize(pid, v)


def optimize(pid, v):
    c = frozen(pid); b = brief(pid); d = work(pid)
    (d / 'svgo.config.cjs').write_text('module.exports = ' + json.dumps(c['svgo']) + ';\n')
    out = d / f'{svg_stem(pid, v)}.svg'
    if (vector_dir(b) / out.name).exists(): raise SystemExit(f'{out.name} exists in the library; use --version {v + 1}')
    r = subprocess.run([str(NODE_MODULES / '.bin/svgo'), '--config', str(d / 'svgo.config.cjs'), '-i', str(d / 'layered.svg'), '-o', str(out)], capture_output=True, text=True, shell=(os.name == 'nt'))
    if r.returncode: raise SystemExit(r.stderr)
    s = out.read_text()
    problems = [m for m in ('<text', '<image', 'href="http', '<script', '<foreignObject', 'Gradient') if m in s]
    if 'data-layer="ink"' not in s: problems.append('ink plate dropped')
    cap = c['maxBytesPage'] if kind(b) == 'page' else c['maxBytes']
    if out.stat().st_size > cap: problems.append(f'{out.stat().st_size} bytes > cap {cap}')
    gz = len(gzip.compress(out.read_bytes(), 9))
    (d / 'optimize.json').write_text(json.dumps({'bytes': out.stat().st_size, 'gzipBytes': gz, 'paths': s.count('<path'), 'problems': problems}))
    print('optimize', pid, out.stat().st_size, 'bytes', gz, 'gzip', problems or 'ok')
    record(pid, v)


# ---------- record + register ----------
def prepare_registration(pid, v, treatment, file, rd, desc, note):
    """Write one artifact record and return its payload; caller holds REG_LOCK."""
    from PIL import Image
    b = brief(pid)
    t = {'path': file.relative_to(LIB).as_posix(), 'sha256': sha(file), 'bytes': file.stat().st_size, 'status': 'draft',
         'note': f'{note} Not approved by Matt. Content review, browser verification and approval are separate states. Records: {rd.relative_to(LIB).as_posix()}/.', 'sourceName': file.name}
    if file.suffix == '.png':
        im = Image.open(file); t.update(width=im.width, height=im.height, format=im.format, mode=im.mode)
    else: t['format'] = 'SVG'
    payload = {'id': f'comic-b-{pid}', 'logicalId': None, 'collection': 'comics', 'title': f'Comic B · {pid}', 'description': desc,
               'service': 'Comic B', 'category': 'Comic B', 'sceneKind': {'model': 'Comic model sheet', 'calibration': 'Comic calibration page', 'page': 'Comic page'}.get(kind(b), f'Comic panel ({b.get("story")})'), 'treatments': {treatment: t}}
    (rd / 'registration-payload.json').write_text(json.dumps(payload, indent=2), encoding='utf-8')
    (rd / 'README.md').write_text(f'# comic-b-{pid} / {treatment} / v{v}\n\n{desc}\n\n| Field | Value |\n|---|---|\n| File | `{t["path"]}` |\n| SHA-256 | `{t["sha256"]}` |\n| Bytes | {t["bytes"]:,} |\n| Status | `draft` |\n\n{note}\n\nMade by `mtw-comic-story/scripts/art/comic_art.py`. Evidence for this artifact is retained in its library record. Content review, integration, browser verification and Matt\'s approval are separate states.\n', encoding='utf-8')
    return payload


def register(pid, v, treatment, file, rd, desc, note):
    payload = prepare_registration(pid, v, treatment, file, rd, desc, note)
    rc = WORK / '_receipts'; rc.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):  # a transient Windows lock on manifest.json (indexer, antivirus, an open viewer) fails the rename
        r = subprocess.run([sys.executable, str(HELPER), 'register', '--library', str(LIB), '--payload', str(rd / 'registration-payload.json'), '--receipt-dir', str(rc)], capture_output=True, text=True)
        if r.returncode == 0 or 'PermissionError' not in r.stdout + r.stderr: break
        time.sleep(5 * (attempt + 1))
    if r.returncode: raise SystemExit(f'register failed for {pid}: {r.stdout[-600:]}{r.stderr[-600:]}')
    print('registered', payload['id'], treatment, f'v{v}')


def record(pid, v):
    b = brief(pid); d = work(pid); svg = d / f'{svg_stem(pid, v)}.svg'; out = vector_dir(b) / svg.name
    found, drift = versions(strict=False); opt = json.loads((d / 'optimize.json').read_text()); src = raster_dir(b) / f'{pid}-v{v}.png'
    with REG_LOCK:
        out.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(svg, out)
        rd = rec_dir(pid, 'comic-ink-svg', svg_stem(pid, v).rsplit('-v', 1)[1]); rd.mkdir(parents=True, exist_ok=False)
        for f in ('svgo.config.cjs', 'optimize.json', 'layers.json', 'effective-config.json'): shutil.copyfile(d / f, rd / f)
        shutil.copyfile(d / 'quantized.png', rd / 'quantized-flats-input.png')
        (rd / 'provenance.json').write_text(json.dumps({'source': src.relative_to(LIB).as_posix(), 'sourceSha256': sha(src),
            'traceConfigSha256': frozen(pid)['configSha256'], 'referenceAnalysisSha256': sha(REFS) if REFS.exists() else None,
            'effectiveConfig': 'effective-config.json', 'versions': found, 'versionDrift': drift,
            'command': f'python comic_art.py all --panel {pid} --version {v}' + (f' --retrace {ARGS.retrace}' if ARGS.retrace else '')}, indent=2), encoding='utf-8')
        register(pid, v, 'comic-ink-svg', out, rd, f'Comic B {kind(b)} {pid} as layered SVG plates (colour flats bg/mid/fig/light/fx with halftone patterns, ink plate on top).',
                 f'Traced with the pinned print pipeline (provenance.json); {opt["paths"]} paths, {opt["bytes"]:,} bytes ({opt["gzipBytes"]:,} gzip); checks: {"; ".join(opt["problems"]) or "ok"}.')


# ---------- review, measure, judge, integrate ----------
RENDER_JS = r"""
const sharp = require(process.argv[2]); const fs = require('fs');
const [, , , svg, raster, outDir] = process.argv;
(async () => {
  const buf = fs.readFileSync(svg); const w = +buf.toString().match(/viewBox="0 0 (\d+)/)[1];
  await sharp(buf, { density: 72 * 1600 / w }).png().toFile(outDir + '/review-1600.png');
  const big = await sharp(buf, { density: 72 * 3 }).png().toBuffer(); const m = await sharp(big).metadata();
  const cw = Math.round(m.width / 6), ch = Math.round(m.height / 6);
  await sharp(big).extract({ left: Math.round(m.width * 0.45), top: Math.round(m.height * 0.3), width: cw, height: ch }).png().toFile(outDir + '/review-zoom3x.png');
  await sharp(raster).resize({ width: 1600 }).png().toFile(outDir + '/review-source-1600.png');
})().catch((e) => { console.error(e); process.exit(1); });
"""


RASTER_REVIEW_JS = r"""
const sharp = require(process.argv[2]); const [, , , raster, outDir] = process.argv;
(async () => {
  await sharp(raster).resize({ width: 1600 }).png().toFile(outDir + '/review-1600.png');
  const m = await sharp(raster).metadata(); const cw = Math.round(m.width / 6), ch = Math.round(m.height / 6);
  await sharp(raster).extract({ left: Math.round(m.width * 0.45), top: Math.round(m.height * 0.3), width: cw, height: ch }).resize({ width: cw * 3, kernel: 'nearest' }).png().toFile(outDir + '/review-zoom3x.png');
})().catch((e) => { console.error(e); process.exit(1); });
"""


def stage_review(pid, v):
    b = brief(pid); d = work(pid)
    if raster_mode() and not ARGS.retrace:  # page art is Codex's raster (Matt, 2026-09-28: "Hi-res image")
        js = d / 'render-raster.cjs'; js.write_text(RASTER_REVIEW_JS)
        r = subprocess.run(['node', str(js), str(NODE_MODULES / 'sharp'), str(raster_dir(b) / master_name(pid, v)), str(d)], capture_output=True, text=True)
        if r.returncode: raise SystemExit(r.stderr)
        print('review', d / 'review-1600.png'); return
    js = d / 'render.cjs'; js.write_text(RENDER_JS)
    r = subprocess.run(['node', str(js), str(NODE_MODULES / 'sharp'), str(vector_dir(b) / f'{svg_stem(pid, v)}.svg'), str(raster_dir(b) / f'{pid}-v{v}.png'), str(d)], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr)
    print('review', d / 'review-1600.png')


def ink_runs(lum, w, h):
    """P50 and P90 run lengths of dark pixels (L < 60), horizontal and vertical, as fractions of width (the method of
    reference-measurements.json)."""
    import numpy as np
    a = np.array(lum, dtype=np.float32).reshape(h, w) < 60; runs = []
    for m in (a, a.T):
        for row in m:
            dif = np.diff(np.concatenate(([0], row.astype(np.int8), [0])))
            runs.extend((np.where(dif == -1)[0] - np.where(dif == 1)[0]).tolist())
    runs.sort()
    return (runs[len(runs) // 2] / w, runs[int(len(runs) * 0.9)] / w) if runs else (0, 0)


def stage_measure(pid, v):
    """Measured features against the reference distribution, adjusted for Matt's black-and-teal darkness: black %,
    ink run widths (line weight), saturated light present, flat colour, halftone and ink plate present. The visual
    judge (style >= 95, composition, sharpness at 3x) is recorded with the judge stage."""
    from PIL import Image
    rm = raster_mode() and not ARGS.retrace
    c = (cfg(pid) if rm else frozen(pid))['measure']; d = work(pid)
    im = Image.open(d / 'review-1600.png').convert('RGB'); im.thumbnail((800, 800)); w, h = im.size
    px = list(im.getdata()); n = len(px)
    lum = [0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px]
    sat = sum(1 for r, g, b in px if colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[1] > 0.5 and max(r, g, b) > 60)
    p50, p90 = ink_runs(lum, w, h)
    colours = len(set((r >> 3, g >> 3, b >> 3) for r, g, b in px))
    s = '' if rm else (vector_dir(brief(pid)) / f'{svg_stem(pid, v)}.svg').read_text()
    m = {'blackPct': round(100 * sum(1 for l in lum if l < 40) / n, 1), 'meanLuminance': round(sum(lum) / n, 1),
         'saturatedPct': round(100 * sat / n, 1), 'inkRunP50FracW': round(p50, 4), 'inkRunP90FracW': round(p90, 4),
         'distinctColours5bit': colours, 'halftone': '<pattern' in s, 'inkPlate': 'data-layer="ink"' in s}
    ref = json.loads(REF_MEASURES.read_text(encoding='utf-8'))['pages'] if REF_MEASURES.exists() else {}
    rp50 = [p['ink']['runP50FracW'] for p in ref.values() if p.get('ink')]; rp90 = [p['ink']['runP90FracW'] for p in ref.values() if p.get('ink')]
    tol = c['refTolerance']; black = {'calibration': c['blackPctCalibration'], 'page': c.get('blackPctPage', c['blackPct'])}.get(kind(brief(pid)), c['blackPct'])
    checks = {'black': black[0] <= m['blackPct'] <= black[1], 'saturatedLight': m['saturatedPct'] >= c['saturatedPctMin'],
              **({} if rm else {'flatColour': colours <= c['maxDistinctColours'], 'halftone': m['halftone'], 'inkPlate': m['inkPlate']})}
    if rp50 and not rm: checks['lineWeight'] = min(rp50) * tol[0] <= m['inkRunP50FracW'] <= max(rp50) * tol[1]
    m['refRange'] = {'inkRunP50FracW': [min(rp50, default=None), max(rp50, default=None)], 'inkRunP90FracW': [min(rp90, default=None), max(rp90, default=None)]}
    m['checks'] = checks; m['pass'] = all(checks.values())
    (d / 'measure.json').write_text(json.dumps(m, indent=1))
    print('measure', pid, {k: m[k] for k in ('blackPct', 'inkRunP50FracW', 'inkRunP90FracW', 'distinctColours5bit')}, checks)
    return m


CONTENT_CHECKS = ('storyAction', 'castIdentity', 'keySubjects', 'styleConsistency', 'sharpness')


def master_path(pid, v):
    b = brief(pid)
    return raster_dir(b) / master_name(pid, v) if raster_mode() and not (ARGS and ARGS.retrace) else vector_dir(b) / f'{svg_stem(pid, v)}.svg'


def story_source(pid):
    b = brief(pid)
    return absp(b.get('storySource', f'site/src/data/comic-stories/{b.get("story", "")}.ts'))


def content_review_errors(pid, v, review):
    return content_review_errors_for(pid, master_path(pid, v), story_source(pid), review, brief(pid))


def content_review_errors_for(pid, src, story, review, expected_brief):
    """Read-only exact master/story review validation, also usable before canonical import."""
    if not isinstance(review, dict): return ['review must be an object']
    why = []
    if not src.is_file(): return ['master missing']
    if not story.is_file(): return ['story source missing; declare storySource in the brief']
    if review.get('masterSha256') != sha(src): why.append('review does not match master bytes')
    if review.get('storySha256') != sha(story): why.append('review does not match current story bytes')
    if review.get('pageId') != pid: why.append('review belongs to a different page')
    if not isinstance(review.get('reviewer'), str) or not review['reviewer'].strip(): why.append('reviewer missing')
    if not isinstance(review.get('observations'), str) or not review['observations'].strip(): why.append('visual observations missing')
    checks = review.get('checks', {})
    if not isinstance(checks, dict): return why + ['checks must be an object']
    for name in CONTENT_CHECKS:
        if checks.get(name) is not True: why.append(f'content review failed or missing: {name}')
    if review.get('unresolved') != []: why.append('unresolved defects must be an explicit empty list')
    # Always required at new acceptance; a missing version/flag never restores the
    # old whole-page checkbox. Reading/preserving historical records is unchanged.
    why.extend(visual_review_errors(pid, src, story, review, expected_brief, absp, REPO))
    return why



def registered_delivery(pid, v):
    """Explicit registered-native adapter. Read-only validation; legacy paths remain unchanged."""
    names = ('registered_master', 'catalog_record', 'catalog_treatment', 'master_sha256', 'public_stem')
    supplied = [getattr(ARGS, name, None) for name in names]
    png_alias = getattr(ARGS, 'native_png_public_alias', None)
    png_only = getattr(ARGS, 'native_png_only', False)
    if png_only and not png_alias: raise SystemExit('Native PNG-only delivery requires explicit --native-png-public-alias')
    if not any(supplied):
        if png_alias: raise SystemExit('Native PNG alias requires all registered native delivery flags')
        return None
    if not all(supplied): raise SystemExit('Registered delivery requires all five master/catalog/hash/public-stem flags')
    if getattr(ARGS, 'stage', None) not in ('judge', 'integrate'):
        raise SystemExit('Registered delivery is only supported by judge and integrate')
    if png_alias and ARGS.stage != 'integrate': raise SystemExit('Native PNG alias is only supported by registered integrate')
    if not re.fullmatch(r'[a-f0-9]{64}', ARGS.master_sha256): raise SystemExit('Exact lower-case master SHA-256 required')
    b = brief(pid); story_id = b.get('story', '')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', story_id): raise SystemExit('Registered delivery needs a safe owned story slug')
    src = absp(ARGS.registered_master).resolve()
    assets = (LIB / 'assets').resolve()
    if not assets.is_relative_to(LIB.resolve()) or not src.is_relative_to(assets) or not src.is_file() or src.suffix.lower() != '.png':
        raise SystemExit('Registered native PNG must resolve inside wiki/image-library/assets')
    catalog = json.loads((LIB / 'manifest.json').read_text(encoding='utf-8'))
    matches = [r for r in catalog.get('records', []) if r.get('id') == ARGS.catalog_record]
    if len(matches) != 1: raise SystemExit('Exact unique current catalog record required')
    treatment = matches[0].get('treatments', {}).get(ARGS.catalog_treatment)
    if not isinstance(treatment, dict) or not isinstance(treatment.get('path'), str):
        raise SystemExit('Exact current catalog treatment required')
    catalog_src = (LIB / treatment['path']).resolve()
    if not catalog_src.is_relative_to(assets) or catalog_src != src or treatment.get('sha256') != ARGS.master_sha256:
        raise SystemExit('Registered master path/hash does not match current catalog treatment')
    stem = absp(ARGS.public_stem).resolve()
    owned = (SITE / story_id).resolve()
    if not owned.is_relative_to(SITE.resolve()) or not stem.is_relative_to(owned) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*', stem.name):
        raise SystemExit('Public stem must be extensionless and resolve inside owned site/public/comic/<story>')
    if stem.name != src.stem:
        raise SystemExit('Registered public stem basename must equal the canonical native master basename')
    png_path = None
    if png_alias:
        png_path = absp(png_alias).resolve()
        if not png_path.is_relative_to(owned) or png_path.name != src.name or png_path.suffix != '.png':
            raise SystemExit('Native PNG public alias must resolve inside owned comic story with exact canonical PNG filename')
        if png_path.exists(): raise SystemExit('Refusing native PNG public alias overwrite: ' + str(png_path))
    native = src.read_bytes()
    if hashlib.sha256(native).hexdigest() != ARGS.master_sha256:
        raise SystemExit('Registered native master bytes changed')
    from io import BytesIO
    from PIL import Image
    try:
        with Image.open(BytesIO(native)) as im:
            if im.format != 'PNG': raise ValueError('native format is not PNG')
            dimensions = im.size; native_mode = im.mode; alpha_present = 'A' in im.getbands() or 'transparency' in im.info; im.verify()
    except Exception as exc: raise SystemExit('Registered native PNG decode failed: ' + str(exc))
    review_file = getattr(ARGS, 'review_file', None)
    if not review_file: raise SystemExit('Registered delivery requires exact --review-file with comic-visual-v1 coverage')
    review = json.loads(absp(review_file).read_text(encoding='utf-8'))
    why = content_review_errors_for(pid, src, story_source(pid), review, b)
    if why: raise SystemExit('Registered delivery review refused: ' + '; '.join(why))
    transport_root = (REPO / '.codex/worktrees').resolve()
    def transport(name):
        value = getattr(ARGS, name, None)
        if not value: raise SystemExit('Registered delivery requires explicit --' + name.replace('_', '-'))
        path = absp(value).resolve()
        if not path.is_relative_to(transport_root):
            raise SystemExit('Registered delivery metadata must resolve inside ignored .codex/worktrees transport; root imports canonical receipts')
        if path.exists(): raise SystemExit('Refusing transport overwrite: ' + str(path))
        return path
    output = transport('review_output' if ARGS.stage == 'judge' else 'receipt_output')
    snapshot = output.with_suffix('.master.png'); encoder = output.with_suffix('.encode.cjs')
    if ARGS.stage == 'integrate' and not png_only:
        for path in (snapshot, encoder):
            if path.exists(): raise SystemExit('Refusing transport overwrite: ' + str(path))
        widths = json.loads((HERE.parents[1] / 'assets/page-constants.json').read_text(encoding='utf-8'))['page']['artWidths']
        if not widths or any(type(w) is not int or w <= 0 for w in widths): raise SystemExit('Invalid page artWidths')
        fit = [w for w in sorted(set(widths)) if w <= dimensions[0]]
        slots = fit or [min(widths)]
        for width in slots:
            for ext in ('webp', 'avif'):
                path = stem.parent / f'{stem.name}-{width}.{ext}'
                if path.exists(): raise SystemExit('Refusing public derivative overwrite: ' + str(path))
    return dict(source=src, sourceBytes=native, dimensions=dimensions, publicStem=stem,
                output=output, snapshot=snapshot, encoder=encoder, review=review,
                catalogRecord=ARGS.catalog_record, catalogTreatment=ARGS.catalog_treatment,
                masterSha256=ARGS.master_sha256, nativePngAlias=png_path, nativePngOnly=png_only,
                nativeMode=native_mode, alphaPresent=alpha_present)


def write_native_png_alias(selected):
    """Exact public copy after registered preflight; no encoder/resample or alpha conversion."""
    target = selected['nativePngAlias']
    if not target: return None
    # Resolve ancestors again immediately before mutation; never follow a replaced public parent.
    if target.resolve() != target or target.exists(): raise SystemExit('Native PNG alias destination changed or exists')
    if sha(selected['source']) != selected['masterSha256']: raise SystemExit('Native PNG source changed before exact copy')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.resolve() != target: raise SystemExit('Native PNG alias parent changed before copy')
    with target.open('xb') as f: f.write(selected['sourceBytes'])
    copied = target.read_bytes(); digest = hashlib.sha256(copied).hexdigest()
    if copied != selected['sourceBytes'] or digest != selected['masterSha256']:
        raise SystemExit('Native PNG exact-copy verification failed; retain attempt for review')
    width, height = selected['dimensions']
    return {'file': str(target), 'path': target.relative_to(REPO).as_posix(),
            'publicPath': target.relative_to(REPO).as_posix(), 'format': 'png',
            'width': width, 'height': height, 'bytes': len(copied), 'sha256': digest,
            'canonicalSourcePath': selected['source'].relative_to(REPO).as_posix(),
            'sourceSha256': selected['masterSha256'], 'operation': 'exact-native-copy',
            'upscaled': False, 'alphaPreserved': True, 'sourceMode': selected['nativeMode'],
            'alphaPresent': selected['alphaPresent']}


def stage_judge(pid, v):
    """Record the author's actual master review for browser integration; no guessed style scores."""
    if not ARGS.review_file: raise SystemExit('judge needs --review-file with exact master/story hashes, checks and observations; numeric style scores are retired')
    selected = registered_delivery(pid, v)
    if selected:
        raw = (json.dumps(selected['review'], indent=2, sort_keys=True) + '\n').encode('utf-8')
        selected['output'].parent.mkdir(parents=True, exist_ok=True)
        with selected['output'].open('xb') as f: f.write(raw)
        print('judge', pid, 'registered native master reviewed; transport only; browser verification pending'); return
    review = json.loads(Path(ARGS.review_file).read_text(encoding='utf-8'))
    why = content_review_errors(pid, v, review)
    if why: raise SystemExit('; '.join(why))
    raw = (json.dumps(review, indent=2, sort_keys=True) + '\n').encode('utf-8')
    digest = hashlib.sha256(raw).hexdigest(); dst = work(pid) / f'content-review-v{v}.json'
    rd = rec_dir(pid, 'content-review', f'{v}-{digest[:12]}'); src = master_path(pid, v)
    with REG_LOCK:
        if not rd.exists():
            rd.mkdir(parents=True, exist_ok=False)
            (rd / 'content-review.json').write_bytes(raw)
            treatment = 'comic-ink-print' if src.name.endswith('-print.png') else 'comic-ink' if src.suffix == '.png' else 'comic-ink-svg'
            register(pid, v, treatment, src, rd, f'Comic B {kind(brief(pid))} {pid}: master content reviewed; reader verification pending.',
                     'Manual visual content review bound to master and story hashes. The accepted style uses no numerical 95 gate. Browser crop, lettering and playback checks remain separate.')
        dst.write_bytes(raw)
    print('judge', pid, 'master reviewed; browser verification pending')


def gate(pid, v):
    f = WORK / pid / f'content-review-v{v}.json'
    candidates = ([f] if f.is_file() else []) + sorted((LIB / 'records' / f'comic-b-{pid}' / 'content-review').glob(f'v{v}-*/content-review.json'))
    if not candidates: return ['no content review; use judge --review-file after inspecting the master against the story and cast']
    errors = []
    for candidate in candidates:
        errors = content_review_errors(pid, v, json.loads(candidate.read_text(encoding='utf-8')))
        if not errors: return []
    return errors


def stage_integrate(pid, v):
    b = brief(pid); selected = registered_delivery(pid, v)
    why = [] if selected else gate(pid, v)
    if why: raise SystemExit(f'{pid}: NOT integrated: {"; ".join(why)}. It stays a registered draft.')
    dst = selected['publicStem'].with_suffix('.svg') if selected else site_path(b)
    if selected and (not raster_mode() or ARGS.retrace): raise SystemExit('Registered native delivery requires raster mode without retrace')
    if selected and selected['nativePngOnly']:
        selected = registered_delivery(pid, v)  # Same source-grade/story/cast/catalog gates before copy-only IO.
        png_output = write_native_png_alias(selected)
        receipt = dict(source={'path': selected['source'].relative_to(REPO).as_posix(),
                              'sha256': selected['masterSha256'], 'width': selected['dimensions'][0],
                              'height': selected['dimensions'][1], 'format': 'png'},
                       masterSha256=selected['masterSha256'], catalogSourcePath=str(selected['source']),
                       catalogRecord=selected['catalogRecord'], catalogTreatment=selected['catalogTreatment'],
                       storySha256=selected['review']['storySha256'], sourceWidth=selected['dimensions'][0],
                       sourceHeight=selected['dimensions'][1], nativePngAlias=png_output, outputs=[png_output],
                       operation='exact-native-copy', catalogRegistered=True, humanApproval=False, browserStatus='pending')
        selected['output'].parent.mkdir(parents=True, exist_ok=True)
        with selected['output'].open('xb') as f: f.write((json.dumps(receipt, indent=2) + '\n').encode('utf-8'))
        print('integrate', rel(selected['nativePngAlias']), 'exact native PNG bytes/alpha; no encoder; browser verification pending'); return
    dst.parent.mkdir(parents=True, exist_ok=True)
    if raster_mode() and not ARGS.retrace:
        c = json.loads(CONFIG.read_text(encoding='utf-8'))['raster']; src = selected['source'] if selected else master_path(pid, v)
        page_config = HERE.parents[1] / 'assets/page-constants.json'
        widths = json.loads(page_config.read_text(encoding='utf-8'))['page']['artWidths']
        if not widths or any(type(w) is not int or w <= 0 for w in widths): raise SystemExit('Invalid page artWidths')
        if selected:
            # Revalidate immediately before transport/public mutations, then encode the exact validated byte buffer.
            selected = registered_delivery(pid, v)
            selected['output'].parent.mkdir(parents=True, exist_ok=True)
            with selected['snapshot'].open('xb') as f: f.write(selected['sourceBytes'])
            src = selected['snapshot']
            png_output = write_native_png_alias(selected)
        js = selected['encoder'] if selected else work(pid) / 'encode.cjs'
        encoder_source = r"""
const sharp = require(process.argv[2]); const [, , , src, base, widths, q, qa] = process.argv;
(async () => { const m = await sharp(src).metadata(); const outputs = [];
  const kernel = 'lanczos3';
  const options = { webp: { quality: +q, smartSubsample: true }, avif: { quality: +qa, effort: 2 } };
  // Never enlarge (Matt, 2026-10-11): a copy stops at the master's own width. Slots wider than the master are not
  // written; when the master is narrower than every slot, the smallest slot (the name the reader requests) holds it.
  const all = JSON.parse(widths), fit = all.filter((w) => w <= m.width), slots = fit.length ? fit : [all[0]];
  for (const width of slots) {
    const img = () => sharp(src).resize({ width: Math.min(width, m.width), kernel, withoutEnlargement: true });
    for (const ext of ['webp', 'avif']) {
      const file = base + '-' + width + '.' + ext;
      const started = performance.now();
      const info = await (ext === 'webp' ? img().webp(options.webp) : img().avif(options.avif)).toFile(file);
      outputs.push({ file, format: ext, width: info.width, height: info.height, bytes: info.size,
        encodeMs: performance.now() - started, slot: width, upscaled: info.width > m.width });
    }
  }
  console.log(JSON.stringify({ sourceWidth: m.width, sourceHeight: m.height, skippedSlots: all.filter((w) => !slots.includes(w)),
    encoder: { sharpVersion: sharp.versions.sharp, kernel, options }, outputs }));
})().catch((e) => { console.error(e); process.exit(1); });
"""
        if selected:
            with js.open('x', encoding='utf-8', newline='\n') as f: f.write(encoder_source)
        else: js.write_text(encoder_source, encoding='utf-8')
        base = dst.with_suffix('')
        r = subprocess.run(['node', str(js), str(NODE_MODULES / 'sharp'), str(src), str(base), json.dumps(sorted(set(widths))), str(c['webpQuality']), str(c['avifQuality'])], capture_output=True, text=True)
        if r.returncode: raise SystemExit(r.stderr)
        receipt = json.loads(r.stdout); receipt.update(masterSha256=sha(src), storySha256=sha(story_source(pid)), browserStatus='pending')
        if selected:
            if png_output:
                receipt['nativePngAlias'] = png_output
                receipt['outputs'].append(png_output)
            receipt.update(storySha256=selected['review']['storySha256'], catalogSourcePath=str(selected['source']), catalogRecord=selected['catalogRecord'],
                           catalogTreatment=selected['catalogTreatment'], exactByteSnapshot=str(selected['snapshot']),
                           humanApproval=False, catalogRegistered=True)
            with selected['output'].open('xb') as f: f.write((json.dumps(receipt, indent=2) + '\n').encode('utf-8'))
        else: (work(pid) / f'integration-v{v}.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
        print('integrate', rel(base), 'AVIF/WebP at the master width or below (no upscales); browser verification pending'); return
    shutil.copyfile(master_path(pid, v), dst); print('integrate', rel(dst), 'browser verification pending')


def stage_score(pid, v):
    """Codex's independent, read-only review of the rendered SVG: style against the reference page(s) it was made from,
    composition when the brief names a reference panel, identity against the cast model sheets, and the INVENTION pass:
    every visual element or treatment not present in the reference pages and not among Matt's exceptions (the dark
    black-and-teal palette, our cast and settings). JSON-schema answer in work/<id>/codex-score.json and art-log.md."""
    b = brief(pid); d = work(pid); c = cfg(pid)
    refs = ([box_ref_sheet(b), ref_png(b['after']['ref'])] if b.get('boxRefs') else [ref_png(b['after']['ref'], b['after'].get('crop'))]) if b.get('after') else [ref_png(r) for r in (b.get('refs') or c['styleSets'][b.get('styleSet', c['defaultStyleSet'])])[:2]]
    sheets = sheets_for(b)
    imgs = [r['path'] for r in refs] + [str(p) for p in sheets] + [str(d / 'review-1600.png')]
    props = {'style': {'type': 'integer'}, 'inventions': {'type': 'array', 'items': {'type': 'string'}}, 'depthShadowPlanes': {'type': 'boolean'},
             'movementStaged': {'type': 'boolean'}, 'reasons': {'type': 'string'}}
    if b.get('boxRefs'):
        props['boxes'] = {'type': 'array', 'items': {'type': 'object', 'additionalProperties': False, 'required': ['box', 'composition', 'reason'],
                          'properties': {'box': {'type': 'integer'}, 'composition': {'type': 'integer'}, 'reason': {'type': 'string'}}}}
    elif b.get('after'): props['composition'] = {'type': 'integer'}
    if sheets: props['identity'] = {'type': 'integer'}
    schema = d / 'score.schema.json'
    schema.write_text(json.dumps({'type': 'object', 'additionalProperties': False, 'required': list(props), 'properties': props}))
    n, ns = len(refs), len(sheets)
    prompt = (f'You are a strict comic-art reviewer. Do not edit or create any files. Images 1-{n} are 1980s comic reference pages'
              + (' (image 1 is a sheet of the reference panels each box copies, numbered by box; image 2 is their whole page)' if b.get('boxRefs') else ' (image 1 is the panel this art must copy)' if b.get('after') else '')
              + (f'; images {n + 1}-{n + ns} are our character model sheets (identity only, not style)' if ns else '')
              + '; the LAST image is our new art. Matt\'s allowed departures from the references, which are NOT inventions: a dark black-and-teal palette, and our own '
              'cast designs (Claude\'s long coat of layered paper pages and teal visor, Codex\'s armour with teal light lines, the office-worker operators, Matt, '
              'the villains as designed), modern office and night-city settings, and props of those settings.' + (' For a page: its box layout is given (the reference transposed into a locked landscape grid); layout differences from the reference are NOT inventions.' if kind(b) == 'page' else '') + ' Judge TECHNIQUE only. Everything else must come from the references. Score 0-100, strictly: style = how closely our art matches the '
              'references\' drawing and printing technique (hand-inked line, feathered hatching, spotted blacks, halftone dots, flat print colour, newsprint feel); '
              '100 = indistinguishable technique; modern digital illustration, clip-art, soft or mushy edges, glows, gradients or 1990s computer graphics score low.'
              + (' boxes = for each box of our page in reading order, composition 0-100: how closely it copies its numbered reference panel\'s camera, framing, poses and placement.' if b.get('boxRefs') else ' composition = how closely it keeps the reference panel\'s camera, framing, poses and placement.' if b.get('after') else '')
              + (' identity = how closely each character matches their model sheet (face, hair, glasses, build, costume details, proportions).' if ns else '')
              + ' depthShadowPlanes = true only if every panel builds depth from layered shadow planes as the references do (a dark foreground mass or silhouette, '
              'mid-ground action, receding background shapes in stepped values, spotted blacks and cast shadows).'
              ' movementStaged = true only if every panel stages motion as the references do (figures caught mid-action, dynamic diagonals, clear lines of action, '
              'reference-style motion lines where action happens; a static figure only as deliberate contrast), without cheesy effects.'
              + ' inventions = list every visual element or treatment in our art that is NOT present in the reference pages and is NOT one of the allowed departures '
              '(for example a rendering effect, a lighting trick, a texture, a graphic device, a costume or prop style, a border or layout device); an empty list '
              'means nothing is invented. Give concise reasons.')
    last = d / 'codex-score.last.json'
    cmd = ['codex', 'exec', '--skip-git-repo-check', '-s', 'read-only', '--output-schema', str(schema), '-o', str(last)]
    for i in imgs: cmd += ['-i', i]
    r = subprocess.run(cmd + ['-'], input=prompt, text=True, capture_output=True, timeout=1200, shell=(os.name == 'nt'))
    k = json.loads(last.read_text()) if last.exists() else {'error': (r.stdout + r.stderr)[-600:]}
    if k.get('boxes'): k['composition'] = min(x['composition'] for x in k['boxes'])  # the weakest box decides
    k.update({'svg': art_stem(pid, v), 'prompt': prompt, 'inputs': [x.get('source', x['path']) for x in refs] + [rel(p) for p in sheets] + ['review-1600.png']})
    (d / 'codex-score.json').write_text(json.dumps(k, indent=1))
    with ART_LOG.open('a', encoding='utf-8') as f:
        f.write(f'| {pid} {art_stem(pid, v)} (Codex) | style {k.get("style")} | comp {k.get("composition", "-")} | identity {k.get("identity", "-")} | invented: {k.get("inventions")} | {str(k.get("reasons", k.get("error", "")))[:300]} |\n')
    print('score', pid, {x: k.get(x) for x in ('style', 'composition', 'identity', 'depthShadowPlanes', 'movementStaged', 'inventions')})



STAGES = {'prompt': stage_prompt, 'generate': stage_generate, 'print': stage_print, 'trace': stage_trace, 'review': stage_review, 'measure': stage_measure}
MANUAL = {'import': stage_import, 'judge': stage_judge, 'score': stage_score, 'integrate': stage_integrate, 'box-prompt': stage_box_prompt}


def sheet(ids):
    """Contact sheet: each image's render (beside its reference pages with --pair-refs). It goes straight into the image
    library (assets/experiments/comic-b/contact-sheets/<name>-<stamp>.png) and is registered there, so Matt can preview it;
    never into discussion/ (Matt, 2026-10-02)."""
    js = WORK / '_sheet.cjs'
    js.write_text(r"""
const sharp = require(process.argv[2]); const [, , , out, cols, ...cells] = process.argv;
(async () => { const W = 620, H = 620, C = +cols, comps = [];
  for (const [i, c] of cells.entries()) { if (!c) continue; const [file, label] = c.split('|'); const x = (i % C) * W, y = Math.floor(i / C) * (H + 22);
    comps.push({ input: await sharp(file).resize({ width: W - 8, height: H - 8, fit: 'contain', background: '#111' }).toBuffer(), left: x + 4, top: y + 22 });
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="20"><text x="4" y="15" font-family="Arial" font-size="13" fill="#fff">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`), left: x, top: y }); }
  await sharp({ create: { width: W * C, height: Math.ceil(cells.length / C) * (H + 22), channels: 3, background: '#222' } }).composite(comps).png().toFile(out); })();
""")
    cells = []; cols = 3
    for pid in ids:
        f = WORK / pid / 'review-1600.png'
        if not f.exists(): continue
        rd = lambda n: json.loads((WORK / pid / n).read_text()) if (WORK / pid / n).exists() else {}
        j, o, m = rd('judge.json'), rd('optimize.json'), rd('measure.json')
        label = f'{pid} style {j.get("score", "?")}' + (f' comp {j["composition"]}' if j.get('composition') is not None else '') + f' | {o.get("bytes", 0) // 1024}KB/{o.get("gzipBytes", 0) // 1024}KBgz | black {m.get("blackPct", "?")}%'
        if ARGS.pair_refs:
            b = brief(pid); after = b.get('after')
            refs = [ref_png(after['ref'], after.get('crop'))] if after else [ref_png(r) for r in (b.get('refs') or cfg()['styleSets'][b.get('styleSet', cfg()['defaultStyleSet'])])[:1]]
            cols = 3
            cells += [f'{r["path"]}|reference: {Path(r["source"]).name[:50]}' for r in refs][:1] + [f'{f}|{label}', f'{WORK / pid / "review-zoom3x.png"}|3x zoom']
        else: cells.append(f'{f}|{label}')
    name = re.sub(r'[^a-z0-9]+', '-', (ARGS.name or ARGS.story or 'sheet').lower()).strip('-')
    out = LIB / 'assets/experiments/comic-b/contact-sheets' / f'{name}-{time.strftime("%Y%m%d-%H%M%S")}.png'; out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['node', str(js), str(NODE_MODULES / 'sharp'), str(out), str(cols), *cells], check=True); print('sheet', out)
    rel = out.relative_to(LIB).as_posix(); rid = 'comic-b-review-' + re.sub(r'[^a-z0-9]+', '-', rel[len('assets/experiments/comic-b/'):-4].lower()).strip('-')
    desc = f'Contact sheet of {", ".join(ids)} for review (comic_art.py sheet{" --pair-refs" if ARGS.pair_refs else ""}).'
    payload = WORK / '_receipts' / f'{rid}.json'; payload.parent.mkdir(parents=True, exist_ok=True)
    payload.write_text(json.dumps({'records': [{'id': rid, 'logicalId': None, 'collection': 'experiments', 'title': f'Comic B · Contact sheet {name}',
        'description': desc, 'service': 'Comic B contact sheets', 'category': 'Comic B', 'publicUse': 'not-selected',
        'treatments': {'comic-review': {'path': rel, 'status': 'review-evidence', 'sourceName': out.name,
                                        'note': f'{desc} Review evidence, not artwork for the site; not approved by Matt.'}}}]}, indent=1), encoding='utf-8')
    r = subprocess.run([sys.executable, str(HELPER), 'register', '--library', str(LIB), '--payload', str(payload), '--receipt-dir', str(WORK / '_receipts' / rid)], capture_output=True, text=True)
    if r.returncode: raise SystemExit(f'Registering {rel} failed: {r.stderr or r.stdout}')
    print('registered', rel)


def run_all(pid, v):
    """Generate a raw master (or explicitly retrace one), without automatic style campaigns or integration."""
    try:
        selected = ('trace',) if ARGS.retrace else ('prompt', 'generate')
        for name in selected: STAGES[name](pid, v)
        # No automatic quantization, style-score call, reference measurement or integration.
        # Inspect the generated master and record a content review before browser integration.
        return None
    except BaseException as e:
        msg = f'{pid}: {e if isinstance(e, SystemExit) else traceback.format_exc(limit=3)}'
        print('FAILED', msg, flush=True); (WORK / '_failures.log').open('a', encoding='utf-8').write(msg + '\n'); return msg


def main():
    global ARGS
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('stage', choices=[*STAGES, *MANUAL, 'all', 'setup', 'check', 'sheet'])
    ap.add_argument('--panel', help='one id, or several separated by commas'); ap.add_argument('--story'); ap.add_argument('--every', action='store_true')
    ap.add_argument('--brief', help='art brief JSON (default wiki/image-library/records/comic-b-art-pipeline-inputs-20260928/art-brief.json)')
    ap.add_argument('--version', type=int, default=1); ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--allow-version-drift', action='store_true')
    ap.add_argument('--retrace', type=int, help='re-trace the registered raster vN with the current config as SVG vN-tK (stages trace, review, measure)')
    ap.add_argument('--score', type=int, help='Historical scoring only; not an integration gate'); ap.add_argument('--composition', type=int); ap.add_argument('--reasons')
    ap.add_argument('--source'); ap.add_argument('--prompt-file'); ap.add_argument('--inputs-file'); ap.add_argument('--generation-record')
    ap.add_argument('--review-file', help='Actual content review JSON bound to master and current story hashes')
    ap.add_argument('--registered-master', help='Exact current catalog native PNG under wiki/image-library/assets; judge/integrate only')
    ap.add_argument('--catalog-record'); ap.add_argument('--catalog-treatment'); ap.add_argument('--master-sha256')
    ap.add_argument('--public-stem', help='Extensionless output path confined to site/public/comic/<story>')
    ap.add_argument('--native-png-public-alias', help='Optional exact canonical-basename PNG path inside owned site/public/comic/<story>; registered integrate only')
    ap.add_argument('--native-png-only', action='store_true', help='With explicit PNG alias and registered gates, copy native PNG only; no AVIF/WebP encoder')
    ap.add_argument('--review-output', help='New exact review receipt in ignored .codex/worktrees; registered judge only')
    ap.add_argument('--receipt-output', help='New integration receipt in ignored .codex/worktrees; registered integrate only')
    ap.add_argument('--pair-refs', action='store_true'); ap.add_argument('--name')
    ARGS = ap.parse_args()
    if any(getattr(ARGS, n) for n in ('registered_master', 'catalog_record', 'catalog_treatment', 'master_sha256', 'public_stem', 'review_output', 'receipt_output', 'native_png_public_alias', 'native_png_only')):
        if ARGS.stage not in ('judge', 'integrate'): raise SystemExit('Registered delivery flags require judge or integrate')
        if not ARGS.registered_master: raise SystemExit('Registered metadata flags require --registered-master')
    if ARGS.stage == 'setup': return setup()
    # Native import, content review and delivery do not need the old vector/calibration toolchain.
    if ARGS.stage not in ('import', 'judge', 'integrate', 'box-prompt'):
        try:
            import vtracer, potrace  # noqa: F401
        except ImportError:  # re-run inside the pinned venv
            if venv_python().exists() and Path(sys.executable).resolve() != venv_python().resolve():
                raise SystemExit(subprocess.run([str(venv_python()), str(Path(__file__)), *sys.argv[1:]]).returncode)
            raise SystemExit(f'vtracer/potracer not installed; run: python {Path(__file__).name} setup  (venv: {VENV})')
        found, drift = versions(strict=True)
        if ARGS.stage == 'check': return print('check', found, 'drift', drift or 'none')
    if ARGS.jobs > 2: raise SystemExit('At most 2 codex processes at once (repo rule).')
    rows = brief_rows()
    ids = ARGS.panel.split(',') if ARGS.panel else [r['id'] for r in rows if not r['id'].startswith('_') and (ARGS.every or r.get('story') == ARGS.story)]
    if not ids: raise SystemExit('Give --panel, --story or --every')
    if ARGS.stage == 'sheet': return sheet(ids)
    if ARGS.stage == 'all':
        with ThreadPoolExecutor(ARGS.jobs) as ex: errors = [e for e in ex.map(lambda i: run_all(i, ARGS.version), ids) if e]
        print('done', len(ids) - len(errors), 'ok,', len(errors), 'failed'); raise SystemExit(1 if errors else 0)
    fn = STAGES.get(ARGS.stage) or MANUAL[ARGS.stage]
    for i in ids:
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', i): raise SystemExit('Art id must be a lowercase slug')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*|_[a-z0-9-]+', brief(i).get('story', '')): raise SystemExit('Art story must be a safe slug')
        fn(i, ARGS.version)


if __name__ == '__main__':
    main()
