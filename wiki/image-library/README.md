# Making Things Work image library

Browse, compare, review and register images in MTW Studio: open `/m/images` (`npm run studio`, port 8788). For an offline copy to share, run `node apps/mtw/cli/mtw.mjs export images --out <folder>` and open the exported `index.html`; no server or internet connection is needed. `all-files.html` is a plain linked index that works without JavaScript. `decisions.jsonl` is Studio's append-only decision log and is not catalog content.

This is the canonical image library. New artwork is saved inside `assets/` and registered in `manifest.json` (`node apps/mtw/cli/mtw.mjs register image <path>`); derived counts, `data.js`, the plain file index and this README are refreshed together. Studio's four-style selector and comparisons are permanent. Public diagrams adopt Site Glass through their primary tour pins; unconverted diagrams retain SVG Flat.

- 0 diagram subjects: 0 SVG Flat, 0 SVG Outline, 0 Holographic, 0 Photorealistic.
- 0 shared icon subjects; 0 flat and 0 outline files.
- 0 original reference records, including 0 selected references and 0 Traditional Systems originals/variants.
- 0 earlier artwork records and 0 experiment records, retained separately from canonical diagrams.
- 0 cinematic scene photograph records and 195 comic art records (Comic B pages, layers, models and navigation), kept in separate collections.
- 198 creative image files; 0 separately stored evidence/provenance images.

The manifest records relative paths, raster pixel dimensions or declared SVG extents, byte sizes, SHA-256 hashes and explicit review status. SVG dimension-source notes distinguish a standard viewBox, a retained legacy attribute and absolute intrinsic sizes; they are not rendered viewport measurements or visual review. New or replacement artwork uses a new filename. Previous versions, metadata and review status remain registered and unchanged. `records/` may hold explicitly separate provenance or verification material; it is not browser source artwork.

Preserved vector manifests inside `assets/` describe their historical vector package; the top-level manifest is authoritative for the current combined library. Inert historical provenance inside SVGs is not a runtime dependency. Maintenance and export do not read discussion or site source folders.

Source selection, author review, unreviewed previews, drafts, website integration and user approval remain separate. Refreshing or zipping does not visually verify artwork.

To share the whole library, zip it using the exact file receipt, then verify extraction elsewhere; for a browsable offline copy use `mtw export images`. Original image bytes are preserved.
