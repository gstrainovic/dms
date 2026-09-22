import { assertEquals } from 'jsr:@std/assert@1'
import { withRateLimitRetry } from './ai-proxy.ts'

function rateLimited(retryAfter = '60') {
  return new Response('{"message":"Zu viele Anfragen."}', { status: 429, headers: { 'Retry-After': retryAfter } })
}

Deno.test('wiederholt nach 429 und wartet so lange, wie Retry-After sagt', async () => {
  const waits: number[] = []
  const answers = [rateLimited('7'), rateLimited('3'), new Response('{}', { status: 200 })]
  const res = await withRateLimitRetry(async () => answers.shift()!, { sleep: async ms => { waits.push(ms) } })
  assertEquals(res.status, 200)
  assertEquals(waits, [7000, 3000])
})

Deno.test('gibt nach den erlaubten Versuchen das 429 zurück', async () => {
  let calls = 0
  const res = await withRateLimitRetry(async () => { calls++; return rateLimited() }, { retries: 2, sleep: async () => {} })
  assertEquals(res.status, 429)
  assertEquals(calls, 3)
})

Deno.test('wartet ohne Retry-After 60 Sekunden und nie länger', async () => {
  const waits: number[] = []
  const answers = [new Response('', { status: 429 }), rateLimited('600'), new Response('{}')]
  await withRateLimitRetry(async () => answers.shift()!, { sleep: async ms => { waits.push(ms) } })
  assertEquals(waits, [60_000, 60_000])
})

Deno.test('lässt andere Fehler sofort durch', async () => {
  let calls = 0
  const res = await withRateLimitRetry(async () => { calls++; return new Response('', { status: 402 }) }, { sleep: async () => {} })
  assertEquals(res.status, 402)
  assertEquals(calls, 1)
})
