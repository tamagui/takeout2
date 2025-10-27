import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { emailHarmony, phoneHarmony } from 'better-auth-harmony'
import { admin, bearer, jwt, magicLink, emailOTP, phoneNumber } from 'better-auth/plugins'
import { database } from '~/database/database'
import { time } from '@vxrn/helpers'
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '~/server/env-server'
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
        console.info('Magic link email would be sent to:', email, 'with URL:', url)
        // TODO: Implement email sending
      },
    }),

    admin(),

    // avoid spam or duplicate emails and phone numbers
    // https://github.com/gekorm/better-auth-harmony
    emailHarmony(),
    phoneHarmony(),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // TODO: Create sendOTPEmail function
        console.info('Sending OTP email to', email, 'with code', otp, 'for', type)
        // sendOTPEmail(email, { type, otp })
      },
    }),

    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // TODO: Create sendOTPSMS function
        console.info('Sending OTP SMS to', phoneNumber, 'with code', code)
        // await sendOTPSMS(phoneNumber, { otp: code })
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          // Initial email for phone-only users
          return `${phoneNumber}@phone.local`
        },
        getTempName: (phoneNumber) => {
          // Initial name for the user
          return ''
        },
      },
    }),
  ],

  socialProviders: {
    // Uncomment and configure when you have GitHub OAuth credentials
    // github: {
    //   enabled: true,
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
    // Uncomment and configure when you have Linear OAuth credentials
    // linear: {
    //   enabled: true,
    //   clientId: process.env.LINEAR_OAUTH_CLIENT_ID!,
    //   clientSecret: process.env.LINEAR_OAUTH_SECRET!,
    // },
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
