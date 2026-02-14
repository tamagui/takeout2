#!/bin/bash

# takeout bootstrap script
# ensures your environment is ready for development

set -e

# colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # no color

info() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo ""
echo -e "${BOLD}takeout bootstrap${NC}"
echo ""

# get required bun version from package.json
get_required_bun_version() {
  if command -v node &> /dev/null; then
    node -e "console.log(require('./package.json').packageManager?.replace('bun@', '') || '')" 2>/dev/null
  elif command -v python3 &> /dev/null; then
    python3 -c "import json; pm=json.load(open('package.json')).get('packageManager',''); print(pm.replace('bun@','') if pm.startswith('bun@') else '')" 2>/dev/null
  else
    grep -o '"packageManager":[[:space:]]*"bun@[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' 2>/dev/null
  fi
}

# check bun
check_bun() {
  info "checking bun..."

  if ! command -v bun &> /dev/null; then
    error "bun is not installed"
    echo ""
    echo "  we recommend using bunv (version manager):"
    echo -e "    ${BOLD}curl -fsSL https://bunv.sh/install | bash${NC}"
    echo ""
    echo "  or install bun directly:"
    echo -e "    ${BOLD}curl -fsSL https://bun.sh/install | bash${NC}"
    echo ""

    read -p "  would you like help installing bunv? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo ""
      info "run this command to install bunv:"
      echo ""
      echo "    curl -fsSL https://bunv.sh/install | bash"
      echo ""
      echo "  then restart your terminal and run this script again"
    fi
    exit 1
  fi

  local current_version=$(bun --version)
  local required_version=$(get_required_bun_version)

  if [ -z "$required_version" ]; then
    warn "could not determine required bun version from package.json"
    success "bun installed (v$current_version)"
    return 0
  fi

  if [ "$current_version" != "$required_version" ]; then
    warn "bun version mismatch: have v$current_version, need v$required_version"
    echo ""

    if command -v bunv &> /dev/null; then
      echo -e "  bunv detected - run: ${BOLD}bunv install $required_version${NC}"
    else
      echo "  consider using bunv for version management:"
      echo -e "    ${BOLD}curl -fsSL https://bunv.sh/install | bash${NC}"
      echo ""
      echo "  or update bun directly:"
      echo -e "    ${BOLD}bun upgrade --version $required_version${NC}"
    fi
    echo ""
    exit 1
  fi

  success "bun v$current_version"
}

# check docker/orbstack
check_docker() {
  info "checking docker..."

  local has_orbstack=false
  local has_docker=false
  local container_runtime=""

  # check for orbstack
  if [ -d "/Applications/OrbStack.app" ] || command -v orbctl &> /dev/null; then
    has_orbstack=true
    container_runtime="orbstack"
  fi

  # check for docker
  if command -v docker &> /dev/null; then
    has_docker=true
    if [ -z "$container_runtime" ]; then
      container_runtime="docker"
    fi
  fi

  if ! $has_docker && ! $has_orbstack; then
    error "neither docker nor orbstack found"
    echo ""
    echo "  on macOS, we recommend orbstack (faster than docker desktop):"
    echo -e "    ${BOLD}brew install orbstack${NC}"
    echo "    or download from: https://orbstack.dev"
    echo ""
    echo "  alternatively, install docker desktop:"
    echo "    https://docs.docker.com/get-docker/"
    echo ""
    exit 1
  fi

  success "$container_runtime installed"

  # check if docker daemon is running
  info "checking if docker is running..."

  if ! docker info &> /dev/null 2>&1; then
    warn "docker daemon is not running"
    echo ""

    if $has_orbstack; then
      read -p "  would you like to open orbstack? [Y/n] " -n 1 -r
      echo ""
      if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        info "opening orbstack..."
        open -a OrbStack
        echo ""
        echo "  waiting for docker to start..."
        local max_wait=30
        local waited=0
        while ! docker info &> /dev/null 2>&1; do
          sleep 1
          waited=$((waited + 1))
          if [ $waited -ge $max_wait ]; then
            error "timed out waiting for docker"
            echo "  please ensure orbstack is running and try again"
            exit 1
          fi
        done
        success "docker is ready"
      else
        echo ""
        warn "you'll need a docker-compatible runtime to start the backend"
      fi
    elif [ -d "/Applications/Docker.app" ]; then
      read -p "  would you like to open docker desktop? [Y/n] " -n 1 -r
      echo ""
      if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        info "opening docker desktop..."
        open -a Docker
        echo ""
        echo "  waiting for docker to start (this may take a minute)..."
        local max_wait=60
        local waited=0
        while ! docker info &> /dev/null 2>&1; do
          sleep 1
          waited=$((waited + 1))
          if [ $waited -ge $max_wait ]; then
            error "timed out waiting for docker"
            echo "  please ensure docker desktop is running and try again"
            exit 1
          fi
        done
        success "docker is ready"
      else
        echo ""
        warn "you'll need a docker-compatible runtime to start the backend"
      fi
    else
      echo ""
      warn "you'll need a docker-compatible runtime to start the backend"
    fi
  else
    success "docker is running"
  fi
}

# run bun install
run_install() {
  echo ""
  read -p "run bun install? [Y/n] " -n 1 -r
  echo ""

  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    info "running bun install..."
    echo ""
    bun install
    echo ""
    success "dependencies installed"
  fi
}

# main
check_bun
check_docker
run_install

echo ""
echo -e "${GREEN}${BOLD}ready to go!${NC}"
echo ""
echo "  next steps:"
echo -e "    ${BOLD}bun onboard${NC}    - setup wizard"
echo -e "    ${BOLD}bun backend${NC}    - start docker services"
echo -e "    ${BOLD}bun dev${NC}        - start dev server"
echo ""
