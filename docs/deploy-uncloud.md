---
name: deploy-uncloud
description: Uncloud deployment guide for self-hosted production setups. uncloud deployment, self-hosted, docker-compose, production setup, SSL certificates, HTTPS, zero-downtime deploys, rolling updates, scaling, multiple machines, Multipass VM, local deployment.
---

# uncloud deployment guide

comprehensive guide to deploying takeout to production using uncloud.

## what is uncloud?

uncloud is a lightweight container orchestration tool that bridges the gap
between docker and kubernetes. it lets you deploy and scale apps across multiple
machines with minimal overhead.

**key features:**

- zero-downtime deployments
- automatic load balancing across machines
- built-in service discovery and mesh networking
- no central control plane (peer-to-peer)
- docker compose compatible
- minimal resource footprint (~150mb ram per machine)

**note:** uncloud is in active development and not yet production-ready.
breaking changes may occur.

## single machine deployment

### prerequisites

1. uncloud cli installed:
   `curl -fsS https://get.uncloud.run/install.sh | sh`
2. digital ocean account (or any VM/dedicated provider)
3. domain name (optional - can use a free `yourapp.xxxxxx.uncld.dev` subdomain)
4. managed postgresql database with logical replication enabled

### quick start

1. **run onboarding:**

   ```bash
   bun onboard
   ```

   - choose "set up production deployment"
   - select "uncloud" platform
   - enter your app subdomain (e.g., `takeout` → `takeout.uncld.dev`)
   - configure database credentials
   - sync to github when prompted

2. **initial setup (first time only):**

   ```bash
   # get your droplet ip from digital ocean
   export DROPLET_IP=134.209.4.79

   # initialize uncloud on the machine
   uc machine init root@$DROPLET_IP
   ```

3. **deploy:**

   ```bash
   # local deployment
   bun tko uncloud deploy-prod

   # or push to main branch for ci/cd
   git push origin main
   ```

### what happens during deployment

1. **build phase:**
   - compiles migrations
   - builds web app for production
   - creates docker image (`takeout-web:latest`)

2. **deployment phase:**
   - establishes ssh connection to deployment host
   - initializes uncloud on server (if needed)
   - pushes docker image to cluster
   - processes docker-compose with production env
   - deploys stack with zero downtime
   - runs health checks

3. **verification:**
   - shows deployment status (`uc ls`)
   - tails recent logs
   - displays access urls

## multi-machine scaling

uncloud supports scaling across multiple machines with automatic load balancing.

### adding machines

```bash
# add second machine
uc machine add --name hetzner-1 root@5.223.45.199

# add third machine
uc machine add --name hetzner-2 root@88.198.12.34

# list all machines
uc machine ls
```

when you add a machine, uncloud automatically:

- installs docker and uncloudd daemon
- sets up wireguard mesh networking
- syncs cluster state
- makes it available for deployments

### scaling services

services automatically distribute across available machines. uncloud picks
machines based on resource availability.

to scale a service to multiple replicas:

```bash
uc scale web 3
```

this creates 3 instances distributed across your cluster with automatic load
balancing.

### configuration

for multi-machine setups, you can still use single `DEPLOY_HOST` - uncloud cli
connects to any machine in the cluster and can control all others through the
mesh network.

alternatively, update your deployment script to track multiple machines:

```typescript
// scripts/uncloud/deploy-prod.ts
const DEPLOY_HOSTS = process.env.DEPLOY_HOSTS?.split(',') || [
  process.env.DEPLOY_HOST,
]
```

## github actions ci/cd

### setup

onboarding automatically configures github actions. to manually sync:

```bash
# sync .env.production to github secrets
bun scripts/env/sync-to-github.ts
```

### required secrets

- `DEPLOY_HOST`: your droplet ip or primary machine ip
- `DEPLOY_SSH_KEY`: private ssh key with access to the machine
- `DEPLOY_USER`: ssh user (default: root)
- `ZERO_UPSTREAM_DB`: main postgres connection string
- `ZERO_CVR_DB`: zero cvr database connection string
- `ZERO_CHANGE_DB`: zero change database connection string

### workflow

when you push to main:

1. runs tests and builds
2. creates docker image
3. if `DEPLOY_HOST` configured, deploys to uncloud
4. shows deployment logs and status
5. runs health checks

to skip deployment on specific commits:

```bash
git commit -m "docs: update readme" --skip-ci
```

or push to non-main branch:

```bash
git push origin feature-branch
```

## database configuration

uncloud deployment uses externally managed databases (digital ocean, render,
supabase, etc.).

### required databases

you need 3 postgres databases on the same host:

- `defaultdb` (or your main db name) - main application data
- `zero_cvr` - zero cvr (client view records)
- `zero_cdb` - zero change database

### connection strings

format:

```
postgresql://user:password@host:port/dbname?sslmode=require
```

example:

```bash
ZERO_UPSTREAM_DB=postgresql://doadmin:pass@db-host.ondigitalocean.com:25060/defaultdb?sslmode=require
ZERO_CVR_DB=postgresql://doadmin:pass@db-host.ondigitalocean.com:25060/zero_cvr?sslmode=require
ZERO_CHANGE_DB=postgresql://doadmin:pass@db-host.ondigitalocean.com:25060/zero_cdb?sslmode=require
```

### logical replication

zero requires logical replication. on digital ocean managed postgres, this is
enabled by default. for other providers, ensure `wal_level = logical`.

## monitoring & debugging

### view logs

