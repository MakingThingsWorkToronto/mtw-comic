import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function recordedRepositoryPath(raw) {
  const normal=raw?.replace(/\\/g,'/');
  if (!normal) return null;
  for(const prefix of ['wiki/image-library/','site/public/']) {
    const i=normal.lastIndexOf(prefix);if(i>=0)return normal.slice(i);
  }
  return null;
}
export function catalogMatches(catalog, sha, exactPath) {
  return catalog.records.filter(r => r.collection !== 'earlier').flatMap(record =>
    Object.entries(record.treatments || {}).filter(([, t]) => t.sha256 === sha && (!exactPath || t.path === exactPath))
      .map(([treatment, selected]) => ({recordId:record.id, treatment, selected})));
}
export function chooseCatalogMatch(matches, prior, exactPath) {
  let rows = matches.filter(m => !exactPath || m.selected.path === exactPath);
  if (prior) {
    const previous = rows.filter(m => m.recordId === prior.recordId && m.treatment === prior.treatment);
    if (previous.length === 1) return previous[0];
  }
  const owners = rows.filter(m => !/^comic-b-retained-/.test(m.recordId));
  if (owners.length) rows = owners;
  const readerSelected = rows.filter(m => m.selected.status === 'content-reviewed-for-reader');
  if (readerSelected.length === 1) rows = readerSelected;
  if (rows.length !== 1) throw Error('Missing or ambiguous byte-bound canonical artwork: ' + JSON.stringify(rows.map(m=>({recordId:m.recordId,path:m.selected.path}))));
  return rows[0];
}
export function readBoundFile(root, relative, expectedSha) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || /^[a-z]:/i.test(relative) || relative.includes('\\') || relative.split('/').includes('..')) throw Error('Unsafe bound file path: '+relative);
  const file = path.join(root, relative), actual = sha256(fs.readFileSync(file));
  if (!expectedSha || actual !== expectedSha) throw Error('Stale bound file hash: '+relative);
  return actual;
}
export function verifyDelivery(root, catalog, alias) {
  const binding = alias.deliveryBinding;
  if (!binding) throw Error('Missing playback delivery binding');
  readBoundFile(root, binding.publicPath, binding.sha256);
  if (binding.canonicalDerivative) {
    const d = binding.canonicalDerivative;
    if (d.sha256 !== binding.sha256 || !catalogMatches(catalog, binding.sha256, d.path).some(m =>
      (!d.recordId || m.recordId === d.recordId) && (!d.treatment || m.treatment === d.treatment))) throw Error('Missing canonical derivative identity');
    readBoundFile(root, 'wiki/image-library/'+d.path, binding.sha256);
  }
  if (binding.encoderReceipt) {
    const e = binding.encoderReceipt;
    readBoundFile(root, e.path, e.sha256);
    readBoundFile(root, e.sourcePath, e.sourceSha256);
    readBoundFile(root, e.outputPath, binding.sha256);
    const receipt=JSON.parse(fs.readFileSync(path.join(root,e.path),'utf8'));
    const groups=receipt.records||[receipt];
    if (!groups.some(g => (g.source?.sha256||g.sourceMasterSha256||g.masterSha256)===e.sourceSha256 &&
      (g.outputs||[]).some(o=>recordedRepositoryPath(o.path||o.file)===e.outputPath && (!o.sha256||o.sha256===binding.sha256)))) throw Error('Encoder receipt does not bind this source/output pair');
    const selected = catalog.records.find(r=>r.id===alias.recordId)?.treatments?.[alias.treatment];
    if (selected?.sha256 !== e.sourceSha256 || 'wiki/image-library/'+selected.path !== e.sourcePath) throw Error('Encoder source differs from selected master');
  }
  if (binding.legacyAlias) {
    const e=binding.legacyAlias;
    const a=e.originalAlias;
    // Lettering-only scene splits may reuse this exact retained artwork; keep
    // originalAlias.scene as provenance instead of relabelling its authority.
    if(!a || a.story!==alias.story || a.art!==alias.art || a.recordId!==alias.recordId || a.treatment!==alias.treatment || !/^[0-9a-f]{64}$/.test(e.priorConfigSha256))throw Error('Legacy alias authority changed');
    const selected=catalog.records.find(r=>r.id===alias.recordId)?.treatments?.[alias.treatment];
    readBoundFile(root,'wiki/image-library/'+selected.path,e.masterSha256);
  }
  if (!binding.canonicalDerivative && !binding.encoderReceipt && !binding.legacyAlias) throw Error('No canonical derivative or exact encoder/retained alias lineage');
  return true;
}

