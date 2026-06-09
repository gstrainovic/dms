import { describe, it, expect } from 'vitest'
import { uint8ToBase64, toDataUrl } from '../encoding.js'

// --- Fixture-Generatoren ---

/** Erzeugt ein valides PNG mit mindestens `minBytes` Größe.
 *  Nutzt tEXt-Chunks (ancillary, safe-to-copy) um die Datei aufzublasen. */
function makeRealisticPng(minBytes: number): Uint8Array {
  // Minimaler 1x1 weißer PNG-Header + IHDR + IDAT
  const header = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d,                           // IHDR length = 13
    0x49, 0x48, 0x44, 0x52,                           // "IHDR"
    0x00, 0x00, 0x00, 0x01,                           // width = 1
    0x00, 0x00, 0x00, 0x01,                           // height = 1
    0x08, 0x02,                                       // bit depth 8, color type 2 (RGB)
    0x00, 0x00, 0x00,                                 // compression, filter, interlace
    0x90, 0x77, 0x53, 0xde,                           // CRC
    0x00, 0x00, 0x00, 0x0c,                           // IDAT length = 12
    0x49, 0x44, 0x41, 0x54,                           // "IDAT"
    0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,        // deflated pixel data
    0x00, 0x02, 0x00, 0x01,                           // ...
    0xe2, 0x21, 0xbc, 0x33,                           // CRC
  ])
  const iend = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, // length = 0
    0x49, 0x45, 0x4e, 0x44, // "IEND"
    0xae, 0x42, 0x60, 0x82, // CRC
  ])

  // Auffüllen mit tEXt-Chunks bis minBytes erreicht
  const chunks: Uint8Array[] = [header]
  let currentSize = header.length + iend.length

  while (currentSize < minBytes) {
    // tEXt-Chunk: keyword\0text
    const keyword = new TextEncoder().encode('Comment\0')
    const fillSize = Math.min(4096, minBytes - currentSize)
    const text = new Uint8Array(fillSize)
    crypto.getRandomValues(text)
    // ASCII-druckbar machen (PNG tEXt Chunk erwartet Latin-1)
    for (let j = 0; j < text.length; j++) text[j] = 0x41 + (text[j] % 26)

    const chunkData = new Uint8Array(keyword.length + text.length)
    chunkData.set(keyword)
    chunkData.set(text, keyword.length)

    // Chunk: length(4) + type(4) + data + CRC(4)
    const chunkLen = chunkData.length
    const chunk = new Uint8Array(4 + 4 + chunkLen + 4)
    const view = new DataView(chunk.buffer)
    view.setUint32(0, chunkLen)
    chunk.set(new TextEncoder().encode('tEXt'), 4)
    chunk.set(chunkData, 8)
    // Einfacher CRC-Platzhalter (PNG-Decoder prüft tEXt CRCs oft nicht streng)
    view.setUint32(8 + chunkLen, 0x00000000)

    chunks.push(chunk)
    currentSize += chunk.length
  }

  chunks.push(iend)

  // Zusammenfügen
  const result = new Uint8Array(currentSize)
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  return result
}

/** Erzeugt ein valides PDF mit mindestens `minBytes` Größe.
 *  Enthält eine Seite mit Text-Content. */
