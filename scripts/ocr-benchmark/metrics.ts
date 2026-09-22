/**
 * Messgrössen für den OCR-Vergleich. Alle arbeiten auf normalisiertem Text, damit Markdown-Formatierung
 * (Tabellen, Fettdruck, Überschriften) und typografische Varianten nicht als Fehler zählen.
 */

/** Text ohne Markdown und HTML, einheitliche Apostrophe, Striche und Leerzeichen */
export function normalize(text: string): string {
  return text
    .replace(/^```\w*\s*$/gm, ' ')                   // Codeblock-Zäune um die ganze Ausgabe
    .replace(/\\([\\`*_{}[\]()#+\-.!|$])/g, '$1')    // Markdown-Escapes (\_ \* \|)
    .replace(/\$?\\quad\$?|\$/g, ' ')                // LaTeX-Abstände für Unterschriftszeilen
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')          // Bild-Links der OCR-Ausgabe
    .replace(/<[^>]+>/g, ' ')                       // HTML-Tags (<br>, <table> ...)
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, ' ') // Trennzeilen von Tabellen
    .replace(/[-_=*]{3,}/g, ' ')                     // Trenn- und Unterschriftslinien
    .replace(/[|#*_`>]/g, ' ')
    .replace(/[’‘ʼ´`]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Zeichenfehlerrate: Editierdistanz zwischen Ausgabe und Referenz, geteilt durch die Länge der Referenz */
export function cer(reference: string, output: string): number {
  const ref = normalize(reference)
  return levenshtein(ref, normalize(output)) / Math.max(1, ref.length)
}

/**
 * Vergleichsform für Felder: ohne Tausender-Punkte, Apostrophe und Leerzeichen. Die Punkte zuerst entfernen,
 * solange die Leerzeichen noch trennen, sonst verschmilzt «180.88.125 | 32» zu einer einzigen Zahl.
 */
function compact(text: string): string {
  return normalize(text).replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1').replace(/[\s']/g, '').toLowerCase()
}

/** Anteil der erwarteten Felder (Beträge, Daten, IBAN, Nummern), die in der Ausgabe vorkommen */
export function fieldRecall(output: string, fields: string[]): { recall: number, missing: string[] } {
  const haystack = compact(output)
  const missing = fields.filter(f => !haystack.includes(compact(f)))
  return { recall: fields.length ? (fields.length - missing.length) / fields.length : 1, missing }
}

function words(text: string): string[] {
  return normalize(text).toLowerCase().split(' ').map(w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).filter(Boolean)
}

/** Erfundener Text: Anteil der Wörter der Ausgabe, die (in dieser Anzahl) nicht in der Referenz stehen */
export function inventedWordRate(reference: string, output: string): number {
  const available = new Map<string, number>()
  for (const w of words(reference)) available.set(w, (available.get(w) ?? 0) + 1)
  const out = words(output)
  let invented = 0
  for (const w of out) {
    const left = available.get(w) ?? 0
    if (left > 0) available.set(w, left - 1)
    else invented++
  }
  return out.length ? invented / out.length : 0
}
