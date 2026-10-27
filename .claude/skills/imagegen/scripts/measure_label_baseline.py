"""Read-only estimate of bright-caption baseline tilt; not OCR or a visual pass."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image


def label_box(value):
    name, x, y, width, height = value.rsplit(':', 4)
    return name, int(x), int(y), int(width), int(height)


def measure(image, box, threshold=180):
    name, x, y, width, height = box
    if width <= 0 or height <= 0 or x < 0 or y < 0 or x+width > image.width or y+height > image.height:
        raise ValueError('Label region outside image: ' + name)
    bright = set()
    for py in range(y, y+height):
        for px in range(x, x+width):
            r, g, b, alpha = image.getpixel((px, py))
            if alpha >= 224 and min(r, g, b) >= threshold:
                bright.add((px, py))
    components = []
    while bright:
        seed = bright.pop()
        pending = [seed]
        pixels = [seed]
        while pending:
            px, py = pending.pop()
            for dx, dy in ((-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)):
                point = (px+dx, py+dy)
                if point in bright:
                    bright.remove(point)
                    pending.append(point)
                    pixels.append(point)
        xs, ys = zip(*pixels)
        left, top, right, bottom = min(xs), min(ys), max(xs)+1, max(ys)+1
        cw, ch = right-left, bottom-top
        if len(pixels) >= 8 and cw >= 2 and ch >= 6 and cw/ch <= 3:
            components.append({'box':[left,top,right,bottom], 'pixels':len(pixels),
                               'baselinePoint':[(left+right)/2,bottom]})
    components.sort(key=lambda c:c['box'][0])
    points = [c['baselinePoint'] for c in components]
    result = {'name':name,'region':[x,y,width,height],'brightThreshold':threshold,
              'components':components,'method':'Least-squares line through bright-component lower bounds.',
              'limitation':'Manual region must isolate one caption; grid lines, punctuation and descenders can bias the estimate.'}
    if len(points) < 3:
        result.update({'estimateAvailable':False,'reason':'Fewer than three usable bright components.'})
        return result
    mx = sum(p[0] for p in points)/len(points)
    my = sum(p[1] for p in points)/len(points)
    denominator = sum((p[0]-mx)**2 for p in points)
    if not denominator:
        result.update({'estimateAvailable':False,'reason':'Components do not span the x-axis.'})
        return result
    slope = sum((p[0]-mx)*(p[1]-my) for p in points)/denominator
    result.update({'estimateAvailable':True,'slopeYPerX':slope,
                   'clockwiseDegrees':math.degrees(math.atan(slope)),
                   'residualRmsPixels':math.sqrt(sum((p[1]-(my+slope*(p[0]-mx)))**2 for p in points)/len(points))})
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image',type=Path)
    parser.add_argument('--label',type=label_box,action='append',required=True,metavar='NAME:X:Y:W:H')
    parser.add_argument('--threshold',type=int,default=180)
    parser.add_argument('--json-output',type=Path)
    args = parser.parse_args()
    source = args.image.resolve()
    if args.json_output:
        target = args.json_output.resolve()
        if target == source or (target.exists() and source.samefile(target)):
            parser.error('--json-output must differ from the input image; refusing to overwrite artwork.')
    if not 0 <= args.threshold <= 255:
        parser.error('--threshold must be between 0 and 255.')
    with Image.open(source) as image:
        rgba = image.convert('RGBA')
        result = {'file':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                  'labels':[measure(rgba,b,args.threshold) for b in args.label],
                  'visualReview':'not-performed-by-this-tool','automaticPassFail':False}
    output = json.dumps(result,indent=2)+'\n'
    if args.json_output:
        args.json_output.write_text(output,encoding='utf-8')
    print(output,end='')
