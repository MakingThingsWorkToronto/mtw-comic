#!/usr/bin/env python3
"""Exercise canonical maintenance in a fresh external fixture with exact artwork copies.

No browser, generation, source mutation, folder copy or repository write occurs.
"""
from copy import deepcopy
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def check_svg_dimensions(workspace):
    """Small, non-artwork SVG fixtures exercise the real dimension reader."""
    sys.dont_write_bytecode = True
    from maintain_library import image_details, treatment_identity
    folder = workspace / "svg-dimension-fixtures"
    folder.mkdir()
    valid = [
        ("standard", 'viewBox="0 0 109 64"', 109, 64, "viewBox"),
        ("whitespace", 'viewBox="0&#x9;0&#xA;109&#xD;64"', 109, 64, "viewBox"),
        ("commas", 'viewBox="0,0,109,64"', 109, 64, "viewBox"),
        ("mixed-separators", 'viewBox="0 ,0, 109 64"', 109, 64, "viewBox"),
        ("exponents", 'viewBox="-1e2 +.5 1.09e2 6.4e1"', 109, 64, "viewBox"),
        ("fractional-extents", 'viewBox="0 0 .125 1.5"', .125, 1.5, "viewBox"),
        ("legacy", 'viewbox="0 0 109 64"', 109, 64, "legacy-viewbox"),
        ("legacy-whitespace", 'viewbox="0&#x9;0&#xA;109&#xD;64"', 109, 64, "legacy-viewbox"),
        ("standard-precedence", 'viewBox="0 0 109 64" viewbox="0 0 5 6"', 109, 64, "viewBox"),
        ("relative-intrinsic-with-viewbox", 'viewBox="0 0 24 24" width="1em" height="1em"', 24, 24, "viewBox"),
        ("intrinsic-unitless", 'width="109" height="64"', 109, 64, "intrinsic-size"),
        ("intrinsic-px", 'width="109px" height="64px"', 109, 64, "intrinsic-size"),
        ("intrinsic-inches", 'width="2in" height=".5in"', 192, 48, "intrinsic-size"),
        ("intrinsic-centimetres", 'width="2.54cm" height="1.27cm"', 96, 48, "intrinsic-size"),
        ("intrinsic-millimetres", 'width="25.4mm" height="12.7mm"', 96, 48, "intrinsic-size"),
        ("intrinsic-quarter-millimetres", 'width="101.6q" height="50.8q"', 96, 48, "intrinsic-size"),
        ("intrinsic-points", 'width="72pt" height="36pt"', 96, 48, "intrinsic-size"),
        ("intrinsic-picas", 'width="6pc" height="3pc"', 96, 48, "intrinsic-size"),
        ("intrinsic-exponent", 'width="1.09e2PX" height="6.4e1px"', 109, 64, "intrinsic-size"),
    ]
    invalid = [
        ("missing", ""), ("empty-viewbox", 'viewBox=""'),
        ("short-viewbox", 'viewBox="0 0 109"'), ("long-viewbox", 'viewBox="0 0 109 64 5"'),
        ("repeated-comma", 'viewBox="0,,0,109,64"'), ("trailing-comma", 'viewBox="0 0 109 64,"'),
        ("viewbox-units", 'viewBox="0 0 109px 64"'), ("non-svg-space", 'viewBox="0&#xa0;0 109 64"'),
        ("zero-width", 'viewBox="0 0 0 64"'), ("zero-height", 'viewBox="0 0 109 0"'),
        ("negative-width", 'viewBox="0 0 -109 64"'), ("negative-height", 'viewBox="0 0 109 -64"'),
        ("nan-viewbox", 'viewBox="0 0 NaN 64"'), ("infinite-viewbox", 'viewBox="0 0 Infinity 64"'),
        ("overflow-viewbox", 'viewBox="0 0 1e999 64"'), ("overflow-origin", 'viewBox="1e999 0 109 64"'),
        ("underflow-extent", 'viewBox="0 0 1e-999 64"'),
        ("invalid-standard-no-fallback", 'viewBox="invalid" viewbox="0 0 109 64" width="109" height="64"'),
        ("legacy-zero", 'viewbox="0 0 0 64"'), ("legacy-overflow", 'viewbox="0 0 109 1e999"'),
        ("intrinsic-width-only", 'width="109"'), ("intrinsic-height-only", 'height="64"'),
        ("intrinsic-percentage", 'width="100%" height="64"'), ("intrinsic-em", 'width="1em" height="1em"'),
        ("intrinsic-auto", 'width="auto" height="64"'), ("intrinsic-zero", 'width="0" height="64"'),
        ("intrinsic-negative", 'width="109" height="-64"'), ("intrinsic-nan", 'width="NaN" height="64"'),
        ("intrinsic-infinity", 'width="Infinity" height="64"'), ("intrinsic-overflow", 'width="1e999px" height="64"'),
        ("intrinsic-underflow", 'width="1e-999px" height="64"'),
        ("external-dependency", 'viewBox="0 0 109 64"><image href="https://example.invalid/art.png"/'),
    ]
    results = []
    for name, attrs, width, height, source in valid:
        path = folder / (name + ".svg")
        path.write_bytes(('<svg xmlns="http://www.w3.org/2000/svg" ' + attrs + '/>').encode("utf-8"))
        before = digest(path)
        details = image_details(path)
        assert math.isclose(details["width"], width) and math.isclose(details["height"], height), name
        assert details["dimensionSource"] == source and "not a rendered viewport measurement" in details["dimensionNote"], name
        if source == "legacy-viewbox":
            assert "nonstandard lowercase viewbox" in details["dimensionNote"], name
        review = {"status": "retained-unreviewed", "note": "Original review untouched."}
        assert treatment_identity({**review, **details}) == review, name
        assert digest(path) == before, name
        results.append({"case": name, "expected": "accepted", "details": details, "sha256Unchanged": before})
    for name, attrs in invalid:
        path = folder / (name + ".svg")
        end = '></svg>' if name == "external-dependency" else '/>'
        path.write_bytes(('<svg xmlns="http://www.w3.org/2000/svg" ' + attrs + end).encode("utf-8"))
        before = digest(path)
        try:
            image_details(path)
        except ValueError as error:
            results.append({"case": name, "expected": "rejected", "error": str(error), "sha256Unchanged": before})
        else:
            raise AssertionError("Invalid SVG inspection escaped: " + name)
        assert digest(path) == before, name
    evidence = {"accepted": len(valid), "rejected": len(invalid), "cases": results,
                "browserReview": "not performed; declaration inspection only", "artworkGenerated": 0}
    write(workspace / "svg-dimension-check.json", evidence)
    return evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-library", required=True, type=Path)
    parser.add_argument("--workspace", required=True, type=Path)
    args = parser.parse_args()
    source = args.source_library.resolve(strict=True)
    workspace = args.workspace.resolve()
    helper = Path(__file__).resolve().parent
    for protected in [source, helper]:
        if workspace == protected or protected in workspace.parents or workspace in protected.parents:
            raise ValueError("Use an external, separate fixture workspace")
    if workspace.exists():
        raise ValueError("Use a fresh fixture workspace; nothing is deleted or replaced")
    workspace.mkdir(parents=True)
    helper_before = {p.name: digest(p) for p in helper.iterdir() if p.is_file()}
    sys.dont_write_bytecode = True
    from check_staging import check_missing_canonical
    missing_canonical = check_missing_canonical(helper, workspace)
    dimensions = check_svg_dimensions(workspace)
    catalog = read(source / "manifest.json")
    diagram = next(r for r in catalog["records"] if r["collection"] == "diagrams" and all(r["treatments"].get(s, {}).get("path") for s in ["svg-flat", "svg-outline", "holographic", "photorealistic"]))
    another = next(r for r in catalog["records"] if r["collection"] == "diagrams" and r["id"] != diagram["id"])
    repo = workspace / "isolated-repo"
    root = repo / "wiki/image-library"
    root.mkdir(parents=True)
    source_guards = {}
    checks = [f"missing canonical catalog rejected before historical reads or output writes: {len(missing_canonical)} cases",
              f"SVG dimension inspection: {dimensions['accepted']} supported forms and {dimensions['rejected']} invalid/dependent forms; bytes and review identity preserved"]
    counter = 0
    runtime_operations = []

    def copy_exact(src, dst):
        source_guards[str(src)] = digest(src)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        assert digest(dst) == source_guards[str(src)]

    fixture_record = {"id": "fixture-diagram", "logicalId": "fixture-diagram", "collection": "diagrams", "title": "Fixture diagram",
                      "description": "Exact preserved source images for a maintenance fixture only.", "service": "Fixture", "category": "Fixture", "references": [], "treatments": {}}
    for style, treatment in diagram["treatments"].items():
        if style not in {"svg-flat", "svg-outline", "holographic", "photorealistic"}:
            continue
        src = source / treatment["path"]
        relative = "assets/diagrams/" + style + src.suffix
        copy_exact(src, root / relative)
        fixture_record["treatments"][style] = {"path": relative, "sha256": digest(src), "status": "draft" if style == "photorealistic" else "unreviewed-preview", "note": "Fixture status retained exactly."}
    metadata = root / "assets/metadata/fixture-v1.json"
    write(metadata, {"id": "fixture-diagram", "version": 1, "elements": [], "relationships": []})
    fixture_record["treatments"]["svg-flat"]["metadata"] = "assets/metadata/fixture-v1.json"
    # The browser console is retired (MTW Studio /m/images); maintenance must work without it and never reinstall it.
    retired_runtime = ["index.html", "browser.js", "library.css"]
    for name in ["barlow-condensed-600.woff2", "open-sans-400.woff2", "open-sans-600.woff2"]:
        copy_exact(source / "assets/fonts" / name, root / "assets/fonts" / name)
    (root / ".gitattributes").write_bytes(b"* -text\n")
    fixture = {"schemaVersion": 1, "name": "Fixture", "canonical": True, "iconAliases": {"fixture-alias": "fixture-diagram"},
               "storagePolicy": {"owner": "canonical fixture"}, "defaultTreatment": "svg-flat", "records": [fixture_record], "files": []}
    write(root / "manifest.json", fixture)
    # A prior snapshot gives preservation guards the same baseline as an existing library.
    (root / "data.js").write_bytes(b"window.MTW_LIBRARY = " + json.dumps(fixture).encode("utf-8") + b";\n")

    def run(operation, payload=None, failure=None):
        nonlocal counter
        counter += 1
        cmd = [sys.executable, "-B", str(helper / "maintain_library.py"), operation, "--library", str(root), "--receipt-dir", str(workspace / f"receipt-{counter:02}")]
        if payload is not None:
            path = workspace / f"payload-{counter:02}.json"
            write(path, payload)
            cmd.extend(["--payload", str(path)])
        before = {name: (root / name).read_bytes() if (root / name).exists() else None for name in ["manifest.json", "data.js", "README.md", "all-files.html"]}
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        assert not any((root / name).exists() for name in retired_runtime), f"{operation} reinstalled the retired browser console"
        runtime_operations.append({"operation": operation, "exitCode": result.returncode})
        if failure:
            assert result.returncode != 0 and failure.lower() in result.stderr.lower(), result.stderr + result.stdout
            assert before == {name: (root / name).read_bytes() if (root / name).exists() else None for name in before}, "Failed operation wrote derived files"
            return result
        assert result.returncode == 0, result.stderr + result.stdout
        return read(root / "manifest.json")

    current = run("refresh")
    run("verify")
    checks.append("refresh and register run without the retired index.html/browser.js/library.css console and never reinstall it")
    (root / "decisions.jsonl").write_bytes(b'{"kind":"fixture"}\n')
    run("verify")
    with (root / "decisions.jsonl").open("ab") as stream:
        stream.write(b'{"kind":"fixture-append"}\n')
    current = run("refresh")
    assert all(f["destination"] != "decisions.jsonl" for f in current["files"])
    run("verify")
    checks.append("a library-root decisions.jsonl is skipped: appends never fail verify and it is not hashed into files[]")
    assert not (repo / "discussion").exists() and not (repo / "site").exists()
    for key in ["canonical", "iconAliases", "storagePolicy"]:
        assert current[key] == fixture[key]
    assert all(current["counts"]["diagramsByStyle"][style]["present"] == 1 for style in fixture_record["treatments"])
    checks.append("refresh/verify without discussion or site; unknown top-level fields and four styles preserved")

    # Two pending creative files must be registered together, with no partial success.
    copy_exact(source / another["treatments"]["svg-flat"]["path"], root / "assets/retained/vector-study.svg")
    copy_exact(source / diagram["treatments"]["photorealistic"]["path"], root / "assets/retained/prototype.png")
    copy_exact(source / another["treatments"]["svg-flat"]["path"], root / "assets/retained/brand-mark.svg")
    def new_record(ident, collection, style, path):
        return {"id": ident, "logicalId": None, "collection": collection, "title": ident, "description": "Retained fixture artwork.",
                "service": "Fixture", "category": "Fixture", "treatments": {style: {"path": path, "status": "unreviewed-preview", "note": "Not reviewed."}}}
    additions = [new_record("earlier-vector", "earlier", "svg-outline", "assets/retained/vector-study.svg"),
                 new_record("prototype", "experiments", "experimental", "assets/retained/prototype.png"),
                 new_record("brand-mark", "earlier", "brand-mark", "assets/retained/brand-mark.svg")]
    run("register", {"records": additions[:1]}, "Unregistered image")
    current = run("register", {"records": additions})
    run("verify")
    assert {r["id"] for r in current["records"]} == {"fixture-diagram", "earlier-vector", "prototype", "brand-mark"}
    assert current["styleNames"]["prototype"] == "Prototype"
    assert current["styleNames"]["experimental"] == "Experimental" and current["styleNames"]["brand-mark"] == "Brand mark"
    assert "assets/retained/vector-study.svg" in (root / "all-files.html").read_text(encoding="utf-8")
    checks.append("atomic multi-record registration; earlier vectors, brand-mark and experimental fallback styles indexed")

    before = deepcopy(next(r for r in current["records"] if r["id"] == "fixture-diagram"))
    old_art = (root / before["treatments"]["svg-flat"]["path"]).read_bytes()
    old_metadata = metadata.read_bytes()
    copy_exact(source / another["treatments"]["svg-flat"]["path"], root / "assets/diagrams/flat-v2.svg")
    write(root / "assets/metadata/fixture-v2.json", {"id": "fixture-diagram", "version": 2, "elements": [], "relationships": []})
    incoming = {"path": "assets/diagrams/flat-v2.svg", "metadata": "assets/metadata/fixture-v2.json", "status": "unreviewed-preview", "note": "A newer version, not approved."}
    current = run("register", {"records": [{"id": "fixture-diagram", "treatments": {"svg-flat": incoming}}]})
    active = next(r for r in current["records"] if r["id"] == "fixture-diagram")
    archived = next(r for r in current["records"] if r.get("retainedFrom") == "fixture-diagram")
    assert archived["treatments"]["svg-flat"] == before["treatments"]["svg-flat"]
    assert (root / before["treatments"]["svg-flat"]["path"]).read_bytes() == old_art and metadata.read_bytes() == old_metadata
    assert set(active["treatments"]) == set(before["treatments"])
    for style in ["svg-outline", "holographic", "photorealistic"]:
        assert active["treatments"][style] == before["treatments"][style]
    repeated = run("register", {"records": [{"id": "fixture-diagram", "treatments": {"svg-flat": incoming}}]})
    assert repeated["records"] == current["records"], "Repeated registration manufactured another version"
    run("verify")
    checks.append("replacement retains old artwork/metadata/review and all four styles; repeat registration adds no false version")

    for label, edit, message in [
        ("drop-treatment", lambda j: j["records"][0]["treatments"].pop("photorealistic"), "Dropping a treatment"),
        ("drop-record", lambda j: j["records"].pop(), "Dropping a registered record"),
        ("duplicate-id", lambda j: j["records"].append(deepcopy(j["records"][0])), "Duplicate record ID"),
    ]:
        saved = (root / "manifest.json").read_bytes()
        altered = read(root / "manifest.json")
        edit(altered)
        write(root / "manifest.json", altered)
        run("refresh", failure=message)
        (root / "manifest.json").write_bytes(saved)
        checks.append(label + " rejected without a derived-file write")

    run("register", {"records": [{"id": "fixture-diagram", "treatments": {"svg-flat": None}}]}, "Dropping a treatment")
    escaped = new_record("escaped", "earlier", "svg-flat", "../outside.svg")
    run("register", {"records": [escaped]}, "Unsafe library path")
    escaped["treatments"]["svg-flat"]["path"] = "assets/%2e%2e/outside.svg"
    run("register", {"records": [escaped]}, "Unsafe library path")
    checks.append("null treatment, parent escape and URL-encoded escape rejected")

    unknown = root / "assets/unregistered.svg"
    copy_exact(source / another["treatments"]["svg-flat"]["path"], unknown)
    run("verify", failure="Unregistered image")
    # Keep the test asset by registering it, rather than deleting it.
    run("register", {"records": [new_record("unregistered-now-registered", "earlier", "original", "assets/unregistered.svg")]})
    checks.append("unregistered creative image rejected, then explicitly registered")

    for path in [root / "assets/diagrams/flat-v2.svg", root / "assets/metadata/fixture-v1.json"]:
        original = path.read_bytes()
        path.write_bytes(original + b"\n")
        run("verify", failure="hash conflict")
        path.write_bytes(original)
    checks.append("registered artwork and metadata byte changes rejected")
    evidence = root / "records/fixture-evidence.png"
    copy_exact(source / diagram["treatments"]["photorealistic"]["path"], evidence)
    current = run("refresh")
    assert current["counts"]["evidenceImageFiles"] == 1
    assert not any(t.get("path", "").startswith("records/") for r in current["records"] for t in r["treatments"].values())
    checks.append("records/ provenance image stays separate from browser artwork")

    export = workspace / "export"
    command = [sys.executable, "-B", str(helper / "build_gallery.py"), "--repo", str(repo), "--output", str(export)]
    result = subprocess.run(command + ["--plan-only"], capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr
    assert not export.exists()
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr
    export_receipt = read(workspace / "export.records/package-files.json")
    for item in export_receipt["files"]:
        assert digest(export / item["path"]) == item["sha256"] == digest(root / item["path"])
    result = subprocess.run(command + ["--overrides", str(workspace / "must-not-be-read.json")], capture_output=True, text=True, encoding="utf-8")
    assert result.returncode != 0 and "--overrides" in result.stderr
    (export / "README.md").write_bytes(b"conflicting staged output\n")
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8")
    assert result.returncode != 0 and "Existing export conflicts" in result.stderr
    copy_exact(root / "README.md", export / "README.md")
    checks.append("legacy entry point exports canonical-only; plan has no copies; stale overrides and output conflicts rejected")

    result = subprocess.run([sys.executable, "-B", str(helper / "package_zip.py"), "--package", str(export),
                             "--file-manifest", str(workspace / "export.records/package-files.json"), "--zip", str(workspace / "fixture.zip"),
                             "--extract-check", str(workspace / "extracted"), "--report", str(workspace / "zip-check.json")],
                            capture_output=True, text=True, encoding="utf-8")
    assert result.returncode == 0, result.stderr
    checks.append("existing package_zip accepts exact receipt and verifies extracted fixture hashes/links")
    for path, expected in source_guards.items():
        assert digest(Path(path)) == expected, path
    assert helper_before == {p.name: digest(p) for p in helper.iterdir() if p.is_file()}, "Execution changed maintained helper files"
    evidence = {"checks": checks, "groupsPassed": len(checks), "sourceCopiesUnchanged": len(source_guards),
                "retiredRuntimeAbsent": retired_runtime, "runtimePreservationOperations": runtime_operations,
                "discussionAndSitePresent": False, "browserReview": "not performed; prior file-URL block remains",
                "fixtureLibrary": str(root), "artworkGenerated": 0, "repoWrites": 0}
    write(workspace / "canonical-maintenance-check.json", evidence)
    print(json.dumps(evidence, ensure_ascii=False))


if __name__ == "__main__":
    main()
