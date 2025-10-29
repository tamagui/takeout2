import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { emailHarmony, phoneHarmony } from 'better-auth-harmony'
import { admin, bearer, jwt, magicLink, emailOTP, phoneNumber } from 'better-auth/plugins'
import { database } from '~/database/database'
import { time } from '@vxrn/helpers'
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '~/server/env-server'
import { APP_SCHEME } from '../constants'
import { afterCreateUser } from './afterCreateUser'
import { storeOTP } from './lastOTP'

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
      },
    }),

    admin(),

    // avoid spam or duplicate emails and phone numbers
    // https://github.com/gekorm/better-auth-harmony
    emailHarmony(),
    phoneHarmony(),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.info(`\n${'='.repeat(60)}`)
        console.info(`📧 OTP CODE for ${email}: ${otp}`)
        console.info(`${'='.repeat(60)}\n`)

        // Store in dev for testing
        storeOTP(email, otp)
      },
    }),

    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        console.info('Sending OTP SMS to', phoneNumber, 'with code', code)
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
