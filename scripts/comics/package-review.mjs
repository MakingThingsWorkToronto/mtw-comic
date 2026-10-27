import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const voices=JSON.parse(fs.readFileSync(path.join(root,'wiki/comics-library/voices.json')));const cast=JSON.parse(fs.readFileSync(path.join(root,'wiki/comics-library/characters.json')));
const data={voices:{profiles:voices.profiles.map(p=>({characterId:p.characterId,casting:p.casting?{selectedVoice:p.casting.selectedVoice}:undefined,clips:p.clips.map(c=>Object.fromEntries(['id','provider','voiceId','text','path','canonicalPath','sha256'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]])))}))},cast:{characters:cast.characters.map(c=>({id:c.id,name:c.name,aliases:c.aliases}))}};
const file=path.join(root,'site/src/data/comic-stories/home-voice-inputs.json'),output=JSON.stringify(data,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==output)throw Error('Home voice review inputs need packaging');}else fs.writeFileSync(file,output);
console.log('Home review input package: '+voices.profiles.length+' profiles');
