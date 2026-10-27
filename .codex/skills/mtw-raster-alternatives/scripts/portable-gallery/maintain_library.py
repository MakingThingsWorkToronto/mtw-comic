#!/usr/bin/env python3
"""Maintain a canonical MTW library using only its manifest and local files.

refresh/verify --library ROOT --receipt-dir OUTSIDE
register --library ROOT --payload FILE.json --receipt-dir OUTSIDE
remove --library ROOT --payload FILE.json --receipt-dir OUTSIDE

A registration payload is {records:[...]}, {record:{...}}, or one record/patch.
New records have id/title/description/service/category/collection/treatments.
Existing IDs merge only the supplied fields and treatments. Null treatments,
path deletion and replacement in place are rejected. A changed treatment is
retained verbatim as an earlier record before the new version is selected.
All creative image paths must already exist below ROOT/assets/. No art is copied,
generated, edited or deleted. ROOT/records/ is reserved for provenance/evidence.

remove runs after MTW Studio (Images Remove) has archived and deleted the files.
Its payload is {expectedManifestSha256, remove:[{path, sha256, recordIds, archivedTo}]}.
It drops exactly those treatments, any record left with no file, links to dropped
records and the files[] rows, then rewrites the derived files. Only the declared
drops pass the append-only guards; every other record and treatment stays protected.
"""
from __future__ import annotations

import argparse
import atexit
import ctypes
from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
from functools import lru_cache
import hashlib
import hmac
import html
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sqlite3
import tempfile
import time
import xml.etree.ElementTree as ET
from PIL import Image

STYLES = ["svg-flat", "svg-outline", "holographic", "photorealistic"]
STYLE_NAMES = {"svg-flat": "SVG Flat", "svg-outline": "SVG Outline", "holographic": "Holographic",
               "photorealistic": "Photorealistic", "original": "Original reference", "prototype": "Prototype",
               "photograph": "Scene photograph", "svg-glass": "Site Glass"}
COLLECTIONS = {"diagrams": "Diagrams", "icons": "Shared icons", "originals": "Original references",
               "scenes": "Scene photographs", "comics": "Comics", "earlier": "Earlier artwork", "experiments": "Experiments"}
IMAGES = {".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".tif", ".tiff", ".bmp", ".ico"}
DERIVED = {"manifest.json", "data.js", "all-files.html", "index.html", "README.md"}
RUNTIME = {".gitattributes"}
# The retired browser console (MTW Studio /m/images replaces it); stale files[] rows are dropped when absent.
RETIRED_RUNTIME = {"index.html", "browser.js", "library.css"}
# Studio's append-only human decision log lives at the library root; it is not catalog content.
UNCATALOGED = {"decisions.jsonl"}
MEASURED = {"bytes", "width", "height", "format", "mode", "metadataSha256", "dimensionSource", "dimensionNote"}
BROWSER_LIMIT = "Not performed by this helper; the prior file-URL policy block remains unperformed, not a pass."
EMBEDDED_IMAGE = re.compile(r"data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+\Z")
SVG_NUMBER = r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?"
SVG_SEPARATOR = r"(?:[ \t\r\n]+,?[ \t\r\n]*|,[ \t\r\n]*)"
SVG_ABSOLUTE_UNITS = {"": 1, "px": 1, "in": 96, "cm": 96 / 2.54, "mm": 96 / 25.4,
                      "q": 96 / 101.6, "pt": 96 / 72, "pc": 16}


def _file_sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1048576), b""):
            h.update(block)
    return h.hexdigest()


@lru_cache(maxsize=1)
def _ntfs_api():
    from ctypes import wintypes
    class Basic(ctypes.Structure):
        _fields_ = [(name, ctypes.c_longlong) for name in ("created", "accessed", "written", "changed")] + [("attributes", wintypes.DWORD)]
    class Identity(ctypes.Structure):
        _fields_ = [("volume", ctypes.c_ulonglong), ("id", ctypes.c_ubyte * 16)]
    api = ctypes.WinDLL("kernel32", use_last_error=True)
    api.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    api.CreateFileW.restype = wintypes.HANDLE
    api.GetFileInformationByHandleEx.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    api.GetFileSizeEx.argtypes = [wintypes.HANDLE, ctypes.POINTER(ctypes.c_longlong)]
    api.GetVolumeInformationByHandleW.argtypes = [wintypes.HANDLE, wintypes.LPWSTR, wintypes.DWORD, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.LPWSTR, wintypes.DWORD]
    api.DeviceIoControl.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
    api.CloseHandle.argtypes = [wintypes.HANDLE]
    return api, Basic, Identity, {}


