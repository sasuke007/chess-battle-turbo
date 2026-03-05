#!/bin/bash
# Vercel Ignored Build Step
# Checks if E2E tests passed for this commit before allowing deployment.
# Exit 1 = proceed with build, Exit 0 = skip build
#
# Required Vercel env vars: GITHUB_TOKEN (PAT with repo read access)
# Provided by Vercel: VERCEL_GIT_COMMIT_SHA, VERCEL_GIT_REPO_OWNER, VERCEL_GIT_REPO_SLUG

RESPONSE=$(curl -sf \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG/commits/$VERCEL_GIT_COMMIT_SHA/check-runs?check_name=e2e")

if echo "$RESPONSE" | grep -q '"conclusion":"success"'; then
  echo "E2E tests passed — proceeding with build"
  exit 1
fi

echo "E2E tests have not passed — skipping build"
exit 0
