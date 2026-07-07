export class ApiClientError extends Error {
  readonly errors: Record<string, string> | undefined

  constructor(message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'ApiClientError'
    this.errors = errors
    // Preserve instanceof checks when transpiling to older targets
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
