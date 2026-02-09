import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../retry.js'

describe('withRetry', () => {
  it('gibt Ergebnis bei Erfolg sofort zurück', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('wirft sofort bei nicht-retry-fähigen Fehlern', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('unknown error'))
    await expect(withRetry(fn)).rejects.toThrow('unknown error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('wiederholt bei Rate-Limit-Fehlern', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('429 rate limit'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, { baseDelay: 10 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('wirft nach maxRetries Versuchen', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('429 rate limit'))
    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow('429 rate limit')
    expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('verwendet custom retryOn', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('custom'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, {
      baseDelay: 10,
      retryOn: (e) => e instanceof Error && e.message === 'custom',
    })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
