#!/usr/bin/env python3
"""Cut animated planes from a master image by pixel mask (never by image-model redraw).

Usage:
  python scripts/comics/cut_planes.py --master <png> --plan <planes.json> --out <dir> [--json]

Plan: {"planes":[{id, role, mode, rect:[x,y,w,h] fractions, feather, floors, ...}],
       "base":{"id":"background","unlit":0.25}}
Modes: luminance (threshold), hue (hue:[lo,hi] degrees, minSat, minVal on 0-255),
       rect (everything in rect), color (color "#rrggbb", tolerance RGB distance).
Masks get a 3x3 open/close, then a box-blur feather. Each plane is a full-canvas
RGBA PNG (RGB = master, alpha = mask); `floors: N` also writes <id>-floor-01..NN
(01 = bottom band of the rect). The base is opaque RGB: master, with light-plane
cut pixels darkened by `unlit`. Planes composited in plan order over the base must
match the master (mean error <= 2.0). Writes planes-receipt.json (comic-planes/1).
Exit 1 when the composite fails or a plane has coverage 0 or > 0.6.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

MAX_MEAN_ERROR = 2.0
MAX_COVERAGE = 0.6


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def rect_px(rect, w, h):
    fx, fy, fw, fh = rect
    x0, y0 = int(round(fx * w)), int(round(fy * h))
    x1, y1 = int(round((fx + fw) * w)), int(round((fy + fh) * h))
    return max(0, x0), max(0, y0), min(w, x1), min(h, y1)


def hsv(rgb):
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    mx, mn = f.max(axis=2), f.min(axis=2)
    d = mx - mn
    safe = np.where(d == 0, 1, d)
    hue = np.where(mx == r, ((g - b) / safe) % 6,
                   np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) * 60
    hue = np.where(d == 0, 0, hue)
    sat = np.where(mx == 0, 0, d / np.where(mx == 0, 1, mx) * 255)
    return hue, sat, mx


def raw_mask(rgb, p):
    mode = p.get("mode", "rect")
    if mode == "luminance":
        lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
        return lum >= p.get("threshold", 170)
    if mode == "hue":
        hue, sat, val = hsv(rgb)
        lo, hi = p["hue"]
        inr = (hue >= lo) & (hue <= hi) if lo <= hi else (hue >= lo) | (hue <= hi)
        return inr & (sat >= p.get("minSat", 0)) & (val >= p.get("minVal", 0))
    if mode == "color":
        c = p["color"].lstrip("#")
        target = np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)
        return np.sqrt(((rgb - target) ** 2).sum(axis=2)) <= p.get("tolerance", 30)
    if mode == "rect":
        return np.ones(rgb.shape[:2], dtype=bool)
    raise SystemExit(f"unknown mode {mode!r} in plane {p.get('id')}")


def _neigh(m, fn):
    pad = np.pad(m, 1, mode="edge")
    h, w = m.shape
    views = [pad[dy:dy + h, dx:dx + w] for dy in range(3) for dx in range(3)]
    return fn(np.stack(views), axis=0)


def erode(m):
    return _neigh(m, np.min)


def dilate(m):
    return _neigh(m, np.max)


def clean(m):
    m = dilate(erode(m))  # open: drop specks
    return erode(dilate(m))  # close: fill pinholes


def box_blur(a, r):
    if r <= 0:
        return a
    k = 2 * r + 1
    for axis in (0, 1):
        a = np.moveaxis(a, axis, 0)
        c = np.cumsum(np.pad(a, [(r, r)] + [(0, 0)] * (a.ndim - 1)), axis=0)
        c = np.concatenate([np.zeros_like(c[:1]), c])
        a = np.moveaxis((c[k:] - c[:-k]) / k, 0, axis)
    return a


def make_alpha(rgb, p):
    h, w = rgb.shape[:2]
    x0, y0, x1, y1 = rect_px(p.get("rect", [0, 0, 1, 1]), w, h)
    m = np.zeros((h, w), dtype=bool)
    m[y0:y1, x0:x1] = raw_mask(rgb[y0:y1, x0:x1], p)
    m = clean(m)
    m[:y0], m[y1:], m[:, :x0], m[:, x1:] = False, False, False, False
    a = box_blur(m.astype(np.float32), int(p.get("feather", 0)))
    return np.rint(a * 255).astype(np.uint8)


def bbox(alpha):
    ys, xs = np.nonzero(alpha)
    if len(xs) == 0:
        return None
    h, w = alpha.shape
    return [round(xs.min() / w, 5), round(ys.min() / h, 5),
            round((xs.max() + 1 - xs.min()) / w, 5), round((ys.max() + 1 - ys.min()) / h, 5)]


def save_plane(rgb, alpha, path):
    Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(path)
    return sha256(path)


def cut(master_path, plan, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(master_path).convert("RGB"))
    h, w = rgb.shape[:2]
    base_cfg = plan.get("base", {})
    unlit = float(base_cfg.get("unlit", 0.25))
    base = rgb.astype(np.float32)
    planes, alphas = [], []
    for p in plan["planes"]:
        alpha = make_alpha(rgb, p)
        alphas.append(alpha)
        if p.get("role") == "light":
            base[alpha > 0] = rgb[alpha > 0].astype(np.float32) * unlit
        file = f"{p['id']}.png"
        entry = {"id": p["id"], "role": p.get("role"), "mode": p.get("mode", "rect"),
                 "file": file, "sha256": save_plane(rgb, alpha, out / file),
                 "bbox": bbox(alpha), "coverage": round(float((alpha > 0).mean()), 6),
                 "floors": []}
        n = int(p.get("floors", 0))
        if n:
            x0, y0, x1, y1 = rect_px(p.get("rect", [0, 0, 1, 1]), w, h)
            edges = [y0 + int(round(k * (y1 - y0) / n)) for k in range(n + 1)]
            for i in range(1, n + 1):  # 01 = bottom band
                fa = np.zeros_like(alpha)
                top, bot = edges[n - i], edges[n - i + 1]
                fa[top:bot] = alpha[top:bot]
                ff = f"{p['id']}-floor-{i:02d}.png"
                entry["floors"].append({"file": ff, "sha256": save_plane(rgb, fa, out / ff),
                                        "bbox": bbox(fa)})
        planes.append(entry)
    base8 = np.rint(base).astype(np.uint8)
    base_file = f"{base_cfg.get('id', 'background')}.png"
    Image.fromarray(base8, "RGB").save(out / base_file)
    comp = base8.astype(np.float32)
    for a in alphas:
        af = (a.astype(np.float32) / 255)[..., None]
        comp = comp * (1 - af) + rgb.astype(np.float32) * af
    err = np.abs(np.rint(comp) - rgb.astype(np.float32))
    mean_err, max_err = float(err.mean()), float(err.max())
    receipt = {"schema": "comic-planes/1",
               "master": {"path": str(master_path), "sha256": sha256(master_path),
                          "width": w, "height": h},
               "planes": planes,
               "base": {"file": base_file, "sha256": sha256(out / base_file)},
               "composite": {"meanError": round(mean_err, 4), "maxError": round(max_err, 2),
                             "ok": mean_err <= MAX_MEAN_ERROR}}
    (out / "planes-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    return receipt


def problems(receipt):
    bad = []
    for p in receipt["planes"]:
        if p["coverage"] == 0:
            bad.append(f"{p['id']}: coverage 0 (nothing cut)")
        elif p["coverage"] > MAX_COVERAGE:
            bad.append(f"{p['id']}: coverage {p['coverage']:.3f} > {MAX_COVERAGE} (cut too much)")
    if not receipt["composite"]["ok"]:
        bad.append(f"composite mean error {receipt['composite']['meanError']} > {MAX_MEAN_ERROR}")
    return bad


def main(argv=None):
    ap = argparse.ArgumentParser(description="Cut planes from a master by pixel mask.")
    ap.add_argument("--master", required=True)
    ap.add_argument("--plan", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--json", action="store_true", help="print the receipt as JSON")
    args = ap.parse_args(argv)
    plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
    receipt = cut(args.master, plan, args.out)
    if args.json:
        print(json.dumps(receipt, indent=2))
    else:
        print(f"{'plane':<18}{'role':<8}{'mode':<11}{'coverage':>9}  bbox")
        for p in receipt["planes"]:
            print(f"{p['id']:<18}{str(p['role']):<8}{p['mode']:<11}{p['coverage']:>9.4f}  {p['bbox']}"
                  + (f"  floors={len(p['floors'])}" if p["floors"] else ""))
        c = receipt["composite"]
        print(f"composite meanError={c['meanError']} maxError={c['maxError']} ok={c['ok']}")
    bad = problems(receipt)
    for b in bad:
        print("FAIL " + b, file=sys.stderr)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
