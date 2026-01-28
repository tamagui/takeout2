import { authClient } from './authClient'

type Result =
  | { success: true; error?: undefined }
  | {
      success: false
      error: { code: string; title: string; message: string }
    }

/**
 * Login with password.
 */
export async function passwordLogin(
  type: 'email' | 'phone',
  emailOrPhoneNumber: string,
  password: string
): Promise<Result> {
  const { data, error } = await (() => {
    switch (type) {
      case 'email': {
        return authClient.signIn.email({
          email: emailOrPhoneNumber,
          password,
        })
      }

      case 'phone': {
        return {
          data: null,
          error: {
            code: 'INVALID_METHOD',
            message: 'Password login with phone number is not supported',
          },
        }
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
    case 'INVALID_EMAIL_OR_PASSWORD':
      return {
        success: false,
        error: {
          code,
          title: 'Incorrect Password',
          message: 'The password you entered is incorrect. Please try again.',
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

export function standardizeBetterAuthError(error: unknown) {
  let code = 'UNKNOWN'
  let message = 'Unknown error'

  if (error && typeof error === 'object') {
    const errorCode = Reflect.get(error, 'code')
    if (errorCode && typeof errorCode === 'string') {
      code = errorCode
    }

    const errorMessage = Reflect.get(error, 'message')
    if (errorMessage && typeof errorMessage === 'string') {
      message = errorMessage
    }
  }

  return { code, message }
}
