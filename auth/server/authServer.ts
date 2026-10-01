import 'server-only'
import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { bearer, emailOTP } from 'better-auth/plugins'
import { trustedContrastAppOrigins } from 'contrast-better-auth'
import { APP_ANALYTICS_INSTALLATION_HEADER } from 'contrast-better-auth/analytics'
import { APP_SCHEME } from '~/constants'
import { server, ports } from '~/env'
import { afterCreateUser } from './afterCreateUser'
import { authDatabase } from './authDb'
import { beforeCreateUser } from './beforeCreateUser'
import { storeOTP } from './lastOTP'

export const authServer = betterAuth({
  baseURL: server.BETTER_AUTH_URL,
  basePath: '/api/auth',
  database: authDatabase,
  secret: server.BETTER_AUTH_SECRET,
  advanced: {
    cookiePrefix: APP_SCHEME,
    // behind Cloudflare the socket IP is always the edge, so better-auth can't
    // tell clients apart and falls back to one shared rate-limit bucket for
    // every request. trust Cloudflare's client IP header so deployed apps
    // bucket rate limits per visitor.
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip'],
    },
  },

  session: {
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 20 * 60,
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },

  trustedOrigins: trustedContrastAppOrigins([
    `http://localhost:${ports.web}`,
    `http://localhost:${ports.zero}`,
    `http://127.0.0.1:${ports.web}`,
    `${APP_SCHEME}://`,
    'http://localhost:5173',
  ]),

  databaseHooks: {
    user: {
      create: {
        before: beforeCreateUser,
        async after(user, context) {
          await afterCreateUser(
            user,
            context?.headers?.get(APP_ANALYTICS_INSTALLATION_HEADER) ?? null,
          )
        },
      },
    },
  },

  plugins: [
    // session-token auth only (web cookie + native bearer). no jwt() plugin:
    // Zero validates the session token via getSession, never a JWKS-verified jwt
    // (that fetch fails on the SSR loopback — see auth/server/getZeroAuthData.ts).
    bearer(),
    expo(),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // dev-only: print + store the OTP so the test-login path can
        // retrieve it without an email roundtrip. previously this
        // logged the OTP unconditionally — meaning a prod deployment
        // leaked every OTP code into server stdout AND the user got
        // no email since no transport is wired. wire a real transport
        // when deploying to prod.
        if (process.env.NODE_ENV === 'development') {
          console.info(`\n${'='.repeat(60)}`)
          console.info(`OTP CODE for ${email}: ${otp}`)
          console.info(`${'='.repeat(60)}\n`)
        } else {
          console.warn(
            `[auth/otp] sendVerificationOTP fired for ${email} but no email transport is wired — OTP not delivered. configure RESEND_API_KEY (or another provider) and wire the send here.`,
          )
        }
        storeOTP(email, otp)
      },
    }),
  ],

  logger: {
    level: 'warn',
  },
})
