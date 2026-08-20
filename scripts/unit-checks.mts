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
import {
  preprocessMathWithPlaceholders,
  restoreMathPlaceholders
} from '../src/renderer/markdown/formats/math.ts'
import { countSourceLines, injectFirstTagAttr } from '../src/renderer/markdown/sourceLines.ts'

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

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'config/presentation.schema.json')
const defaults = JSON.parse(readFileSync(join(root, 'config/presentation.default.json'), 'utf-8'))
assert.equal(validatePresentationConfig(defaults, schemaPath).valid, true)
const bad = validatePresentationConfig(
  { ...defaults, presentation: { ...defaults.presentation, fontSizePx: 'large' } },
  schemaPath
)
assert.equal(bad.valid, false)
if (!bad.valid) assert.match(bad.message, /fontSizePx/)

console.log('OK: shared unit checks passed.')
