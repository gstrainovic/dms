import { describe, it, expect } from 'vitest'
import { hashImage } from '../image-utils.js'

describe('hashImage', () => {
  it('berechnet SHA-256 Hash korrekt', async () => {
    const data = new TextEncoder().encode('test data').buffer
    const hash = await hashImage(data)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('gibt gleichen Hash für gleiche Daten', async () => {
    const data1 = new TextEncoder().encode('same').buffer
    const data2 = new TextEncoder().encode('same').buffer
    expect(await hashImage(data1)).toBe(await hashImage(data2))
  })

  it('gibt verschiedene Hashes für verschiedene Daten', async () => {
    const data1 = new TextEncoder().encode('data1').buffer
    const data2 = new TextEncoder().encode('data2').buffer
    expect(await hashImage(data1)).not.toBe(await hashImage(data2))
  })
})
