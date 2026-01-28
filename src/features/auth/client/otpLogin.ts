import { sleep } from '@take-out/helpers'

import { authClient } from './authClient'
import { standardizeBetterAuthError } from './passwordLogin'

type Result =
  | { success: true; error?: undefined }
  | {
      success: false
      error: { code: string; title: string; message: string }
    }

/**
 * Asks the server to send a login OTP code to the given email or phone number.
 */
export function validateLoginOtpCode(
  method: 'email' | 'phone',
  to: string,
  timeoutAfterMs = 8000
): Promise<Result> {
  return Promise.race([
    validateLoginOtpCodeInfinite(method, to),
    sleep(timeoutAfterMs).then(() => {
      return {
        error: {
          code: `TIMEOUT`,
          title: `Timed out`,
          message: `Timed out verifying OTP code.`,
        },
        success: false,
      } satisfies Result
    }),
  ])
}

async function validateLoginOtpCodeInfinite(
  method: 'email' | 'phone',
  to: string
): Promise<Result> {
  switch (method) {
    case 'email': {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: to,
        type: 'sign-in',
      })

      if (data?.success) {
        return { success: true }
      }

      const { code, message } = standardizeBetterAuthError(error)

      switch (code) {
        case 'INVALID_EMAIL':
          return {
            success: false,
            error: {
              code,
              title: 'Invalid Email',
              message: `The email address "${to}" is not valid. Please check and try again.`,
            },
          }

        case 'TOO_MANY_REQUESTS':
        case 'RATE_LIMIT_EXCEEDED':
          return {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              title: 'Too Many Attempts',
              message: 'Please wait a minute before trying again.',
            },
          }

        default:
          return {
            success: false,
            error: {
              code,
              title: 'An Error Occurred',
              message: `Failed to send OTP: "${message}" (${code}). Please try again.`,
            },
          }
      }
    }

    case 'phone': {
      const phoneNumber = to.startsWith('+') ? to : `+${to}`
      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      })

      if (!error) {
        return { success: true }
      }

      const { code, message } = standardizeBetterAuthError(error)

      switch (code) {
        case 'INVALID_COUNTRY':
          return {
            success: false,
            error: {
              code,
              title: 'Invalid Country Code',
              message: `The phone number "${to}" has an invalid country code. Please check and try again.`,
            },
          }

        case 'SMS_REGION_UNSUPPORTED':
          return {
            success: false,
            error: {
              code,
              title: 'Region Not Supported',
              message:
                "We're sorry, but SMS verification isn't available for phone numbers in this region. You can use another number or choose email login instead.",
            },
          }

        case 'TOO_SHORT':
        case 'INVALID_PHONE_NUMBER':
          return {
            success: false,
            error: {
              code,
              title: 'Invalid Phone Number',
              message:
                'The phone number you entered is invalid. Please check the number and try again.',
            },
          }

        case 'TOO_MANY_REQUESTS':
        case 'RATE_LIMIT_EXCEEDED':
          return {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              title: 'Too Many Attempts',
              message: 'Please wait a minute before trying again.',
            },
          }

        default:
          return {
            success: false,
            error: {
              code,
              title: 'An Error Occurred',
              message: `Failed to send OTP: "${message}" (${code}). Please try again.`,
            },
          }
      }
    }

    default: {
      return {
        success: false,
        error: {
          code: 'INVALID_METHOD',
          title: 'Invalid Method',
          message: `The method "${method}" is not supported.`,
        },
      }
    }
  }
}

/**
 * Login with an OTP code sent to the given email or phone number.
 */
export async function otpLogin(
  method: 'email' | 'phone',
  emailOrPhoneNumber: string,
  otp: string
): Promise<Result> {
  const { data, error } = await (() => {
    switch (method) {
      case 'email': {
        return authClient.signIn.emailOtp({
          email: emailOrPhoneNumber,
          otp,
        })
      }

      case 'phone': {
        // By default, the plugin creates a session for the user after verifying the phone number. We use this to log in the user.
        return authClient.phoneNumber.verify({
          phoneNumber: emailOrPhoneNumber.startsWith('+')
            ? emailOrPhoneNumber
            : `+${emailOrPhoneNumber}`,
          code: otp,
        })
      }

      default:
        return {
          data: null,
          error: { code: 'INVALID_METHOD', message: 'Invalid method' },
        }
    }
  })()

  if (!error) {
    return { success: true }
  }

  const { code, message } = standardizeBetterAuthError(error)

  switch (code) {
    case 'INVALID_OTP': {
      return {
        success: false,
        error: {
          code,
          title: 'Invalid OTP',
          message: `The OTP you entered is invalid. Please check the code and try again.`,
        },
      }
    }

    case 'OTP_EXPIRED': {
      return {
        success: false,

        error: {
          code,
          title: 'OTP Expired',
          message: `Your OTP has expired. Please request a new one.`,
        },
      }
    }

    case 'TOO_MANY_REQUESTS':
    case 'RATE_LIMIT_EXCEEDED': {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          title: 'Too Many Attempts',
          message: 'Please wait a minute before trying again.',
        },
      }
    }

    default: {
      return {
        success: false,

        error: {
          code,
          title: 'An Error Occurred',
          message: `Failed to log in: "${message}" (${code}). Please try again.`,
        },
      }
    }
  }
}
