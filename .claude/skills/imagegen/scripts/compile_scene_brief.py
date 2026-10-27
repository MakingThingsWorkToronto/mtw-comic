#!/usr/bin/env python3
"""Compile MTW raster scene constraints; read-only inputs, no image calls or QA claim."""
import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


class BriefError(ValueError):
    pass


def require(test, message):
    if not test:
        raise BriefError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def text(value, where):
    require(isinstance(value, str) and value.strip(), f"{where}: expected nonempty text")
    return value.strip()


def repo_file(root, relative):
    value = text(relative, "path")
    path = (root / value).resolve()
    require(not Path(value).is_absolute() and path.is_relative_to(root), "path must stay within repo")
    require(path.is_file(), f"missing input: {value}")
    return path


def scoped(item, part, where):
    """An existing instruction may override a part; a record does not grant permission."""
    require(item.get("part") in (2, 3, "override"), f"{where}: declare part 2, 3 or override")
    text(item.get("reason"), f"{where}.reason")
    if item["part"] == "override":
        text(item.get("authority"), f"{where}.authority (existing instruction)")
    else:
        require(item["part"] == part, f"{where}: Part {item['part']} change leaks into Part {part}")


def library_file(library, relative):
    """Resolve a declared, existing library file; never fall back to old roots."""
    value = text(relative, "library path")
    path = (library / value).resolve()
    require(not Path(value).is_absolute() and path.is_relative_to(library),
            "library path must stay within canonical library")
    require(path.is_file(), f"missing canonical input: {value}")
    return path


def canonical_inputs(brief, root, source, library):
    library = Path(library).resolve() if library else root / "wiki/image-library"
    require(library.is_relative_to(root), "canonical library must stay within repo")
    manifest_path = library_file(library, "manifest.json")
    manifest = read_json(manifest_path)
    require(manifest.get("schemaVersion") == 1 and isinstance(manifest.get("records"), list),
            "expected canonical image-library records manifest")
    records = {}
    for record in manifest["records"]:
        name = text(record.get("id"), "record.id")
        require(name not in records, f"duplicate canonical record: {name}")
        records[name] = record
    matches = [r for r in records.values() if r.get("collection") == "diagrams"
               and r.get("logicalId", r["id"]) == brief["id"]]
    require(len(matches) == 1, "diagram id must resolve to exactly one canonical record")
    diagram = matches[0]
    style = brief.get("vectorTreatment", "svg-flat")
    require(style in ("svg-flat", "svg-outline"), "vectorTreatment must be svg-flat or svg-outline")
    treatment = diagram.get("treatments", {}).get(style, {})
    artwork = library_file(library, treatment.get("path"))
    require(artwork.suffix.lower() == ".svg", "canonical vector treatment must be an SVG")
    require(sha(artwork) == treatment.get("sha256"), "canonical SVG hash mismatch")
    metadata_path = library_file(library, treatment.get("metadata"))
    files = {f.get("destination", f.get("path")): f for f in manifest.get("files", [])}
    metadata_sha = treatment.get("metadataSha256") or files.get(treatment.get("metadata"), {}).get("sha256")
    require(metadata_sha and sha(metadata_path) == metadata_sha, "canonical metadata hash mismatch or missing guard")
    metadata = read_json(metadata_path)
    require(metadata.get("id") == brief["id"], "canonical metadata id mismatch")
    try:
        view_box = [float(v) for v in ET.parse(artwork).getroot().get("viewBox", "").split()]
    except (ET.ParseError, ValueError) as error:
        raise BriefError("canonical SVG has invalid viewBox/XML") from error
    require(len(view_box) == 4 and metadata.get("viewBox") == view_box,
            "canonical metadata viewBox does not match its SVG")
    require(metadata.get("treatment", style.removeprefix("svg-")) in (style, style.removeprefix("svg-")),
            "canonical metadata treatment mismatch")
    if brief["referenceKind"] == "selected-reference":
        selected = []
        for ref_id in diagram.get("references", []):
            require(ref_id in records, f"missing canonical reference record: {ref_id}")
            record = records[ref_id]
            require(record.get("collection") == "originals", "selected composition must resolve to an original record")
            original = record.get("treatments", {}).get("original", {})
            path = library_file(library, original.get("path"))
            require(sha(path) == original.get("sha256"), "canonical original hash mismatch")
            selected.append(path)
        require(source in selected, "reference is not a selected canonical source for this diagram id")
    else:
        require(source == artwork, "new-svg reference must be this diagram's declared canonical SVG treatment")
    return metadata_path, metadata, {
        "path": manifest_path.relative_to(root).as_posix(), "sha256": sha(manifest_path),
        "recordId": diagram["id"], "vectorTreatment": style,
        "vector": {"path": artwork.relative_to(root).as_posix(), "sha256": sha(artwork)}
    }


