"""Prepare Codex image prompts and assemble completed images offline."""
import argparse
import html
import json
from pathlib import Path
from PIL import Image
from stitch_images import stitch_sections, create_preview

SECTION_HEIGHTS = dict(zip([
    '01_hero', '02_pain', '03_problem', '04_story', '05_solution',
    '06_how_it_works', '07_social_proof', '08_authority', '09_benefits',
    '10_risk_removal', '11_comparison', '12_target_filter', '13_final_cta'
], [800, 600, 500, 700, 400, 600, 800, 500, 700, 500, 400, 400, 600]))

def plan(brief_path, output):
    brief = json.loads(Path(brief_path).read_text(encoding='utf-8-sig'))
    required = ['product_name', 'one_liner', 'target_audience', 'main_problem', 'key_benefit']
    if not isinstance(brief, dict) or any(not isinstance(brief.get(k), str) or not brief[k].strip() for k in required):
        raise ValueError('Brief requires nonempty strings: ' + ', '.join(required))
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for key, height in SECTION_HEIGHTS.items():
        manifest[key] = {
            'prompt': f'Create Korean detail page section {key}, target canvas 1200x{height}. '
                      'Use consistent typography, colors and product appearance. '
                      'Only use verified claims; never invent testimonials, statistics or guarantees. '
                      'Codex must complete this draft with exact section copy and design.\n'
                      + json.dumps(brief, ensure_ascii=False),
            'width': 1200, 'height': height, 'filename': key + '.png'}
    with (output / 'image_prompts.json').open('x', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print('Draft saved. Complete copy/design and generate images with Codex before assemble.')

def assemble(output):
    output = Path(output).resolve()
    manifest = json.loads((output / 'image_prompts.json').read_text(encoding='utf-8-sig'))
    if not isinstance(manifest, dict) or set(manifest) != set(SECTION_HEIGHTS):
        raise ValueError('Manifest must contain exactly the 13 canonical section IDs.')
    paths, filenames = [], []
    for key in SECTION_HEIGHTS:
        data = manifest[key]
        filename = data.get('filename') if isinstance(data, dict) else None
        if not isinstance(filename, str) or '/' in filename or '\\' in filename or ':' in filename or not filename.lower().endswith('.png'):
            raise ValueError(f'Invalid PNG filename for {key}')
        if filename in filenames:
            raise ValueError('Each section needs a unique filename.')
        path = (output / 'sections' / filename).resolve()
        if path.parent != (output / 'sections').resolve():
            raise ValueError('Image must be inside sections directory.')
        with Image.open(path) as im:
            if im.format != 'PNG':
                raise ValueError(f'Not a PNG image: {filename}')
            im.verify()
        paths.append(str(path))
        filenames.append(filename)
    stitch_sections(paths, str(output / 'final_page.png'))
    stitch_sections(paths, str(output / 'final_page.pdf'))
    create_preview(str(output / 'final_page.png'), str(output / 'preview.png'))
    images = '\n'.join(f'<img src="sections/{html.escape(name, quote=True)}" alt="{key}" loading="lazy">'
                       for key, name in zip(SECTION_HEIGHTS, filenames))
    (output / 'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>상세페이지</title><style>body{margin:0;background:#eee}main{max-width:1200px;margin:auto}'
        'img{display:block;width:100%;height:auto}</style><main>' + images + '</main></html>', encoding='utf-8')
    print('Created final_page.png, final_page.pdf, preview.png and index.html.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('plan', help='Prepare draft prompts; does not call AI')
    p.add_argument('--brief', required=True)
    p.add_argument('--output', default='output')
    a = sub.add_parser('assemble', help='Validate and assemble 13 PNG sections')
    a.add_argument('--output', default='output')
    args = parser.parse_args()
    try:
        if args.command == 'plan':
            plan(args.brief, args.output)
        else:
            assemble(args.output)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.exit(1, f'Error: {exc}\n')

if __name__ == '__main__':
    main()
