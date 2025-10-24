import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { admin, bearer, jwt, magicLink } from 'better-auth/plugins'
import { database } from '~/database/database'
import { sendMagicLinkEmail } from '~/features/email/actions/sendMagicLinkEmail'
import { time } from '@vxrn/helpers'
import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  LINEAR_OAUTH_CLIENT_ID,
  LINEAR_OAUTH_SECRET,
  ONECHAT_GITHUB_CLIENT_ID,
  ONECHAT_GITHUB_CLIENT_SECRET,
} from '~/server/env-server'
import { APP_SCHEME } from '../constants'
import { afterCreateUser } from './afterCreateUser'

console.info(`[better-auth] server`, BETTER_AUTH_SECRET.slice(0, 3), BETTER_AUTH_URL)

export const authServer = betterAuth({
  // using BETTER_AUTH_URL instead of baseUrl

  database,

  session: {
    freshAge: time.minute.days(2),
    storeSessionInDatabase: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    // matches webApp.url in sst.config
    'https://start.chat',
    'http://localhost:8081',
    `${APP_SCHEME}://`,
  ],

  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await afterCreateUser(user)
        },
      },
    },
  },

  plugins: [
    jwt({
      jwt: {
        expirationTime: '3y',
      },

      jwks: {
        // compat with zero
        keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' },
      },
    }),

    bearer(),

    // To support better-auth/client in React Native
    expo(),

    magicLink({
      sendMagicLink: async ({ email, url }) => {
        sendMagicLinkEmail(email, { link: url })
      },
    }),

    admin(),

    // avoid spam or duplicate emails
    // https://github.com/gekorm/better-auth-harmony
    emailHarmony(),
  ],

  socialProviders: {
    github: {
      enabled: true,
      clientId: ONECHAT_GITHUB_CLIENT_ID,
      clientSecret: ONECHAT_GITHUB_CLIENT_SECRET,
    },
    linear: {
      enabled: true,
      clientId: LINEAR_OAUTH_CLIENT_ID,
      clientSecret: LINEAR_OAUTH_SECRET,
    },
  },

  logger: {
    level: 'debug',
    log(level, message, ...args) {
      console.info(level, message, ...args)
    },
  },

  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
})
