---
description: Report an issue to the takeout2 repo with rich system context
---

Report an issue on the `tamagui/takeout2` GitHub repo based on the current conversation context.

## Steps

1. **Check for `gh` CLI**
   - Run `which gh` to check if GitHub CLI is installed
   - If not found, ask the user if they'd like to install it:
     - macOS: `brew install gh`
     - then `gh auth login` to authenticate
   - If they decline, provide the manual URL: https://github.com/tamagui/takeout2/issues/new

2. **Gather context from the conversation**
   - Identify the error, bug, or issue from recent conversation context
   - Summarize what went wrong and what was expected

3. **Gather system info** (run these in parallel):
   - `node -v` (node version)
   - `bun -v` (bun version)
   - `uname -sm` (os/arch)
   - `git log --oneline -1` (current commit)
   - `git branch --show-current` (current branch)
   - Check if docker is running: `docker info --format '{{.ServerVersion}}' 2>/dev/null || echo "not running"`
   - `cat package.json | jq -r '.version // "unknown"'` (project version)

4. **Build the issue body** with this structure:
   ```
   ## Description
   <clear summary of the issue>

   ## Steps to Reproduce
   <what was being done when it happened>

   ## Expected Behavior
   <what should have happened>

   ## Actual Behavior
   <what actually happened, include error messages>

   ## Environment
   - OS: <uname output>
   - Node: <version>
   - Bun: <version>
   - Commit: <git hash>
   - Branch: <branch>
   - Docker: <version or not running>
   - Project version: <version>

   ## Logs / Stack Trace
   <relevant error output, truncated if very long>
   ```

5. **Create the issue**
   - Ask the user to confirm the title and body before submitting
   - Use: `gh issue create --repo tamagui/takeout2 --title "<title>" --body "<body>"`
   - After creation, show the issue URL

Keep the title concise and the body well-formatted. Include only relevant logs (truncate to ~100 lines if needed).
