#!/usr/bin/env python3
"""Trusted publisher: revalidate a patch and advance only the fixed evolution ref.

This controller never imports or runs code from PROJECT. Independent approval and
QA are prerequisites enforced by the workflow before this job starts.
"""
import argparse
import json
import re
import subprocess
import sys

import control

BRANCH = 'rift-lab/evolution'
REF = 'refs/heads/' + BRANCH
AUTHOR_NAME = 'RIFT LAB Automation'
AUTHOR_EMAIL = 'rift-lab-automation@users.noreply.github.com'


def remote_head(project):
    result = control.git(project, 'ls-remote', '--exit-code', '--refs', 'origin', REF, check=False)
    if result.returncode == 2:
        control.require(not result.stdout.strip(), 'Unexpected missing-ref response')
        return None
    control.require(result.returncode == 0, 'Cannot read the evolution ref')
    lines = result.stdout.decode('ascii').splitlines()
    control.require(len(lines) == 1, 'Unexpected evolution ref response')
    fields = lines[0].split('\t')
    control.require(len(fields) == 2 and fields[1] == REF and control.SHA.fullmatch(fields[0]),
                    'Invalid evolution ref response')
    return fields[0]


def publish(project, base, seed, artifact, out, run_id):
    control.require(isinstance(run_id, str) and re.fullmatch(r'[1-9][0-9]{0,19}', run_id),
                    'Run ID must be a bounded positive decimal integer')
    limits = control.policy()
    control.require(limits.get('seed_sha') == seed, 'Seed differs from the trusted policy')
    control.require(limits.get('evolution_branch') == BRANCH, 'Unexpected policy evolution branch')
    control.require(isinstance(base, str) and control.SHA.fullmatch(base), 'Invalid expected base SHA')
    source = control.verify_source(project, seed)
    control.require(source['head_sha'] == base, 'Checkout HEAD differs from the trusted base')
    current = remote_head(project)
    control.require(current == base or (current is None and base == seed),
                    'Evolution ref changed or is missing; refusing a stale publication')
    # Reconstruct and validate the canonical diff on this fresh privileged runner.
    # No paths outside the product allowlist can reach the index/worktree.
    control.bundle(project, base, artifact, out)
    control.git(project, '-c', 'user.name=' + AUTHOR_NAME, '-c', 'user.email=' + AUTHOR_EMAIL,
                'commit', '-m', 'RIFT LAB automated round ' + run_id)
    head = control.project_head(project)
    control.require(head != base, 'Publication did not create a new commit')
    # Never force; a race after the optimistic check is rejected by normal Git FF rules.
    control.git(project, 'push', '--no-follow-tags', 'origin', 'HEAD:' + REF)
    control.require(remote_head(project) == head, 'Post-push evolution ref verification failed')
    return {'status': 'published', 'branch': BRANCH, 'base_sha': base,
            'head_sha': head, 'run_id': run_id}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project')
    parser.add_argument('--base', required=True)
    parser.add_argument('--seed', required=True)
    parser.add_argument('--artifact', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--run-id', required=True)
    args = parser.parse_args(argv)
    try:
        result = publish(args.project, args.base, args.seed, args.artifact, args.out, args.run_id)
        print(json.dumps(result, ensure_ascii=True))
        return 0
    except (control.Rejected, OSError, UnicodeError, json.JSONDecodeError,
            subprocess.SubprocessError) as error:
        reason = str(error) if isinstance(error, control.Rejected) else type(error).__name__
        print(json.dumps({'status': 'rejected', 'reason': reason}, ensure_ascii=True))
        return 2


if __name__ == '__main__':
    sys.exit(main())
