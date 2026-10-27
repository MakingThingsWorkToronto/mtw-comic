"""Read-only PNG facts for raster review; never edits artwork or claims a visual pass."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image


def inspect(path, minimum_width=0, minimum_height=0, require_transparency=False, samples=(), transparent_samples=()):
    path = Path(path).resolve()
    data = path.read_bytes()
    with Image.open(path) as im:
        width, height = im.size
        rgba = im.convert('RGBA')
        alpha = rgba.getchannel('A')
        histogram = alpha.histogram()
        zero = histogram[0]
        partial = sum(histogram[1:255])
        points = [('top-left', 0, 0), ('top-right', width-1, 0),
                  ('bottom-left', 0, height-1), ('bottom-right', width-1, height-1)]
        points += list(samples) + list(transparent_samples)
        flags = []
        if im.format != 'PNG':
            flags.append('File is not PNG.')
        if width < minimum_width or height < minimum_height:
            flags.append('Dimensions are below the requested minimum.')
        if require_transparency and not zero:
            flags.append('No fully transparent pixels; transparent-background request is unmet.')
        values = []
        for name, x, y in points:
            if not 0 <= x < width or not 0 <= y < height:
                raise ValueError('Sample outside image: ' + name)
            values.append({'name': name, 'x': x, 'y': y, 'rgba': list(rgba.getpixel((x, y)))})
        for name, x, y in transparent_samples:
            if rgba.getpixel((x, y))[3] != 0:
                flags.append('Expected fully transparent sample remains visible: ' + name)
        return {'file': str(path), 'sha256': hashlib.sha256(data).hexdigest(),
                'analyzedAt': datetime.now(timezone.utc).isoformat(),
                'format': im.format, 'mode': im.mode, 'width': width, 'height': height,
                'aspectRatio': width/height, 'aspect16x9CrossProductDelta': width*9-height*16,
                'minimumWidth': minimum_width, 'minimumHeight': minimum_height,
                'fullyTransparentPixels': zero, 'partiallyTransparentPixels': partial,
                'alphaExtrema': list(alpha.getextrema()), 'samples': values,
                'expectedTransparentSamples': [name for name, _, _ in transparent_samples],
                'technicalFlags': flags, 'visualReview': 'not-performed-by-this-tool'}


def named_sample(value):
    name, x, y = value.rsplit(':', 2)
    return name, int(x), int(y)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--minimum-width', type=int, default=0)
    parser.add_argument('--minimum-height', type=int, default=0)
    parser.add_argument('--require-transparency', action='store_true')
    parser.add_argument('--sample', type=named_sample, action='append', default=[], metavar='NAME:X:Y')
    parser.add_argument('--expect-transparent', type=named_sample, action='append', default=[],
                        metavar='NAME:X:Y', help='Require alpha zero at an explicitly measured source-selection point.')
    parser.add_argument('--json-output', type=Path)
    args = parser.parse_args()
    if args.json_output:
        source = args.image.resolve()
        destination = args.json_output.resolve()
        if destination == source or (destination.exists() and source.samefile(destination)):
            parser.error('--json-output must differ from the input image; refusing to overwrite artwork.')
    result = inspect(args.image, args.minimum_width, args.minimum_height,
                     args.require_transparency, args.sample, args.expect_transparent)
    output = json.dumps(result, indent=2) + '\n'
    if args.json_output:
        args.json_output.write_text(output, encoding='utf-8')
    print(output, end='')
    raise SystemExit(2 if result['technicalFlags'] else 0)
