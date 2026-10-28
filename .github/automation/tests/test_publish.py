"""End-to-end publication uses only disposable local bare remotes, never GitHub/API."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

FOLDER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(FOLDER))
import control
spec = importlib.util.spec_from_file_location('rift_publish', FOLDER / 'publish.py')
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class PublicationBoundary(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='rift-publish-test-')
        self.root = Path(self.temp.name)
        self.repo = self.root / 'project'
        self.repo.mkdir()
        self.git(self.repo, 'init', '-q', '-b', 'main')
        self.git(self.repo, 'config', 'user.name', 'Fixture author')
        self.git(self.repo, 'config', 'user.email', 'fixture@example.invalid')
        (self.repo / 'src').mkdir()
        (self.repo / 'src/value.js').write_text('export const value=1;\n')
        self.git(self.repo, 'add', '.')
        self.git(self.repo, 'commit', '-qm', 'fixture seed')
        self.seed = self.head(self.repo)
        self.remote = self.root / 'remote.git'
        self.git(self.repo, 'init', '-q', '--bare', str(self.remote))
        self.git(self.repo, 'remote', 'add', 'origin', str(self.remote))
        self.git(self.repo, 'push', '-q', 'origin', 'main')
        self.original_policy = control.policy()
        self.trusted_policy = {**self.original_policy, 'seed_sha': self.seed,
                               'evolution_branch': 'rift-lab/evolution'}
        self.policy_mock = patch.object(control, 'policy', return_value=self.trusted_policy)
        self.policy_mock.start()
        self.addCleanup(self.policy_mock.stop)

    def tearDown(self):
        self.temp.cleanup()

    @staticmethod
    def git(repo, *args):
        return subprocess.check_output(['/usr/bin/git', '-C', str(repo), *args], stderr=subprocess.PIPE)

    def head(self, repo):
        return self.git(repo, 'rev-parse', 'HEAD').decode().strip()

    def artifact(self, repo=None, value=2, protected=False, suffix='1'):
        repo = repo or self.repo
        base = self.head(repo)
        author = self.root / ('author-' + suffix)
        clean = self.root / ('validate-' + suffix)
        shutil.copytree(repo, author)
        shutil.copytree(repo, clean)
        name = 'package.json' if protected else 'src/value.js'
        (author / name).write_text('export const value=' + str(value) + ';\n')
        self.git(author, 'add', '-A')
        diff = self.git(author, 'diff', '--cached', '--binary', '--full-index').decode()
        artifact = self.root / ('artifact-' + suffix)
        if protected:
            # Deliberately manufacture an untrusted artifact: publisher must revalidate it.
            import hashlib
            artifact.mkdir()
            (artifact / 'candidate.patch').write_text(diff)
            (artifact / 'manifest.json').write_text(json.dumps({'status': 'changed', 'base_sha': base,
                                                               'sha256': hashlib.sha256(diff.encode()).hexdigest(),
                                                               'summary': '##[error]untrusted metadata'}))
        else:
            control.accept_body(clean, base, {'status': 'changed', 'base_sha': base,
                                             'patch': diff, 'summary': '##[error]untrusted metadata'}, artifact)
        return artifact

    def publish(self, artifact, project=None, suffix='1', base=None, seed=None, run_id='123'):
        project = project or self.repo
        return publisher.publish(project, base or self.head(project), seed or self.seed,
                                 artifact, self.root / ('out-' + suffix), run_id)

    def remote_ref(self, ref):
        return self.git(self.repo, 'ls-remote', '--refs', 'origin', ref).decode().split()[0]

    def assert_main_unchanged(self):
        self.assertEqual(self.remote_ref('refs/heads/main'), self.seed)

    def test_creates_evolution_branch_then_resumes_next_round_without_touching_main(self):
        artifact = self.artifact()
        result = self.publish(artifact)
        self.assertEqual(result['status'], 'published')
        self.assertEqual(result['branch'], 'rift-lab/evolution')
        first = result['head_sha']
        self.assertEqual(self.remote_ref('refs/heads/rift-lab/evolution'), first)
        self.assertEqual(self.git(self.repo, 'show', '-s', '--format=%an'), b'RIFT LAB Automation\n')
        self.assert_main_unchanged()
        next_repo = self.root / 'next-project'
        self.git(self.repo, 'clone', '-q', '--branch', 'rift-lab/evolution', str(self.remote), str(next_repo))
        next_artifact = self.artifact(next_repo, value=3, suffix='2')
        next_result = self.publish(next_artifact, project=next_repo, suffix='2', run_id='124')
        self.assertEqual(next_result['base_sha'], first)
        self.assertEqual((next_repo / 'src/value.js').read_text(), 'export const value=3;\n')
        self.assertEqual(self.remote_ref('refs/heads/rift-lab/evolution'), next_result['head_sha'])
        self.assert_main_unchanged()

    def test_publisher_disables_local_hooks_and_fsmonitor(self):
        artifact = self.artifact()
        marker = self.root / 'hook-ran'
        hookdir = self.root / 'untrusted-hooks'
        hookdir.mkdir()
        script = '#!/bin/sh\ntouch "' + str(marker) + '"\nexit 0\n'
        for name in ['pre-commit', 'post-commit', 'pre-push', 'fsmonitor']:
            path = hookdir / name
            path.write_text(script)
            path.chmod(0o755)
        self.git(self.repo, 'config', 'core.hooksPath', str(hookdir))
        self.git(self.repo, 'config', 'core.fsmonitor', str(hookdir / 'fsmonitor'))
        result = self.publish(artifact)
        self.assertEqual(result['status'], 'published')
        self.assertFalse(marker.exists())
        self.assert_main_unchanged()

    def test_stale_base_is_rejected_before_applying_or_committing(self):
        stale = self.root / 'stale-project'
        shutil.copytree(self.repo, stale)
        artifact = self.artifact()
        self.publish(artifact)
        with self.assertRaises(control.Rejected):
            self.publish(artifact, project=stale, suffix='stale')
        self.assertEqual(self.head(stale), self.seed)
        self.assertEqual(self.git(stale, 'status', '--porcelain'), b'')
        self.assert_main_unchanged()

    def test_missing_evolution_ref_is_rejected_when_base_is_not_seed(self):
        (self.repo / 'src/value.js').write_text('export const value=2;\n')
        self.git(self.repo, 'commit', '-qam', 'unpublished extra base')
        artifact = self.artifact(value=3)
        with self.assertRaises(control.Rejected):
            self.publish(artifact)
        self.assert_main_unchanged()

    def test_invalid_run_id_seed_and_policy_branch_cannot_select_another_target(self):
        artifact = self.artifact()
        for bad in ['0', '-1', '12;echo bad', '1\n##[error]bad', '9' * 21, 'main']:
            with self.subTest(run_id=bad), self.assertRaises(control.Rejected):
                self.publish(artifact, run_id=bad)
        with self.assertRaises(control.Rejected):
            self.publish(artifact, seed='0' * 40)
        with patch.object(control, 'policy', return_value={**self.trusted_policy, 'evolution_branch': 'main'}):
            with self.assertRaises(control.Rejected):
                self.publish(artifact)
        self.assertEqual(self.git(self.repo, 'status', '--porcelain'), b'')
        self.assert_main_unchanged()

    def test_source_without_seed_ancestry_is_rejected(self):
        unrelated = self.root / 'unrelated'
        unrelated.mkdir()
        self.git(unrelated, 'init', '-q')
        self.git(unrelated, 'config', 'user.name', 'Fixture')
        self.git(unrelated, 'config', 'user.email', 'fixture@example.invalid')
        (unrelated / 'src').mkdir()
        (unrelated / 'src/value.js').write_text('unrelated\n')
        self.git(unrelated, 'add', '.')
        self.git(unrelated, 'commit', '-qm', 'unrelated root')
        with self.assertRaises(control.Rejected):
            self.publish(self.root / 'missing-artifact', project=unrelated)
        self.assert_main_unchanged()

    def test_rejects_missing_source_and_protected_patch(self):
        with self.assertRaises(control.Rejected):
            self.publish(self.root / 'missing-artifact', project=self.root / 'missing', base=self.seed)
        artifact = self.artifact(protected=True)
        with self.assertRaises(control.Rejected):
            self.publish(artifact)
        self.assertEqual(self.head(self.repo), self.seed)
        self.assertEqual(self.git(self.repo, 'status', '--porcelain'), b'')
        self.assert_main_unchanged()

    def test_race_after_optimistic_check_is_rejected_by_normal_push(self):
        artifact = self.artifact()
        original_git = control.git
        raced = False

        def race_git(project, *args, **kwargs):
            nonlocal raced
            if args and args[0] == 'push' and not raced:
                raced = True
                rival = self.root / 'rival'
                self.git(self.repo, 'clone', '-q', '--branch', 'main', str(self.remote), str(rival))
                self.git(rival, 'config', 'user.name', 'Fixture rival')
                self.git(rival, 'config', 'user.email', 'rival@example.invalid')
                (rival / 'src/value.js').write_text('rival change\n')
                self.git(rival, 'commit', '-qam', 'rival update')
                self.git(rival, 'push', '-q', 'origin', 'HEAD:refs/heads/rift-lab/evolution')
            return original_git(project, *args, **kwargs)

        with patch.object(control, 'git', side_effect=race_git):
            with self.assertRaises(control.Rejected):
                self.publish(artifact)
        self.assertTrue(raced)
        self.assertNotEqual(self.remote_ref('refs/heads/rift-lab/evolution'), self.head(self.repo))
        self.assert_main_unchanged()

    def test_controller_stdout_does_not_echo_model_notes_or_summary(self):
        body = self.root / 'review.json'
        body.write_text(json.dumps({'decision': 'approve', 'notes': '##[error]not a runner command'}))
        result = subprocess.run(['python3', str(FOLDER / 'control.py'), 'approve', '--body-file', str(body)],
                                capture_output=True, check=True)
        self.assertEqual(json.loads(result.stdout), {'decision': 'approve'})
        self.assertNotIn(b'##[', result.stdout)
        artifact = self.artifact()
        # CLI policy points to the actual pinned seed; this fixture exercises sanitized accept output instead.
        candidate = self.root / 'candidate.json'
        candidate.write_text(json.dumps({'status': 'changed', 'base_sha': self.seed,
                                         'patch': (artifact / 'candidate.patch').read_text(),
                                         'summary': '##[error]not a runner command'}))
        result = subprocess.run(['python3', str(FOLDER / 'control.py'), 'accept', str(self.repo),
                                 '--base', self.seed, '--body-file', str(candidate),
                                 '--out', str(self.root / 'cli-out')], capture_output=True, check=True)
        self.assertNotIn('summary', json.loads(result.stdout))
        self.assertNotIn(b'##[', result.stdout)
        self.assertIn('##[error]', json.loads((self.root / 'cli-out/manifest.json').read_text())['summary'])


if __name__ == '__main__':
    unittest.main()
