#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from http.client import HTTPException

STORAGE_ROOT = os.environ.get(
    "REGISTRY_STORAGE_ROOT", "/works/me/registry_data/docker/registry/v2"
)
REGISTRY_URL = os.environ.get("REGISTRY_URL", "http://localhost:5000")
REGISTRY_CONTAINER = os.environ.get("REGISTRY_CONTAINER", "docker-registry")
REGISTRY_CONFIG = "/etc/docker/registry/config.yml"
DEFAULT_REPOS = "tholabul-ilmi-api,tholabul-ilmi-web"
WRITE_METHODS = ("PUT", "POST", "PATCH", "DELETE")
MANIFEST_ACCEPT = ", ".join(
    [
        "application/vnd.oci.image.index.v1+json",
        "application/vnd.oci.image.manifest.v1+json",
        "application/vnd.docker.distribution.manifest.list.v2+json",
        "application/vnd.docker.distribution.manifest.v2+json",
    ]
)
READ_ERRORS = (OSError, ValueError, KeyError)


def log(message):
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{stamp}] {message}", flush=True)


def gigabytes(size):
    return f"{size / 1e9:.2f} GB"


def blob_path(digest):
    algorithm, value = digest.split(":", 1)
    return f"{STORAGE_ROOT}/blobs/{algorithm}/{value[:2]}/{value}/data"


def read_manifest(digest):
    with open(blob_path(digest)) as handle:
        return json.load(handle)


def child_digests(document):
    return [entry["digest"] for entry in document.get("manifests", [])]


def manifest_tree(digest, found):
    if digest in found:
        return found
    found.add(digest)
    for child in child_digests(read_manifest(digest)):
        manifest_tree(child, found)
    return found


def manifest_blobs(digest, found=None):
    found = {} if found is None else found
    if digest in found:
        return found
    document = read_manifest(digest)
    found[digest] = os.path.getsize(blob_path(digest))
    for child in child_digests(document):
        manifest_blobs(child, found)
    if "config" in document:
        found[document["config"]["digest"]] = document["config"]["size"]
    for layer in document.get("layers", []):
        found[layer["digest"]] = layer["size"]
    return found


def manifests_dir(repo):
    return f"{STORAGE_ROOT}/repositories/{repo}/_manifests"


def repositories():
    directory = f"{STORAGE_ROOT}/repositories"
    return sorted(os.listdir(directory)) if os.path.isdir(directory) else []


def current_tags(repo):
    tags_dir = f"{manifests_dir(repo)}/tags"
    tags = {}
    if not os.path.isdir(tags_dir):
        return tags
    for tag in os.listdir(tags_dir):
        link = f"{tags_dir}/{tag}/current/link"
        if os.path.isfile(link):
            with open(link) as handle:
                tags[tag] = (handle.read().strip(), os.stat(link).st_mtime)
    return tags


def revisions(repo):
    directory = f"{manifests_dir(repo)}/revisions/sha256"
    if not os.path.isdir(directory):
        return set()
    return {
        f"sha256:{name}"
        for name in os.listdir(directory)
        if os.path.isfile(f"{directory}/{name}/link")
    }


def plan_repo(repo, keep):
    tags = current_tags(repo)
    if "prod" not in tags:
        return None
    newest = {}
    for digest, modified in tags.values():
        newest[digest] = max(newest.get(digest, 0), modified)
    roots = set(sorted(newest, key=newest.get, reverse=True)[:keep])
    roots.add(tags["prod"][0])
    retained = set()
    for root in roots:
        manifest_tree(root, retained)
    doomed = revisions(repo) - retained
    tagged_digests = {digest for digest, _ in tags.values()}
    return {
        "tags": tags,
        "roots": roots,
        "retained": retained,
        "doomed": doomed,
        "doomed_tagged": doomed & tagged_digests,
    }


def missing_blobs(digests):
    missing = set()
    for digest in digests:
        for blob in manifest_blobs(digest):
            if not os.path.exists(blob_path(blob)):
                missing.add(blob)
    return missing


def estimate_reclaim(plans):
    kept = {}
    for repo in repositories():
        digests = plans[repo]["retained"] if repo in plans else revisions(repo)
        for digest in digests:
            try:
                manifest_blobs(digest, kept)
            except READ_ERRORS:
                continue
    freed = {}
    for plan in plans.values():
        for digest in plan["doomed"]:
            try:
                blobs = manifest_blobs(digest)
            except READ_ERRORS:
                continue
            for blob, size in blobs.items():
                if blob not in kept:
                    freed[blob] = size
    return sum(freed.values())


def blobs_size():
    total = 0
    for directory, _, files in os.walk(f"{STORAGE_ROOT}/blobs"):
        for name in files:
            total += os.path.getsize(os.path.join(directory, name))
    return total


def http(method, path, accept=None):
    request = urllib.request.Request(REGISTRY_URL + path, method=method)
    if accept:
        request.add_header("Accept", accept)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, b""
    except (OSError, HTTPException):
        return 0, b""


def registry_recently_written(minutes):
    result = subprocess.run(
        ["docker", "logs", "--since", f"{minutes}m", REGISTRY_CONTAINER],
        capture_output=True,
        text=True,
    )
    output = result.stdout + result.stderr
    return any(f'"{method} /v2/' in output for method in WRITE_METHODS)


