# deployment with uncloud

deploy your stack locally (multipass) or to production servers.

## quick start - local

test deployment locally with multipass:

```bash
# build app
bun run web build

# deploy to local vm
bun run deploy:local
```

your app will be running at http://localhost:8262

## quick start - production

deploy to a real server:

```bash
# set server details
export DEPLOY_HOST=your-server-ip
export DEPLOY_USER=root  # optional, defaults to root
export DEPLOY_SSH_KEY=~/.ssh/id_rsa  # optional

# build app
bun run web build

# deploy to production
bun run deploy
```

your app will be running at http://your-server-ip:8262

## what it does

1. creates ubuntu vm with multipass (4 cpu, 4gb ram, 20gb disk)
2. installs docker on the vm
3. installs uncloud on the vm
4. deploys your full stack (web, zero, postgres, minio)
5. forwards ports to localhost:8262

## stack

the deployment uses:

- `docker-compose.yml` - base services (postgres, zero, minio)
- `docker-compose.deploy.yml` - production overrides + web service

services deployed:

- **web** (localhost:8262) - your app
- **zero** (localhost:4848) - sync server
- **pgdb** - postgres with pgvector
- **minio** - s3-compatible storage

## networking

uncloud creates a wireguard mesh network so services can talk to each other by
name:

- `web:8262` - web app
- `pgdb:5432` - postgres
- `zero:4848` - zero sync
- `minio:9000` - storage

no need for `host.docker.internal` or manual port mapping.

## commands

### local deployment

```bash
# deploy to local vm
bun run web build
bun run deploy:local

# check status
uc ls

# view logs
uc logs web
uc logs web -f        # follow logs

# ssh to vm
multipass shell takeout-deploy

# clean up
bun run deploy:clean
```

### production deployment

```bash
# set env vars
export DEPLOY_HOST=123.45.67.89
export DEPLOY_USER=root
export DEPLOY_SSH_KEY=~/.ssh/id_rsa

# deploy
bun run web build
bun run deploy

# check status
uc ls

# view logs
uc logs web
uc logs web -f        # follow logs

# ssh to server
ssh root@123.45.67.89
```

## redeploy after changes

### local

```bash
# make your changes...

# rebuild and redeploy
bun run web build
bun run deploy:local
```

### production

```bash
# make your changes...

# rebuild and redeploy
bun run web build
bun run deploy
```

uncloud does zero-downtime deployments automatically.

## prerequisites

```bash
# install multipass
brew install multipass

# install uncloud cli
curl -fsS https://get.uncloud.run/install.sh | sh
```

## troubleshooting

### port already in use

kill any port forwards:

```bash
pkill -f "ssh.*takeout-deploy.*8262"
```

then run `bun run deploy` again.

### can't access localhost:8262

check services are running:

```bash
uc ls
```

check logs:

```bash
uc logs web
```

### vm issues

delete and recreate:

```bash
bun run deploy:clean
bun run deploy
```

## architecture

```
┌─────────────────────────────────────┐
│ multipass vm (ubuntu)               │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ uncloud (wireguard mesh)     │  │
│  ├──────────────────────────────┤  │
│  │                               │  │
│  │  ┌────────┐  ┌────────────┐  │  │
│  │  │ caddy  │──│ web:8262   │  │  │
│  │  │ (http) │  │            │  │  │
│  │  └────────┘  └────────────┘  │  │
│  │                               │  │
│  │  ┌────────┐  ┌────────────┐  │  │
│  │  │ zero   │──│ pgdb:5432  │  │  │
│  │  │ :4848  │  │ (postgres) │  │  │
│  │  └────────┘  └────────────┘  │  │
│  │                               │  │
│  │  ┌────────┐                  │  │
│  │  │ minio  │                  │  │
│  │  │ :9000  │                  │  │
│  │  └────────┘                  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
└──────────────┬──────────────────────┘
               │
               │ ssh port forward
               │
        ┌──────▼──────┐
        │ localhost   │
        │ :8262       │
        │ :4848       │
        └─────────────┘
```

## production setup

### 1. get a server

any vps or dedicated server works:

- [hetzner](https://hetzner.com) - $5+/month
- [digitalocean](https://digitalocean.com) - $6+/month
- [linode](https://linode.com) - $5+/month
- [vultr](https://vultr.com) - $6+/month

requirements:

- ubuntu 22.04 or later
- 2gb+ ram recommended
- ssh access

### 2. set environment variables

```bash
export DEPLOY_HOST=your-server-ip
export DEPLOY_USER=root  # or ubuntu
export DEPLOY_SSH_KEY=~/.ssh/id_rsa
```

add to your `.bashrc` or `.zshrc` to make permanent.

### 3. deploy

```bash
bun run web build
bun run deploy
```

### 4. custom domain (optional)

point your domain's A record to your server ip:

```
A    @    123.45.67.89
```

uncloud handles https automatically via let's encrypt.

## team access

for managing clusters with multiple team members, see
[team access guide](./deployment-team-access.md).

## resources

- [uncloud docs](https://uncloud.run/docs)
- [multipass docs](https://multipass.run/docs)
- [team access guide](./deployment-team-access.md)
- [scaling guide](./deployment-scaling.md)
