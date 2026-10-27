#!/usr/bin/env python3
"""Plain-assert test for cut_planes.py. Run: python scripts/comics/test_cut_planes.py"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "cut_planes.py"
W, H = 400, 300


def make_master(path):
    m = np.zeros((H, W, 3), dtype=np.uint8)
    m[:] = (20, 20, 30)
    m[15:160, 220:340] = (60, 60, 80)  # tower body (dark enough to stay uncut)
    for r in range(6):
        for c in range(4):
            y, x = 25 + 25 * r, 230 + 28 * c
            m[y:y + 8, x:x + 8] = (230, 220, 150)  # bright windows
    m[60:150, 40:130] = (95, 196, 201)  # teal screen
    m[165:225, 248:296] = (180, 90, 60)  # prop
    Image.fromarray(m, "RGB").save(path)


def run(master, plan, out):
    plan_path = Path(out).with_suffix(".json")
    plan_path.write_text(json.dumps(plan))
    return subprocess.run([sys.executable, str(SCRIPT), "--master", str(master), "--plan",
                           str(plan_path), "--out", str(out)], capture_output=True, text=True)


def main():
    plan = {"planes": [
        {"id": "tower-lights", "role": "light", "mode": "luminance", "rect": [0.55, 0.05, 0.3, 0.6],
         "threshold": 170, "feather": 1, "floors": 3},
        {"id": "screen-glow", "role": "light", "mode": "hue", "rect": [0.1, 0.2, 0.3, 0.3],
         "hue": [165, 200], "minSat": 60, "minVal": 90, "feather": 1},
        {"id": "phone", "role": "props", "mode": "rect", "rect": [0.62, 0.55, 0.12, 0.2], "feather": 2},
        {"id": "agent", "role": "agents", "mode": "color", "rect": [0, 0, 1, 1],
         "color": "#5fc4c9", "tolerance": 40, "feather": 1}],
        "base": {"id": "background", "unlit": 0.25}}
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        master = td / "master.png"
        make_master(master)
        out = td / "planes"
        res = run(master, plan, out)
        assert res.returncode == 0, res.stdout + res.stderr
        for f in ["tower-lights", "screen-glow", "phone", "agent", "background",
                  "tower-lights-floor-01", "tower-lights-floor-02", "tower-lights-floor-03",
                  "planes-receipt"]:
            assert (out / f).with_suffix(".json" if f == "planes-receipt" else ".png").exists(), f
        rec = json.loads((out / "planes-receipt.json").read_text())
        assert rec["schema"] == "comic-planes/1"
        assert rec["composite"]["ok"] and rec["composite"]["meanError"] <= 2.0, rec["composite"]
        planes = {p["id"]: p for p in rec["planes"]}
        with Image.open(out / "tower-lights.png") as im:
            assert im.mode == "RGBA" and im.size == (W, H)
        with Image.open(out / "background.png") as bg:
            assert bg.mode == "RGB"
        # floors: 01 is the bottom band, so bbox y is ascending bottom to top (smaller y upward)
        ys = [f["bbox"][1] for f in planes["tower-lights"]["floors"]]
        assert len(ys) == 3 and ys[0] > ys[1] > ys[2], ys
        cov = planes["tower-lights"]["coverage"]
        assert 0.005 < cov < 0.05, cov  # 24 windows of 8x8 plus feather ring
        # rect plane bbox equals its rect (to within the 2px feather)
        bx, by, bw, bh = planes["phone"]["bbox"]
        for got, want, size in zip((bx, by, bx + bw, by + bh), (0.62, 0.55, 0.74, 0.75),
                                   (W, H, W, H)):
            assert abs(got - want) * size <= 2.5, (got, want)
        assert 0 < planes["screen-glow"]["coverage"] < 0.6
        # an empty cut fails with exit 1
        empty = {"planes": [{"id": "none", "role": "light", "mode": "luminance",
                             "threshold": 255, "feather": 0}]}
        res = run(master, empty, td / "empty")
        assert res.returncode == 1, res.stdout + res.stderr
        assert "coverage 0" in res.stderr, res.stderr
        # a cut that takes the whole image fails too
        big = {"planes": [{"id": "all", "role": "props", "mode": "rect"}]}
        assert run(master, big, td / "big").returncode == 1
    print("test_cut_planes: all assertions passed")


if __name__ == "__main__":
    main()
