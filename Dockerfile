# we build web app outside docker and then just install here
# its generally faster and easier to debug

FROM node:24-slim

# for healthchecks and bun installation
RUN apt-get update && apt-get install -y \
  curl \
  unzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy package.json first to extract bun version
COPY package.json bun.lock vite.config.ts ./

# install bun version from packageManager field in package.json
RUN BUN_VERSION=$(grep -o '"packageManager": *"bun@[^"]*"' package.json | grep -o '[0-9][0-9.]*') \
  && curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
ENV PATH="/root/.bun/bin:${PATH}"
COPY packages ./packages

# skip postinstall during docker build (it's dev-only setup)
# BUN BUG just started happening: https://github.com/oven-sh/bun/issues/19088
# RUN bun install --production --frozen-lockfile --ignore-scripts
RUN bun install --ignore-scripts

COPY . .

RUN test -d dist || (echo "dist/ not found, did you build the app before building docker?" && exit 1)

EXPOSE 8081

CMD ["bun", "one", "serve", "--port", "8081"]
