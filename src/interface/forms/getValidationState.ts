export type FormFieldValidation = 'valid' | 'checking' | 'idle' | { error: string }

type FieldState = {
  state: {
    meta: {
      isValidating: boolean
      errors: (string | undefined)[]
      isTouched: boolean
    }
  }
}

export function getValidationState(field: FieldState): FormFieldValidation {
  if (field.state.meta.isValidating) {
    return 'checking'
  }
  if (field.state.meta.errors.length > 0) {
    const firstError = field.state.meta.errors[0]
    return { error: firstError || 'Invalid' }
  }
  if (field.state.meta.isTouched) {
    return 'valid'
  }
  return 'idle'
}
