#!/usr/bin/env python3
"""Copy bounded QA evidence as bytes, never following links or decoding content.

Run only after the QA user's processes have been stopped. The destination must be
new and outside the source; copied directories/files receive 0755/0644 modes.
"""
import argparse
import json
import os
from pathlib import Path
import re
import stat
import sys

MAX_FILES = 1000
MAX_BYTES = 100 * 1024 * 1024
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_DEPTH = 8
MAX_ENTRIES = 2000
DIRECTORY_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC


class Rejected(ValueError):
    pass


def require(condition, reason):
    if not condition:
        raise Rejected(reason)


def component(name):
    require(isinstance(name, str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._ -]*', name),
            'Unsafe evidence filename')
    require(not name.startswith('.') and name not in ('.', '..'), 'Unsafe evidence component')


def absolute(path):
    path = Path(path)
    require('..' not in path.parts, 'Parent traversal is forbidden')
    return path.absolute()


def open_directory(path):
    """Open every component relative to a pinned fd; no parent symlink traversal."""
    path = absolute(path)
    fd = os.open('/', DIRECTORY_FLAGS)
    try:
        for name in path.parts[1:]:
            child = os.open(name, DIRECTORY_FLAGS, dir_fd=fd)
            os.close(fd)
            fd = child
        require(stat.S_ISDIR(os.fstat(fd).st_mode), 'Source must be a directory')
        return fd
    except BaseException:
        os.close(fd)
        raise


def remove_children(fd):
    """Remove only our partial destination; unlink links without following them."""
    for name in os.listdir(fd):
        entry = os.stat(name, dir_fd=fd, follow_symlinks=False)
        if stat.S_ISDIR(entry.st_mode):
            child = os.open(name, DIRECTORY_FLAGS, dir_fd=fd)
            try:
                remove_children(child)
            finally:
                os.close(child)
            os.rmdir(name, dir_fd=fd)
        else:
            os.unlink(name, dir_fd=fd)


def copy_tree(source_fd, target_fd, source_device, count, depth=0):
    for name in sorted(os.listdir(source_fd)):
        component(name)
        require(depth < MAX_DEPTH, 'Evidence nesting exceeds the depth limit')
        count['entries'] += 1
        require(count['entries'] <= MAX_ENTRIES, 'Too many evidence entries')
        entry = os.stat(name, dir_fd=source_fd, follow_symlinks=False)
        require(entry.st_dev == source_device, 'Evidence may not cross filesystem boundaries')
        require(not stat.S_ISLNK(entry.st_mode), 'Evidence symlinks are forbidden')
        if stat.S_ISDIR(entry.st_mode):
            child = os.open(name, DIRECTORY_FLAGS, dir_fd=source_fd)
            target = None
            try:
                opened = os.fstat(child)
                require((opened.st_dev, opened.st_ino) == (entry.st_dev, entry.st_ino),
                        'Evidence directory changed while being opened')
                os.mkdir(name, mode=0o755, dir_fd=target_fd)
                target = os.open(name, DIRECTORY_FLAGS, dir_fd=target_fd)
                os.fchmod(target, 0o755)
                copy_tree(child, target, source_device, count, depth + 1)
            finally:
                if target is not None:
                    os.close(target)
                os.close(child)
            continue
        require(stat.S_ISREG(entry.st_mode), 'Only regular evidence files are allowed')
        require(entry.st_nlink == 1, 'Evidence hardlinks are forbidden')
        require(entry.st_size <= MAX_FILE_BYTES, 'Evidence file exceeds the size limit')
        count['files'] += 1
        require(count['files'] <= MAX_FILES, 'Too many evidence files')
        source = os.open(name, FILE_FLAGS, dir_fd=source_fd)
        target = None
        copied = 0
        try:
            opened = os.fstat(source)
            require(stat.S_ISREG(opened.st_mode) and opened.st_nlink == 1,
                    'Opened evidence must be a regular, unlinked file')
            require((opened.st_dev, opened.st_ino) == (entry.st_dev, entry.st_ino),
                    'Evidence file changed while being opened')
            target = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
                             mode=0o644, dir_fd=target_fd)
            os.fchmod(target, 0o644)
            while True:
                chunk = os.read(source, 65536)
                if not chunk:
                    break
                copied += len(chunk)
                count['bytes'] += len(chunk)
                require(copied <= MAX_FILE_BYTES, 'Evidence file grew beyond its size limit')
                require(count['bytes'] <= MAX_BYTES, 'Total evidence exceeds the byte limit')
                view = memoryview(chunk)
                while view:
                    written = os.write(target, view)
                    require(written > 0, 'Evidence write did not advance')
                    view = view[written:]
            final = os.fstat(source)
            require(final.st_nlink == 1 and final.st_size == opened.st_size == copied and
                    final.st_mtime_ns == opened.st_mtime_ns,
                    'Evidence changed while being copied')
        finally:
            if target is not None:
                os.close(target)
            os.close(source)


def collect(source, destination):
    source = absolute(source)
    destination = absolute(destination)
    require(not destination.is_relative_to(source), 'Destination must be outside the source')
    component(destination.name)
    source_fd = open_directory(source)
    parent_fd = target_fd = None
    created = False
    try:
        parent_fd = open_directory(destination.parent)
        original = os.fstat(source_fd)
        parent = os.fstat(parent_fd)
        require((parent.st_dev, parent.st_ino) != (original.st_dev, original.st_ino),
                'Destination parent must not be the source')
        os.mkdir(destination.name, mode=0o755, dir_fd=parent_fd)
        created = True
        target_fd = os.open(destination.name, DIRECTORY_FLAGS, dir_fd=parent_fd)
        os.fchmod(target_fd, 0o755)
        count = {'files': 0, 'bytes': 0, 'entries': 0}
        copy_tree(source_fd, target_fd, original.st_dev, count)
        return {'files': count['files'], 'bytes': count['bytes']}
    except BaseException:
        if created:
            if target_fd is None:
                target_fd = os.open(destination.name, DIRECTORY_FLAGS, dir_fd=parent_fd)
            remove_children(target_fd)
            os.rmdir(destination.name, dir_fd=parent_fd)
        raise
    finally:
        if target_fd is not None:
            os.close(target_fd)
        if parent_fd is not None:
            os.close(parent_fd)
        os.close(source_fd)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('destination')
    args = parser.parse_args(argv)
    try:
        result = collect(args.source, args.destination)
        print(json.dumps(result))
        return 0
    except (OSError, Rejected) as error:
        reason = str(error) if isinstance(error, Rejected) else type(error).__name__
        print(json.dumps({'status': 'rejected', 'reason': reason}))
        return 2


if __name__ == '__main__':
    sys.exit(main())
