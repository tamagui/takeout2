import { type Expected, createEnv, expected } from '@take-out/env'

const result = createEnv({
  ports: {
    minio: 9200,
    postgres: 5433,
    web: 8081,
    zero: 4848,
  },

  base: {
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    BETTER_AUTH_SECRET: expected,
    BETTER_AUTH_URL: expected,
    CLOUDFLARE_R2_ACCESS_KEY: expected,
    CLOUDFLARE_R2_ENDPOINT: expected,
    CLOUDFLARE_R2_PUBLIC_URL: expected,
    CLOUDFLARE_R2_SECRET_KEY: expected,
    ONE_SERVER_URL: expected,
    ONECHAT_GITHUB_CLIENT_ID: 'Iv23liNaYfNSauaySodL',
    VITE_DEMO_MODE: '1',
    ZERO_APP_ID: 'takeout',
    ZERO_APP_PUBLICATIONS: 'zero_takeout',
    ZERO_MUTATE_FORWARD_COOKIES: 'true',
    ZERO_QUERY_FORWARD_COOKIES: 'true',
  },

  development: ({ ports, portOffset }) => ({
    ALLOW_MISSING_ENV: '1',
    BETTER_AUTH_SECRET: 'asjdbafbiasdjsadjasahjYVGHSVHFB',
    BETTER_AUTH_URL: `http://localhost:${ports.web}`,
    CLOUDFLARE_R2_ACCESS_KEY: 'minio',
    CLOUDFLARE_R2_ENDPOINT: `http://127.0.0.1:${ports.minio}`,
    CLOUDFLARE_R2_PUBLIC_URL: `http://127.0.0.1:${ports.minio}`,
    CLOUDFLARE_R2_SECRET_KEY: 'minio_password',
    COMPOSE_PROJECT_NAME: portOffset ? `takeout-${portOffset}` : 'takeout',
    ONE_SERVER_URL: `http://localhost:${ports.web}`,
    VITE_PORT_MINIO: String(ports.minio),
    VITE_PORT_POSTGRES: String(ports.postgres),
    VITE_PORT_WEB: String(ports.web),
    VITE_PORT_ZERO: String(ports.zero),
    VITE_PROTOCOL: 'http',
    VITE_WEB_HOSTNAME: `localhost:${ports.web}`,
    VITE_ZERO_HOSTNAME: `localhost:${ports.zero}`,
    ZERO_CHANGE_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/zero_cdb`,
    ZERO_CVR_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/zero_cvr`,
    ZERO_MUTATE_URL: `http://127.0.0.1:${ports.web}/api/zero/push`,
    ZERO_QUERY_URL: `http://127.0.0.1:${ports.web}/api/zero/pull`,
    ZERO_UPSTREAM_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/postgres`,
  }),

  production: {
    ALLOW_MISSING_ENV: '',
    VITE_PORT_MINIO: '',
    VITE_PORT_POSTGRES: '',
    VITE_PORT_WEB: '',
    VITE_PORT_ZERO: '',
    VITE_PROTOCOL: 'https',
    VITE_WEB_HOSTNAME: expected,
    VITE_ZERO_HOSTNAME: expected,
    ZERO_CHANGE_DB: expected,
    ZERO_CVR_DB: expected,
    ZERO_MUTATE_URL: '',
    ZERO_QUERY_URL: '',
    ZERO_UPSTREAM_DB: expected,
  },
})

// complete env var registry for CI/docker sync
// `expected` = required at runtime (no default), string = optional/has default
// env-update reads this to sync CI yml, docker yml, .env
export const envVars: Record<string, string | Expected> = {
  // app vars (from createEnv config above)
  ...result.config.base,
  ...result.config.production,

  // vars not in createEnv but needed in CI/docker
  APNS_ENDPOINT: 'https://api.sandbox.push.apple.com',
  APNS_KEY: '',
  APNS_KEY_ID: '',
  APNS_TEAM_ID: '',
  DEPLOY_DB: '',
  DEPLOY_HOST: '',
  DEPLOY_SSH_KEY: '',
  DEPLOY_USER: 'root',
  DEPLOYMENT_ARCH: 'linux/amd64',
  DEPLOYMENT_PLATFORM: 'uncloud',
  POSTMARK_SERVER_TOKEN: expected,
  VITE_POSTHOG_API_KEY: '',
  VITE_POSTHOG_HOST: '',
  ZERO_CVR_MAX_CONNS: '4',
  ZERO_NUM_SYNC_WORKERS: '2',
  ZERO_PER_USER_MUTATION_LIMIT_MAX: '30',
  ZERO_PER_USER_MUTATION_LIMIT_WINDOW_MS: '60000',
  ZERO_UPSTREAM_MAX_CONNS: '8',
}

// dep-resolved vars: key = env var name, value = package name
// env-update resolves the version from package.json dependencies
export const envDeps: Record<string, string> = {
  ZERO_VERSION: '@rocicorp/zero',
}

export const envConfig = result.config
export const { server, ports, portOffset } = result
if (import.meta.main) result.run()