def file_identity(path):
    """Only real change-time signatures permit reuse; Windows ctime is creation."""
    if os.name != "nt":
        info = Path(path).stat()
        return ("posix-v1", info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)
    try:
        api, Basic, Identity, volumes = _ntfs_api()
    except (OSError, AttributeError):
        return None
    # A live writer can defer metadata/journal updates until close. Such a file
    # must miss the cache: do not share write access during the identity probe.
    handle = api.CreateFileW(os.path.abspath(os.fspath(path)), 0x81, 5, None, 3, 0, None)
    if handle == ctypes.c_void_p(-1).value:
        return None
    try:
        basic, identity, size, filesystem = Basic(), Identity(), ctypes.c_longlong(), ctypes.create_unicode_buffer(32)
        if not (api.GetFileInformationByHandleEx(handle, 0, ctypes.byref(basic), ctypes.sizeof(basic)) and
                api.GetFileInformationByHandleEx(handle, 18, ctypes.byref(identity), ctypes.sizeof(identity)) and
                api.GetFileSizeEx(handle, ctypes.byref(size))):
            return None
        if identity.volume not in volumes:
            if not api.GetVolumeInformationByHandleW(handle, None, 0, None, None, None, filesystem, len(filesystem)):
                return None
            volumes[identity.volume] = filesystem.value
        if volumes[identity.volume] != "NTFS" or basic.changed <= 0:
            return None
        # NTFS timestamps can collide within one clock tick. A file's journal
        # revision distinguishes fast writes even when the caller resets mtime.
        from ctypes import wintypes
        record, returned = ctypes.create_string_buffer(4096), wintypes.DWORD()
        if not api.DeviceIoControl(handle, 0x000900EB, None, 0, record, len(record), ctypes.byref(returned), None):
            return None
        major = int.from_bytes(record.raw[4:6], "little")
        offset = 24 if major == 2 else 40 if major == 3 else None
        if offset is None or returned.value < offset + 8:
            return None
        revision = int.from_bytes(record.raw[offset:offset+8], "little", signed=True)
        if revision <= 0:
            return None
        return ("ntfs-usn-v1", identity.volume, bytes(identity.id).hex(), size.value, basic.written, basic.changed, basic.attributes, revision)
    finally:
        api.CloseHandle(handle)


class VerifiedHashes:
    """Actual measured hashes only; cache failure is a miss, never a validation pass."""
    def __init__(self, cache_path=None):
        self.path, self.memory, self.db, self.secret = cache_path, {}, None, None
        self.opened = False

    def open(self):
        if self.opened or self.path is None:
            return
        self.opened = True
        db = None
        try:
            self.path = Path(self.path)
            self.path.parent.mkdir(parents=True, exist_ok=True)
            key_path = self.path.with_suffix(".key")
            try:
                fd = os.open(key_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as stream:
                    stream.write(os.urandom(32))
            except FileExistsError:
                pass
            secret = key_path.read_bytes()
            if len(secret) != 32:
                return
            db = sqlite3.connect(self.path, timeout=.1)
            db.execute("CREATE TABLE IF NOT EXISTS verified (path TEXT PRIMARY KEY, stamp TEXT NOT NULL, digest TEXT NOT NULL, mac TEXT NOT NULL)")
            db.commit()
            self.db, self.secret = db, secret
        except (OSError, sqlite3.Error):
            if db is not None:
                db.close()
            self.db = None

    def tag(self, path, stamp, digest):
        return hmac.new(self.secret, json.dumps([path, stamp, digest], separators=(",", ":")).encode("utf-8"), hashlib.sha256).hexdigest()

    def flush(self):
        if self.db is not None:
            try:
                self.db.commit()
            except sqlite3.Error:
                self.db.rollback()

    def close(self):
        self.flush()
        if self.db is not None:
            self.db.close()
            self.db = None

    def sha(self, path):
        key = os.path.normcase(os.path.abspath(os.fspath(path)))
        before = file_identity(path)
        # No robust signature: do not reuse even an in-process measurement.
        if before is None:
            old = Path(path).stat()
            value = _file_sha(path)
            now = Path(path).stat()
            if (old.st_dev, old.st_ino, old.st_size, old.st_mtime_ns, old.st_ctime_ns) != (now.st_dev, now.st_ino, now.st_size, now.st_mtime_ns, now.st_ctime_ns):
                raise ValueError(f"Source changed during hash: {path}")
            return value
        stamp = json.dumps(before, separators=(",", ":"))
        saved = self.memory.get(key)
        self.open()
        if saved is None and self.db is not None:
            try:
                row = self.db.execute("SELECT stamp,digest,mac FROM verified WHERE path=?", (key,)).fetchone()
                if row and row[0] == stamp and re.fullmatch(r"[0-9a-f]{64}", row[1]) and hmac.compare_digest(row[2], self.tag(key, row[0], row[1])):
                    saved = (row[0], row[1])
            except (sqlite3.Error, TypeError, ValueError):
                pass
        value = saved[1] if saved is not None and saved[0] == stamp else _file_sha(path)
        if file_identity(path) != before:
            raise ValueError(f"Source changed during hash: {path}")
        self.memory[key] = (stamp, value)
        if self.db is not None and (saved is None or saved[0] != stamp):
            try:
                self.db.execute("INSERT OR REPLACE INTO verified VALUES (?,?,?,?)", (key, stamp, value, self.tag(key, stamp, value)))
            except sqlite3.Error:
                pass
        return value


def _cache_path():
    for parent in Path(__file__).resolve().parents:
        if (parent / "apps/mtw").is_dir():
            return parent / "apps/mtw/.state/library-hashes-v1.sqlite3"
    return None


_HASHES = VerifiedHashes(_cache_path())
atexit.register(_HASHES.close)


def sha(path):
    return _HASHES.sha(path)


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def json_bytes(value, compact=False):
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":") if compact else None,
                       indent=None if compact else 2) + "\n").encode("utf-8")


def local_path(root, name):
    if not isinstance(name, str) or not name or any(c in name for c in "\\:%?#") or any(ord(c) < 32 for c in name):
        raise ValueError(f"Unsafe library path: {name!r}")
    p = PurePosixPath(name)
    if p.is_absolute() or ".." in p.parts or "." in name.split("/") or "//" in name:
        raise ValueError(f"Unsafe library path: {name}")
    path = (root / name).resolve()
    if root not in path.parents:
        raise ValueError(f"Path escapes library: {name}")
    return path


