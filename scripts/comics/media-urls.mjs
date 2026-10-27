/** URLs created by the reader at runtime, including generated raster candidates and legacy panel IDs. */
export function comicMediaUrls(story, widths = [1600]) {
  const urls = new Set();
  function add(value) {
    if (typeof value === 'string' && /^\/(?:comic|audio|fonts|scripts)\//.test(value) && /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(value)) urls.add(value);
    else if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === 'object') Object.values(value).forEach(add);
  }
  add(story);
  for (const scene of story.scenes || []) {
    if (scene.art && !/\.svg(?:[?#]|$)/i.test(scene.art)) {
      const formats = scene.artFormats || ['avif', 'webp'];
      for (const width of widths) for (const format of formats) urls.add(`${scene.art}-${width}.${format}`);
    } else if (!scene.art && !scene.layers?.length) {
      for (const panel of scene.panels || []) {
        if (!panel.img) continue;
        urls.add(panel.img.startsWith('/') ? panel.img : `/comic/${story.id}/${panel.img}.svg`);
      }
    }
  }
  return urls;
}
