"""Whole-page art tools for Comic Story pages (mtw-comic-story, art stage; guide: references/art-pipeline.md).

    python page_tools.py template --page <page.json>     layout template PNG (dark ground, exact box rects, faint numbers)
    python page_tools.py detect   --page <page.json> --image <generated page PNG> [--out <regions.json>]
                                                          find each box's region on the generated page; writes regions JSON
                                                          and an overlay PNG to read
    python page_tools.py validate --page <page.json> --image <generated page PNG> --ref <reference page>
                                                          Codex scores layout, style and per-box composition against the
                                                          reference (0-100 with reasons); JSON written beside the page file

page.json: {"id", "size": [W, H], "margin": [mx, my] (fractions), "gutter": g (fraction of width),
            "boxes": [{"id", "rect": [x, y, w, h] (fractions of the inner area), "open": bool, "poly": [[x, y], ...] (optional)}]}
The template and its outputs live in the work folder until the caller registers them (comic_art.py conventions).
"""
import argparse, json, os, subprocess, tempfile
from pathlib import Path

LOCAL = Path(os.environ.get('LOCALAPPDATA') or tempfile.gettempdir())
WORK = Path(os.environ.get('COMIC_ART_WORK') or LOCAL / 'mtw-comic-art' / 'work')
GROUND = (11, 20, 25)
SEPARATOR = (26, 155, 161)  # brand teal #1a9ba1; never sampled paper


def geometry(p):
    """Pixel boxes on the page: rects map into the inner area; edges that meet another box are inset by half a gutter;
    outer edges sit on the margin, and an open box bleeds to the page edge."""
    W, H = p['size']; mx, my = p['margin']; g = p['gutter'] * W
    ix, iy, iw, ih = mx * W, my * H, W - 2 * mx * W, H - 2 * my * H
    out = []
    for b in p['boxes']:
        x, y, w, h = b['rect']; l, t, r, bt = ix + x * iw, iy + y * ih, ix + (x + w) * iw, iy + (y + h) * ih
        l += g / 2 if x > 0.001 else 0; t += g / 2 if y > 0.001 else 0
        r -= g / 2 if x + w < 0.999 else 0; bt -= g / 2 if y + h < 0.999 else 0
        if b.get('open'):  # bleeds off the page on its outer sides
            l = 0 if x <= 0.001 else l; t = 0 if y <= 0.001 else t; r = W if x + w >= 0.999 else r; bt = H if y + h >= 0.999 else bt
        out.append({**b, 'px': [round(l), round(t), round(r), round(bt)]})
    return out


def template(p, dst):
    from PIL import Image, ImageDraw, ImageFont
    W, H = p['size']; im = Image.new('RGB', (W, H), SEPARATOR); d = ImageDraw.Draw(im)
    try: font = ImageFont.truetype('arial.ttf', int(H * 0.09))
    except OSError: font = ImageFont.load_default()
    for i, b in enumerate(geometry(p), 1):
        l, t, r, bt = b['px']
        d.rectangle([l, t, r, bt], fill=(58, 64, 68) if not b.get('open') else (40, 46, 50), outline=None if b.get('open') else SEPARATOR, width=0 if b.get('open') else 6)
        d.text(((l + r) / 2, (t + bt) / 2), str(i), fill=(90, 98, 102), font=font, anchor='mm')
        if b.get('open'): d.text((l + 20, bt - 20), 'OPEN: no border, bleeds', fill=(110, 118, 122), font=ImageFont.load_default(), anchor='ls')
    im.save(dst); print('template', dst)


