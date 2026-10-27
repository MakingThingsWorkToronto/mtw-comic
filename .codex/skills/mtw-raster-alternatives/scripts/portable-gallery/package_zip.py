#!/usr/bin/env python3
"""Zip an exact gallery file manifest, extract elsewhere, and verify every byte."""
from pathlib import Path, PurePosixPath
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
import shutil
from zipfile import ZipFile, ZIP_DEFLATED


def logical_path(path):
    """Keep report/containment paths absolute and free of the Win32 I/O prefix."""
    name = os.fspath(path)
    if os.name == 'nt':
        if name.startswith('\\\\?\\UNC\\'):
            name = '\\\\' + name[8:]
        elif name.startswith('\\\\?\\'):
            name = name[4:]
            if not Path(name).is_absolute():
                raise ValueError('Only absolute drive/UNC paths support extended-length I/O')
        if name.startswith('\\\\.\\'):
            raise ValueError('Device paths are not package paths')
    return Path(os.path.abspath(name))


def disk_path(path):
    """Use extended-length Windows I/O only for already absolute logical paths."""
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise ValueError('Filesystem I/O needs an absolute, normalized path')
    path = logical_path(path)
    name = str(path)
    if os.name == 'nt':
        name = '\\\\?\\UNC\\' + name[2:] if name.startswith('\\\\') else '\\\\?\\' + name
    return Path(name)


def resolved_path(path, strict=False):
    # Resolution may itself need long-path I/O. Containment is checked on the
    # returned logical path before any archive/output write.
    return logical_path(disk_path(logical_path(path)).resolve(strict=strict))


def sha(path):
    h = hashlib.sha256()
    with disk_path(path).open('rb') as file:
        for block in iter(lambda: file.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


def local_path(root, relative):
    if not isinstance(relative, str) or not relative or any(ord(c) < 32 for c in relative):
        raise ValueError(f'Unsafe relative path: {relative!r}')
    name = PurePosixPath(relative)
    if (name.is_absolute() or any(part in {'', '.', '..'} for part in relative.split('/')) or
            any(c in relative for c in ':\\*?<>|"') or
            any(part.endswith(('.', ' ')) or re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', part, re.I)
                for part in name.parts)):
        raise ValueError(f'Unsafe relative path: {relative}')
    root = resolved_path(root)
    path = root / relative
    if root not in path.parents:
        raise ValueError(f'Path escapes package: {relative}')
    path = resolved_path(path)
    if root not in path.parents:
        raise ValueError(f'Path escapes package: {relative}')
    return disk_path(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--package', required=True, type=Path)
    parser.add_argument('--file-manifest', required=True, type=Path)
    parser.add_argument('--zip', required=True, type=Path)
    parser.add_argument('--extract-check', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    root = resolved_path(args.package, strict=True)
    destination = resolved_path(args.zip)
    extracted = resolved_path(args.extract_check)
    report_path = resolved_path(args.report)
    for outside in [destination, extracted, report_path]:
        if root == outside or root in outside.parents or outside in root.parents:
            raise ValueError('ZIP, extraction and report paths must be separate from the source package')
    if any(disk_path(path).exists() for path in (destination, extracted, report_path)):
        raise ValueError('Use fresh ZIP, extraction and report paths; existing files are never replaced')
    records = json.loads(disk_path(resolved_path(args.file_manifest)).read_text(encoding='utf-8-sig'))['files']
    expected = {item['path']:item for item in records}
    if len(expected) != len(records):
        raise ValueError('Duplicate manifest filenames')
    source_disk = disk_path(root)
    actual = {p.relative_to(source_disk).as_posix() for p in source_disk.rglob('*') if p.is_file()}
    if actual != set(expected):
        raise ValueError('Manifest does not enumerate the complete source package')
    for relative, item in expected.items():
        source = local_path(root, relative)
        if sha(source) != item['sha256']:
            raise ValueError(f'Source differs from manifest: {relative}')
    disk_path(destination.parent).mkdir(parents=True, exist_ok=True)
    with ZipFile(disk_path(destination), 'x', compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for relative in sorted(expected):
            archive.write(local_path(root, relative), 'MTW-image-library/' + relative)
    disk_path(extracted).mkdir(parents=True)
    unpacked_root = extracted / 'MTW-image-library'
    with ZipFile(disk_path(destination)) as archive:
        if set(archive.namelist()) != {'MTW-image-library/' + n for n in expected}:
            raise ValueError('ZIP contents differ from exact file manifest')
        for item in archive.infolist():
            target = local_path(extracted, item.filename)
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(item) as source, target.open('xb') as output:
                shutil.copyfileobj(source, output)
    for relative, item in expected.items():
        if sha(local_path(unpacked_root, relative)) != item['sha256']:
            raise ValueError(f'Extracted bytes differ: {relative}')
    catalog = json.loads(local_path(unpacked_root, 'manifest.json').read_text(encoding='utf-8'))
    links = 0
    for record in catalog['records']:
        for treatment in record['treatments'].values():
            for key in ['path','metadata']:
                if treatment.get(key):
                    assert local_path(unpacked_root,treatment[key]).is_file()
                    links += 1
    for filename in ['all-files.html']:
        content = local_path(unpacked_root, filename).read_text(encoding='utf-8')
        urls = re.findall(r'(?:src|href)=["\']([^"\']+)',content) if filename.endswith('.html') else re.findall(r'url\(["\']?([^\)"\']+)',content)
        for url in urls:
            if not url.startswith('#'):
                assert local_path(unpacked_root,url).is_file(), url
                links += 1
    result = {'createdAt':datetime.now(timezone.utc).isoformat(),'zip':str(destination),'zipBytes':disk_path(destination).stat().st_size,
        'zipSha256':sha(destination),'sourcePackage':str(root),'extractionRoot':str(unpacked_root),
        'files':len(expected),'imageFiles':catalog['counts']['imageFiles'],'extractedHashMatches':len(expected),
        'resolvedRelativeReferences':links,'originalImageBytesPreserved':True,
        'browserReview':'not performed by this helper; structural portability is not a browser pass'}
    disk_path(report_path.parent).mkdir(parents=True,exist_ok=True)
    disk_path(report_path).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
