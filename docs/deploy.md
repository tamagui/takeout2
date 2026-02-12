---
name: deploy
description: Deployment infrastructure overview and platform setup. deploy, deployment, production, CI/CD, continuous integration, DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, uncloud, SST, docker, containers, infrastructure, environment variables, GitHub Actions, or zero-downtime deploys.
---

# deployment infrastructure summary

complete overview of the e2e deployment system built for takeout.

## what was built

### 1. environment management system

**package.json env section**

```json
{
  "env": {
    "DEPLOYMENT_PLATFORM": "uncloud",
    "DEPLOY_HOST": true,
    "DEPLOY_USER": "root",
    "DEPLOY_SSH_KEY": true
    // ... all other env vars
  }
}
```

**auto-sync workflow**

- `bun env:update` syncs to `.github/workflows/*.yml`
- `bun env:update` syncs to `src/server/env-server.ts`
- keeps everything in sync automatically

**github secrets sync**

- `bun scripts/env/sync-to-github.ts` - interactive sync tool
- reads only `.env.production` (not .env or .env.local)
- compares against existing GitHub secrets
- shows new vs already-synced variables
- interactive multi-select picker (new vars pre-selected)
- masks sensitive values

flags:
- `--dry-run` - preview what would sync
- `--new` - only sync new variables (skip interactive)
- `--all` - sync all without prompts
- `-y` / `--yes` - sync all without prompts

### 2. deployment platform abstraction

**auto-detection** (scripts/ops/release.ts)

```typescript
async function detectDeploymentPlatform(): Promise<'sst' | 'uncloud'> {
  // 1. check DEPLOYMENT_PLATFORM env var (works in CI and local)
  // 2. check .env.production file (local fallback)
  // 3. default to uncloud (safer - no cloudflare api needed)
}
```

**platform-specific deployment**

- `deployUncloud()` - runs when DEPLOYMENT_PLATFORM=uncloud
- `deploySST()` - runs when DEPLOYMENT_PLATFORM=sst
- gracefully skips if vars missing

### 3. uncloud deployment

**modular helpers** (scripts/uncloud/helpers/deploy.ts)

- `checkUncloudConfigured()` - validate env vars
- `installUncloudCLI()` - auto-install if missing
- `setupSSHKey()` - create ssh key from env var
- `runDeployment()` - execute deployment
- `showDeploymentStatus()` - display service status
- `runHealthCheck()` - verify deployment health
- `tailLogs()` - show recent logs
- `showDeploymentInfo()` - display access urls

**deployment flow**

1. validates env vars (DEPLOY_HOST, ZERO_UPSTREAM_DB)
2. installs uncloud cli if needed
3. sets up ssh key from secret
4. builds migrations
5. builds web app
6. builds docker image (arm64)
7. connects to deployment host
8. pushes image to cluster
9. deploys stack
10. runs health checks
11. shows logs and access info

### 4. interactive onboarding

**production setup wizard** (packages/takeout/src/commands/onboard.ts)

```bash
bun onboard
```

**uncloud flow:**

1. choose deployment platform (uncloud or sst)
2. enter domain (yourapp.uncloud.run or custom)
3. configure database (postgres with logical replication)
4. generate auth secrets
5. save to `.env.production`
6. run `bun env:update` automatically
7. offer to sync to github secrets
8. show next steps with scaling instructions

**sst flow:**

1. cleans up uncloud vars when switching
2. runs aws env setup
3. syncs to github
4. shows deployment guide

### 5. platform switching

**uncloud → sst**

- clears DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY
- sets DEPLOYMENT_PLATFORM=sst
- runs env:update
- syncs to github

**sst → uncloud**

- clears sst-specific vars
- sets DEPLOYMENT_PLATFORM=uncloud
- configures deploy vars
- runs env:update
- syncs to github

### 6. ci/cd integration

**github actions workflow** (.github/workflows/ci.yml)

- runs on every push
- full test suite
- builds web app
- creates docker image
- on main branch: attempts deployment if configured
- gracefully skips deployment if secrets missing

**environment variables**

- auto-generated section between `# 🔒 start` and `# 🔒 end`
- managed by `bun env:update`
- never edit manually

### 7. documentation

**guides created:**

- `docs/deployment-uncloud.md` - comprehensive uncloud guide
  - single machine setup
  - multi-machine scaling
  - database configuration
  - monitoring & debugging
  - common issues

**inline help:**

- onboarding shows scaling commands
- ops/ci shows missing config instructions
- all scripts have helpful error messages

## user journey

### new template user

1. **clone and setup**

   ```bash
   git clone <repo>
   cd takeout2
   bun install
   bun onboard
   ```

2. **development (immediate)**

   ```bash
   bun dev    # works immediately after onboarding
   ```

3. **production (when ready)**
   - onboarding already configured everything
   - github secrets already synced
   - just push to deploy:
   ```bash
   git push origin main
   ```

### switching platforms

**from uncloud to sst**

```bash
bun onboard
# → choose "production setup"
# → choose "sst"
# → automatically cleans up uncloud vars
# → syncs to github
```

**from sst to uncloud**

```bash
bun onboard
# → choose "production setup"
# → choose "uncloud"
# → configures deploy vars
# → syncs to github
```

## scaling architecture

### single machine (current)

```
DEPLOY_HOST=134.209.4.79    # single droplet
```

### multi-machine (future)

```bash
# on deployment machine
uc machine add --name hetzner-1 root@5.223.45.199
uc machine add --name hetzner-2 root@88.198.12.34

# scale service
uc scale web 3    # 3 replicas across cluster

# still use single DEPLOY_HOST
# uncloud cli connects to any machine, controls all
```

### load balancing

- uncloud automatically distributes services
- caddy reverse proxy on each machine
- automatic service discovery via dns
- wireguard mesh network for inter-machine communication

## key files modified

```
package.json                                  # env section
.github/workflows/ci.yml                      # auto-generated env vars
src/server/env-server.ts                      # auto-generated validation
scripts/ops/release.ts                             # deployment orchestration
scripts/uncloud/helpers/deploy.ts             # uncloud-specific logic
scripts/env/sync-to-github.ts                 # github secrets sync (NEW)
scripts/uncloud/deploy-prod.ts                # load from env vars
scripts/uncloud/helpers/build.ts              # arm64 platform
packages/takeout/src/commands/onboard.ts      # env:update + github sync
docs/deployment-uncloud.md                    # comprehensive guide (NEW)
```

## environment variable flow

```
.env.production (local file)
    ↓
package.json (env section)
    ↓ (bun env:update)
    ├→ .github/workflows/ci.yml (auto-generated)
    └→ src/server/env-server.ts (auto-generated)
    ↓ (bun scripts/env/sync-to-github.ts)
github secrets
    ↓
github actions environment
    ↓
scripts/ops/release.ts
    ↓
scripts/uncloud/deploy-prod.ts
    ↓
uncloud cluster deployment
```

## future improvements

- support multiple DEPLOY_HOSTS for multi-machine clusters
- automated database backups before deployment
- blue-green deployments
- canary deployments
- prometheus metrics
- automated ssl cert management
- custom domain configuration in onboarding
