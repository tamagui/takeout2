export class AbortError extends Error {
  constructor(message = '') {
    super(message)
    this.name = 'AbortError'
  }
}

export class EnsureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnsureError'
  }
}
