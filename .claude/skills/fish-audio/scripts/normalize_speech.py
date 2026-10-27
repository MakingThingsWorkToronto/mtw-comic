"""Normalize one retained speech recording; no provider access, preserve original bytes."""
import argparse, hashlib, json, math, re, shutil, subprocess
from pathlib import Path

def sha(data): return hashlib.sha256(data).hexdigest()
def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def safe(root, value, homes):
    if '\\' in value or any(p in ['.','..'] for p in value.split('/')): raise ValueError('Unsafe canonical audio reference')
    target=(Path(root)/value).resolve()
    if not any(target.is_relative_to((Path(root)/h).resolve()) for h in homes): raise ValueError('Audio reference leaves its canonical home')
    return target
def run(args): return subprocess.run(args,capture_output=True,text=True,encoding='utf-8',timeout=40,check=True)
def measure(file, prefix=''):
    result=run(['ffmpeg','-nostdin','-hide_banner','-i',str(file),'-af',prefix+'loudnorm=I=-18:TP=-3.5:LRA=7:print_format=json','-f','null','NUL'])
    return json.loads(re.findall(r'\{[^{}]+\}',result.stderr,re.S)[-1])
def normalize(repo,output,row):
    source=row['reuse'];raw=safe(repo,source['path'],['wiki/comics-library/assets/voices','wiki/soundtrack-library/assets'])
    raw_bytes=raw.read_bytes()
    if sha(raw_bytes)!=source['sha256']: raise ValueError('Retained source audio hash differs')
    dest=safe(output,row['normalizedCanonicalPath'],['wiki/soundtrack-library/assets/speech/home-20261010'])
    receipt=safe(output,row['normalizationReceiptCanonicalPath'],['wiki/soundtrack-library/records/home-voiceover-20261010'])
    if dest.exists() or receipt.exists(): raise ValueError('New version required; never overwrite encoded audio or evidence')
    if not all(shutil.which(x) for x in ['ffmpeg','ffprobe']): raise ValueError('ffmpeg and ffprobe are required')
    eq='highpass=f=70,lowpass=f=12500,acompressor=threshold=0.1:ratio=3:attack=0.1:release=80:knee=2.828:makeup=1,';first=measure(raw,eq)
    if not all(math.isfinite(float(first[k])) for k in ['input_i','input_tp','input_lra','input_thresh','target_offset']): raise ValueError('Recording cannot establish finite loudness')
    filt=eq+'loudnorm=I=-18:TP=-3.5:LRA=7:measured_I='+first['input_i']+':measured_TP='+first['input_tp']+':measured_LRA='+first['input_lra']+':measured_thresh='+first['input_thresh']+':offset='+first['target_offset']+':linear=true:print_format=json'
    dest.parent.mkdir(parents=True,exist_ok=True)
    command=['ffmpeg','-nostdin','-hide_banner','-n','-i',str(raw),'-af',filt,'-ac','1','-ar','44100','-c:a','libmp3lame','-b:a','128k',str(dest)]
    run(command);encoded=measure(dest)
    probe=json.loads(run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(dest)]).stdout)
    duration=float(probe['format']['duration']);data=dest.read_bytes()
    passed=-18.5<=float(encoded['input_i'])<=-17.5 and float(encoded['input_tp'])<=-3 and duration>0 and probe['streams'][0]['codec_name']=='mp3'
    assert sha(raw.read_bytes())==source['sha256'],'Original changed'
    source_receipt=safe(repo,source['receipt'],['wiki/comics-library/records','wiki/soundtrack-library/records'])
    result={'schemaVersion':1,'id':row['id'],'type':'speech-narration' if row['kind'] in ['caption','place'] else 'speech-dialogue',
      'storyId':'home','characterId':row['characterId'],'provider':row['provider'],'voiceId':row['voiceId'],'text':row['text'],'textSha256':row['textSha256'],
      'status':'normalized-candidate' if passed else 'failed-encoded-target','productionApproved':False,'hearingReview':'pending',
      'source':{'canonicalPath':source['path'],'sha256':source['sha256'],'receiptCanonicalPath':source['receipt'],'receiptSha256':sha(source_receipt.read_bytes()),'bytes':len(raw_bytes)},
      'savedAsset':{'path':row['normalizedCanonicalPath'],'sha256':sha(data),'bytes':len(data),'durationSeconds':duration},
      'target':{'integratedLufs':-18,'truePeakMaxDbfs':-3,'encoderTargetPeakDbfs':-3.5,'lra':7},
      'measurements':{'beforeAfterEQ':first,'actualEncoded':encoded,'ffprobe':probe},'filter':filt,'encoderCommand':command,
      'dependencies':{'helperSha256':sha(Path(__file__).read_bytes()),**{tool:sha(Path(shutil.which(tool)).read_bytes()) for tool in ['ffmpeg','ffprobe']}},
      'reproduction':'Reuse retained raw and normalized bytes. Re-encoding with recorded filter/tools is distinct from stochastic provider regeneration. No new provider request.',
      'scope':'Exact retained Home text/voice reuse; not a new take or human text approval.'}
    receipt.parent.mkdir(parents=True,exist_ok=True)
    with receipt.open('x',encoding='utf-8') as f: json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
    if not passed: raise ValueError('Encoded speech target failed; retain bytes/evidence, do not overwrite')
    return result
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repo',type=Path,default=Path.cwd());parser.add_argument('--output-root',type=Path);parser.add_argument('--plan',type=Path,required=True);parser.add_argument('--line-id',required=True);args=parser.parse_args()
    row=next(r for r in read(args.plan)['rows'] if r['id']==args.line_id)
    if not row.get('reuse'): raise ValueError('Only an exact saved recording may use this normalization helper')
    result=normalize(args.repo,args.output_root or args.repo,row)
    print(json.dumps({'id':row['id'],'asset':result['savedAsset'],'lufs':result['measurements']['actualEncoded']['input_i'],'truePeakDbfs':result['measurements']['actualEncoded']['input_tp'],'providerRequests':0}))
if __name__=='__main__': main()
