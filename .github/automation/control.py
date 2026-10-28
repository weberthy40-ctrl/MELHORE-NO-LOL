#!/usr/bin/env python3
"""Trusted patch boundary. Never imports or executes code from a candidate checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile

GIT = '/usr/bin/git'
POLICY_FILE = Path(__file__).with_name('policy.json')
SHA = re.compile(r'[0-9a-f]{40}\Z')
ALLOWED = ('src/', 'tests/', 'public/', 'docs/')
PROTECTED_DOCS = {'docs/automation.md', 'docs/qa.md'}
PROTECTED_NAMES = {'agents.md', 'agents.override.md'}


class Rejected(ValueError):
    """Fail-closed rejection, suitable for a log without credential values."""


def require(condition, message):
    if not condition:
        raise Rejected(message)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON key')
        result[key] = value
    return result


def read_json(path, limit=400000):
    path = Path(path)
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and not path.is_symlink(), 'Expected a regular JSON file')
    require(info.st_size <= limit, 'JSON file is too large')
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_object)


def policy():
    data = read_json(POLICY_FILE)
    for name in ('max_patch_bytes', 'max_file_bytes', 'max_changed_files'):
        require(type(data.get(name)) is int and data[name] > 0, 'Invalid trusted policy')
    return data


def git(project, *args, index=None, data=None, check=True):
    project = Path(project).resolve()
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_TERMINAL_PROMPT='0')
    if index is not None:
        env['GIT_INDEX_FILE'] = str(index)
    command = [GIT, '--git-dir', str(project / '.git'), '--work-tree', str(project),
               '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
               '-c', 'core.attributesFile=/dev/null', '-c', 'commit.gpgsign=false',
               '-c', 'diff.external=', *args]
    result = subprocess.run(command, input=data, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, env=env, cwd=project, timeout=60)
    if check and result.returncode:
        # Git stderr can contain arbitrary patch text; do not emit it as workflow commands.
        raise Rejected('Git operation rejected: ' + args[0])
    return result


def project_head(project):
    project = Path(project).resolve()
    require(project.is_dir() and (project / '.git').is_dir() and not (project / '.git').is_symlink(),
            'Expected a standalone Git checkout')
    return git(project, 'rev-parse', 'HEAD').stdout.decode().strip()


def check_path(name):
    require(isinstance(name, str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._ /-]*', name),
            'Unsafe path syntax')
    pieces = name.split('/')
    require(all(p and not p.startswith('.') for p in pieces), 'Unsafe path component')
    require(name.startswith(ALLOWED), 'Path is outside the product allowlist')
    require(name.casefold() not in PROTECTED_DOCS, 'Protected normative document')
    require(all(p.casefold() not in PROTECTED_NAMES for p in pieces), 'Protected instruction filename')


def validate_tree_diff(project, old, new, limits, max_files=None, index=None):
    raw = git(project, 'diff', '--raw', '-z', '--no-renames', '--no-ext-diff',
              '--no-textconv', old, new, index=index).stdout.split(b'\0')
    require(raw[-1] == b'', 'Malformed Git raw diff')
    raw.pop()
    require(len(raw) % 2 == 0, 'Malformed Git raw diff')
    count = len(raw) // 2
    if max_files is not None:
        require(count <= max_files, 'Too many changed files')
    for offset in range(0, len(raw), 2):
        try:
            fields = raw[offset].decode('ascii').split()
            name = raw[offset + 1].decode('ascii')
        except UnicodeDecodeError as error:
            raise Rejected('Only ASCII paths are accepted') from error
        require(len(fields) == 5 and fields[0].startswith(':'), 'Malformed Git diff record')
        old_mode, new_mode = fields[0][1:], fields[1]
        require(old_mode in ('000000', '100644') and new_mode in ('000000', '100644'),
                'Symlinks, submodules and executable/special modes are forbidden')
        check_path(name)
        if new_mode != '000000':
            size = int(git(project, 'cat-file', '-s', new + ':' + name).stdout)
            require(size <= limits['max_file_bytes'], 'Changed file is too large')
    return count


def verify_source(project, seed):
    require(bool(SHA.fullmatch(seed)), 'Invalid seed SHA')
    head = project_head(project)
    require(git(project, 'merge-base', '--is-ancestor', seed, head, check=False).returncode == 0,
            'Source is not descended from the pinned seed')
    count = validate_tree_diff(project, seed, head, policy())
    return {'status': 'verified', 'head_sha': head, 'seed_sha': seed, 'changed_files': count}


def check_output(out):
    out = Path(out)
    require(not any(node.is_symlink() for node in [out, *out.parents]),
            'Output directory may not traverse a symlink')
    require(not out.exists() or out.is_dir(), 'Output must be a directory')
    for name in ('manifest.json', 'candidate.patch'):
        require(not (out / name).exists() and not (out / name).is_symlink(), 'Output already exists')
    return out


def output_manifest(out, manifest, patch=None):
    out = check_output(out)
    out.mkdir(parents=True, exist_ok=True)
    if patch is not None:
        (out / 'candidate.patch').write_bytes(patch)
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=True, indent=2) + '\n')
    return manifest


def accept_body(project, base, body, out):
    check_output(out)
    limits = policy()
    require(isinstance(base, str) and SHA.fullmatch(base), 'Invalid expected base SHA')
    require(project_head(project) == base, 'Checkout HEAD differs from the trusted base')
    require(not git(project, 'status', '--porcelain', '--untracked-files=normal').stdout,
            'Candidate checkout must be clean before applying a patch')
    require(isinstance(body, dict) and set(body) == {'status', 'base_sha', 'patch', 'summary'},
            'Invalid candidate JSON fields')
    require(body['base_sha'] == base, 'Candidate base differs from the trusted base')
    require(isinstance(body['summary'], str) and len(body['summary']) <= 2000, 'Invalid summary')
    require(isinstance(body['patch'], str), 'Patch must be a string')
    require(body['status'] in ('changed', 'no-change', 'blocked'), 'Invalid candidate status')
    patch = body['patch'].encode('utf-8')
    require(len(patch) <= limits['max_patch_bytes'], 'Patch is too large')
    if body['status'] != 'changed':
        require(not patch, 'No-change/blocked candidates must not contain a patch')
        return output_manifest(out, {'status': body['status'], 'base_sha': base, 'summary': body['summary']})
    require(bool(patch.strip()), 'Changed candidate must have a patch')
    with tempfile.TemporaryDirectory(prefix='rift-index-') as temp:
        index = Path(temp) / 'index'
        git(project, 'read-tree', base, index=index)
        git(project, 'apply', '--cached', '--check', '--binary', '-', index=index, data=patch)
        git(project, 'apply', '--cached', '--binary', '-', index=index, data=patch)
        tree = git(project, 'write-tree', index=index).stdout.decode().strip()
        count = validate_tree_diff(project, base, tree, limits,
                                   max_files=limits['max_changed_files'], index=index)
        require(count > 0, 'Patch did not change any files')
        canonical = git(project, 'diff', '--cached', '--binary', '--full-index',
                        '--no-renames', '--no-ext-diff', '--no-textconv', base,
                        index=index).stdout
    require(len(canonical) <= limits['max_patch_bytes'], 'Canonical patch is too large')
    # Only apply after every path, mode and size was checked against the staged tree.
    git(project, 'apply', '--index', '--binary', '-', data=canonical)
    return output_manifest(out, {'status': 'changed', 'base_sha': base,
                                'sha256': hashlib.sha256(canonical).hexdigest(),
                                'summary': body['summary']}, canonical)


def bundle(project, base, artifact, out):
    artifact = Path(artifact)
    manifest = read_json(artifact / 'manifest.json', limit=20000)
    require(isinstance(manifest, dict) and set(manifest) == {'status', 'base_sha', 'sha256', 'summary'},
            'Invalid artifact manifest fields')
    require(manifest['status'] == 'changed' and manifest['base_sha'] == base, 'Invalid artifact base/status')
    path = artifact / 'candidate.patch'
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and not path.is_symlink(), 'Expected a regular patch file')
    require(info.st_size <= policy()['max_patch_bytes'], 'Artifact patch is too large')
    patch = path.read_bytes()
    require(isinstance(manifest['sha256'], str) and
            hashlib.sha256(patch).hexdigest() == manifest['sha256'], 'Artifact hash mismatch')
    body = {'status': 'changed', 'base_sha': base, 'patch': patch.decode('utf-8'), 'summary': manifest['summary']}
    return accept_body(project, base, body, out)


def approve(body):
    require(isinstance(body, dict) and set(body) == {'decision', 'notes'}, 'Invalid review JSON fields')
    require(body['decision'] in ('approve', 'block'), 'Invalid review decision')
    require(isinstance(body['notes'], str) and len(body['notes']) <= 4000, 'Invalid review notes')
    return body


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    verify = commands.add_parser('verify-source')
    verify.add_argument('project')
    verify.add_argument('--seed', required=True)
    accept = commands.add_parser('accept')
    accept.add_argument('project')
    accept.add_argument('--base', required=True)
    accept.add_argument('--body-file', required=True)
    accept.add_argument('--out', required=True)
    replay = commands.add_parser('bundle')
    replay.add_argument('project')
    replay.add_argument('--base', required=True)
    replay.add_argument('--artifact', required=True)
    replay.add_argument('--out', required=True)
    review = commands.add_parser('approve')
    review.add_argument('--body-file', required=True)
    dry = commands.add_parser('dry-run')
    dry.add_argument('--live', action='store_true')
    args = parser.parse_args(argv)
    try:
        code = 0
        if args.command == 'verify-source':
            result = verify_source(args.project, args.seed)
        elif args.command == 'accept':
            result = accept_body(args.project, args.base, read_json(args.body_file), args.out)
            code = 1 if result['status'] == 'blocked' else 0
        elif args.command == 'bundle':
            result = bundle(args.project, args.base, args.artifact, args.out)
        elif args.command == 'approve':
            result = approve(read_json(args.body_file))
            code = 0 if result['decision'] == 'approve' else 1
        else:
            require(not args.live or os.environ.get('RIFT_KEY_PRESENT') == 'true',
                    'OPENAI_API_KEY is missing; no model call was attempted')
            result = {'status': 'dry-run', 'implemented': True, 'model_called': False,
                      'key_present': os.environ.get('RIFT_KEY_PRESENT') == 'true',
                      'live_requested': args.live}
        # Model text stays in manifest artifacts, never in command-capable runner logs.
        safe_result = {key: value for key, value in result.items() if key not in ('summary', 'notes')}
        print(json.dumps(safe_result, ensure_ascii=True))
        return code
    except (Rejected, OSError, UnicodeError, json.JSONDecodeError,
            subprocess.SubprocessError) as error:
        # Keep untrusted filename/patch content out of command-capable workflow logs.
        message = str(error) if isinstance(error, Rejected) else type(error).__name__
        print(json.dumps({'status': 'rejected', 'reason': message}, ensure_ascii=True))
        return 2


if __name__ == '__main__':
    sys.exit(main())
