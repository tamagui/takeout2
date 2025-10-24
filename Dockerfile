# we build web app outside docker and then just install here
# its generally faster and easier to debug

FROM node:22.4-slim

# for healthchecks and bun installation
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set CI environment variable to skip bootstrap during install
ENV CI=true

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY scripts/node-version-check.ts ./scripts/
COPY scripts/bootstrap.ts ./scripts/
COPY scripts/helpers/zero-get-version.ts ./scripts/helpers/
COPY src/start/package.json ./src/start/

RUN bun install --production --frozen-lockfile

COPY . .

EXPOSE 8081

CMD ["bun", "run", "web:serve"]