def separate_path(path, protected, label):
    path = Path(path).resolve()
    for root in protected:
        if path == root or root in path.parents or path in root.parents:
            raise ValueError(f"{label} must be outside and separate from library/helper: {path}")
    return path


def input_membership(root):
    """Cheap full-library input names, including provenance; no content cache."""
    return {path.relative_to(root).as_posix() for path in root.rglob("*")
            if path.is_file() and path.relative_to(root).as_posix() not in DERIVED | UNCATALOGED}


def require_input_membership(root, expected):
    actual = input_membership(root)
    if actual != expected:
        raise ValueError("Concurrent library input membership change; added: " +
                         ", ".join(sorted(actual - expected)) + "; removed: " +
                         ", ".join(sorted(expected - actual)))


def snapshot(root):
    path = root / "data.js"
    if not path.exists():
        return None
    match = re.fullmatch(r"\s*window\.MTW_LIBRARY\s*=\s*(\{.*\})\s*;\s*", path.read_text(encoding="utf-8-sig"), re.S)
    if not match:
        raise ValueError("Cannot read the previous data.js snapshot without executing code")
    return json.loads(match.group(1))


def indexed_records(catalog):
    rows = catalog.get("records")
    if not isinstance(rows, list):
        raise ValueError("The canonical manifest requires records[]")
    result = {}
    folded = set()
    logical = set()
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
            raise ValueError("Every record needs an ID")
        if row["id"].casefold() in folded:
            raise ValueError(f"Duplicate record ID: {row['id']}")
        folded.add(row["id"].casefold())
        if row.get("collection") not in COLLECTIONS:
            raise ValueError(f"Unsupported collection on {row['id']}")
        if not isinstance(row.get("treatments"), dict) or not row["treatments"]:
            raise ValueError(f"No treatments on {row['id']}")
        for key in ["title", "description", "service", "category"]:
            if not isinstance(row.get(key), str):
                raise ValueError(f"Record {row['id']} needs {key}")
        if row["collection"] in {"diagrams", "icons"}:
            key = (row["collection"], row.get("logicalId", row["id"]))
            if key in logical:
                raise ValueError(f"Duplicate canonical logical ID: {key}")
            logical.add(key)
        result[row["id"]] = row
    return result


def treatment_identity(treatment):
    return {k: v for k, v in treatment.items() if k not in MEASURED}


