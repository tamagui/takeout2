export interface DemoUserCredentials {
  email: string
  name: string
  password: string
}

export interface DemoSignInResult {
  error: {
    message?: string
  } | null
}

export interface DemoUserSignInOptions<Result extends DemoSignInResult> {
  credentials: DemoUserCredentials | (() => DemoUserCredentials)
  errorMessage?: string
  onSignedIn?(result: Result): void | Promise<void>
  signInEmail(
    credentials: Pick<DemoUserCredentials, 'email' | 'password'>,
  ): Promise<Result>
  signUpEmail(credentials: DemoUserCredentials): Promise<unknown>
}

export type DemoUserSignInOutcome = { ok: true } | { error: string }

export function createDemoUserSignIn<Result extends DemoSignInResult>(
  options: DemoUserSignInOptions<Result>,
) {
  let inFlight: Promise<DemoUserSignInOutcome> | undefined

  return function signInAsDemo(): Promise<DemoUserSignInOutcome> {
    if (inFlight) return inFlight

    const request = (async (): Promise<DemoUserSignInOutcome> => {
      try {
        const credentials =
          typeof options.credentials === 'function'
            ? options.credentials()
            : options.credentials

        await options.signUpEmail(credentials)
        const result = await options.signInEmail({
          email: credentials.email,
          password: credentials.password,
        })

        if (result.error) {
          return {
            error: result.error.message ?? options.errorMessage ?? 'demo login failed',
          }
        }

        await options.onSignedIn?.(result)
        return { ok: true }
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : (options.errorMessage ?? 'demo login failed'),
        }
      }
    })().finally(() => {
      inFlight = undefined
    })

    inFlight = request
    return request
  }
}
