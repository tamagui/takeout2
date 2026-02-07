import type Stripe from 'stripe'

export interface PaymentError {
  code: string
  message: string
  httpStatus: number
  isRetryable: boolean
}

// card-specific error codes from stripe
const CARD_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined. Please try a different payment method.',
  expired_card: 'Your card has expired. Please use a different card.',
  incorrect_cvc: 'The CVC number is incorrect. Please check and try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  insufficient_funds: 'Your card has insufficient funds.',
  invalid_cvc: 'The CVC number is invalid.',
  invalid_expiry_month: 'The expiration month is invalid.',
  invalid_expiry_year: 'The expiration year is invalid.',
  invalid_number: 'The card number is invalid.',
  processing_error: 'An error occurred while processing your card. Please try again.',
  payment_method_invalid: 'This payment method is invalid. Please try another.',
}

// parse a stripe error into a user-friendly PaymentError
export function parseStripeError(error: unknown): PaymentError {
  if (!isStripeError(error)) {
    return {
      code: 'unknown_error',
      message: 'An unexpected error occurred. Please try again.',
      httpStatus: 500,
      isRetryable: true,
    }
  }

  const stripeError = error as Stripe.errors.StripeError

  // card errors get friendly messages
  if (stripeError.type === 'StripeCardError') {
    const code = stripeError.code ?? 'card_declined'
    return {
      code,
      message: CARD_ERROR_MESSAGES[code] ?? stripeError.message,
      httpStatus: 402,
      isRetryable: code === 'processing_error',
    }
  }

  // rate limiting
  if (stripeError.type === 'StripeRateLimitError') {
    return {
      code: 'rate_limit',
      message: 'Too many requests. Please try again in a moment.',
      httpStatus: 429,
      isRetryable: true,
    }
  }

  // authentication issues (bad API key)
  if (stripeError.type === 'StripeAuthenticationError') {
    return {
      code: 'auth_error',
      message: 'Payment service configuration error.',
      httpStatus: 500,
      isRetryable: false,
    }
  }

  return {
    code: stripeError.code ?? 'stripe_error',
    message: 'A payment error occurred. Please try again.',
    httpStatus: stripeError.statusCode ?? 500,
    isRetryable: true,
  }
}

function isStripeError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return false
  }
  const errorType = (error as Record<string, string>).type
  return typeof errorType === 'string' && errorType.startsWith('Stripe')
}
