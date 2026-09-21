/**
 * Node checks for shared helpers (search, paths, math placeholders, schema).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectTextHits, findRanges, searchDocuments, SEARCH_MAX_HITS } from '../src/shared/search.ts'
import { fileName, pathsEqual, splitHash, resolveRelativePath, pdfExportFileName } from '../src/shared/pathUtils.ts'
import { isMarkdownPath } from '../src/shared/markdownExtensions.ts'
import { sanitizeCssColor } from '../src/shared/cssUtils.ts'
import { slugifyHeading } from '../src/shared/headingSlug.ts'
import { validatePresentationConfig } from '../src/main/configValidation.ts'
import { MARKDOWN_COLOR_KEYS } from '../src/shared/markdownColors.ts'
import {
  preprocessMathWithPlaceholders,
  restoreMathPlaceholders
} from '../src/renderer/markdown/formats/math.ts'
import { countSourceLines, injectFirstTagAttr } from '../src/renderer/markdown/sourceLines.ts'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { readFileWhenStable, tryStatFile } from '../src/main/fileStability.ts'
import { isZoomInShortcut } from '../src/main/zoomShortcut.ts'

const hits: ReturnType<typeof searchDocuments> = []
collectTextHits('a.md', 'hello world\nhello again', 'hello', hits)
assert.equal(hits.length, 2)
assert.equal(hits[0].line, 1)
assert.equal(hits[0].column, 1)

const whole: typeof hits = []
collectTextHits('a.md', 'cat catalog', 'cat', whole, { wholeWord: true })
assert.equal(whole.length, 1)

const regexHits: typeof hits = []
collectTextHits('a.md', 'abc 123 def', '\\d+', regexHits, { regex: true })
assert.equal(regexHits.length, 1)
assert.equal(regexHits[0].length, 3)

assert.equal(findRanges('hello', '[', { regex: true }), 'invalid-regex')
const wholeWordRanges = findRanges('The cat sat', 'cat', { wholeWord: true })
assert.notEqual(wholeWordRanges, 'invalid-regex')
if (wholeWordRanges !== 'invalid-regex') assert.equal(wholeWordRanges.length, 1)

assert.ok(searchDocuments([{ path: 'a.md', content: 'x' }], 'missing').length === 0)
assert.ok(SEARCH_MAX_HITS > 0)

assert.equal(fileName(String.raw`C:\docs\note.md`), 'note.md')
assert.equal(fileName('/tmp/note.md'), 'note.md')
assert.equal(pdfExportFileName(String.raw`C:\docs\demo.md`), 'demo.pdf')
assert.equal(pdfExportFileName('/tmp/notes.backup.md'), 'notes.backup.pdf')
assert.equal(pdfExportFileName(null), 'document.pdf')
assert.equal(pathsEqual(String.raw`C:\Docs\A.md`, 'c:/docs/a.md'), true)
assert.equal(pathsEqual('/tmp/a.md', '/tmp/b.md'), false)
assert.deepEqual(splitHash('chapters/_index.md#intro'), {
  pathPart: 'chapters/_index.md',
  hash: '#intro'
})

assert.equal(isMarkdownPath(String.raw`C:\docs\note.md`), true)
assert.equal(isMarkdownPath(String.raw`C:\docs\note.md.txt`), false)
assert.equal(isMarkdownPath('.hidden.md'), true)

assert.equal(sanitizeCssColor('#0969da'), '#0969da')
assert.equal(sanitizeCssColor('javascript:alert(1)'), '#0969da')

const counts = new Map<string, number>()
assert.equal(slugifyHeading('Hello World', counts), 'hello-world')
assert.equal(slugifyHeading('Hello World', counts), 'hello-world-1')

assert.ok(
  resolveRelativePath(String.raw`C:\docs\page.md`, 'chapters/_index.md').toLowerCase().includes('chapters')
)

assert.equal(countSourceLines(''), 0)
assert.equal(countSourceLines('one'), 1)
assert.equal(countSourceLines('a\nb\n'), 3)
assert.equal(
  injectFirstTagAttr('<pre class="hljs">x</pre>', 'data-source-line', '4'),
  '<pre data-source-line="4" class="hljs">x</pre>'
)
assert.equal(injectFirstTagAttr('<hr>', 'data-source-line', '2'), '<hr data-source-line="2">')

const mathConfig = {
  enabled: true,
  engine: 'katex' as const,
  inlineDelimiters: [['$', '$'] as [string, string]],
  blockDelimiters: [['$$', '$$'] as [string, string]],
  throwOnError: false
}
const { text, slots } = preprocessMathWithPlaceholders('alpha $x$ beta', mathConfig)
assert.ok(slots.length >= 1)
assert.ok(text.includes('MATHPLACEHOLDER'))
const restored = restoreMathPlaceholders(`<p>${text}</p>`, slots)
assert.ok(restored.includes('math-inline') || restored.includes('katex'))
assert.equal(restored.includes('MATHPLACEHOLDER'), false)

const currencyLine = '| WLY | 25 | $1,202.50 | $48.10 | C | $48.10 | JOHN WILEY | K_Brokerage |'
const currency = preprocessMathWithPlaceholders(currencyLine, mathConfig)
assert.equal(currency.slots.length, 0, 'currency $ amounts must not become math')
assert.equal(currency.text, currencyLine)
assert.equal(currency.text.split('|').length, currencyLine.split('|').length)

const currencyPair = preprocessMathWithPlaceholders('$20,000 and $30,000', mathConfig)
assert.equal(currencyPair.slots.length, 0)

const realMath = preprocessMathWithPlaceholders('area $x = \\pi r^2$ ok', mathConfig)
assert.equal(realMath.slots.length, 1)

const quadratic = preprocessMathWithPlaceholders(
  'the quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.',
  mathConfig
)
assert.equal(quadratic.slots.length, 1)

const spanning = preprocessMathWithPlaceholders(
  '| WLY | $48.10 | K_Brokerage |\n\n## SELL / TRIM\n\n| ACGLO | $8,349.25 | $18.35 |\n',
  mathConfig
)
assert.equal(spanning.slots.length, 0)
assert.ok(spanning.text.includes('## SELL / TRIM'))
assert.ok(spanning.text.includes('| ACGLO |'))

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'config/presentation.schema.json')
const defaults = JSON.parse(readFileSync(join(root, 'config/presentation.default.json'), 'utf-8'))
assert.equal(validatePresentationConfig(defaults, schemaPath).valid, true)
assert.ok(MARKDOWN_COLOR_KEYS.includes('h2'))
assert.ok(defaults.presentation.markdownColors.light.h2)
const bad = validatePresentationConfig(
  { ...defaults, presentation: { ...defaults.presentation, fontSizePx: 'large' } },
  schemaPath
)
assert.equal(bad.valid, false)
if (!bad.valid) assert.match(bad.message, /fontSizePx/)

const stableDir = mkdtempSync(join(tmpdir(), 'mdv-stable-'))
const stablePath = join(stableDir, 'note.md')
writeFileSync(stablePath, 'hello-stable')
assert.equal(tryStatFile(stablePath)?.size, 'hello-stable'.length)
assert.equal(await readFileWhenStable(stablePath), 'hello-stable')
writeFileSync(stablePath, 'chunk')
const pending = readFileWhenStable(stablePath)
await new Promise((resolve) => setTimeout(resolve, 120))
writeFileSync(stablePath, 'chunk-complete')
assert.equal(await pending, 'chunk-complete')
assert.equal(
  await readFileWhenStable(join(stableDir, 'missing.md'), undefined, { maxWaitMs: 250 }),
  null
)
rmSync(stableDir, { recursive: true, force: true })

const zoomBase = { type: 'keyDown', key: '=', code: 'Equal', control: true, meta: false, alt: false }
assert.equal(isZoomInShortcut(zoomBase), true)
assert.equal(isZoomInShortcut({ ...zoomBase, key: '+', code: 'Equal' }), true)
assert.equal(isZoomInShortcut({ ...zoomBase, key: '+', code: 'NumpadAdd' }), true)
assert.equal(isZoomInShortcut({ ...zoomBase, control: false }), false)
assert.equal(isZoomInShortcut({ ...zoomBase, alt: true }), false)
assert.equal(isZoomInShortcut({ ...zoomBase, type: 'keyUp' }), false)
assert.equal(isZoomInShortcut({ ...zoomBase, key: '-', code: 'Minus' }), false)
assert.equal(isZoomInShortcut({ ...zoomBase, key: '0', code: 'Digit0' }), false)

console.log('OK: shared unit checks passed.')