function makeRealisticPdf(minBytes: number): Uint8Array {
  // Genug Textinhalt generieren
  const filler = 'Dies ist ein OCR-Testdokument. Rechnung Nr. 2024-001. Betrag: 150,00 EUR. '
  let textContent = ''
  while (new TextEncoder().encode(textContent).length < minBytes) {
    textContent += filler
  }

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${textContent.length + 44} >>
stream
BT
/F1 12 Tf
72 720 Td
(${textContent}) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
${String(300 + textContent.length).padStart(10, '0')} 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + textContent.length}
%%EOF`

  return new TextEncoder().encode(pdf)
}

/** Zufällige Bytes einer bestimmten Größe */
function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size)
  // crypto.getRandomValues hat ein Limit von 65536 Bytes pro Aufruf
  for (let i = 0; i < size; i += 65536) {
    crypto.getRandomValues(bytes.subarray(i, Math.min(i + 65536, size)))
  }
  return bytes
}

// --- Referenz: Buggy-Implementierung mit chunkSize 32768 ---

function buggyBase64(bytes: Uint8Array): string {
  let result = ''
  const chunkSize = 32768 // NICHT durch 3 teilbar!
  for (let i = 0; i < bytes.length; i += chunkSize) {
    result += btoa(String.fromCharCode(...bytes.subarray(i, i + chunkSize)))
  }
  return result
}

// --- Tests ---

describe('uint8ToBase64', () => {
  it('encodiert leere Bytes', () => {
    const result = uint8ToBase64(new Uint8Array(0))
    expect(result).toBe('')
  })

  it('encodiert kleine Daten korrekt (< 1 Chunk)', () => {
    const input = new TextEncoder().encode('Hallo Welt')
    const result = uint8ToBase64(input)
    expect(atob(result)).toBe('Hallo Welt')
  })

  it('Round-Trip: encode → decode ergibt Original (klein)', () => {
    const input = randomBytes(100)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('Round-Trip: encode → decode ergibt Original (> 32 KB, Multi-Chunk)', () => {
    const input = randomBytes(50_000)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('Round-Trip: encode → decode ergibt Original (genau 32766 Bytes = 1 voller Chunk)', () => {
    const input = randomBytes(32766)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('Round-Trip: encode → decode ergibt Original (32767 Bytes = Chunk-Grenze + 1)', () => {
    const input = randomBytes(32767)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('Round-Trip: 100 KB — realistische Bildgröße', () => {
    const input = randomBytes(100_000)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('Round-Trip: 1 MB — großes Dokument', () => {
    const input = randomBytes(1_000_000)
    const base64 = uint8ToBase64(input)
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(input)
  })

  it('enthält kein Padding (=) in der Mitte des Strings', () => {
    const input = randomBytes(100_000)
    const base64 = uint8ToBase64(input)
    // Padding darf nur am Ende stehen (letzte 1-2 Zeichen)
    const withoutTrailing = base64.replace(/=+$/, '')
    expect(withoutTrailing).not.toContain('=')
  })

  it('buggy chunkSize 32768 erzeugt Padding in der Mitte (Regression-Beweis)', () => {
    const input = randomBytes(50_000)
    const broken = buggyBase64(input)
    const withoutTrailing = broken.replace(/=+$/, '')
    // Dieser Test beweist, dass die alte Implementierung kaputt war
    expect(withoutTrailing).toContain('=')
  })
})

describe('toDataUrl', () => {
  it('erzeugt korrekte Data-URL für PNG', () => {
    const png = makeRealisticPng(50_000)
    const url = toDataUrl(png, 'image/png')
    expect(url).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/)
  })

  it('erzeugt korrekte Data-URL für JPEG', () => {
    const data = randomBytes(80_000)
    const url = toDataUrl(data, 'image/jpeg')
    expect(url).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/)
  })

  it('erzeugt korrekte Data-URL für PDF', () => {
    const pdf = makeRealisticPdf(60_000)
    const url = toDataUrl(pdf, 'application/pdf')
    expect(url).toMatch(/^data:application\/pdf;base64,[A-Za-z0-9+/]+=*$/)
  })

  it('Data-URL für großes PNG (200 KB) ist decodierbar', () => {
    const png = makeRealisticPng(200_000)
    const url = toDataUrl(png, 'image/png')

    // Prefix abtrennen und Base64 decodieren
    const base64 = url.replace('data:image/png;base64,', '')
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(png)
  })

  it('Data-URL für großes PDF (500 KB) ist decodierbar', { timeout: 15000 }, () => {
    const pdf = makeRealisticPdf(500_000)
    const url = toDataUrl(pdf, 'application/pdf')

    const base64 = url.replace('data:application/pdf;base64,', '')
    const decoded = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(pdf)
  })
})

describe('Realistische Fixtures', () => {
  it('makeRealisticPng erzeugt valide PNG-Signatur', () => {
    const png = makeRealisticPng(50_000)
    // PNG Magic Bytes
    expect(png[0]).toBe(0x89)
    expect(png[1]).toBe(0x50) // P
    expect(png[2]).toBe(0x4e) // N
    expect(png[3]).toBe(0x47) // G
    expect(png.length).toBeGreaterThanOrEqual(50_000)
  })

  it('makeRealisticPng erzeugt verschiedene Größen', () => {
    const small = makeRealisticPng(40_000)
    const large = makeRealisticPng(200_000)
    expect(small.length).toBeGreaterThanOrEqual(40_000)
    expect(large.length).toBeGreaterThanOrEqual(200_000)
  })

  it('makeRealisticPdf erzeugt valide PDF-Signatur', () => {
    const pdf = makeRealisticPdf(50_000)
    const header = new TextDecoder().decode(pdf.subarray(0, 8))
    expect(header).toContain('%PDF-1.4')
    expect(pdf.length).toBeGreaterThanOrEqual(50_000)
  })

  it('makeRealisticPdf enthält deutschen Text', () => {
    const pdf = makeRealisticPdf(50_000)
    const content = new TextDecoder().decode(pdf)
    expect(content).toContain('Rechnung')
    expect(content).toContain('EUR')
  })
})