def tour_associations(row):
    """Primary and retained variant tours share validation and byte-preservation rules."""
    tours = []
    primary = row.get("tour")
    if primary:
        if not isinstance(primary, dict) or primary.get("id") != row.get("logicalId"):
            raise ValueError(f"Invalid tour association: {row['id']}")
        tours.append(primary)
    variants = row.get("tourVariants", [])
    if not isinstance(variants, list):
        raise ValueError(f"Invalid tour variants: {row['id']}")
    seen = {tour["id"] for tour in tours}
    for variant in variants:
        ident = variant.get("id") if isinstance(variant, dict) else None
        if not isinstance(ident, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", ident) or ident == row.get("logicalId") or ident in seen:
            raise ValueError(f"Invalid tour variant: {row['id']}/{ident}")
        seen.add(ident)
        tours.append(variant)
    if tours and row["collection"] != "diagrams":
        raise ValueError(f"Invalid tour association: {row['id']}")
    return tours


def preserve_previous(previous, current, removed=None):
    """Append-only guard. `removed` (from remove_records) names the only drops allowed."""
    if previous is None:
        return
    removed = removed or {"records": set(), "treatments": set(), "paths": set()}
    old, new = indexed_records(previous), indexed_records(current)
    all_treatments = [treatment_identity(t) for row in new.values() for t in row["treatments"].values() if isinstance(t, dict)]
    for ident, row in old.items():
        if ident not in new:
            if ident in removed["records"]:
                continue
            raise ValueError(f"Dropping a registered record is not allowed: {ident}")
        for style, treatment in row["treatments"].items():
            if (ident, style) in removed["treatments"] and style not in new[ident]["treatments"]:
                continue
            after = new[ident]["treatments"].get(style)
            if not isinstance(after, dict) or (treatment.get("path") and not after.get("path")):
                raise ValueError(f"Dropping a treatment is not allowed: {ident}/{style}")
            if treatment.get("path") and treatment_identity(treatment) not in all_treatments:
                raise ValueError(f"Previous treatment/review must be retained: {ident}/{style}")
        incoming_tours = {tour["id"]: tour for tour in tour_associations(new[ident])}
        for tour in tour_associations(row):
            incoming = incoming_tours.get(tour["id"])
            if incoming is None:
                raise ValueError(f"Dropping tour association: {ident}/{tour['id']}")
            versions = {v["version"]: v for v in incoming.get("versions", [])}
            for prior in tour["versions"]:
                after = versions.get(prior["version"], {})
                if any(after.get(k) != v for k, v in prior.items() if k != "review"):
                    raise ValueError(f"Retained tour version changed: {ident}/{tour['id']}")
        if row.get("references") and not (set(row["references"]) - removed["records"]).issubset(new[ident].get("references", [])):
            raise ValueError(f"Dropping source lineage is not allowed: {ident}")


def svg_dimensions(root, name):
    """Inspect declared extent only; never repair SVG bytes or imply a render pass."""
    key = "viewBox" if "viewBox" in root.attrib else "viewbox" if "viewbox" in root.attrib else None
    if key:
        value = root.get(key).strip(" \t\r\n")
        pattern = f"({SVG_NUMBER})" + (f"{SVG_SEPARATOR}({SVG_NUMBER})" * 3)
        match = re.fullmatch(pattern, value)
        if not match:
            raise ValueError(f"SVG needs a four-number {key}: {name}")
        values = [float(part) for part in match.groups()]
        if not all(math.isfinite(part) for part in values) or any(part <= 0 for part in values[2:]):
            raise ValueError(f"SVG {key} needs finite values and positive dimensions: {name}")
        width, height = values[2:]
        source = "viewBox" if key == "viewBox" else "legacy-viewbox"
        note = ("Declared viewBox extent; not a rendered viewport measurement." if key == "viewBox" else
                "Numeric extent from nonstandard lowercase viewbox; not a rendered viewport measurement. Original bytes preserved.")
    else:
        dimensions = []
        for key in ["width", "height"]:
            value = root.get(key, "").strip(" \t\r\n")
            match = re.fullmatch(f"({SVG_NUMBER})(px|in|cm|mm|q|pt|pc)?", value, re.I)
            if not match:
                raise ValueError(f"SVG without viewBox needs absolute intrinsic width and height: {name}")
            number = float(match.group(1)) * SVG_ABSOLUTE_UNITS[(match.group(2) or "").lower()]
            if not math.isfinite(number) or number <= 0:
                raise ValueError(f"SVG intrinsic size needs finite positive dimensions: {name}")
            dimensions.append(number)
        width, height = dimensions
        source = "intrinsic-size"
        note = "Declared absolute intrinsic size in CSS pixels (96 px per inch); not a rendered viewport measurement."
    return {"width": int(width) if width.is_integer() else width,
            "height": int(height) if height.is_integer() else height,
            "dimensionSource": source, "dimensionNote": note}


def image_details(path):
    if path.suffix.lower() == ".svg":
        root = ET.parse(path).getroot()
        details = svg_dimensions(root, path.name)
        for node in root.iter():
            for key, value in node.attrib.items():
                # In-document references and embedded raster data (the Site Glass brain) keep an SVG standalone.
                if key.rsplit("}", 1)[-1] == "href" and not value.startswith("#") and not EMBEDDED_IMAGE.match(value):
                    raise ValueError(f"External SVG dependency: {path.name}")
        return {**details, "format": "SVG", "mode": None}
    with Image.open(path) as im:
        # MPO is the multi-picture JPEG phones write (Pillow reports it as MPO); it keeps the JPEG extensions.
        suffixes = {"PNG": {".png"}, "JPEG": {".jpg", ".jpeg"}, "MPO": {".jpg", ".jpeg"}, "WEBP": {".webp"}, "GIF": {".gif"},
                    "AVIF": {".avif"}, "TIFF": {".tif", ".tiff"}, "BMP": {".bmp"}, "ICO": {".ico"}}
        if path.suffix.lower() not in suffixes.get(im.format, set()):
            raise ValueError(f"Image format/extension conflict: {path.name}")
        return {"width": im.width, "height": im.height, "format": im.format, "mode": im.mode}


def derive(root, catalog, previous, removed=None):
    """Validate immutable files, then return derived catalog; never change a file."""
    result = deepcopy(catalog)
    rows = indexed_records(result)
    preserve_previous(previous, result, removed)
    removed_paths = removed["paths"] if removed else set()
    physical = {}
    physical_folded = set()
    for path in sorted(root.rglob("*")):
        if path.is_file():
            name = path.relative_to(root).as_posix()
            if name in UNCATALOGED:
                continue
            local_path(root, name)
            folded_name = name.casefold()
            if folded_name in physical_folded:
                raise ValueError(f"Conflicting portable filename: {name}")
            physical_folded.add(folded_name)
            physical[name] = path
    # Reuse verified measurements only while actual change-time identity is stable.
    validation_hashes = {}
    def validation_hash(path):
        before = file_identity(path)
        saved = validation_hashes.get(path)
        if before is not None and saved is not None and saved[0] == before:
            if file_identity(path) != before:
                raise ValueError(f"Source changed during validation hash: {path}")
            return saved[1]
        value = sha(path)
        if before is not None and file_identity(path) != before:
            raise ValueError(f"Source changed during validation hash: {path}")
        validation_hashes[path] = (before, value)
        return value
    roles = {}
    expected_hashes = {}
    for source in [previous or {}, catalog]:
        seen = set()
        for f in source.get("files", []):
            name = f.get("destination", f.get("path"))
            if (name in RETIRED_RUNTIME or name in UNCATALOGED or name in removed_paths) and name not in physical:
                continue
            local_path(root, name)
            if name.casefold() in seen:
                raise ValueError(f"Duplicate registered filename: {name}")
            seen.add(name.casefold())
            roles[name] = f.get("role", "preserved-file")
            if name not in physical:
                raise ValueError(f"Missing registered file: {name}")
            if name not in DERIVED | RUNTIME and f.get("sha256"):
                expected_hashes.setdefault(name, []).append(f["sha256"])
    # Both inventories assert against one measurement; retain every expectation.
    # Final inventory and receipt recheck identity instead of rereading stable bytes.
    for name, expected in expected_hashes.items():
        actual_hash = validation_hash(physical[name])
        if any(actual_hash != value for value in expected):
            raise ValueError(f"Registered hash conflict: {name}")
    registered_images = set()
    for row in rows.values():
        for style, treatment in row["treatments"].items():
            if not isinstance(style, str) or not style or not isinstance(treatment, dict):
                raise ValueError(f"Invalid or dropped treatment: {row['id']}/{style}")
            if not treatment.get("path"):
                if treatment.get("status") != "missing":
                    raise ValueError(f"A treatment without a file must be explicitly missing: {row['id']}/{style}")
                continue
            name = treatment["path"]
            path = local_path(root, name)
            if not name.startswith("assets/") or path.suffix.lower() not in IMAGES:
                raise ValueError(f"Browser artwork must be an image under assets/: {name}")
            if not path.is_file():
                raise ValueError(f"Missing artwork: {name}")
            if not isinstance(treatment.get("status"), str) or not treatment["status"]:
                raise ValueError(f"Explicit review status required: {row['id']}/{style}")
            actual_hash = validation_hash(path)
            if treatment.get("sha256") and treatment["sha256"] != actual_hash:
                raise ValueError(f"Treatment hash conflict: {name}")
            treatment.update({"sha256": actual_hash, "bytes": path.stat().st_size, **image_details(path)})
            registered_images.add(name)
            roles.setdefault(name, row["collection"] + ":" + style)
            if treatment.get("metadata"):
                metadata = local_path(root, treatment["metadata"])
                if not metadata.is_file():
                    raise ValueError(f"Missing metadata: {treatment['metadata']}")
                metadata_hash = validation_hash(metadata)
                if treatment.get("metadataSha256") and treatment["metadataSha256"] != metadata_hash:
                    raise ValueError(f"Metadata hash conflict: {treatment['metadata']}")
                treatment["metadataSha256"] = metadata_hash
                roles.setdefault(treatment["metadata"], "metadata")
        for linked in row.get("references", []) + row.get("relatedDiagrams", []):
            if linked not in rows:
                raise ValueError(f"Unknown linked record: {row['id']} -> {linked}")
    tour_ids = set()
    diagram_ids = {row.get("logicalId") for row in rows.values() if row["collection"] == "diagrams"}
    for row in rows.values():
        for tour in tour_associations(row):
            ident = tour["id"]
            if ident in tour_ids or (ident != row.get("logicalId") and ident in diagram_ids):
                raise ValueError(f"Duplicate or conflicting tour id: {ident}")
            tour_ids.add(ident)
            versions = tour.get("versions", [])
            if not versions or len({v["version"] for v in versions}) != len(versions):
                raise ValueError(f"Invalid tour versions: {row['id']}/{ident}")
            if tour.get("currentVersion") not in {v["version"] for v in versions}:
                raise ValueError(f"Missing current tour: {row['id']}/{ident}")
            for version in versions:
                data = local_path(root, version["data"])
                preview = local_path(root, version["preview"])
                if validation_hash(data) != version["sha256"] or read_json(data).get("diagram") != row["logicalId"]:
                    raise ValueError(f"Tour data identity mismatch: {row['id']}/{ident}")
                if version.get("review", {}).get("playback") == "generated" and not preview.is_file():
                    raise ValueError(f"Missing generated tour playback: {row['id']}/{ident}")
    creative_images = {name for name, path in physical.items() if name.startswith("assets/") and path.suffix.lower() in IMAGES}
    if creative_images != registered_images:
        raise ValueError("Unregistered image files under assets/: " + ", ".join(sorted(creative_images - registered_images)))
    result["styleNames"] = {**STYLE_NAMES, **result.get("styleNames", {})}
    for row in rows.values():
        for style in row["treatments"]:
            result["styleNames"].setdefault(style, style.replace("-", " ").capitalize())
    result["files"] = [{"destination": name, "sha256": validation_hash(path), "bytes": path.stat().st_size,
                        "role": roles.get(name, "provenance" if name.startswith("records/") else "runtime" if name in RUNTIME else "preserved-file")}
                       for name, path in physical.items() if name not in DERIVED]
    counts = {"collections": {key: sum(r["collection"] == key for r in rows.values()) for key in COLLECTIONS},
              "diagramsByStyle": {}, "iconsByStyle": {}, "selectedOriginalReferences": sum(bool(r.get("selectedReference")) for r in rows.values()),
              "traditionalOriginals": sum(r["collection"] == "originals" and r["category"] == "Traditional Systems" for r in rows.values())}
    for collection, key in [("diagrams", "diagramsByStyle"), ("icons", "iconsByStyle")]:
        relevant = [r for r in rows.values() if r["collection"] == collection]
        for style in STYLES:
            states = [r["treatments"].get(style, {"status": "missing"}) for r in relevant]
            counts[key][style] = {"present": sum(bool(s.get("path")) for s in states), "missing": sum(not s.get("path") for s in states),
                                  "statuses": dict(Counter(s.get("status", "missing") for s in states))}
    counts.update({"copiedFiles": len(result["files"]), "copiedBytes": sum(f["bytes"] for f in result["files"]),
                   "imageFiles": len(creative_images), "evidenceImageFiles": sum(name.startswith("records/") and p.suffix.lower() in IMAGES for name, p in physical.items())})
    result["counts"] = counts
    return result


def generated_files(catalog):
    groups = []
    for collection, title in COLLECTIONS.items():
        items = []
        for record in catalog["records"]:
            if record["collection"] != collection:
                continue
            links = [f'<a href="{html.escape(t["path"], quote=True)}">{html.escape(catalog["styleNames"].get(style, style))}</a>'
                     for style, t in record["treatments"].items() if t.get("path")]
            for tour in tour_associations(record):
                version = next(v for v in tour["versions"] if v["version"] == tour["currentVersion"])
                if version.get("review", {}).get("playback") == "generated":
                    label = "Explore diagram tour" if tour["id"] == record.get("logicalId") else f"Explore diagram tour ({tour['id']})"
                    links.append(f'<a href="{html.escape(version["preview"], quote=True)}">{html.escape(label)}</a>')
            items.append('<li><strong>' + html.escape(record["title"]) + '</strong> — ' + ' · '.join(links) + '</li>')
        if items:
            groups.append('<section><h2>' + title + '</h2><ul>' + '\n'.join(items) + '</ul></section>')
    provenance = [f["destination"] for f in catalog.get("files", []) if f["destination"].startswith("records/")]
    if provenance:
        record_groups = {}
        for name in provenance:
            group = name.split("/")[1]
            record_groups.setdefault(group, []).append(name)
        sections = []
        for group, names in sorted(record_groups.items()):
            links = [f'<li><a href="{html.escape(name, quote=True)}">{html.escape(name.split("/", 2)[-1])}</a></li>' for name in names]
            sections.append('<details><summary>' + html.escape(group) + f' ({len(names)} files)</summary><ul>' + '\n'.join(links) + '</ul></details>')
        groups.append('<section><h2>Preserved image context and review evidence</h2><p>Historical prompts, source records and diagnostic images retain their original bytes and review limits. Old path strings inside them are provenance; use the relocation map for current locations.</p>' + '\n'.join(sections) + '</section>')
    index = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>All image files · Making Things Work</title><style>body{margin:0;background:#0b1419;color:#e8f1f2;font:15px/1.5 system-ui,sans-serif}main{max-width:72rem;margin:0 auto;padding:1.5rem}a{color:#7fd6dc}summary{cursor:pointer}</style><body><main class="file-list"><h1>All image files</h1><p>Full-size artwork, including retained earlier versions, followed by preserved image context and evidence. For status, comparisons and review, open <code>/m/images</code> in MTW Studio (<code>npm run studio</code>, port 8788).</p>' + '\n'.join(groups) + '</main></body></html>\n'
    c = catalog["counts"]
    coverage = ', '.join(f"{c['diagramsByStyle'][s]['present']} {catalog['styleNames'][s]}" for s in STYLES)
    readme = f"""# Making Things Work image library

Browse, compare, review and register images in MTW Studio: open `/m/images` (`npm run studio`, port 8788). For an offline copy to share, run `node apps/mtw/cli/mtw.mjs export images --out <folder>` and open the exported `index.html`; no server or internet connection is needed. `all-files.html` is a plain linked index that works without JavaScript. `decisions.jsonl` is Studio's append-only decision log and is not catalog content.

This is the canonical image library. New artwork is saved inside `assets/` and registered in `manifest.json` (`node apps/mtw/cli/mtw.mjs register image <path>`); derived counts, `data.js`, the plain file index and this README are refreshed together. Studio's four-style selector and comparisons are permanent. Public diagrams adopt Site Glass through their primary tour pins; unconverted diagrams retain SVG Flat.

- {c['collections']['diagrams']} diagram subjects: {coverage}.
- {c['collections']['icons']} shared icon subjects; {c['iconsByStyle']['svg-flat']['present']} flat and {c['iconsByStyle']['svg-outline']['present']} outline files.
- {c['collections']['originals']} original reference records, including {c['selectedOriginalReferences']} selected references and {c['traditionalOriginals']} Traditional Systems originals/variants.
- {c['collections']['earlier']} earlier artwork records and {c['collections']['experiments']} experiment records, retained separately from canonical diagrams.
- {c['collections']['scenes']} cinematic scene photograph records and {c['collections']['comics']} comic art records (Comic B pages, layers, models and navigation), kept in separate collections.
- {c['imageFiles']} creative image files; {c['evidenceImageFiles']} separately stored evidence/provenance images.

The manifest records relative paths, raster pixel dimensions or declared SVG extents, byte sizes, SHA-256 hashes and explicit review status. SVG dimension-source notes distinguish a standard viewBox, a retained legacy attribute and absolute intrinsic sizes; they are not rendered viewport measurements or visual review. New or replacement artwork uses a new filename. Previous versions, metadata and review status remain registered and unchanged. `records/` may hold explicitly separate provenance or verification material; it is not browser source artwork.

Preserved vector manifests inside `assets/` describe their historical vector package; the top-level manifest is authoritative for the current combined library. Inert historical provenance inside SVGs is not a runtime dependency. Maintenance and export do not read discussion or site source folders.

Source selection, author review, unreviewed previews, drafts, website integration and user approval remain separate. Refreshing or zipping does not visually verify artwork.

To share the whole library, zip it using the exact file receipt, then verify extraction elsewhere; for a browsable offline copy use `mtw export images`. Original image bytes are preserved.
"""
    # Resolve immutable playback return links without restoring the retired browser app.
    bridge = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=all-files.html"><title>Image library file index</title><body><p><a href="all-files.html">Open the image library file index</a></p></body></html>\n'
    return {"manifest.json": json_bytes(catalog), "data.js": b"window.MTW_LIBRARY = " + json_bytes(catalog, True).rstrip(b"\n") + b";\n",
            "all-files.html": index.encode("utf-8"), "index.html": bridge.encode("utf-8"), "README.md": readme.encode("utf-8")}


def validate_links(root, generated):
    for name in ["index.html", "all-files.html"]:
        content = generated.get(name, (root / name).read_bytes() if (root / name).is_file() else b"").decode("utf-8-sig")
        if not content:
            raise ValueError(f"Missing browser file: {name}")
        urls = re.findall(r'(?:src|href)=["\']([^"\']+)', content) if name.endswith("html") else re.findall(r'url\(["\']?([^\)"\']+)', content)
        for url in urls:
            if not url.startswith("#"):
                path = local_path(root, url)
                if url not in generated and not path.is_file():
                    raise ValueError(f"Unresolved local reference: {name} -> {url}")


def register_records(catalog, payload):
    candidate = deepcopy(catalog)
    rows = indexed_records(candidate)
    entries = payload.get("records") if isinstance(payload, dict) and "records" in payload else [payload.get("record", payload)]
    if not isinstance(entries, list) or not entries:
        raise ValueError("Registration needs a nonempty records[] array")
    seen = set()
    retained = []
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str):
            raise ValueError("Registration record needs an id")
        ident = entry["id"]
        if ident.casefold() in seen:
            raise ValueError(f"Duplicate registration ID: {ident}")
        seen.add(ident.casefold())
        if not isinstance(entry.get("treatments"), dict) or not entry["treatments"]:
            raise ValueError(f"Registration needs nonempty treatments: {ident}")
        if ident not in rows:
            new = deepcopy(entry)
            candidate["records"].append(new)
            rows[ident] = new
            continue
        row = rows[ident]
        for style, incoming in entry["treatments"].items():
            if not isinstance(incoming, dict) or not incoming.get("path"):
                raise ValueError(f"Dropping a treatment is not allowed: {ident}/{style}")
            old = row["treatments"].get(style)
            if old and old.get("path") == incoming["path"]:
                # Re-registering an unchanged file must not manufacture another version.
                # Partial review updates retain unsupplied provenance/hash fields.
                incoming = {**deepcopy(old), **deepcopy(incoming)}
            if old and old.get("path") and treatment_identity(incoming) != treatment_identity(old):
                key = hashlib.sha256(json.dumps(old, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]
                archive_id = f"earlier-{ident}-{style}-{key}"
                if archive_id not in rows:
                    archive = {"id": archive_id, "logicalId": row.get("logicalId"), "collection": "earlier",
                               "title": row["title"] + " · earlier " + STYLE_NAMES.get(style, style), "description": row["description"],
                               "service": row["service"], "category": row["category"], "treatments": {style: deepcopy(old)},
                               "references": deepcopy(row.get("references", [])), "relatedDiagrams": [ident], "retainedFrom": ident}
                    candidate["records"].append(archive)
                    rows[archive_id] = archive
                    retained.append(archive_id)
            row["treatments"][style] = deepcopy(incoming)
        for key, value in entry.items():
            if key not in {"id", "treatments"}:
                row[key] = deepcopy(value)
    indexed_records(candidate)
    return candidate, retained


def remove_records(root, catalog, payload):
    """Drop the declared, already-deleted files from the catalog. Returns (candidate, removed)."""
    entries = payload.get("remove") if isinstance(payload, dict) else None
    if not isinstance(entries, list) or not entries:
        raise ValueError("Removal needs a nonempty remove[] array")
    candidate = deepcopy(catalog)
    rows = indexed_records(candidate)
    declared = {}
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str) or not entry["path"]:
            raise ValueError("Removal entry needs a path")
        name = entry["path"]
        local_path(root, name)
        if name in declared:
            raise ValueError(f"Duplicate removal path: {name}")
        if name in DERIVED | RUNTIME | UNCATALOGED:
            raise ValueError(f"Producer-owned file cannot be removed: {name}")
        if (root / name).exists():
            raise ValueError(f"Removal path still exists; archive and delete it first: {name}")
        ids = entry.get("recordIds", [])
        if not isinstance(ids, list) or not all(isinstance(i, str) for i in ids):
            raise ValueError(f"Removal recordIds must be a list of IDs: {name}")
        for ident in ids:
            if ident not in rows:
                raise ValueError(f"Removal names an unknown record: {ident}")
        declared[name] = entry
    removed = {"records": set(), "treatments": set(), "paths": set(declared)}
    matched = set()
    for row in list(rows.values()):
        for style, treatment in list(row["treatments"].items()):
            name = treatment.get("path") if isinstance(treatment, dict) else None
            if name not in declared:
                continue
            entry = declared[name]
            if row["id"] not in entry.get("recordIds", []):
                raise ValueError(f"Removal of {name} does not declare record {row['id']}")
            if entry.get("sha256") and treatment.get("sha256") and entry["sha256"] != treatment["sha256"]:
                raise ValueError(f"Removal hash conflict: {name}")
            if row.get("tour") or row.get("tourVariants"):
                raise ValueError(f"Removing a diagram with tours is not supported: {row['id']}/{style}")
            del row["treatments"][style]
            removed["treatments"].add((row["id"], style))
            matched.add((name, row["id"]))
        if not row["treatments"]:
            removed["records"].add(row["id"])
    for name, entry in declared.items():
        for ident in entry.get("recordIds", []):
            if (name, ident) not in matched:
                raise ValueError(f"Record {ident} has no treatment at {name}")
    candidate["records"] = [row for row in candidate["records"] if row["id"] not in removed["records"]]
    for row in candidate["records"]:
        for key in ("references", "relatedDiagrams"):
            if row.get(key):
                row[key] = [linked for linked in row[key] if linked not in removed["records"]]
    candidate["files"] = [f for f in candidate.get("files", []) if f.get("destination", f.get("path")) not in declared]
    indexed_records(candidate)
    return candidate, removed


def atomic_write(path, data):
    if path.is_file() and path.read_bytes() == data:
        return
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".mtw-write-", delete=False) as f:
            temporary = Path(f.name)
            f.write(data)
        # Windows refuses the rename while another process (Studio, an editor, a scanner) briefly holds the
        # target open; retry a bounded number of times instead of failing a long run at its last step.
        for attempt in range(20):
            try:
                temporary.replace(path)
                break
            except PermissionError:
                if attempt == 19:
                    raise
                time.sleep(0.25 * (attempt + 1))
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def receipt(root, folder, operation, retained=None, removed=None):
    files = [{"path": p.relative_to(root).as_posix(), "sha256": sha(p), "bytes": p.stat().st_size}
             for p in sorted(root.rglob("*")) if p.is_file()]
    result = {"operation": operation, "library": str(root), "files": len(files), "packageBytes": sum(f["bytes"] for f in files),
              "manifestSha256": sha(root / "manifest.json"), "retainedEarlierIds": retained or [],
              "hashesAndRelativeReferences": "pass", "browserReview": BROWSER_LIMIT, "artworkMutation": "none"}
    if removed is not None:
        result["removed"] = {"paths": sorted(removed["paths"]), "records": sorted(removed["records"]),
                             "treatments": sorted(f"{i}/{s}" for i, s in removed["treatments"])}
    folder.mkdir(parents=True, exist_ok=True)
    atomic_write(folder / "package-files.json", json_bytes({"root": str(root), "files": files}))
    atomic_write(folder / "maintenance-checks.json", json_bytes(result))
    return result


