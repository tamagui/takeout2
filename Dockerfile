# multi-stage build: install deps in isolated stage, copy to slim runtime

FROM oven/bun:1.3.9 AS bun-base

FROM node:24-slim AS prod-deps

# copy bun from official image (avoids flaky curl install)
COPY --from=bun-base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=bun-base /usr/local/bin/bunx /usr/local/bin/bunx

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY patches ./patches

# skip postinstall during docker build (it's dev-only setup)
RUN bun install --ignore-scripts

# rebuild native modules for linux
RUN bun rebuild oxc-parser 2>/dev/null || true

FROM node:24-slim AS runtime

RUN apt-get update && apt-get install -y \
  curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=bun-base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=bun-base /usr/local/bin/bunx /usr/local/bin/bunx

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .

RUN test -d dist || (echo "dist/ not found, did you build the app before building docker?" && exit 1)

EXPOSE 8081

CMD ["bun", "one", "serve", "--port", "8081"]