```bash
# single service
uc logs web              # view web service logs
uc logs web -f           # follow logs

# multiple services (0.15.0+)
uc logs web api          # multiple services at once
uc logs                  # all services

# machine targeting (0.15.0+)
uc logs web -m machine1  # logs from specific machine

# or via script
bun tko uncloud logs              # all services
bun tko uncloud logs web          # single service
bun tko uncloud logs web api -f   # multiple, follow
bun tko uncloud logs -m machine1  # specific machine
```

### service status

```bash
uc ls                    # list all services
uc ps                    # container status (0.15.0+)
uc machine ls            # machine status
```

### service management (0.15.0+)

```bash
uc start web             # start a service
uc stop web              # stop a service
uc start                 # start all services
uc stop                  # stop all services
```

### ssh access

```bash
ssh root@134.209.4.79

# then inside:
docker ps                # see running containers
docker logs container-id # view specific container logs
```

### health checks

```bash
bun tko uncloud check-deployment
```

checks:

- web service is running
- zero sync is accessible
- database connectivity
- storage is accessible

## ssl certificates

### default: let's encrypt (acme)

by default, caddy automatically obtains ssl certificates from let's encrypt.
this works well but has rate limits:

- **5 duplicate certificates** per exact domain set per 168 hours (7 days)
- redeploying frequently or resetting the cluster can hit these limits
- if rate limited, you'll see ssl handshake errors

**avoiding rate limits:**

1. don't reset the cluster unnecessarily (`uc machine init` with reset)
2. the deploy script now preserves existing clusters when possible
3. use cloudflare origin ca for frequently changing setups

### cloudflare origin ca (recommended for custom domains)

if using cloudflare for dns, origin ca certificates bypass rate limits entirely:

**benefits:**

- no rate limits (15 year validity)
- enable cloudflare proxy for ddos protection and caching
- faster ssl handshakes (cloudflare edge)

**setup:**

1. during onboarding, choose "use cloudflare origin ca" when configuring custom
   domains
2. or manually:

```bash
# generate certificate at cloudflare dashboard → ssl/tls → origin server
# save to certs/origin.pem and certs/origin.key

# add to .env.production
ORIGIN_CA_CERT=certs/origin.pem
ORIGIN_CA_KEY=certs/origin.key
```

3. in cloudflare dashboard:
   - enable proxy (orange cloud) for your domains
   - set ssl mode to "full (strict)"

4. for ci/cd, add the certs as base64-encoded github secrets:

```bash
# encode and add to github secrets
base64 -i certs/origin.pem | gh secret set ORIGIN_CA_CERT_B64
base64 -i certs/origin.key | gh secret set ORIGIN_CA_KEY_B64
```

the ci workflow will automatically decode these and use them during deploy.

**note:** origin ca certs only work when traffic goes through cloudflare proxy.
direct access to the server ip will show certificate errors.

### recovering from rate limits

if you've hit let's encrypt rate limits:

1. **wait 7 days** for the rate limit to reset, or
2. **switch to origin ca** (recommended), or
3. **use the uncld.dev fallback domain** (e.g., `web.abc123.uncld.dev`)

## common issues

### deployment fails: "uncloud cli not found"

install uncloud cli:

```bash
curl -fsS https://get.uncloud.run/install.sh | sh -s -- --version 0.15.0
```

### ssh+cli connection mode (0.15.0+)

if you use 1password, yubikey, or other ssh agents, use `ssh+cli://` mode:

```bash
# uses system openssh instead of built-in ssh
uc machine init ssh+cli://your-server.com

# this works if "ssh your-server.com" works
```

### ssh connection fails

ensure:

1. ssh key is added to droplet
2. `DEPLOY_SSH_KEY` points to correct key file
3. firewall allows ssh (port 22)

verify connection:

```bash
ssh -i ~/.ssh/id_rsa root@134.209.4.79
```

### services not accessible

check:

1. domain dns points to droplet ip
2. firewall allows http/https (ports 80/443)
3. services are running: `uc ls`

### database connection errors

verify:

1. connection strings are correct
2. database has logical replication enabled
3. databases exist (defaultdb, zero_cvr, zero_cdb)
4. firewall allows postgres connections

## file structure

```
scripts/uncloud/
├── deploy-prod.ts         # main deployment script
├── deploy-local.ts        # local multipass deployment
├── check-deployment.ts    # health checks
├── logs.ts                # view logs
├── cluster.ts             # encrypted cluster config management
└── helpers/
    ├── build.ts           # build functions
    ├── deploy.ts          # rollback, health checks, deploy lock
    ├── ssh.ts             # ssh utilities
    ├── uncloud.ts         # uncloud cli wrappers
    └── processEnv.ts      # env variable processing
```

## deployment commands

```bash
# full deployment
bun tko uncloud deploy-prod

# skip web build (faster redeploy)
bun tko uncloud deploy-prod --skip-build

# skip docker build (use existing image)
bun tko uncloud deploy-prod --skip-docker

# skip both (just redeploy)
bun tko uncloud deploy-prod --skip-build --skip-docker

# view logs
bun tko uncloud logs
bun tko uncloud logs -f    # follow

# check deployment health
bun tko uncloud check-deployment
```

## team collaboration

uncloud stores cluster config in `~/.config/uncloud`. to share with team:

```bash
# save and encrypt cluster config
export UNCLOUD_CLUSTER_PASSWORD=team-secret
bun tko uncloud cluster save

# team member loads config
export UNCLOUD_CLUSTER_PASSWORD=team-secret
bun tko uncloud cluster load

# now they can deploy/manage
uc ls
bun tko uncloud deploy-prod
```

## next steps

- add custom domain: configure dns to point to droplet ip
- enable https: uncloud includes caddy with automatic ssl
- add monitoring: integrate with datadog, new relic, etc.
- scale horizontally: add more machines with `uc machine add`
- backup database: set up automated backups
- set up staging environment: clone setup with different domain
