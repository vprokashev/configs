/**
 * Anthropic API batch translator
 * https://docs.anthropic.com/en/api/getting-started
 */
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { type LocaleKeys, locales } from './src/i18n/locales'
import en from './translates/en.json'

const apiKey ='xxx'
const apiUrl = 'https://api.anthropic.com/v1/messages'
// Haiku max output = 4096 tokens ≈ ~16000 output chars.
// 5 langs × ~1.3 expansion = 6.5× English chars. Target 400 EN chars → ~2600 output chars → safe.
const TARGET_EN_CHARS = 400

function calcBatchSize(items: { value: string }[], startIndex: number): number {
  let chars = 0
  let count = 0
  for (let i = startIndex; i < items.length; i++) {
    if (count > 0 && chars + items[i].value.length > TARGET_EN_CHARS) break
    chars += items[i].value.length
    count++
  }
  return Math.max(1, count)
}

type LocalesWithoutEn = Exclude<LocaleKeys, 'en'>
const localesWithoutEn: LocalesWithoutEn[] = locales.filter((l) => l !== 'en') as LocalesWithoutEn[]

type Locale = { [k: string]: string | Locale }
type RootLocale = { [p in LocalesWithoutEn]: Locale }

interface TranslationItem {
  key: string
  english: string
}

interface TranslationResult {
  key: string
  german: string
  french: string
  spanish: string
  brazilian: string
  russian: string
}

function isRootLocale(locale: unknown): asserts locale is RootLocale {
  const condition =
    typeof locale === 'object' &&
    locale &&
    Object.keys(locale).length === localesWithoutEn.length &&
    Object.keys(locale).every((lKey) => localesWithoutEn.some((l2Key) => l2Key === lKey))

  if (!condition) {
    throw new Error('Invalid root locale structure')
  }
}

async function getRootLocale(): Promise<RootLocale> {
  const files = await Promise.all(
    localesWithoutEn.map((code) => fs.readFile(`./translates/${code}.json`, 'utf-8')),
  )
  const parsed = localesWithoutEn.reduce<Partial<RootLocale>>((acc, code, index) => {
    acc[code] = JSON.parse(files[index])
    return acc
  }, {})

  isRootLocale(parsed)
  return parsed
}

async function saveRootLocale(rootLocale: RootLocale) {
  await Promise.all(
    Object.entries(rootLocale).map(([code, locale]) => {
      const filePath = path.join('./translates', `${code}.json`)
      const json = JSON.stringify(locale, null, 2) + '\n'
      return fs.writeFile(filePath, json, 'utf-8')
    }),
  )
}

function getBySegments(s: string[], locale: Locale): string | Locale | null {
  return s.reduce((acc: string | Locale | null, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key]
    }
    return null
  }, locale)
}

function setBySegments(s: string[], value: string, locale: Locale): void {
  let obj: Locale = locale
  for (let i = 0; i < s.length - 1; i++) {
    const key = s[i]
    if (!(key in obj) || typeof obj[key] !== 'object') {
      obj[key] = {}
    }
    obj = obj[key] as Locale
  }
  obj[s[s.length - 1]] = value
}

function* walkJson(obj: Locale | string, segments: string[] = []): Generator<[string[], string]> {
  if (typeof obj === 'string') {
    yield [segments, obj]
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      yield* walkJson(value, [...segments, key])
    }
  }
}

async function translateBatch(items: TranslationItem[]): Promise<TranslationResult[]> {
  const task =
    'Translate each item in the JSON array from English into German, French, Spanish, Brazilian Portuguese, and Russian.\n' +
    "Do not change currency signs or currency formatting.\n" +
    'Respond with ONLY a raw JSON array — no markdown, no code blocks, no explanation.\n' +
    'Each object must have these exact fields: "key", "german", "french", "spanish", "brazilian", "russian".'

  const requestBody = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    system: 'You are a professional translator. Respond with raw JSON only, no markdown.',
    messages: [
      {
        role: 'user',
        content: task + '\n\n' + JSON.stringify(items, null, 2),
      },
      // Pre-fill assistant response to force raw JSON
      {
        role: 'assistant',
        content: '[',
      },
    ],
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const parsed = JSON.parse(errorText) as { error?: { message?: string } }
    const msg = parsed?.error?.message ?? errorText
    throw new Error(`API ${response.status}: ${msg}`)
  }

  const json = (await response.json()) as { content?: { text?: string }[]; stop_reason?: string }

  if (json.stop_reason === 'max_tokens') {
    throw new Error('TRUNCATED')
  }

  const responseText = '[' + (json.content?.[0]?.text ?? '')

  try {
    const results = JSON.parse(responseText.trim()) as TranslationResult[]
    return results
  } catch {
    console.error('[translateBatch] Raw response:', responseText.slice(0, 300))
    throw new Error('Failed to parse JSON from AI response')
  }
}

