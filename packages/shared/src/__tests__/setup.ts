import { afterEach, beforeEach, vi } from 'vitest'

let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error')
})

afterEach(() => {
  const calls = consoleErrorSpy.mock.calls
  consoleErrorSpy.mockRestore()
  if (calls.length > 0) {
    const messages = calls.map(args => args.map(String).join(' ')).join('\n  ')
    throw new Error(`console.error wurde aufgerufen:\n  ${messages}`)
  }
})
