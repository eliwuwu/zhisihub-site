#!/usr/bin/env bash
set -euo pipefail

repo_name="${1:-zhisihub-site}"
branch_name="main"

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated yet."
  exit 1
fi

owner="$(gh api user -q .login)"
repo_full_name="$owner/$repo_name"

if gh repo view "$repo_full_name" >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "https://github.com/$repo_full_name.git"
  else
    git remote add origin "https://github.com/$repo_full_name.git"
  fi
  git push -u origin "$branch_name"
else
  gh repo create "$repo_name" --public --source=. --remote=origin --push
fi

if gh api "repos/$repo_full_name/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$repo_full_name/pages" --input - <<JSON
{"build_type":"legacy","source":{"branch":"$branch_name","path":"/"}}
JSON
else
  gh api -X POST "repos/$repo_full_name/pages" --input - <<JSON
{"build_type":"legacy","source":{"branch":"$branch_name","path":"/"}}
JSON
fi

echo "GitHub Pages requested for https://$owner.github.io/$repo_name/"