def delete_manifest(repo, digest):
    status, _ = http("DELETE", f"/v2/{repo}/manifests/{digest}")
    return status in (202, 404)


def garbage_collect():
    result = subprocess.run(
        [
            "docker",
            "exec",
            REGISTRY_CONTAINER,
            "registry",
            "garbage-collect",
            REGISTRY_CONFIG,
        ],
        capture_output=True,
        text=True,
    )
    summary = [
        line
        for line in result.stdout.splitlines()
        if "blobs marked" in line
    ]
    return result.returncode == 0, summary


def restart_registry():
    subprocess.run(
        ["docker", "restart", REGISTRY_CONTAINER], check=True, capture_output=True
    )
    deadline = time.time() + 60
    while time.time() < deadline:
        status, _ = http("GET", "/v2/")
        if status in (200, 401):
            return True
        time.sleep(1)
    return False


def verify_manifest(repo, reference):
    status, body = http("GET", f"/v2/{repo}/manifests/{reference}", MANIFEST_ACCEPT)
    if status != 200:
        return [f"{repo}:{reference} manifest -> {status}"]
    document = json.loads(body)
    problems = []
    for child in child_digests(document):
        problems.extend(verify_manifest(repo, child))
    blobs = [document["config"]["digest"]] if "config" in document else []
    blobs += [layer["digest"] for layer in document.get("layers", [])]
    for digest in blobs:
        status, _ = http("HEAD", f"/v2/{repo}/blobs/{digest}")
        if status != 200:
            problems.append(f"{repo}:{reference} blob {digest[:19]} -> {status}")
    return problems


def verify_repo(repo):
    status, body = http("GET", f"/v2/{repo}/tags/list")
    if status != 200:
        return [f"{repo} tags/list -> {status}"]
    problems = []
    for tag in json.loads(body).get("tags") or []:
        problems.extend(verify_manifest(repo, tag))
    return problems


def verify_all(repos, stage):
    problems = []
    for repo in repos:
        problems.extend(verify_repo(repo))
    for problem in problems:
        log(f"verify {stage}: {problem}")
    return problems


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Trim the local registry: keep the newest N releases per repo "
            "(plus prod) with their child manifests, delete every other "
            "manifest revision including untagged leftovers, then garbage-"
            "collect, restart the registry and verify every remaining tag "
            "through the API. Dry run unless --apply is given."
        )
    )
    parser.add_argument("--apply", action="store_true", help="perform the cleanup")
    parser.add_argument(
        "--keep", type=int, default=10, help="releases to keep per repo (default 10)"
    )
    parser.add_argument(
        "--repos",
        default=DEFAULT_REPOS,
        help="comma separated repositories to trim (default: this project's)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="skip the refusal when the registry saw writes in the last 10 minutes",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    plans = {}
    for repo in [name for name in args.repos.split(",") if name]:
        try:
            plan = plan_repo(repo, args.keep)
        except READ_ERRORS as error:
            log(f"{repo}: cannot read retained manifests ({error}), refusing")
            return 2
        if plan is None:
            log(f"{repo}: no prod tag, skipped")
            continue
        plans[repo] = plan
    if not plans:
        log("nothing to do")
        return 2

    for repo, plan in plans.items():
        removed_tags = sorted(
            tag
            for tag, (digest, _) in plan["tags"].items()
            if digest in plan["doomed_tagged"]
        )
        log(
            f"{repo}: keep {len(plan['roots'])} releases "
            f"({len(plan['retained'])} manifests), delete {len(plan['doomed'])} "
            f"manifests, of which {len(plan['doomed_tagged'])} old releases"
        )
        if removed_tags:
            log(f"{repo}: tags removed: {', '.join(removed_tags)}")

    retained = set().union(*(plan["retained"] for plan in plans.values()))
    missing = missing_blobs(retained)
    if missing:
        log(f"{len(missing)} retained blobs are missing on disk, refusing")
        return 2

    if not any(plan["doomed"] for plan in plans.values()):
        log("nothing to delete")
        return 0

    log(f"estimated reclaim: {gigabytes(estimate_reclaim(plans))}")
    if not args.apply:
        log("dry run, nothing changed; re-run with --apply")
        return 0

    if not args.force and registry_recently_written(10):
        log("registry saw writes in the last 10 minutes, refusing")
        return 2

    before = blobs_size()
    failures = 0
    for repo, plan in plans.items():
        for digest in sorted(plan["doomed"]):
            if not delete_manifest(repo, digest):
                failures += 1
                log(f"{repo}: failed to delete {digest}")
    log(f"manifests deleted, {failures} failures")

    if verify_all(plans, "before gc"):
        log("remaining tags are broken, aborting before garbage-collect")
        return 1

    collected, summary = garbage_collect()
    for line in summary:
        log(f"gc: {line}")
    if not collected:
        log("garbage-collect failed")
        return 1

    if not restart_registry():
        log("registry did not come back after restart")
        return 1

    problems = verify_all(plans, "after gc")

    after = blobs_size()
    log(f"blobs on disk: {gigabytes(before)} -> {gigabytes(after)}")
    if problems or failures:
        log("finished with problems")
        return 1
    log("finished, all remaining tags verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
