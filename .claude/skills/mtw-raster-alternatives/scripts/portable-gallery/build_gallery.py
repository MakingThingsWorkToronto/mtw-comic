#!/usr/bin/env python3
"""Export the canonical MTW image library without replacing its browser runtime.

The existing wiki/image-library/manifest.json and its registered files are required.
Historical discussion/site inputs never bootstrap a competing gallery. Register
new artwork with maintain_library.py before exporting it.

Output must be outside the repo/helper. Exact source plans and hash receipts go
beside the output in <output-name>.records/. --plan-only lists files without
copying them. The retained --overrides argument reports the registration command;
it cannot update or replace the canonical catalog.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--overrides", action="append", default=[], type=Path)
    parser.add_argument("--plan-only", action="store_true")
    args = parser.parse_args()
    repo = args.repo.resolve(strict=True)
    out = args.output.resolve()
    helper = Path(__file__).resolve().parent
    if out == repo or repo in out.parents or out in repo.parents:
        raise ValueError("Output must be an external staging directory separate from the repo; the integrating writer imports exact files.")
    if out == helper or out in helper.parents or helper in out.parents:
        raise ValueError("Output must not contain, replace or sit inside the maintained helper package.")
    records_dir = out.with_name(out.name + ".records")
    if records_dir == helper or records_dir in helper.parents or helper in records_dir.parents:
        raise ValueError("Build records must remain outside the maintained helper package.")
    canonical_root = repo / "wiki/image-library"
    if not (canonical_root / "manifest.json").is_file():
        raise ValueError(
            f"Canonical image library is required: missing {canonical_root / 'manifest.json'}. "
            "Check --repo or recover the registered wiki/image-library catalog and its files before exporting. "
            "Historical discussion/site sources are not a fallback; register new artwork with maintain_library.py."
        )
    if args.overrides:
        raise ValueError("Use maintain_library.py register to update the canonical library; --overrides cannot overwrite its catalog.")
    sys.dont_write_bytecode = True
    from maintain_library import export_library
    print(json.dumps(export_library(canonical_root, out, records_dir, args.plan_only), ensure_ascii=False))


if __name__ == "__main__":
    main()
