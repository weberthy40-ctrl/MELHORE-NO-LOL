"""Behavior tests against disposable real Git repositories, without keys or network."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'control.py'
spec = importlib.util.spec_from_file_location('rift_control', SCRIPT)
control = importlib.util.module_from_spec(spec)
spec.loader.exec_module(control)


class PatchBoundary(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='rift-control-test-')
        self.root = Path(self.temp.name)
        self.repo = self.root / 'source'
        self.repo.mkdir()
        self.git(self.repo, 'init', '-q')
        self.git(self.repo, 'config', 'user.name', 'QA fixture')
        self.git(self.repo, 'config', 'user.email', 'qa@example.invalid')
        for name, text in {'src/base.js': 'export const n=1;\n', 'src/delete.js': 'old\n',
                           'docs/QA.md': 'trusted\n', 'AGENTS.md': 'trusted\n',
                           'package.json': '{}\n'}.items():
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
        self.git(self.repo, 'add', '.')
        self.git(self.repo, 'commit', '-qm', 'fixture base')
        self.base = self.git(self.repo, 'rev-parse', 'HEAD').decode().strip()
        self.author = self.root / 'author'
        shutil.copytree(self.repo, self.author)

    def tearDown(self):
        self.temp.cleanup()

    @staticmethod
    def git(repo, *args):
        return subprocess.check_output(['/usr/bin/git', '-C', str(repo), *args], stderr=subprocess.PIPE)

    def candidate(self, changes=None):
        for name, value in (changes or {}).items():
            path = self.author / name
            path.parent.mkdir(parents=True, exist_ok=True)
            if value is None:
                path.unlink()
            else:
                path.write_text(value)
        self.git(self.author, 'add', '-A')
        diff = self.git(self.author, 'diff', '--cached', '--binary', '--full-index').decode()
        return {'status': 'changed', 'base_sha': self.base, 'patch': diff, 'summary': 'fixture change'}

    def accept(self, body, name='out'):
        return control.accept_body(self.repo, self.base, body, self.root / name)

    def assert_rejected(self, body):
        with self.assertRaises(control.Rejected):
            self.accept(body)
        self.assertEqual(self.git(self.repo, 'status', '--porcelain'), b'')
        self.assertFalse((self.root / 'out' / 'manifest.json').exists())

    def test_create_modify_delete_and_revalidate_artifact_on_fresh_checkout(self):
        body = self.candidate({'src/base.js': 'export const n=2;\n',
                               'tests/new.txt': 'test\n', 'src/delete.js': None})
        fresh = self.root / 'fresh'
        shutil.copytree(self.repo, fresh)
        result = self.accept(body)
        self.assertEqual(result['status'], 'changed')
        self.assertEqual((self.repo / 'src/base.js').read_text(), 'export const n=2;\n')
        self.assertFalse((self.repo / 'src/delete.js').exists())
        self.assertEqual((self.repo / 'tests/new.txt').read_text(), 'test\n')
        replay = control.bundle(fresh, self.base, self.root / 'out', self.root / 'replayed')
        self.assertEqual(replay['sha256'], result['sha256'])
        self.assertEqual((fresh / 'src/base.js').read_bytes(), (self.repo / 'src/base.js').read_bytes())

    def test_rejects_protected_paths_without_mutating_checkout(self):
        for name in ['package.json', '.github/workflows/evil.yml', 'docs/QA.md',
                     'docs/AUTOMATION.md', 'src/AGENTS.md', 'tests/AGENTS.override.md',
                     'src/.codex/config.toml', 'src/.npmrc', 'scripts/ci-browser.sh']:
            with self.subTest(path=name):
                if self.author.exists():
                    shutil.rmtree(self.author)
                shutil.copytree(self.repo, self.author)
                self.assert_rejected(self.candidate({name: 'untrusted\n'}))

    def test_rejects_symlink_mode(self):
        (self.author / 'src/link').symlink_to('/tmp/elsewhere')
        self.assert_rejected(self.candidate())

    def test_rejects_executable_mode_even_without_content_change(self):
        (self.author / 'src/base.js').chmod(0o755)
        self.assert_rejected(self.candidate())

    def test_rejects_submodule_gitlink(self):
        self.git(self.author, 'update-index', '--add', '--cacheinfo', '160000', self.base, 'src/module')
        diff = self.git(self.author, 'diff', '--cached', '--binary', '--full-index').decode()
        self.assertIn('160000', diff)
        self.assert_rejected({'status': 'changed', 'base_sha': self.base, 'patch': diff, 'summary': 'gitlink'})

    def test_binary_payload_is_preserved_and_expansion_limit_is_checked(self):
        clean = self.root / 'binary-clean'
        shutil.copytree(self.repo, clean)
        blob = self.author / 'public/image.bin'
        blob.parent.mkdir(parents=True)
        blob.write_bytes(bytes(range(256)) * 4)
        body = self.candidate()
        self.assertIn('GIT binary patch', body['patch'])
        self.accept(body)
        self.assertEqual((self.repo / 'public/image.bin').read_bytes(), blob.read_bytes())
        # A tiny compressed patch must not bypass the decompressed per-file ceiling.
        large = self.author / 'public/large.bin'
        large.write_bytes(b'\0' * 1000001)
        body = self.candidate()
        self.assertLess(len(body['patch']), control.policy()['max_patch_bytes'])
        with self.assertRaises(control.Rejected):
            control.accept_body(clean, self.base, body, self.root / 'expanded')
        self.assertEqual(self.git(clean, 'status', '--porcelain'), b'')

    def test_existing_output_and_symlink_fail_before_applying(self):
        body = self.candidate({'src/base.js': 'changed\n'})
        out = self.root / 'out'
        out.mkdir()
        (out / 'manifest.json').write_text('stale')
        with self.assertRaises(control.Rejected):
            self.accept(body)
        self.assertEqual(self.git(self.repo, 'status', '--porcelain'), b'')
        self.assertEqual((out / 'manifest.json').read_text(), 'stale')
        (out / 'manifest.json').unlink()
        out.rmdir()
        out.symlink_to(self.root / 'elsewhere')
        self.assert_rejected(body)

    def test_rejects_unexpected_base_and_dirty_checkout(self):
        body = self.candidate({'src/base.js': 'changed\n'})
        body['base_sha'] = '0' * 40
        self.assert_rejected(body)
        body['base_sha'] = self.base
        (self.repo / 'src/base.js').write_text('existing user edit\n')
        with self.assertRaises(control.Rejected):
            self.accept(body)
        self.assertEqual((self.repo / 'src/base.js').read_text(), 'existing user edit\n')

    def test_rejects_unsafe_and_traversal_paths(self):
        for name in ['src/../package.json', '../outside', '/tmp/outside', 'src//x',
                     'src/./x', 'src/x\ny', 'src/x\ty', 'src/á.js', 'src/AGENTS.MD']:
            with self.subTest(path=name), self.assertRaises(control.Rejected):
                control.check_path(name)
        body = {'status': 'changed', 'base_sha': self.base, 'summary': 'escape',
                'patch': 'diff --git a/src/../../outside b/src/../../outside\nnew file mode 100644\n--- /dev/null\n+++ b/src/../../outside\n@@ -0,0 +1 @@\n+bad\n'}
        self.assert_rejected(body)
        self.assertFalse((self.root / 'outside').exists())

    def test_rejects_patch_and_file_and_count_limits(self):
        self.assert_rejected({'status': 'changed', 'base_sha': self.base,
                              'summary': 'huge', 'patch': 'x' * 48001})
        small = self.candidate({'src/base.js': 'too much\n'})
        limits = {**control.policy(), 'max_file_bytes': 2}
        with patch.object(control, 'policy', return_value=limits):
            self.assert_rejected(small)
        limits = {**control.policy(), 'max_changed_files': 1}
        body = self.candidate({'src/a': 'a\n', 'src/b': 'b\n'})
        with patch.object(control, 'policy', return_value=limits):
            self.assert_rejected(body)

    def test_rejects_corrupt_artifact_and_artifact_symlink(self):
        fresh = self.root / 'fresh'
        shutil.copytree(self.repo, fresh)
        self.accept(self.candidate({'src/base.js': 'changed\n'}))
        artifact = self.root / 'out'
        (artifact / 'candidate.patch').write_text('tampered')
        with self.assertRaises(control.Rejected):
            control.bundle(fresh, self.base, artifact, self.root / 'replay')
        (artifact / 'candidate.patch').unlink()
        (artifact / 'candidate.patch').symlink_to(self.repo / 'src/base.js')
        with self.assertRaises(control.Rejected):
            control.bundle(fresh, self.base, artifact, self.root / 'replay')
        self.assertEqual(self.git(fresh, 'status', '--porcelain'), b'')

    def test_no_change_and_blocked_do_not_apply_anything(self):
        for status in ['no-change', 'blocked']:
            result = self.accept({'status': status, 'base_sha': self.base,
                                  'patch': '', 'summary': 'No safe improvement'}, name=status)
            self.assertEqual(result['status'], status)
        self.assertEqual(self.git(self.repo, 'status', '--porcelain'), b'')
        self.assert_rejected({'status': 'no-change', 'base_sha': self.base,
                              'patch': 'hidden change', 'summary': ''})

    def test_verify_source_validates_ancestry_and_accumulated_controls(self):
        self.assertEqual(control.verify_source(self.repo, self.base)['changed_files'], 0)
        body = self.candidate({'src/base.js': 'changed\n'})
        self.accept(body)
        self.git(self.repo, 'commit', '-qm', 'product update')
        self.assertEqual(control.verify_source(self.repo, self.base)['changed_files'], 1)
        (self.repo / 'docs/QA.md').write_text('tampered normative control\n')
        self.git(self.repo, 'add', '.')
        self.git(self.repo, 'commit', '-qm', 'untrusted control change')
        with self.assertRaises(control.Rejected):
            control.verify_source(self.repo, self.base)
        with self.assertRaises(control.Rejected):
            control.verify_source(self.repo, '0' * 40)

    def test_duplicate_keys_and_extra_fields_rejected(self):
        path = self.root / 'dup.json'
        path.write_text('{"decision":"approve","decision":"block","notes":""}')
        with self.assertRaises(control.Rejected):
            control.read_json(path)
        with self.assertRaises(control.Rejected):
            control.approve({'decision': 'approve', 'notes': '', 'extra': True})

    def test_review_approve_and_block_exit_status(self):
        for decision, expected in [('approve', 0), ('block', 1)]:
            path = self.root / (decision + '.json')
            path.write_text(json.dumps({'decision': decision, 'notes': 'independent review'}))
            result = subprocess.run(['python3', str(SCRIPT), 'approve', '--body-file', str(path)], capture_output=True)
            self.assertEqual(result.returncode, expected)
            self.assertEqual(json.loads(result.stdout)['decision'], decision)

    def test_dry_run_never_calls_a_model_and_missing_key_fails(self):
        env = {k: v for k, v in os.environ.items() if k != 'RIFT_KEY_PRESENT'}
        result = subprocess.run(['python3', str(SCRIPT), 'dry-run'], env=env, capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertFalse(json.loads(result.stdout)['model_called'])
        result = subprocess.run(['python3', str(SCRIPT), 'dry-run', '--live'], env=env, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('missing', json.loads(result.stdout)['reason'])
        env['RIFT_KEY_PRESENT'] = 'true'
        result = subprocess.run(['python3', str(SCRIPT), 'dry-run', '--live'], env=env, capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertFalse(json.loads(result.stdout)['model_called'])


if __name__ == '__main__':
    unittest.main()
