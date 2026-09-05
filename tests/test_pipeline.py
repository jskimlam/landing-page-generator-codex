import json
from pathlib import Path
import sys
import tempfile
import unittest
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.agents/skills/landing-page-generator/scripts'))
import generate_page as pipeline

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        brief = self.root / 'brief.json'
        brief.write_text(json.dumps(dict.fromkeys(['product_name', 'one_liner', 'target_audience', 'main_problem', 'key_benefit'], 'demo')), encoding='utf-8')
        pipeline.plan(brief, self.root)
        (self.root / 'sections').mkdir()

    def images(self):
        for i, key in enumerate(pipeline.SECTION_HEIGHTS):
            Image.new('RGB', (1200, 10), (i * 10, 0, 0)).save(self.root / 'sections' / (key + '.png'))

    def test_complete_output(self):
        self.images()
        pipeline.assemble(self.root)
        with Image.open(self.root / 'final_page.png') as im:
            self.assertEqual(im.size, (1200, 130))
            self.assertEqual(im.getpixel((5, 125))[:3], (120, 0, 0))
        self.assertTrue((self.root / 'final_page.pdf').read_bytes().startswith(b'%PDF'))
        self.assertEqual((self.root / 'index.html').read_text(encoding='utf-8').count('<img '), 13)

    def test_missing_image(self):
        with self.assertRaises(FileNotFoundError):
            pipeline.assemble(self.root)
        self.assertFalse((self.root / 'final_page.png').exists())

    def test_path_escape(self):
        p = self.root / 'image_prompts.json'
        manifest = json.loads(p.read_text(encoding='utf-8'))
        manifest['01_hero']['filename'] = '../outside.png'
        p.write_text(json.dumps(manifest), encoding='utf-8')
        with self.assertRaises(ValueError):
            pipeline.assemble(self.root)

    def test_no_overwrite(self):
        with self.assertRaises(FileExistsError):
            pipeline.plan(self.root / 'brief.json', self.root)

    def test_corrupt_image(self):
        self.images()
        (self.root / 'sections/13_final_cta.png').write_bytes(b'broken')
        with self.assertRaises(OSError):
            pipeline.assemble(self.root)
        self.assertFalse((self.root / 'final_page.pdf').exists())

if __name__ == '__main__':
    unittest.main()