def detect(p, image, out):
    """For each inner edge of each box, search +-3% of the page for the gutter: the offset where a band of gutter width
    matches the branded teal along the whole edge (legacy white-page inputs remain readable). Edges without a clear band keep the template position. Writes regions (fractions of
    the page) and an overlay PNG (detected in teal, template in red)."""
    import numpy as np
    from PIL import Image, ImageDraw
    W, H = p['size']; g = max(3, int(p['gutter'] * W))
    im = Image.open(image).convert('RGB').resize((W, H), Image.LANCZOS); a = np.array(im, dtype=np.float32)
    teal = np.max(np.abs(a - np.array(SEPARATOR)), axis=2) <= 24
    # Prefer teal per edge; retained white-page inputs may also contain substantial teal artwork.
    legacy = (a.min(axis=2) > 200) & (np.ptp(a, axis=2) < 24)
    def band(mask, axis, pos, lo, hi):  # fraction of the segment matching the separator over a gutter-wide band centred at pos
        s = int(pos - g / 2); e = s + g
        if s < 0 or e > (W if axis == 'x' else H): return 0
        seg = mask[lo:hi, s:e] if axis == 'x' else mask[s:e, lo:hi].T
        return float(seg.all(axis=1).mean()) if seg.size else 0
    regions, notes = [], []
    for b in geometry(p):
        l, t, r, bt = b['px']; new = [l, t, r, bt]
        for k, (axis, pos, lo, hi, sign) in enumerate([('x', l, t, bt, -1), ('y', t, l, r, -1), ('x', r, t, bt, 1), ('y', bt, l, r, 1)]):
            if pos <= 1 or pos >= (W if axis == 'x' else H) - 1: continue  # outer or bleeding edge
            centre = pos + sign * g / 2; span = int(0.03 * W)
            candidates = range(int(centre - span), int(centre + span) + 1)
            best = max(candidates, key=lambda c: band(teal, axis, c, lo, hi))
            score = band(teal, axis, best, lo, hi)
            if score < 0.85:  # legacy fallback is local to this edge, never selected by whole-image colour counts
                best = max(candidates, key=lambda c: band(legacy, axis, c, lo, hi))
                score = band(legacy, axis, best, lo, hi)
            if score >= 0.85: new[k] = round(best - sign * g / 2)
            notes.append(f'{b["id"]} edge {"LTRB"[k]}: template {pos}, band {score:.2f} at {best - sign * g / 2:.0f}' + ('' if score >= 0.85 else ' (kept template)'))
        drift = max(abs(n - o) for n, o in zip(new, [l, t, r, bt])) / W
        reg = {'id': b['id'], 'rect': [round(new[0] / W, 4), round(new[1] / H, 4), round((new[2] - new[0]) / W, 4), round((new[3] - new[1]) / H, 4)], 'driftPctOfWidth': round(100 * drift, 2)}
        if b.get('open'): reg['open'] = True
        if b.get('poly'): reg['poly'] = b['poly']
        regions.append(reg)
    ov = Image.open(image).convert('RGB').resize((W, H)); dr = ImageDraw.Draw(ov)
    for b, reg in zip(geometry(p), regions):
        dr.rectangle(b['px'], outline=(220, 40, 40), width=3)
        x, y, w, h = reg['rect']; dr.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=(95, 196, 201), width=5)
    ovp = Path(out).with_suffix('.overlay.png'); ov.save(ovp)
    Path(out).write_text(json.dumps({'page': p['id'], 'size': p['size'], 'regions': regions, 'maxDriftPctOfWidth': max(r['driftPctOfWidth'] for r in regions), 'notes': notes}, indent=1))
    print('detect', out, 'overlay', ovp, 'max drift %', max(r['driftPctOfWidth'] for r in regions))


def validate(p, image, ref, out):
    schema = WORK / '_validate.schema.json'
    schema.write_text(json.dumps({'type': 'object', 'additionalProperties': False, 'required': ['layout', 'style', 'boxes', 'reasons'],
        'properties': {'layout': {'type': 'integer'}, 'style': {'type': 'integer'}, 'reasons': {'type': 'string'},
                       'boxes': {'type': 'array', 'items': {'type': 'object', 'additionalProperties': False, 'required': ['box', 'composition', 'reason'],
                                 'properties': {'box': {'type': 'integer'}, 'composition': {'type': 'integer'}, 'reason': {'type': 'string'}}}}}}))
    n = len(p['boxes'])
    prompt = (f'You are a strict comic-art reviewer. Image 1 is a 1980s comic page (the reference). Image 2 is our new page, a WIDE (landscape) '
              f'transposition of the reference\'s layout with our own characters, in black and teal on a dark ground (brand-teal #1a9ba1 gutters, margins and panel borders (historical reference separator colours are superseded) are intended, not a fault). '
              f'Its {n} boxes, in reading order, copy the reference\'s panels in order (box n after panel n). Do not edit or create any files. Score 0-100, strictly: '
              f'(1) layout: how exactly image 2 reproduces the reference\'s panel structure, proportions, margins, gutters and hand-inked borders, allowing for the '
              f'landscape transposition; (2) style: how closely image 2\'s drawing and printing (ink line, feathered hatching, spotted blacks, halftone dots, flat print '
              f'colour, newsprint feel) match the reference, 100 meaning indistinguishable in technique, and anything that looks like modern digital illustration or '
              f'1990s computer graphics scoring low; (3) for each box, composition: how closely it keeps its reference panel\'s camera, framing and placement. Give reasons.')
    last = WORK / '_validate.last.json'
    cmd = ['codex', 'exec', '--skip-git-repo-check', '-s', 'read-only', '--output-schema', str(schema), '-o', str(last), '-i', str(ref), '-i', str(image), '-']
    r = subprocess.run(cmd, input=prompt, text=True, capture_output=True, timeout=900, shell=(os.name == 'nt'))
    res = json.loads(last.read_text()) if last.exists() else {'error': r.stdout[-800:] + r.stderr[-800:]}
    res['prompt'] = prompt; res['inputs'] = {'reference': str(ref), 'page': str(image)}
    Path(out).write_text(json.dumps(res, indent=1)); print('validate', json.dumps({k: res.get(k) for k in ('layout', 'style')}), out)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('op', choices=['template', 'detect', 'validate']); ap.add_argument('--page', required=True)
    ap.add_argument('--image'); ap.add_argument('--ref'); ap.add_argument('--out')
    a = ap.parse_args(); p = json.loads(Path(a.page).read_text(encoding='utf-8'))
    if a.op == 'template': template(p, a.out or WORK / f'{p["id"]}-layout.png')
    elif a.op == 'detect': detect(p, a.image, a.out or WORK / f'{p["id"]}.regions.json')
    else: validate(p, a.image, a.ref, a.out or WORK / f'{p["id"]}.validation.json')