;(async function main() {
  console.log('[main] Starting translation process...')
  const rootLocale = await getRootLocale()
  console.log('[main] Loaded existing translations')

  // Collect all untranslated entries
  const untranslated: { path: string[]; value: string }[] = []
  let skippedCount = 0

  for (const [segments, value] of walkJson(en)) {
    // Skip empty strings — decorative alts, optional fields, etc.
    if (!value) continue

    const someoneDontHave = localesWithoutEn.some((code) => !getBySegments(segments, rootLocale[code]))
    if (someoneDontHave) {
      untranslated.push({ path: segments, value })
    } else {
      skippedCount++
    }
  }

  console.log(`[main] To translate: ${untranslated.length}, already done: ${skippedCount}`)

  let translatedCount = 0
  let errorCount = 0

  // Process in batches sized by estimated token count
  let batchNum = 0
  for (let i = 0; i < untranslated.length; ) {
    const size = calcBatchSize(untranslated, i)
    const batch = untranslated.slice(i, i + size)
    batchNum++
    const totalBatches = '?'

    console.log(`\n[main] Batch ${batchNum}/${totalBatches} (${batch.length} items)`)
    batch.forEach(({ path: p }) => console.log(`  - ${p.join('.')}`))

    const applyResults = (results: TranslationResult[]) => {
      for (const result of results) {
        const segments = result.key.split('.')
        setBySegments(segments, result.brazilian, rootLocale['br'])
        setBySegments(segments, result.german, rootLocale['de'])
        setBySegments(segments, result.spanish, rootLocale['es'])
        setBySegments(segments, result.french, rootLocale['fr'])
        setBySegments(segments, result.russian, rootLocale['ru'])
        translatedCount++
      }
    }

    // Recursively splits in half on truncation — avoids one-by-one retries
    async function translateWithFallback(items: TranslationItem[]): Promise<void> {
      try {
        const results = await translateBatch(items)
        applyResults(results)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (msg === 'TRUNCATED' && items.length > 1) {
          const mid = Math.ceil(items.length / 2)
          console.warn(`[main] ⚠ Truncated (${items.length} items) — splitting into ${mid}+${items.length - mid}`)
          await translateWithFallback(items.slice(0, mid))
          await translateWithFallback(items.slice(mid))
        } else if (msg === 'TRUNCATED') {
          console.error(`[main] ✗ ${items[0].key} too long even alone, skipping`)
          errorCount++
        } else {
          throw error
        }
      }
    }

    try {
      const items: TranslationItem[] = batch.map(({ path: p, value }) => ({
        key: p.join('.'),
        english: value,
      }))
      await translateWithFallback(items)
      console.log(`[main] ✓ Batch ${batchNum} done (${batch.length} items)`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('usage limits') || msg.includes('rate limit') || msg.includes('401')) {
        console.error('[main] Fatal API error — stopping early')
        errorCount += untranslated.length - i
        break
      }
      console.error(`[main] ✗ Batch ${batchNum} failed: ${msg}`)
      errorCount += batch.length
    }

    i += size
  }

  console.log('\n[main] Saving translations...')
  await saveRootLocale(rootLocale)
  console.log('[main] ✓ Translations saved')

  console.log('\n[main] Summary:')
  console.log(`  Translated: ${translatedCount}`)
  console.log(`  Skipped:    ${skippedCount}`)
  console.log(`  Errors:     ${errorCount}`)
})()
