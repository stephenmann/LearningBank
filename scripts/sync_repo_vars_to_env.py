#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

DEFAULT_OWNER = "stephenmann"
DEFAULT_REPO = "LearningBank"
DEFAULT_ENVIRONMENT = "prod"
DEFAULT_API_URL = "https://api.github.com"


class GitHubApiError(RuntimeError):
    pass


def parse_next_link(link_header: str | None) -> str | None:
    if not link_header:
        return None

    for part in link_header.split(","):
        section = part.strip()
        if 'rel="next"' not in section:
            continue
        start = section.find("<")
        end = section.find(">", start + 1)
        if start != -1 and end != -1:
            return section[start + 1 : end]
    return None


class GitHubApiClient:
    def __init__(self, token: str, api_url: str = DEFAULT_API_URL) -> None:
        self.api_url = api_url.rstrip("/")
        self.token = token

    def _request(
        self, method: str, path_or_url: str, payload: dict[str, Any] | None = None
    ) -> tuple[Any | None, dict[str, str]]:
        if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
            url = path_or_url
        else:
            url = f"{self.api_url}/{path_or_url.lstrip('/')}"

        body = None
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")

        request = urllib.request.Request(
            url=url,
            data=body,
            method=method,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + self.token,
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "learningbank-variable-sync-cli",
                **({"Content-Type": "application/json"} if body else {}),
            },
        )

        try:
            with urllib.request.urlopen(request) as response:
                response_body = response.read().decode("utf-8")
                data = json.loads(response_body) if response_body else None
                headers = {k: v for k, v in response.headers.items()}
                return data, headers
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            raise GitHubApiError(
                f"GitHub API request failed ({error.code}) {method} {url}\n{details}"
            ) from error
        except urllib.error.URLError as error:
            raise GitHubApiError(
                f"GitHub API request failed while calling {method} {url}: {error.reason}"
            ) from error

    def list_repository_variables(self, owner: str, repo: str) -> list[dict[str, str]]:
        url = (
            f"{self.api_url}/repos/{owner}/{repo}/actions/variables"
            "?per_page=100&page=1"
        )
        variables: list[dict[str, str]] = []

        while url:
            payload, headers = self._request("GET", url)
            batch = payload.get("variables", []) if isinstance(payload, dict) else []
            variables.extend(batch)
            url = parse_next_link(headers.get("Link"))

        return variables

    def upsert_environment_variable(
        self, owner: str, repo: str, environment: str, name: str, value: str
    ) -> None:
        environment_path = urllib.parse.quote(environment, safe="")
        name_path = urllib.parse.quote(name, safe="")
        path = (
            f"/repos/{owner}/{repo}/environments/{environment_path}/variables/{name_path}"
        )
        self._request("PUT", path, {"name": name, "value": value})


def resolve_token(explicit_token: str | None) -> tuple[str, str]:
    if explicit_token:
        return explicit_token, "--token"

    for env_name in ("GH_TOKEN", "GITHUB_TOKEN"):
        token = os.getenv(env_name)
        if token:
            return token, env_name

    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as error:
        raise GitHubApiError(
            "No GitHub token found. Set GH_TOKEN/GITHUB_TOKEN, pass --token, or install/authenticate gh."
        ) from error

    token = result.stdout.strip()
    if result.returncode == 0 and token:
        return token, "gh auth token"

    stderr = result.stderr.strip()
    extra = f" gh said: {stderr}" if stderr else ""
    raise GitHubApiError(
        "No GitHub token found. Set GH_TOKEN/GITHUB_TOKEN, pass --token, or run `gh auth login`."
        + extra
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Copy repository Actions variables into a target environment."
    )
    parser.add_argument("--owner", default=DEFAULT_OWNER, help="Repository owner.")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Repository name.")
    parser.add_argument(
        "--environment",
        default=DEFAULT_ENVIRONMENT,
        help=f"Target environment name (default: {DEFAULT_ENVIRONMENT}).",
    )
    parser.add_argument(
        "--token",
        help="GitHub token. If omitted, uses GH_TOKEN/GITHUB_TOKEN or `gh auth token`.",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"GitHub API base URL (default: {DEFAULT_API_URL}).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        token, token_source = resolve_token(args.token)
        client = GitHubApiClient(token=token, api_url=args.api_url)

        print(
            f"Syncing repository variables from {args.owner}/{args.repo} to environment '{args.environment}'..."
        )
        print(f"Using auth token from: {token_source}")
        variables = client.list_repository_variables(args.owner, args.repo)
        print(f"Found {len(variables)} repository variable(s).")

        if not variables:
            print("Nothing to sync.")
            return 0

        for index, variable in enumerate(sorted(variables, key=lambda item: item["name"]), 1):
            name = variable["name"]
            value = variable["value"]
            print(f"[{index}/{len(variables)}] Upserting {name} ...", end=" ")
            client.upsert_environment_variable(
                owner=args.owner,
                repo=args.repo,
                environment=args.environment,
                name=name,
                value=value,
            )
            print("done")

        print(
            f"Completed: synced {len(variables)} variable(s) to environment '{args.environment}'."
        )
        return 0
    except GitHubApiError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
