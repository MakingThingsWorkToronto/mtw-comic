import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {rebindDelivery, sha256, verifyDelivery, readBoundFile} from './playback_bindings.mjs';

/** Immutable producer. Outputs may be staged; no catalog or media writes occur. */
export function prepareDeliveryRebind({root, configPath, catalogPath, constantsPath}) {
  const inputs = [configPath, catalogPath, constantsPath].map(relative => {
    if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').includes('..')) throw Error('Repo-relative producer input required');
    const bytes = fs.readFileSync(path.join(root, relative));
    return {path: relative, sha256: sha256(bytes), bytes};
  });
  const [config, catalog, constants] = inputs.map(i => JSON.parse(i.bytes.toString('utf8')));
  const result = rebindDelivery(root, catalog, config, constants);
  // Preserve every annotation, phone target and retained source recipe. Only
  // masterAliases[].deliveryBinding is a generated projection of this producer.
  const candidateBytes = Buffer.from(JSON.stringify(result.candidate, null, 2) + '\n');
  const receipt = {schemaVersion: 1, operation: 'playback-delivery-rebind',
    producer: '.codex/skills/mtw-comic-story/scripts/rebind_playback_delivery.mjs',
    producerSha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
    helperSha256: sha256(fs.readFileSync(fileURLToPath(new URL('./playback_bindings.mjs', import.meta.url)))),
    priorConfigSha256: inputs[0].sha256, outputConfigSha256: sha256(candidateBytes),
    inputGuards: inputs.map(({path, sha256}) => ({path, sha256})),
    artWidths: result.artWidths, selectedSlot: result.slot, bindings: result.changes,
    approval: 'No new artwork, source selection, visual/listening acceptance or human approval inferred'};
  for (const binding of result.changes) readBoundFile(root, binding.sourcePath, binding.sourceSha256);
  for (const alias of result.candidate.masterAliases) verifyDelivery(root, catalog, alias);
  for (const input of inputs) if (sha256(fs.readFileSync(path.join(root, input.path))) !== input.sha256) throw Error('Producer input changed: ' + input.path);
  return {candidateBytes, receipt, count: result.changes.length};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {values} = parseArgs({options: {root: {type:'string'}, config: {type:'string', default:'wiki/comics-library/playback-review-inputs.json'},
    catalog: {type:'string', default:'wiki/image-library/manifest.json'}, constants: {type:'string', default:'.codex/skills/mtw-comic-story/assets/page-constants.json'},
    out: {type:'string'}, receipt: {type:'string'}}});
  if (!values.root || !values.out || !values.receipt) throw Error('--root --out --receipt required');
  const destinations = [values.out, values.receipt].map(v => path.resolve(v));
  if (destinations[0] === destinations[1] || destinations.some(v => fs.existsSync(v))) throw Error('Two absent immutable output paths required');
  try {
    const result = prepareDeliveryRebind({root: path.resolve(values.root), configPath: values.config, catalogPath: values.catalog, constantsPath: values.constants});
    // Exclusive create protects existing data; do not silently overwrite review config.
    fs.writeFileSync(destinations[0], result.candidateBytes, {flag:'wx'});
    fs.writeFileSync(destinations[1], JSON.stringify(result.receipt, null, 2)+'\n', {flag:'wx'});
    process.stdout.write(JSON.stringify({status:'pass', bindings:result.count, outputs:destinations,
      configSha256:result.receipt.outputConfigSha256, priorConfigSha256:result.receipt.priorConfigSha256})+'\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({status:'refused', error:error.message, unbound:error.aliases || []})+'\n'); process.exitCode = 1;
  }
}
