# uncloud scaling guide

how to scale your deployment across multiple machines for high availability and
load balancing.

## single machine (default)

the basic deployment runs everything on one machine:

```bash
bun run deploy:local  # or bun run deploy
```

## multi-machine setup

### 1. add more machines

after your initial deployment, add machines to the cluster:

```bash
# add a second machine
uc machine add --name server-2 root@second-server-ip -i ~/.ssh/id_rsa

# add a third machine
uc machine add --name server-3 root@third-server-ip -i ~/.ssh/id_rsa
```

each machine joins the wireguard mesh network and can run containers.

### 2. list machines

```bash
uc machine ls
```

output:

```
NAME        STATE   ADDRESS         PUBLIC IP
server-1    Up      10.210.0.1/24   123.45.67.89
server-2    Up      10.210.1.1/24   123.45.67.90
server-3    Up      10.210.2.1/24   123.45.67.91
```

### 3. scale services

scale your services across the cluster:

```bash
# scale web app to 3 replicas (one per machine)
uc scale web=3

# scale zero sync to 2 replicas
uc scale zero=2
```

uncloud automatically:

- distributes replicas across machines
- load balances traffic via caddy
- handles service discovery

### 4. verify distribution

```bash
uc ps
```

shows which containers are running on which machines.

## scaling strategies

### high availability

run multiple replicas of each service:

```bash
# 3 web app instances across 3 machines
uc scale web=3

# 2 zero instances for redundancy
uc scale zero=2
```

### resource optimization

from your sst config, you're using:

- web: 4 vCPU, 8 GB RAM
- zero: 4 vCPU, 8 GB RAM

for uncloud, adjust machine sizes accordingly:

- small apps: 2 cpu, 4gb ram per machine
- medium apps: 4 cpu, 8gb ram per machine
- large apps: 8+ cpu, 16gb+ ram per machine

### database considerations

postgres should stay on one machine (primary). for HA:

1. use managed postgres (rds, supabase, neon)
2. or set up postgres replication manually
3. or use planetscale (managed mysql)

## auto-scaling

uncloud doesn't have built-in auto-scaling like ecs. for dynamic scaling:

1. monitor with prometheus/grafana
2. write scripts to call `uc scale` based on metrics
3. or use kubernetes if you need advanced auto-scaling

## cost comparison

### sst/aws ecs (from your config)

- web: 1-1 tasks (4 vCPU, 8 GB, spot)
- zero: 1-5 tasks (4 vCPU, 8 GB, spot)
- aurora postgres: 0-4 ACU
- nat gateway: ~$30/month
- load balancer: ~$20/month
- **estimate: $100-200/month**

### uncloud multi-machine

- 3x hetzner cpx41 (8 vCPU, 16 GB): 3 × $25 = $75/month
- managed postgres (neon/supabase): $25/month
- **estimate: $100/month**

### uncloud single machine

- 1x hetzner cpx31 (4 vCPU, 8 GB): $20/month
- self-hosted postgres: included
- **estimate: $20/month**

## production setup example

based on your sst config scaling (zero: min 1, max 5):

```bash
# initialize 3 machines
uc machine init root@server-1 -i ~/.ssh/id_rsa
uc machine add --name server-2 root@server-2 -i ~/.ssh/id_rsa
uc machine add --name server-3 root@server-3 -i ~/.ssh/id_rsa

# deploy
uc deploy -f docker-compose.yml -f docker-compose.deploy.yml

# scale for production
uc scale web=3    # 3 web instances (load balanced)
uc scale zero=2   # 2 zero instances (sticky sessions)

# verify
uc ls
uc ps
```

## monitoring

check service health:

```bash
# all services
uc ls

# detailed info
uc inspect web
uc inspect zero

# logs
uc logs web -f
uc logs zero -f
```

## rolling updates

uncloud does zero-downtime deployments:

```bash
# make changes, rebuild
bun run web build

# redeploy
uc deploy -f docker-compose.yml -f docker-compose.deploy.yml
```

uncloud:

1. starts new containers
2. waits for health checks
3. removes old containers
4. no downtime

## removing machines

```bash
# drain containers from machine first
uc scale web=2  # reduces from 3 to 2
uc scale zero=1 # reduces from 2 to 1

# wait for containers to stop on removed machine

# remove machine from cluster
uc machine rm server-3
```

## resources

- [uncloud docs](https://uncloud.run/docs)
- [sst config reference](../sst.config.ts) - your current aws setup
- [docker-compose.deploy.yml](../docker-compose.deploy.yml) - production config
