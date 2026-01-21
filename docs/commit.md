---
name: commit
description: Git commit guidelines. commit, create commits, commit message, commit style, commit conventions, commit format, committing changes, make commit, git commit, lowercase messages, one-line commits. Never add yourself as contributor, keep messages lowercase and one-line.
---

# git commit

guidelines for creating git commits in this project. use this when the user asks
you to commit changes.

## rules

- NEVER commit without explicit user permission
- NEVER add yourself as a co-contributor or co-author
- keep commit messages one-line and lowercase
- don't add commit as a final step in your todo list unless asked

## format

```
<type>: <description>
```

types: fix, feat, refactor, docs, test, chore

## examples

good:

- `fix: handle null user in profile query`
- `feat: add dark mode toggle to settings`
- `refactor: extract auth logic to separate hook`

bad:

- `Fixed the bug` (capitalized, vague)
- `Add new feature for users` (capitalized, vague)
- `WIP` (not descriptive)

## workflow

1. check `git status` to see what changed
2. check `git diff` to review changes
3. stage relevant files with `git add`
4. commit with a concise message
5. do NOT push unless explicitly asked

## what not to commit

- `.env` files with secrets
- `node_modules/`
- build artifacts
- credentials or api keys