def compile_brief(brief, repo, library=None, legacy_discussion=False):
    require(not legacy_discussion, "Discussion replay is retired; resolve the canonical image-library inputs. Historical call records remain unchanged in the library records archive.")
    require("criticalRoutes" not in brief, "criticalRoutes is not supported; use routes so intended connection constraints are not silently discarded")
    root = Path(repo).resolve()
    from completion_contract import validate_registration_contract
    completion = validate_registration_contract(brief.get('registrationContract'), root, require_absent=True)
    logical_id = text(brief.get("id"), "id")
    require(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", logical_id), "invalid diagram id")
    treatment = brief.get("treatment")
    require(treatment in ("holographic", "photorealistic"), "raster diagram treatment required")
    kind = brief.get("referenceKind")
    require(kind in ("selected-reference", "new-svg"), "referenceKind must be selected-reference or new-svg")
    part = 3 if treatment == "photorealistic" and kind == "selected-reference" else 2
    require(brief.get("part") == part, f"{treatment}/{kind} requires Appendix A Part {part}")
    reference = brief.get("reference", {})
    source = repo_file(root, reference.get("path"))
    source_sha = sha(source)
    require(reference.get("sha256") == source_sha, "reference hash changed or is incorrect")
    metadata_path, metadata, authority = canonical_inputs(brief, root, source, library)

    for name in ("sourceLabels", "labels"):
        require(name in brief, f"{name}: field required; use an explicit empty list when there are no labels")
    source_labels = brief["sourceLabels"]
    labels = brief["labels"]
    for values, name in ((source_labels, "sourceLabels"), (labels, "labels")):
        require(isinstance(values, list), f"{name}: expected list")
        for value in values:
            text(value, name)
        require(len(values) == len(set(values)), f"{name}: duplicate labels")
    omissions = brief.get("labelOmissions", [])
    require(set(source_labels) - set(labels) == {i.get("text") for i in omissions},
            "every omitted internal label needs a scoped omission record")
    additions = brief.get("labelAdditions", [])
    require(set(labels) - set(source_labels) == {i.get("text") for i in additions},
            "every added label needs an existing-instruction override")
    for item in omissions + additions:
        scoped(item, part, "label change")
    require(all(i["part"] == "override" for i in additions), "added labels require a recorded override")

    lines = [f"Scene constraints: {logical_id}, {treatment}, Appendix A Part {part}."]
    lines.append("Preserve the attached reference's camera, composition, object counts and routes except the explicit changes below.")
    title_policy = {"removeOverallTitle": kind == "selected-reference", "preserveInternalLabels": True}
    if title_policy["removeOverallTitle"]:
        lines.append("Remove only an overall image title. Retain all permitted internal labels, including semantic column and group headings.")
    else:
        lines.append("This SVG composition has no overall image title to remove. Retain its permitted internal row, column and group headings.")
    lines.append("Only readable labels: " + ("; ".join(json.dumps(s, ensure_ascii=False) for s in labels) or "none") + ".")
    surfaces = brief.get("surfaceLabels", [])
    assigned = [label for entry in surfaces for label in entry.get("labels", [])]
    require(set(assigned) <= set(labels) and len(assigned) == len(set(assigned)), "surfaceLabels contain unknown or repeated labels")
    floating = [label for label in labels if label not in assigned]
    if floating:
        which = "all labels above" if not assigned else "; ".join(json.dumps(s, ensure_ascii=False) for s in floating)
        lines.append("Floating captions: " + which
                     + ". Paper #f2f2ef, screen-aligned bare glyphs; empty surrounding space stays transparent/page-colored. No caption rectangle, halo or backplate. Label-only callouts stay bare text; do not illustrate them with new props, icons or object clusters.")
    for entry in surfaces:
        require(entry.get("labels"), "surfaceLabels needs at least one label")
        surface = text(entry.get("surface"), "surfaceLabels.surface")
        contrast = text(entry.get("contrast"), "surfaceLabels.contrast")
        lines.append(f"On existing {surface}: {'; '.join(entry['labels'])}. {contrast}; screen-aligned lettering; do not add a separate label plate.")

    classification_labels = [label for label in labels if label in ("Internal", "Confidential")]
    if classification_labels:
        lines.append("Classification tags " + "; ".join(classification_labels)
                     + " are not error statuses. Use paper lettering and neutral/teal tag borders; no red classification tag. "
                     + "Error red is reserved for a denied route, its X stop and its associated error caption.")

    changes = brief.get("changes", [])
    for change in changes:
        scoped(change, part, "composition change")
        lines.append("Source exception: " + text(change.get("instruction"), "change.instruction"))
    if omissions:
        lines.append("Omit source copy: " + "; ".join(i["text"] for i in omissions) + ".")

    route_contracts = []
    relations = {r.get("id"): r for r in metadata.get("relationships", []) if r.get("id")}
    for route in brief.get("routes", []):
        name = text(route.get("name"), "route.name")
        start, end = text(route.get("start"), "route.start"), text(route.get("end"), "route.end")
        require(start != end, f"{name}: distinct endpoint descriptions required")
        require(route.get("confirmedAgainstReference") is True, f"{name}: confirm raster endpoint mapping against the actual reference")
        relationship = route.get("relationship")
        metadata_denied = False
        if relationship:
            require(relationship in relations, f"unknown SVG relationship: {relationship}")
            rel = relations[relationship]
            metadata_denied = rel.get("outcome") == "blocked" or rel.get("statusRole") == "error"
            flags = [rel.get("startArrow"), rel.get("endArrow")]
            require(all(type(flag) is bool for flag in flags), f"{relationship}: no usable arrowhead metadata")
            heads = [endpoint for endpoint, flag in zip(("start", "end"), flags) if flag]
            require("heads" not in route, f"{name}: use metadata heads or explicit heads, not both")
        else:
            heads = route.get("heads")
            require(isinstance(heads, list) and set(heads) <= {"start", "end"} and len(heads) == len(set(heads)), f"{name}: heads must explicitly name start/end or be empty")
            text(route.get("evidence"), f"{name}.evidence")
        receiving = [value for key, value in (("start", start), ("end", end)) if key in heads]
        head_free = [value for key, value in (("start", start), ("end", end)) if key not in heads]
        denied = metadata_denied or "deniedStop" in route
        denied_stop = text(route.get("deniedStop"), f"{name}.deniedStop") if denied else None
        require(not denied or not heads, f"{name}: denied connection must end in an X, not an arrowhead")
        contract = {"name": name, "start": start, "end": end, "heads": heads, "relationship": relationship,
                    "denied": denied, "deniedStop": denied_stop}
        route_contracts.append(contract)
        clause = f"Route {name}: {start} to {end}; exactly {len(heads)} arrowhead(s)"
        if receiving:
            clause += " at " + " and ".join(receiving)
        if head_free:
            clause += "; zero arrowheads at " + " and ".join(head_free)
        if denied:
            clause += "; red #ff4d4d dashed line stops at a solid X before " + denied_stop + ", with no continuation"
        lines.append(clause + ".")

    marks = brief.get("marks", [])
    for mark in marks:
        name, location = text(mark.get("name"), "mark.name"), text(mark.get("location"), "mark.location")
        require(mark.get("form", "contour") in ("contour", "text-only"), f"{name}: MTW diagram marks use contour or text-only")
        require(mark.get("color", "#f2f2ef") in ("#f2f2ef", "#5fc4c9"), f"{name}: original product colors are not allowed")
        form = "exact text only, no invented logo" if mark.get("form") == "text-only" else "hollow contour"
        lines.append(f"Mark {name} at {location}: {form}, monochrome {mark.get('color', '#f2f2ef')}.")
    if any(mark.get("form") != "text-only" for mark in marks):
        lines.append("Contour marks preserve their recognizable silhouettes and open interiors; no filled logos or original product colors.")
    if brief.get("softwareWindows"):
        lines.append("Software controls use MTW neutrals/teal only; no traffic-light dots or extra product marks.")
    visible_feet = False
    for group in brief.get("people", []):
        count, framing = group.get("count"), group.get("framing")
        require(type(count) is int and count > 0, "people.count must be a positive integer")
        require(framing in ("full-body", "seated", "torso", "portrait"), "unknown people framing")
        line = f"People: exactly {count} at {text(group.get('location'), 'people.location')}, preserve {framing} framing."
        if framing in ("full-body", "seated"):
            visible_feet = True
        lines.append(line)
    if visible_feet:
        lines.append("Natural feet only where visible; no separate oval, disc, pad or projection ring beneath or around any figure; preserve purposeful connection nodes.")
    if brief.get("foregroundLinks"):
        lines.append("Foreground links follow the existing routes as thin purposeful connections, never broad filled shelves, ribbons or supporting strips.")
    return {"schemaVersion": 1, "id": logical_id, "treatment": treatment, "part": part,
            "source": {"path": source.relative_to(root).as_posix(), "sha256": source_sha},
            "metadata": {"path": metadata_path.relative_to(root).as_posix(), "sha256": sha(metadata_path)},
            "inputAuthority": authority, "registrationContract": completion,
            "titlePolicy": title_policy, "routes": route_contracts, "promptBlock": "\n".join(lines) + "\n",
            "limitations": "Checks the authored brief and input lineage only; no generated-image inspection or approval."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("brief", type=Path)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--library", type=Path, help="Canonical records root; default <repo>/wiki/image-library")
    parser.add_argument("--legacy-discussion", action="store_true", help="Retired option: reports canonical migration guidance; does not read discussion")
    parser.add_argument("--out", type=Path, required=True, help="New JSON contract; never overwrites")
    parser.add_argument("--prompt-out", type=Path, required=True, help="New text constraint block; never overwrites")
    args = parser.parse_args()
    try:
        result = compile_brief(read_json(args.brief), args.repo, args.library, args.legacy_discussion)
        result["briefSha256"] = sha(args.brief)
        outputs = [args.out.resolve(), args.prompt_out.resolve()]
        require(len(set(outputs)) == 2, "output paths must differ")
        repo = args.repo.resolve()
        library = args.library.resolve() if args.library else repo / "wiki/image-library"
        for path in outputs:
            require(not path.exists(), f"output exists: {path}")
            if path.is_relative_to(repo):
                require(path.is_relative_to(library / "records"),
                        "new repo scene evidence belongs under canonical image-library/records, never discussion or artwork")
        for path in outputs:
            path.parent.mkdir(parents=True, exist_ok=True)
        with outputs[0].open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        with outputs[1].open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(result["promptBlock"])
        print(json.dumps({"contract": str(outputs[0]), "promptBlock": str(outputs[1]), "status": "brief-valid-image-unchecked"}))
    except (BriefError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        parser.exit(2, f"Invalid scene brief: {error}\n")


if __name__ == "__main__":
    main()
