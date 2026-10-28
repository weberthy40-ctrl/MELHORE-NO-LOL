"""Dependency-free structural guards; YAML syntax is also checked locally with PyYAML."""
import json
from pathlib import Path
import re
import unittest
ROOT=Path(__file__).resolve().parents[2]
FLOW=ROOT/'workflows/rift-lab-autoevolution.yml'
AUTOMATION=ROOT/'automation'

class WorkflowBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text=FLOW.read_text()
        matches=list(re.finditer(r'^  ([a-z]+):\n',cls.text.split('jobs:\n',1)[1],re.M))
        body=cls.text.split('jobs:\n',1)[1]
        cls.jobs={m[1]:body[m.start():matches[i+1].start() if i+1<len(matches) else len(body)] for i,m in enumerate(matches)}

    def test_only_fixed_triggers_and_concurrency(self):
        trigger=self.text.split('permissions:',1)[0]
        self.assertIn("cron: '0 12 * * *'",trigger)
        self.assertIn('workflow_dispatch:',trigger)
        self.assertNotIn('pull_request',trigger)
        self.assertIn('default: dry-run',trigger)
        self.assertIn('group: rift-lab-autoevolution',self.text)
        self.assertIn('cancel-in-progress: false',self.text)

    def test_key_actions_are_last_and_read_only_git_permissions(self):
        for name,profile in [('implement',':workspace'),('review',':read-only')]:
            job=self.jobs[name]
            self.assertIn('contents: read',job)
            self.assertNotIn('contents: write',job)
            last=job[job.rfind('\n      - '):]
            self.assertIn('uses: openai/codex-action@c05cfd74ad95c626cdf05c6685e62becc3bf7813',last)
            self.assertIn("permission-profile: '"+profile+"'",last)
            self.assertIn('safety-strategy: drop-sudo',last)
            self.assertNotIn('persist-credentials: true',job)
            self.assertRegex(job,r'timeout-minutes: \d+')
        self.assertEqual(self.text.count('openai-api-key: ${{ secrets.OPENAI_API_KEY }}'),2)
        self.assertNotIn('safety-strategy: unsafe',self.text)
        self.assertNotIn('allow-users:',self.text)

    def test_publisher_never_executes_candidate_or_calls_model(self):
        job=self.jobs['publish']
        self.assertEqual(self.text.count('contents: write'),1)
        self.assertIn('contents: write',job)
        self.assertIn('control.py approve',job)
        self.assertIn('publish.py',job)
        for forbidden in ['npm ', 'node ', 'pip ', 'codex-action', '--force', 'refs/heads/main']:
            self.assertNotIn(forbidden,job)

    def test_qa_isolated_and_collected_without_following_links(self):
        job=self.jobs['verify']
        self.assertIn('sudo -u riftqa /usr/bin/env -i',job)
        self.assertIn('/opt/rift-control/qa.sh',job)
        self.assertIn('pkill -KILL -u riftqa',job)
        self.assertIn('automation/collect.py',job)
        self.assertNotIn('cp -a /home/riftqa/results',job)
        self.assertNotIn('secrets.',job)
        self.assertIn('::stop-commands::',job)

    def test_review_gets_native_evidence_and_no_candidate_execution(self):
        job=self.jobs['review']
        self.assertIn('name: qa-evidence',job)
        self.assertIn('path: qa-evidence',job)
        self.assertIn('control.py bundle',job)
        self.assertNotIn('npm ',job)

    def test_partial_reruns_cannot_reuse_an_old_admission(self):
        for name in ['implement','verify','review','publish']:
            self.assertIn("github.run_attempt == '1'",self.jobs[name])

    def test_budget_and_output_sizes_are_pinned(self):
        policy=json.loads((AUTOMATION/'policy.json').read_text())
        schema=json.loads((AUTOMATION/'candidate.schema.json').read_text())
        self.assertLessEqual(policy['max_patch_bytes'],12000)
        self.assertEqual(schema['properties']['patch']['maxLength'],policy['max_patch_bytes'])
        self.assertEqual(policy['evolution_branch'],'rift-lab/evolution')
        self.assertEqual(policy['max_cycles'],1)
        self.assertEqual(policy['max_correction_attempts'],3)
        self.assertGreaterEqual(tuple(map(int,policy['codex_version'].split('.'))),(0,138,0))
        self.assertRegex(policy['seed_sha'],r'^[a-f0-9]{40}$')
        for action in re.findall(r'uses: ([^\s]+)',self.text):
            self.assertRegex(action,r'@[a-f0-9]{40}$')


class ExtraBrowserProtocol(unittest.TestCase):
    def run_cases(self,cases):
        import os
        import subprocess
        import tempfile
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);folder=root/'tests/browser';folder.mkdir(parents=True)
            for name,body in cases.items():(folder/name).write_text(body)
            text=(AUTOMATION/'qa.sh').read_text()
            section=text.split('# BEGIN EXTRA BROWSER SCENARIOS\n',1)[1].split('# END EXTRA BROWSER SCENARIOS',1)[0]
            result=subprocess.run(['bash','-euo','pipefail','-c',section],cwd=root,env={**os.environ,'out':str(root/'results')},capture_output=True,text=True,timeout=10)
            return result,(root/'ran.txt').exists()

    def test_native_scenario_receives_url_and_artifact_dir(self):
        result,_=self.run_cases({'journey.mjs':"import assert from 'node:assert/strict';import process from 'node:process';assert.equal(process.argv[2],'http://127.0.0.1:4173/');assert.ok(process.env.QA_ARTIFACT_DIR.endsWith('/new-browser'));console.log('fixture scenario, not native browser evidence');"})
        self.assertEqual(result.returncode,0,result.stderr)

    def test_more_than_five_scenarios_is_rejected_before_execution(self):
        code="import {writeFileSync} from 'node:fs';writeFileSync('ran.txt','bad');"
        result,ran=self.run_cases({str(i)+'.mjs':code for i in range(6)})
        self.assertNotEqual(result.returncode,0);self.assertFalse(ran)

    def test_failing_scenario_blocks_round(self):
        result,_=self.run_cases({'failure.mjs':"import process from 'node:process';process.exit(7);"})
        self.assertEqual(result.returncode,7)

if __name__=='__main__':unittest.main()
