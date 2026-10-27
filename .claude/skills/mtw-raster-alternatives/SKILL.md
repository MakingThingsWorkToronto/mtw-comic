---
name: mtw-raster-alternatives
description: Maintain the comic artwork catalog and portable gallery through its producer.
---

# Comic artwork registration

This directory retains the image catalog producer used by Comic Studio and the comic art scripts. It does not carry the consulting website's diagram or holographic generation queues.

Generate comic art with `../mtw-comic-story/SKILL.md` and `../imagegen/SKILL.md`. Save every attempt under `wiki/image-library/`, retain original bytes and prior versions, and register through `node apps/mtw/cli/mtw.mjs register image <path...>` or the comic batch importer. Never hand-edit catalog projections.

The underlying producer is `scripts/portable-gallery/maintain_library.py`; its `--help` documents register, refresh, verify and explicit removal. Registration records provenance and review state; it does not imply selection, publication or human approval.
