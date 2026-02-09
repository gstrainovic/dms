export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  retryOn?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryOn: (error: unknown) => {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      return msg.includes('rate limit') || msg.includes('429') || msg.includes('503')
    }
    return false
  },
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === opts.maxRetries || !opts.retryOn(error)) {
        throw error
      }
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelay,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
