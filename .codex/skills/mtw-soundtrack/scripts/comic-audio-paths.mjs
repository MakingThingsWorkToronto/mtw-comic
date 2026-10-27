import path from 'node:path';
// Read-only canonical comic audio and receipts; never grants sibling-console write access.
export function resolveComicAudioPath(root,pathname){let decoded;try{decoded=decodeURIComponent(pathname);}catch{return null;}if(decoded.includes('\0'))return null;const f=path.resolve(root,'.'+decoded),base=path.resolve(root,'wiki/comics-library'),ext=path.extname(f).toLowerCase();
 for(const dir of ['assets/voices','assets/sounds']){const allowed=path.resolve(base,dir);if(f.startsWith(allowed+path.sep)&&['.mp3','.wav','.ogg'].includes(ext))return f;}
 const receipts=path.resolve(base,'records');if(f.startsWith(receipts+path.sep)&&ext==='.json')return f;
 const runtime=path.resolve(root,'site/public/scripts/comic-story.js');return f===runtime?f:null;
}

// Existing comic-relative links are compatibility inputs; new audio uses root-relative soundtrack refs.
export function canonicalAudioReference(reference) {
 if (typeof reference !== 'string' || !reference) throw Error('Missing audio reference');
 let value = reference;
 if (value.startsWith('../soundtrack-library/')) value = 'wiki/soundtrack-library/' + value.slice('../soundtrack-library/'.length);
 else if (/^(assets|records)\//.test(value)) value = 'wiki/comics-library/' + value;
 if (!/^wiki\/(soundtrack-library|comics-library)\/(assets|records)\//.test(value) || value.includes('\\') || value.split('/').some(s => s === '..' || s === '.' || !s)) throw Error('Unsafe audio reference ' + reference);
 const media = /^wiki\/(soundtrack-library|comics-library)\/assets\//.test(value);
 if (!(media ? (value.startsWith('wiki/soundtrack-library/')?/\.(mp3|wav|ogg|webm)$/i:/\.(mp3|wav|ogg)$/i) : /\.json$/i).test(value)) throw Error('Unsupported audio reference ' + reference);
 return value;
}
