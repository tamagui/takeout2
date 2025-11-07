# uncloud team access guide

how multiple team members work with the same uncloud cluster.

## how cluster state works

uncloud stores cluster state in **two places**:

1. **locally**: `~/.config/uncloud` on your machine (cluster config, ssh keys)
2. **distributed**: synchronized across all machines via corrosion (distributed
   sqlite)

when you run `uc machine init`, you create the cluster config locally and the
cluster state is synced across all machines.

## adding team members

### method 1: join existing cluster (recommended)

other team members connect to an existing machine in the cluster:

```bash
# team member runs on their machine
uc machine init root@existing-server-ip -i ~/.ssh/id_rsa
```

this:

- connects to the existing cluster
- syncs cluster state to their `~/.config/uncloud`
- gives them full cluster management access

### method 2: share cluster config

alternatively, share the cluster config directory:

```bash
# on your machine
tar -czf uncloud-cluster.tar.gz ~/.config/uncloud

# send to team member, they extract:
tar -xzf uncloud-cluster.tar.gz -C ~/
```

then they have the same cluster access as you.

## what team members can do

once connected to the cluster, **all team members can**:

- deploy services: `uc deploy`
- scale services: `uc scale web=3`
- view logs: `uc logs web`
- add/remove machines: `uc machine add`
- manage the entire cluster

**there's no built-in RBAC** - access is all-or-nothing based on ssh access.

## ssh access requirements

team members need:

- ssh access to **at least one** machine in the cluster
- their ssh public key added to the server

### adding team member ssh keys

on each server:

```bash
# add their public key
echo "ssh-rsa AAAAB3... user@host" >> ~/.ssh/authorized_keys

# or copy from their machine
ssh-copy-id -i ~/.ssh/id_rsa.pub root@server-ip
```

## example team workflow

### initial setup (team lead)

```bash
# initialize cluster
uc machine init root@server-1 -i ~/.ssh/id_rsa

# add more machines
uc machine add --name server-2 root@server-2-ip -i ~/.ssh/id_rsa

# deploy
uc deploy -f docker-compose.yml -f docker-compose.deploy.yml

# share server ips with team
```

### team member joins

```bash
# install uncloud cli
curl -fsS https://get.uncloud.run/install.sh | sh

# connect to existing cluster (using any server in cluster)
uc machine init root@server-1-ip -i ~/.ssh/id_rsa

# verify access
uc ls
uc machine ls

# now they can manage everything
uc scale web=3
uc logs web
```

## security considerations

⚠️ **important**: uncloud has no built-in access control beyond ssh

**good practices:**

- use ssh key authentication (not passwords)
- use jump hosts/bastion for production
- audit ssh access regularly
- use separate clusters for dev/staging/prod

**limitations:**

- no role-based permissions (admin vs viewer)
- no audit logs of who did what
- no fine-grained access control

for production with multiple team members, consider:

1. use a bastion host for ssh access
2. implement change management process
3. use infrastructure-as-code (docker-compose in git)
4. require pull requests for deployment changes

## environment variables for team

add to your team's `.bashrc` or `.zshrc`:

```bash
# shared cluster
export DEPLOY_HOST=your-server-ip
export DEPLOY_USER=root
export DEPLOY_SSH_KEY=~/.ssh/id_rsa
```

then everyone can use:

```bash
bun run deploy
```

## ci/cd with uncloud

for automated deployments, create a dedicated ssh key:

```bash
# generate deploy key (no passphrase for ci)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -N ""

# add to server
ssh-copy-id -i ~/.ssh/deploy_key.pub root@server-ip

# add to github actions secrets:
# DEPLOY_SSH_KEY: contents of deploy_key
# DEPLOY_HOST: server-ip
```

github action example:

```yaml
name: deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: install uncloud
        run: curl -fsS https://get.uncloud.run/install.sh | sh

      - name: setup ssh key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key

      - name: deploy
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_SSH_KEY: ~/.ssh/deploy_key
        run: |
          bun run web build
          bun run deploy
```

## comparing to other tools

### docker swarm

- has rbac (manager/worker nodes)
- has secrets management
- more team-friendly for production

### kubernetes

- extensive rbac
- service accounts
- namespaces for isolation
- audit logging

### uncloud

- simpler but less secure for teams
- best for: small teams with high trust
- use ssh-level security

## when to use uncloud for teams

✅ **good fit:**

- small teams (2-5 people)
- high trust environment
- simple deployments
- low security requirements

❌ **not ideal for:**

- large teams (>10 people)
- compliance requirements (soc2, hipaa)
- need for audit trails
- role-based access needed

## encrypted cluster config (recommended)

instead of manually sharing cluster state, use the encrypted config script:

### save cluster config

after deploying, save your cluster config:

```bash
# set password (store in 1password, bitwarden, etc)
export UNCLOUD_CLUSTER_PASSWORD=your-team-secret-password

# save encrypted config
bun run cluster:save
```

this creates `.uncloud-cluster.enc` which you can:

- commit to git (it's encrypted)
- or store in secure location and share link

### team members load config

```bash
# team member gets password from team vault
export UNCLOUD_CLUSTER_PASSWORD=your-team-secret-password

# load cluster config
bun run cluster:load

# verify access
uc ls
uc machine ls

# now they can deploy
bun run deploy
```

### adding to ci/cd

github actions example:

```yaml
- name: load cluster config
  env:
    UNCLOUD_CLUSTER_PASSWORD: ${{ secrets.UNCLOUD_CLUSTER_PASSWORD }}
  run: bun run cluster:load

- name: deploy
  run: bun run deploy
```

store `UNCLOUD_CLUSTER_PASSWORD` in github secrets.

## resources

- [deployment guide](./deployment.md)
- [scaling guide](./deployment-scaling.md)
- [uncloud docs](https://uncloud.run/docs)
