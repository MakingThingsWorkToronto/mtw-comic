"""Offline fixtures: the generated_images fallback and dedicated-reference sheet resolution. No Codex, no generation."""
import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import comic_art


class NativeCollect(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix='mtw-native-collect-'))
        self.events = self.tmp / 'events.jsonl'
        self.events.write_text('not json\n' + json.dumps({'type': 'thread.started', 'thread_id': 'T1'}) + '\n', encoding='utf-8')
        self.folder = self.tmp / 'generated_images' / 'T1'; self.folder.mkdir(parents=True)

    def test_single_new_file_is_collected(self):
        png = self.folder / 'exec-abc.png'; png.write_bytes(b'png')
        self.assertEqual(comic_art.collect_native(self.events, time.time() - 5, self.tmp), png)

    def test_old_none_or_ambiguous_files_are_not_guessed(self):
        old = self.folder / 'exec-old.png'; old.write_bytes(b'x'); os.utime(old, (1, 1))
        self.assertIsNone(comic_art.collect_native(self.events, time.time(), self.tmp))
        (self.folder / 'exec-a.png').write_bytes(b'a'); (self.folder / 'exec-b.png').write_bytes(b'b')
        self.assertIsNone(comic_art.collect_native(self.events, time.time() - 5, self.tmp))

    def test_missing_thread_id_returns_none(self):
        self.events.write_text('{}\n', encoding='utf-8')
        self.assertIsNone(comic_art.collect_native(self.events, 0, self.tmp))


class SheetStem(unittest.TestCase):
    def test_exact_studio_binding_replaces_filename_guess(self):
        with patch.object(comic_art, 'resolve_cast', return_value={'path': 'wiki/image-library/assets/exact-selected-v1.png'}) as resolve:
            self.assertEqual(comic_art.sheet_stem('Joan Mikita'), 'exact-selected-v1')
            resolve.assert_called_once_with(comic_art.REPO, 'Joan Mikita')

    def test_missing_mapping_never_falls_back(self):
        with patch.object(comic_art, 'resolve_cast', side_effect=ValueError('Missing canonical modelRecord')):
            with self.assertRaisesRegex(ValueError, 'modelRecord'):
                comic_art.sheet_stem('sam')


if __name__ == '__main__':
    unittest.main()