def load_validated(root):
    catalog = read_json(root / "manifest.json")
    current = derive(root, catalog, snapshot(root))
    generated = generated_files(current)
    validate_links(root, generated)
    return current, generated


def export_library(root, out, records_dir, plan_only=False):
    """Exact canonical export used by the legacy entry point; no legacy inputs."""
    root, out = Path(root).resolve(strict=True), Path(out).resolve()
    helper = Path(__file__).resolve().parent
    separate_path(out, [root, helper], "Output")
    separate_path(records_dir, [root, helper], "Records")
    catalog, generated = load_validated(root)
    for name, content in generated.items():
        if not (root / name).is_file() or (root / name).read_bytes() != content:
            raise ValueError("Canonical library needs refresh before export: " + name)
    files = [{"source": str(p), "destination": p.relative_to(root).as_posix(), "sha256": sha(p), "bytes": p.stat().st_size}
             for p in sorted(root.rglob("*")) if p.is_file()]
    expected = {f["destination"]: f for f in files}
    if out.exists():
        for path in out.rglob("*"):
            if path.is_file():
                name = path.relative_to(out).as_posix()
                if name not in expected or sha(path) != expected[name]["sha256"]:
                    raise ValueError(f"Existing export conflicts; use fresh output: {name}")
    records_dir.mkdir(parents=True, exist_ok=True)
    atomic_write(records_dir / "copy-plan.json", json_bytes({"output": str(out), "canonicalSource": str(root), "counts": catalog["counts"], "files": files}))
    if plan_only:
        return {"operation": "canonical-export-plan", "files": len(files), "outputCreated": False}
    for item in files:
        target = local_path(out, item["destination"])
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copyfile(item["source"], target)
        if sha(target) != item["sha256"] or sha(Path(item["source"])) != item["sha256"]:
            raise ValueError(f"Export hash conflict: {item['destination']}")
    return receipt(out, records_dir, "canonical-export")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["refresh", "verify", "register", "remove"])
    parser.add_argument("--library", required=True, type=Path)
    parser.add_argument("--receipt-dir", required=True, type=Path)
    parser.add_argument("--payload", type=Path)
    args = parser.parse_args()
    root = args.library.resolve(strict=True)
    helper = Path(__file__).resolve().parent
    if root == helper or helper in root.parents or root in helper.parents:
        raise ValueError("Library must be separate from the maintained helper")
    receipts = separate_path(args.receipt_dir, [root, helper], "Receipt directory")
    before_inputs = input_membership(root)
    before_hash = sha(root / "manifest.json")
    catalog = read_json(root / "manifest.json")
    previous = snapshot(root)
    retained = []
    removed = None
    if args.operation == "remove":
        if not args.payload:
            parser.error("remove requires --payload")
        payload = read_json(args.payload)
        if not isinstance(payload, dict) or payload.get("expectedManifestSha256") != before_hash:
            raise ValueError("Stale or unbound removal payload: expectedManifestSha256 must match the current manifest")
        catalog, removed = remove_records(root, catalog, payload)
    elif args.operation == "register":
        if not args.payload:
            parser.error("register requires --payload")
        payload = read_json(args.payload)
        if isinstance(payload, dict) and payload.get("expectedManifestSha256") and payload["expectedManifestSha256"] != before_hash:
            raise ValueError("Stale registration payload: manifest hash changed")
        catalog, retained = register_records(catalog, payload)
    elif args.payload:
        parser.error("--payload is only used by register and remove")
    updated = derive(root, catalog, previous, removed)
    outputs = generated_files(updated)
    validate_links(root, outputs)
    require_input_membership(root, before_inputs)
    if args.operation == "verify":
        stale = [name for name, data in outputs.items() if not (root / name).is_file() or (root / name).read_bytes() != data]
        if stale:
            raise ValueError("Derived files need refresh: " + ", ".join(stale))
    else:
        if sha(root / "manifest.json") != before_hash:
            raise ValueError("Concurrent manifest change; no update written")
        for name, data in outputs.items():
            atomic_write(root / name, data)
    print(json.dumps(receipt(root, receipts, args.operation, retained, removed), ensure_ascii=False))


if __name__ == "__main__":
    main()
