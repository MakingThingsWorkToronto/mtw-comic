#!/usr/bin/env bash
# Usage: generate.sh <reference.png> <output.png> <prompt.txt>
set -euo pipefail
[ "$#" -eq 3 ] || { echo "Usage: generate.sh <reference.png> <fresh-output.png> <prompt.txt>" >&2; exit 2; }
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
destination="$(realpath -m -- "$2")"
repo_check="$repo_root"
destination_check="$destination"
if command -v cygpath >/dev/null 2>&1; then
  # Git Bash can expose one Windows directory as /tmp and /c/Users/... .
  # Compare normalized Windows paths so these aliases cannot bypass ownership.
  repo_check="$(cygpath -am "$repo_root")"
  destination_check="$(cygpath -am "$destination")"
  repo_check="${repo_check,,}"
  destination_check="${destination_check,,}"
fi
case "$destination_check" in
  "$repo_check/wiki/image-library/assets/"*) ;;
  "$repo_check/"*) echo "New repo images belong under wiki/image-library/assets; discussion and site copies are not authoring destinations." >&2; exit 2 ;;
esac
ref="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
out_dir="$(dirname "$destination")"
out_name="$(basename "$destination")"
prompt="$3"

[ -f "$ref" ] || { echo "reference not found: $ref" >&2; exit 1; }
[ -f "$prompt" ] || { echo "prompt not found: $prompt" >&2; exit 1; }
[ ! -e "$out_dir/$out_name" ] || { echo "output exists, use a -vN name: $out_dir/$out_name" >&2; exit 1; }
mkdir -p "$out_dir"

{
  echo "Use the imagegen skill with the built-in image_gen tool. Input image 1 is attached."
  echo "Generate exactly one image from the prompt below. Save it into the current working directory as $out_name."
  echo "Retain the exact output even if it is a draft. Do not replace existing images or create other files. The integrating caller will retain prompt/lineage records and register the image in the canonical library. Print the saved path and final prompt used."
  echo
  cat "$prompt"
} | codex exec --skip-git-repo-check -s workspace-write -C "$out_dir" -i "$ref" -
