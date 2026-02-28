Commit all current changes and push to main. Follow these steps exactly:

1. Run `git status` to see all changed/untracked files. If there are no changes, stop and tell the user "Nothing to commit — working tree is clean."

2. Run `git diff` and `git diff --cached` to review staged and unstaged changes. Summarize what changed in 1-2 sentences.

3. Stage all relevant files with `git add` (specific files, not `git add .`). Skip any `.env`, credentials, or secret files — warn the user if any are detected.

4. Write a clear, concise commit message that describes the "why" not the "what". Use this format:
   ```
   git commit -m "$(cat <<'EOF'
   <commit message here>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

5. If the commit fails due to a pre-commit hook, fix the issue and create a NEW commit (never amend).

6. Run `git pull --rebase origin main` to sync with remote before pushing. If there are merge conflicts:
   - List the conflicting files
   - Stop and ask the user how to resolve them
   - Do NOT force push or auto-resolve

7. Push with `git push origin main`. If the push is rejected:
   - If "non-fast-forward": tell the user "Remote has new commits. Run pull --rebase first." and attempt the rebase.
   - If permission denied: tell the user "Push access denied — check your SSH key or token."
   - If any other error: show the full error output and ask the user how to proceed.

8. Run `git status` and `git log --oneline -1` to confirm success. Report the commit hash and message to the user.

IMPORTANT: Never use `--force`, `--no-verify`, or `--no-gpg-sign`. If something fails, diagnose and fix — don't bypass safety checks.
