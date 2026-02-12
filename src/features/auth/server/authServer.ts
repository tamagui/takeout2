import { expo } from '@better-auth/expo'
import { time } from '@take-out/helpers'
import { betterAuth } from 'better-auth'
import { admin, bearer, emailOTP, jwt, magicLink, phoneNumber } from 'better-auth/plugins'

import { DOMAIN } from '~/constants/app'
import { database } from '~/database/database'
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '~/server/env-server'

import { APP_SCHEME } from '../constants'
import { afterCreateUser } from './afterCreateUser'
import { storeOTP } from './lastOTP'

console.info(`[better-auth] server`, BETTER_AUTH_SECRET.slice(0, 3), BETTER_AUTH_URL)

export const authServer = betterAuth({
  // using BETTER_AUTH_URL instead of baseUrl

  database,

  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 30, // per minute per IP
    customRules: {
      // stricter limits on auth endpoints (better-auth paths)
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 3 },
      '/email-otp/send-verification-otp': { window: 60, max: 3 },
    },
  },

  // cloudflare IP header + cross-subdomain cookies for zero.tamagui.dev
  advanced: {
    ...(BETTER_AUTH_URL.includes(DOMAIN) && {
      crossSubDomainCookies: {
        enabled: true,
        domain: '.tamagui.dev',
      },
    }),
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
  },

  session: {
    freshAge: time.minute.days(2),
    storeSessionInDatabase: true,
  },

  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [
    // match dev, prod, tauri
    `https://${DOMAIN}`,
    `http://localhost:${process.env.VITE_PORT_WEB || '8081'}`,
    `http://host.docker.internal:${process.env.VITE_PORT_WEB || '8081'}`,
    `${APP_SCHEME}://`,
  ],

  databaseHooks: {
    user: {
      create: {
        async after(user) {
          // how we nicely move private user => public user for zero:
          await afterCreateUser(user)
        },
      },
    },
  },

  plugins: [
    // for use with react-native, tauri, etc
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

  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
})
