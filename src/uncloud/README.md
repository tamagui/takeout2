# uncloud deployment

all uncloud-related files in one place.

https://uncloud.run/

we have two setups for production in this repo: SST and uncloud. SST is a bit
more tested and robust as it sets up AWS services, but it requires a lot more
initial work to get set up and costs more to run.

uncloud is a new utility that makes deploying to your own dedicated servers and
other cloud providers as simple as a `docker-compose.yml` file with no need to
set up separate docker container pipelines or even have a "master" server that
coordinates deploys.

## structure

```
src/uncloud/
├── docker-compose.yml          # single compose file (local + production)
├── deploy.ts                   # deployment script
├── cluster-config.ts           # encrypted cluster sharing
├── deployment.md               # usage guide
├── deployment-scaling.md       # multi-machine scaling
└── deployment-team-access.md   # team collaboration
```

## why one compose file?

**docker-compose.yml** works for both local and production:

**local (`--no-dns --no-caddy`):**

- no ingress/caddy (services use internal IPs)
- no ports exposed (access via ssh port forwarding)
- services communicate via uncloud mesh network

**production (with dns + caddy):**

- would use `x-ports` for https ingress
- caddy handles let's encrypt automatically
- public domains work

## usage

```bash
# local deployment
bun run deploy:local

# production deployment
export DEPLOY_HOST=your-server-ip
bun run deploy

# cluster sharing
bun run cluster:save
bun run cluster:load
```

## how it works

the deployment script:

1. detects local vs production (`--local` flag)
2. for local: adds `--no-dns --no-caddy` to init
3. uses same compose file for both
4. differences handled at runtime (port forwarding, etc)
