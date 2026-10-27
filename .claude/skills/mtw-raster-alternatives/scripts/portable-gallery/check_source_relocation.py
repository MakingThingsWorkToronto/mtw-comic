#!/usr/bin/env python3
"""Read-only exact-file relocation gate; does not copy, delete or approve images.

Run before only after all canonical destinations have been preserved. It checks
both ends and exact source-scope coverage. Run after removal to check canonical
bytes again and require zero files (including hidden/ignored support files) in
every explicit source scope (file or directory). Empty directories may remain.
No scope discovery or wildcard expansion occurs. Reports are snapshots, not
locks against later edits.

Plan: {schemaVersion:1, scopes:["discussion/references"], files:[
 {source:"discussion/references/a.png", destination:"assets/originals/a.png",
  sha256:"<64 hex>", bytes:123, kind:"artwork|evidence|support"}]}
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys

KINDS = {"artwork", "evidence", "support"}
REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
RESERVED = re.compile(r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)", re.I)


class InvalidPlan(ValueError):
    pass


def relative_name(value, label):
    if not isinstance(value, str) or not value:
        raise InvalidPlan(f"{label} must be a nonempty relative POSIX path")
    parts = value.split("/")
    if (any(c in value for c in '\\:*?<>|\"') or
            any(ord(c) < 32 for c in value) or
            any(p in {"", ".", ".."} or p.endswith((".", " ")) or RESERVED.match(p)
                for p in parts)):
        raise InvalidPlan(f"Unsafe {label}: {value!r}")
    return value


def absolute_path(path):
    # Do not resolve links before checking each component with lstat.
    return Path(os.path.abspath(os.fspath(path)))


def path_state(path):
    """Reject symlinks/junctions/reparse points in all existing path components."""
    path = absolute_path(path)
    cursor = Path(path.anchor)
    final = cursor.lstat()
    for part in path.parts[1:]:
        cursor /= part
        try:
            final = cursor.lstat()
        except FileNotFoundError:
            return None
        if stat.S_ISLNK(final.st_mode) or getattr(final, "st_file_attributes", 0) & REPARSE:
            raise InvalidPlan(f"Symlink/reparse path is not allowed: {cursor}")
    return final


def within(path, parent):
    return path == parent or parent in path.parents


def validate_plan(plan):
    if not isinstance(plan, dict) or type(plan.get("schemaVersion")) is not int or plan["schemaVersion"] != 1:
        raise InvalidPlan("Plan requires schemaVersion: 1")
    scopes = plan.get("scopes")
    if not isinstance(scopes, list) or not scopes:
        raise InvalidPlan("Plan requires nonempty explicit scopes[]")
    known_scopes = []
    for name in scopes:
        relative_name(name, "scope")
        if not name.startswith("discussion/"):
            raise InvalidPlan(f"Scope must be a named file or directory inside discussion/: {name}")
        key = name.casefold()
        if any(key == previous or key.startswith(previous + "/") or previous.startswith(key + "/")
               for previous in known_scopes):
            raise InvalidPlan(f"Duplicate or overlapping source scope: {name}")
        known_scopes.append(key)
    files = plan.get("files")
    if not isinstance(files, list) or not files:
        raise InvalidPlan("Plan requires nonempty exact files[]")
    sources, destinations = {}, {}
    for item in files:
        if not isinstance(item, dict):
            raise InvalidPlan("Every files[] entry must be an object")
        source = relative_name(item.get("source"), "source")
        destination = relative_name(item.get("destination"), "destination")
        key = source.casefold()
        if key in sources:
            raise InvalidPlan(f"Duplicate source: {source}")
        if not any(key == scope or key.startswith(scope + "/") for scope in known_scopes):
            raise InvalidPlan(f"Source is outside the declared scopes: {source}")
        if not isinstance(item.get("sha256"), str) or not re.fullmatch(r"[a-fA-F0-9]{64}", item["sha256"]):
            raise InvalidPlan(f"Invalid SHA-256 for: {source}")
        if type(item.get("bytes")) is not int or item["bytes"] < 0:
            raise InvalidPlan(f"Invalid byte size for: {source}")
        if not isinstance(item.get("kind"), str) or item["kind"] not in KINDS:
            raise InvalidPlan(f"Invalid kind for: {source}")
        normalized = {**item, "sha256": item["sha256"].lower()}
        old = destinations.get(destination.casefold())
        if old and (old["destination"] != destination or old["sha256"] != normalized["sha256"] or old["bytes"] != item["bytes"]):
            raise InvalidPlan(f"Conflicting destination: {destination}")
        sources[key] = normalized
        destinations[destination.casefold()] = normalized
    return scopes, list(sources.values()), list(destinations.values())


def scan_scope(repo, name, phase, file_scope=False):
    root = repo / name
    state = path_state(root)
    if state is None:
        if phase == "after":
            return []
        raise InvalidPlan(f"Missing source scope before removal: {name}")
    if stat.S_ISREG(state.st_mode):
        return [name]
    if file_scope:
        raise InvalidPlan(f"Exact file scope was replaced by a non-file entry: {name}")
    if not stat.S_ISDIR(state.st_mode):
        raise InvalidPlan(f"Source scope is not a regular file or directory: {name}")
    found, pending = [], [root]
    while pending:
        directory = pending.pop()
        path_state(directory)
        with os.scandir(directory) as entries:
            for entry in entries:
                path = Path(entry.path)
                state = path_state(path)
                if state is None:
                    raise InvalidPlan(f"Source changed during inventory: {path}")
                if stat.S_ISDIR(state.st_mode):
                    pending.append(path)
                elif stat.S_ISREG(state.st_mode):
                    found.append(path.relative_to(repo).as_posix())
                else:
                    raise InvalidPlan(f"Non-regular source entry: {path}")
    folded = [p.casefold() for p in found]
    if len(folded) != len(set(folded)):
        raise InvalidPlan(f"Case-conflicting source filenames in: {name}")
    return sorted(found)


def measured_file(path):
    state = path_state(path)
    if state is None or not stat.S_ISREG(state.st_mode):
        raise InvalidPlan(f"Missing or non-regular file: {path}")
    digest = hashlib.sha256()
    count = 0
    with path.open("rb") as stream:
        opened = os.fstat(stream.fileno())
        if (opened.st_dev, opened.st_ino) != (state.st_dev, state.st_ino):
            raise InvalidPlan(f"File changed before read: {path}")
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
            count += len(block)
        read_end = os.fstat(stream.fileno())
    final = path_state(path)
    # Windows Python may expose creation time through lstat's ctime while fstat
    # exposes change time. Compare ctime only between calls to the same API.
    signature = lambda s: (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns)
    if (final is None or any(signature(state) != signature(s) for s in (opened, read_end, final)) or
            state.st_ctime_ns != final.st_ctime_ns or opened.st_ctime_ns != read_end.st_ctime_ns):
        raise InvalidPlan(f"File changed during read: {path}")
    return count, digest.hexdigest()


def verify(repo, plan, phase):
    repo = absolute_path(repo)
    library = repo / "wiki/image-library"
    result = {"schemaVersion": 1, "operation": "source-relocation-check", "phase": phase,
              "checkedAt": datetime.now(timezone.utc).isoformat(), "repo": str(repo), "library": str(library),
              "status": "fail", "plannedFiles": 0, "plannedDestinations": 0,
              "checkedSourceFiles": 0, "checkedDestinationFiles": 0,
              "observedSourceFiles": 0, "remainingFiles": [], "errors": [],
              "artworkMutation": "none", "review": "Byte preservation and scoped completion only; no visual/user approval."}

    def error(code, message, path=None):
        result["errors"].append({"code": code, "message": str(message), **({"path": path} if path else {})})

    try:
        if phase not in {"before", "after"}:
            raise InvalidPlan("Phase must be before or after")
        scopes, files, destinations = validate_plan(plan)
        result.update(scopes=scopes, plannedFiles=len(files), plannedDestinations=len(destinations),
                      kinds=dict(Counter(f["kind"] for f in files)))
        for root in (repo, library):
            state = path_state(root)
            if state is None or not stat.S_ISDIR(state.st_mode):
                raise InvalidPlan(f"Required root is missing or not a directory: {root}")
        actual = []
        exact_sources = {item["source"].casefold() for item in files}
        for scope in scopes:
            try:
                actual.extend(scan_scope(repo, scope, phase, scope.casefold() in exact_sources))
            except (ValueError, OSError) as exc:
                error("source-scope", exc, scope)
        result["observedSourceFiles"] = len(actual)
        if phase == "before":
            expected = {item["source"] for item in files}
            for source in sorted(set(actual) - expected):
                error("unlisted-source", "File is absent from the exact relocation plan", source)
            for source in sorted(expected - set(actual)):
                error("missing-source", "Planned source was not found in its declared scope", source)
        else:
            result["remainingFiles"] = sorted(actual)
            for source in sorted(actual):
                error("leftover-source", "File remains in an authorized source scope", source)
        checks = [(library / item["destination"], item, "destination") for item in destinations]
        if phase == "before":
            checks += [(repo / item["source"], item, "source") for item in files]
        for path, item, role in checks:
            name = item[role]
            try:
                size, digest = measured_file(path)
                result["checkedSourceFiles" if role == "source" else "checkedDestinationFiles"] += 1
                if size != item["bytes"] or digest != item["sha256"]:
                    error(f"{role}-mismatch", f"Expected {item['bytes']} bytes / {item['sha256']}; got {size} / {digest}", name)
            except (ValueError, OSError) as exc:
                error(f"{role}-unreadable", exc, name)
    except (ValueError, OSError) as exc:
        error("invalid-plan-or-root", exc)
    result["status"] = "fail" if result["errors"] else "pass"
    return result


def report_target(value, repo, plan_path):
    path = absolute_path(value)
    if within(path, repo):
        raise InvalidPlan("Report must be outside the repo")
    state = path_state(path)
    if state and (not stat.S_ISREG(state.st_mode) or state.st_nlink > 1):
        raise InvalidPlan("Report must be a regular file without hard links")
    for protected in (plan_path, absolute_path(__file__)):
        if path == protected or (state and protected.exists() and os.path.samefile(path, protected)):
            raise InvalidPlan("Report must not overwrite its plan or helper")
    if not path.parent.is_dir():
        raise InvalidPlan("Report parent must already exist outside the repo")
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--phase", required=True, choices=["before", "after"])
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        repo, plan_path = absolute_path(args.repo), absolute_path(args.plan)
        root_state = path_state(repo)
        if root_state is None or not stat.S_ISDIR(root_state.st_mode):
            raise InvalidPlan("Repo must be an existing directory without linked path components")
        target = report_target(args.report, repo, plan_path) if args.report else None
        path_state(plan_path)
        raw = plan_path.read_bytes()
        result = verify(repo, json.loads(raw.decode("utf-8-sig")), args.phase)
        result["planSha256"] = hashlib.sha256(raw).hexdigest()
    except (ValueError, OSError) as exc:
        print(json.dumps({"status": "fail", "errors": [{"code": "input", "message": str(exc)}]}))
        return 2
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if target:
        # Recheck the only writable path immediately before writing the report.
        try:
            report_target(target, repo, plan_path)
            target.write_text(output, encoding="utf-8")
        except (ValueError, OSError) as exc:
            print(json.dumps({"status": "fail", "errors": [{"code": "report", "message": str(exc)}]}))
            return 2
    print(output, end="")
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
