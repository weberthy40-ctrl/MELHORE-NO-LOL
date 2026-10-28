"""Evidence collection must not turn QA-controlled names into credential reads."""
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'collect.py'
spec = importlib.util.spec_from_file_location('rift_collect', SCRIPT)
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class EvidenceBoundary(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='rift-collect-test-')
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        self.destination = self.root / 'collected'

    def tearDown(self):
        self.temp.cleanup()

    def collect(self):
        return collector.collect(self.source, self.destination)

    def rejected(self):
        with self.assertRaises((collector.Rejected, OSError)):
            self.collect()
        self.assertFalse(self.destination.exists())

    def test_copies_regular_log_and_png_as_opaque_bytes_and_normalizes_modes(self):
        payload = b'\x89PNG\x00\xffnot decoded'
        (self.source / 'browser').mkdir()
        (self.source / 'browser/screenshot.png').write_bytes(payload)
        log = self.source / 'qa.log'
        log.write_bytes(b'passed\n')
        log.chmod(0o755)
        report = self.collect()
        self.assertEqual(report, {'files': 2, 'bytes': len(payload) + 7})
        self.assertEqual((self.destination / 'browser/screenshot.png').read_bytes(), payload)
        self.assertEqual((self.destination / 'qa.log').read_bytes(), b'passed\n')
        self.assertEqual(stat.S_IMODE((self.destination / 'qa.log').stat().st_mode), 0o644)
        self.assertEqual(stat.S_IMODE((self.destination / 'browser').stat().st_mode), 0o755)

    def test_rejects_symlink_to_private_proc_environ_without_copying(self):
        (self.source / 'environ.log').symlink_to('/proc/self/environ')
        self.rejected()

    def test_rejects_symlink_directory_and_rolls_back_partial_regular_files(self):
        (self.source / 'a.log').write_text('safe evidence\n')
        outside = self.root / 'private'
        outside.mkdir()
        (outside / 'private.log').write_text('private fixture\n')
        (self.source / 'z-linked-dir').symlink_to(outside, target_is_directory=True)
        self.rejected()
        self.assertEqual((outside / 'private.log').read_text(), 'private fixture\n')

    def test_rejects_symlink_source_and_symlink_parent(self):
        alias = self.root / 'alias'
        alias.symlink_to(self.source, target_is_directory=True)
        with self.assertRaises(OSError):
            collector.collect(alias, self.destination)
        nested = self.source / 'nested'
        nested.mkdir()
        with self.assertRaises(OSError):
            collector.collect(alias / 'nested', self.destination)
        self.assertFalse(self.destination.exists())

    def test_replacement_with_symlink_between_stat_and_open_is_not_followed(self):
        name = 'payload.log'
        target = self.source / name
        target.write_text('initial evidence\n')
        original_open = os.open
        swapped = False

        def racing_open(path, flags, *args, **kwargs):
            nonlocal swapped
            if path == name and not flags & os.O_CREAT and not swapped:
                target.unlink()
                target.symlink_to('/proc/self/environ')
                swapped = True
            return original_open(path, flags, *args, **kwargs)

        with patch.object(collector.os, 'open', side_effect=racing_open):
            self.rejected()
        self.assertTrue(swapped)

    def test_limits_empty_directory_fanout(self):
        (self.source / 'one').mkdir()
        (self.source / 'two').mkdir()
        with patch.object(collector, 'MAX_ENTRIES', 1):
            self.rejected()

    def test_rejects_fifo_without_blocking(self):
        os.mkfifo(self.source / 'stream.log')
        result = subprocess.run(['python3', str(SCRIPT), str(self.source), str(self.destination)],
                                capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)['status'], 'rejected')
        self.assertFalse(self.destination.exists())

    def test_rejects_hardlinks(self):
        outside = self.root / 'private.txt'
        outside.write_text('private fixture\n')
        os.link(outside, self.source / 'linked.txt')
        self.rejected()
        self.assertEqual(outside.read_text(), 'private fixture\n')

    def test_rejects_oversized_file_and_total_without_leaving_a_partial_destination(self):
        (self.source / 'large.bin').write_bytes(b'\0' * 100)
        with patch.object(collector, 'MAX_FILE_BYTES', 50):
            self.rejected()
        with patch.object(collector, 'MAX_BYTES', 50):
            self.rejected()

    def test_rejects_too_many_files_and_too_deep_directories(self):
        (self.source / 'one.log').write_text('1')
        (self.source / 'two.log').write_text('2')
        with patch.object(collector, 'MAX_FILES', 1):
            self.rejected()
        parent = self.source
        for _ in range(9):
            parent = parent / 'nested'
            parent.mkdir()
        self.rejected()

    def test_rejects_dot_non_ascii_and_unsafe_filename_components(self):
        for name in ['.hidden', 'á.log', 'line\nname', 'tab\tname']:
            with self.subTest(name=name):
                target = self.source / name
                target.write_text('untrusted\n')
                self.rejected()
                target.unlink()
        with self.assertRaises(collector.Rejected):
            collector.collect(self.source / '..' / 'source', self.destination)

    def test_existing_destination_is_untouched_and_inside_source_is_forbidden(self):
        self.destination.mkdir()
        (self.destination / 'existing.log').write_text('existing\n')
        with self.assertRaises(FileExistsError):
            self.collect()
        self.assertEqual((self.destination / 'existing.log').read_text(), 'existing\n')
        with self.assertRaises(collector.Rejected):
            collector.collect(self.source, self.source / 'inside')
        self.assertFalse((self.source / 'inside').exists())
        with self.assertRaises(collector.Rejected):
            collector.collect(self.source, self.source)

    def test_missing_source_returns_exit_two_and_does_not_create_destination(self):
        result = subprocess.run(['python3', str(SCRIPT), str(self.root / 'missing'), str(self.destination)],
                                capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)['status'], 'rejected')
        self.assertFalse(self.destination.exists())

    def test_destination_parent_symlink_is_rejected_and_descriptors_are_closed(self):
        other = self.root / 'other'
        other.mkdir()
        alias = self.root / 'alias'
        alias.symlink_to(other, target_is_directory=True)
        before = len(os.listdir('/proc/self/fd'))
        for _ in range(20):
            with self.assertRaises(OSError):
                collector.collect(self.source, alias / 'result')
        self.assertEqual(len(os.listdir('/proc/self/fd')), before)
        self.assertFalse((other / 'result').exists())
        (self.source / 'payload.log').symlink_to('/proc/self/environ')
        for _ in range(20):
            self.rejected()
        self.assertEqual(len(os.listdir('/proc/self/fd')), before)


if __name__ == '__main__':
    unittest.main()
