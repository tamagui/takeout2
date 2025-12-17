# we build web app outside docker and then just install here
# its generally faster and easier to debug

FROM node:24-slim

# for healthchecks and bun installation
RUN apt-get update && apt-get install -y \
  curl \
  unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.23"
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# copy package files
COPY package.json bun.lock vite.config.ts ./
COPY packages ./packages

# skip postinstall during docker build (it's dev-only setup)
RUN bun install --production --frozen-lockfile --ignore-scripts

COPY . .

RUN test -d dist || (echo "dist/ not found, did you build the app before building docker?" && exit 1)

EXPOSE 8081

CMD ["bun", "one", "serve", "--port", "8081"]