/** Refresh delivery bytes from retained authority; never infer a master from a filename. */
export function rebindDelivery(root, catalog, config, pageConstants) {
  const widths = pageConstants?.page?.artWidths;
  if (!Array.isArray(widths) || !widths.length || widths.some(w => !Number.isSafeInteger(w) || w <= 0) || new Set(widths).size !== widths.length)
    throw Error('Exact current PAGE.artWidths required');
  const slot = Math.max(...widths), candidate = structuredClone(config), changes = [], errors = [];
  if (!Array.isArray(config.masterAliases) || !config.masterAliases.length) throw Error('Exact retained master aliases required');
  const seen = new Set();
  for (const alias of candidate.masterAliases) {
    try {
      const key = alias.story + '/' + alias.scene;
      if (seen.has(key)) throw Error('Duplicate scene alias'); seen.add(key);
      if (typeof alias.art !== 'string' || !alias.art.startsWith('/comic/') || alias.art.includes('\\') || alias.art.split('/').includes('..')) throw Error('Exact authored comic art stem required');
      const selected = catalog.records.find(r => r.id === alias.recordId)?.treatments?.[alias.treatment];
      if (!selected) throw Error('Missing selected canonical master');
      readBoundFile(root, 'wiki/image-library/' + selected.path, selected.sha256);
      const publicPath = 'site/public' + alias.art + '-' + slot + '.avif';
      const bytes = fs.readFileSync(path.join(root, publicPath)), hash = sha256(bytes);
      const prior = alias.deliveryBinding;
      if (!prior) throw Error('Missing retained delivery authority');
      const binding = {publicPath, sha256: hash};
      const matches = catalogMatches(catalog, hash);
      if (matches.length) {
        const match = chooseCatalogMatch(matches);
        readBoundFile(root, 'wiki/image-library/' + match.selected.path, hash);
        binding.canonicalDerivative = {recordId: match.recordId, treatment: match.treatment, path: match.selected.path, sha256: hash};
      } else if (prior.encoderReceipt) {
        const e = prior.encoderReceipt;
        readBoundFile(root, e.path, e.sha256);
        if (e.sourceSha256 !== selected.sha256 || e.sourcePath !== 'wiki/image-library/' + selected.path) throw Error('Encoder source differs from selected master');
        const receipt = JSON.parse(fs.readFileSync(path.join(root, e.path), 'utf8'));
        const outputs = (receipt.records || [receipt]).filter(g => (g.source?.sha256 || g.sourceMasterSha256 || g.masterSha256) === selected.sha256)
          .flatMap(g => g.outputs || []).filter(o => {
            const recorded = recordedRepositoryPath(o.path || o.file);
            // Match the exact retained output bytes to the current target; a
            // same-named output or a claimed source name supplies no identity.
            if (!recorded) return false;
            try { return readBoundFile(root, recorded, hash) === hash && (!o.sha256 || o.sha256 === hash); } catch { return false; }
          });
        if (outputs.length !== 1) throw Error('Missing or ambiguous exact retained encoder output');
        binding.encoderReceipt = {...e, outputPath: recordedRepositoryPath(outputs[0].path || outputs[0].file)};
      } else if (prior.legacyAlias) {
        // Preserve the already frozen authority verbatim; never manufacture it
        // for a new or changed scene/master merely because a filename matches.
        binding.legacyAlias = structuredClone(prior.legacyAlias);
      } else throw Error('No exact canonical derivative, source-bound encoder or retained legacy authority');
      alias.deliveryBinding = binding;
      verifyDelivery(root, catalog, alias);
      changes.push({story: alias.story, scene: alias.scene, recordId: alias.recordId, treatment: alias.treatment,
        sourcePath: 'wiki/image-library/' + selected.path, sourceSha256: selected.sha256, priorBinding: prior, binding});
    } catch (error) { errors.push({story: alias.story, scene: alias.scene, error: error.message}); }
  }
  if (errors.length) { const error = Error('Delivery rebind refused for ' + errors.length + ' aliases'); error.aliases = errors; throw error; }
  return {candidate, changes, artWidths: widths, slot};
}
