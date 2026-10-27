"""Make read-only before/after contact-detail proofs; never edits either PNG or asserts a visual pass."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, hashlib, json, re

def render(before, after, regions, output):
    before, after, output = Path(before).resolve(), Path(after).resolve(), Path(output).resolve()
    if before == after:
        raise ValueError('Before and after must be distinct versioned files.')
    page=(11,20,25,255)
    images=[]
    for src in (before,after):
        with Image.open(src) as im:
            background=Image.new('RGBA',im.size,page)
            background.alpha_composite(im.convert('RGBA'))
            images.append(background.convert('RGB'))
    output.mkdir(parents=True,exist_ok=True)
    if not regions:
        raise ValueError('At least one named region is required.')
    rows=[]
    tiles=[]
    for r in regions:
        label=r['name']; box=tuple(r['bounds'])
        if not re.fullmatch(r'[A-Za-z0-9_-]+',label):
            raise ValueError('Region names may contain only letters, numbers, underscores and hyphens.')
        if len(box)!=4 or box[2]<=box[0] or box[3]<=box[1]:
            raise ValueError('Invalid bounds: '+label)
        for im in images:
            if min(box)<0 or box[2]>im.width or box[3]>im.height:
                raise ValueError('Crop outside image: '+label)
        width,height=box[2]-box[0],box[3]-box[1]
        proof=Image.new('RGB',(width*2,height+48),page[:3])
        d=ImageDraw.Draw(proof)
        label_lines=label.split('-',1)
        for line_number,line in enumerate(label_lines): d.text((2,2+line_number*13),line,fill=(242,242,239))
        d.text((2,31),'Before',fill=(185,195,196)); d.text((width+2,31),'After',fill=(185,195,196))
        proof.paste(images[0].crop(box),(0,48)); proof.paste(images[1].crop(box),(width,48))
        paths=[output/(label+'-native.png'),output/(label+'-4x.png')]
        for path in paths:
            if path in (before,after):
                raise ValueError('Refusing to overwrite an input.')
        proof.save(paths[0])
        tiles.append(proof)
        proof.resize((proof.width*4,proof.height*4),Image.Resampling.NEAREST).save(paths[1])
        rows.append({'name':label,'bounds':list(box),'beforeAndAfterWidth':width,'beforeAndAfterHeight':height,
          'proofs':[{'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]})
    tile_width=max(p.width for p in tiles); tile_height=max(p.height for p in tiles)
    sheet=Image.new('RGB',(tile_width*3,tile_height*((len(tiles)+2)//3)),page[:3])
    for i,tile in enumerate(tiles): sheet.paste(tile,((i%3)*tile_width,(i//3)*tile_height))
    sheets=[output/'all-contacts-native.png',output/'all-contacts-4x.png']
    sheet.save(sheets[0]); sheet.resize((sheet.width*4,sheet.height*4),Image.Resampling.NEAREST).save(sheets[1])
    result={'before':{'file':str(before),'sha256':hashlib.sha256(before.read_bytes()).hexdigest()},
      'after':{'file':str(after),'sha256':hashlib.sha256(after.read_bytes()).hexdigest()},
      'background':'#0b1419','mode':'derived review crops only','visualReview':'not-performed-by-this-tool','regions':rows,
      'overviewProofs':[{'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sheets]}
    (output/'contact-proofs.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('before',type=Path); parser.add_argument('after',type=Path)
    parser.add_argument('--regions',type=Path,required=True,help='JSON list of {name,bounds:[left,top,right,bottom]}.')
    parser.add_argument('--output',type=Path,required=True)
    a=parser.parse_args()
    result=render(a.before,a.after,json.loads(a.regions.read_text(encoding='utf-8')),a.output)
    print(json.dumps({'regionCount':len(result['regions']),'output':str(a.output)},indent=2))
