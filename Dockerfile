# we build web app outside docker and then just install here
# its generally faster and easier to debug

FROM node:22.4-slim

# for healthchecks, bun installation, and sharp dependencies
RUN apt-get update && apt-get install -y \
  curl \
  unzip \
  libvips-dev \
  libheif-dev \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock ./

RUN PRODUCTION=1 bun install --production --frozen-lockfile

COPY . .

RUN test -d dist || (echo "dist/ not found, did you build the app before building docker?" && exit 1)

EXPOSE 3533

CMD ["bun", "run", "web:serve"]
