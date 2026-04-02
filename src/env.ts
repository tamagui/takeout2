import { createEnv } from '@take-out/env'

const { env, ports, portOffset, run } = createEnv({
  ports: {
    web: 8081,
    zero: 4848,
    postgres: 5433,
    minio: 9200,
  },

  base: {
    BETTER_AUTH_SECRET: 'asjdbafbiasdjsadjasahjYVGHSVHFB',
    ONECHAT_GITHUB_CLIENT_ID: 'Iv23liNaYfNSauaySodL',
    VITE_DEMO_MODE: '1',
    ZERO_APP_ID: 'takeout',
    ZERO_APP_PUBLICATIONS: 'zero_takeout',
    ZERO_MUTATE_FORWARD_COOKIES: 'true',
    ZERO_QUERY_FORWARD_COOKIES: 'true',
  },

  development: ({ ports, portOffset }) => ({
    VITE_PROTOCOL: 'http',
    VITE_PORT_WEB: String(ports.web),
    VITE_PORT_ZERO: String(ports.zero),
    VITE_PORT_POSTGRES: String(ports.postgres),
    VITE_PORT_MINIO: String(ports.minio),

    VITE_WEB_HOSTNAME: `localhost:${ports.web}`,
    VITE_ZERO_HOSTNAME: `localhost:${ports.zero}`,

    BETTER_AUTH_URL: `http://localhost:${ports.web}`,
    ONE_SERVER_URL: `http://localhost:${ports.web}`,

    COMPOSE_PROJECT_NAME: portOffset ? `takeout-${portOffset}` : 'takeout',

    ZERO_UPSTREAM_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/postgres`,
    ZERO_CVR_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/zero_cvr`,
    ZERO_CHANGE_DB: `postgresql://user:password@127.0.0.1:${ports.postgres}/zero_cdb`,
    ZERO_MUTATE_URL: `http://127.0.0.1:${ports.web}/api/zero/push`,
    ZERO_QUERY_URL: `http://127.0.0.1:${ports.web}/api/zero/pull`,

    CLOUDFLARE_R2_ENDPOINT: `http://127.0.0.1:${ports.minio}`,
    CLOUDFLARE_R2_PUBLIC_URL: `http://127.0.0.1:${ports.minio}`,
    CLOUDFLARE_R2_ACCESS_KEY: 'minio',
    CLOUDFLARE_R2_SECRET_KEY: 'minio_password',

    ALLOW_MISSING_ENV: '1',
    ONE_DISABLE_STRICT_MODE: '1',
  }),

  production: {
    VITE_PROTOCOL: 'https',
    VITE_PORT_WEB: '',
    VITE_PORT_ZERO: '',
    VITE_PORT_POSTGRES: '',
    VITE_PORT_MINIO: '',
    VITE_WEB_HOSTNAME: '',
    VITE_ZERO_HOSTNAME: '',
    BETTER_AUTH_URL: '',
    ONE_SERVER_URL: '',
    ZERO_UPSTREAM_DB: '',
    ZERO_CVR_DB: '',
    ZERO_CHANGE_DB: '',
    ZERO_MUTATE_URL: '',
    ZERO_QUERY_URL: '',
    CLOUDFLARE_R2_ENDPOINT: '',
    CLOUDFLARE_R2_PUBLIC_URL: '',
    CLOUDFLARE_R2_ACCESS_KEY: '',
    CLOUDFLARE_R2_SECRET_KEY: '',
    ALLOW_MISSING_ENV: '',
    ONE_DISABLE_STRICT_MODE: '',
  },
})

export { env as ENV, ports, portOffset }
if (import.meta.main) run()
