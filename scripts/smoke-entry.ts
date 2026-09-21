import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createPipeline } from '../src/renderer/markdown/createPipeline'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demo = readFileSync(join(root, 'samples/demo.md'), 'utf-8')
const config = JSON.parse(readFileSync(join(root, 'config/presentation.default.json'), 'utf-8'))

const { html } = createPipeline(config).render(demo, {
  documentPath: join(root, 'samples/demo.md')
})

const numberedConfig = {
  ...config,
  formats: {
    ...config.formats,
    codeHighlight: { ...config.formats.codeHighlight, lineNumbers: true }
  }
}
const numbered = createPipeline(numberedConfig).render(demo, {
  documentPath: join(root, 'samples/demo.md')
}).html

const currencySource = `| Ticker | Mkt Val | Price | Rating |
|--------|--------:|------:|:------:|
| AAA | $1,202.50 | $48.10 | C |
| BBB | $24,796.80 | $413.28 | A |

## After table

| Next | Type |
|------|------|
| CCC | Equity |
`
const currencyHtml = createPipeline(config).render(currencySource).html
const currencyRows = currencyHtml.match(/<tr[\s\S]*?<\/tr>/g) ?? []
const firstBodyCells = (currencyRows[1]?.match(/<td[\s>]/g) ?? []).length

const checks: Array<[string, boolean]> = [
  ['table', /<table[\s>]/i.test(html)],
  ['table wrap', /class="table-wrap"/.test(html) && /<div[^>]*table-wrap[\s\S]*?<table[\s>]/.test(html)],
  ['demo currency keeps dollar text', html.includes('$1,202.50') && html.includes('$48.10')],
  ['demo currency not math-error', !html.includes('math-error')],
  ['demo currency heading after table', /<h3[^>]*>After currency table<\/h3>/i.test(html)],
  ['currency table keeps four cells', firstBodyCells === 4],
  ['currency table keeps dollar text', currencyHtml.includes('$1,202.50') && currencyHtml.includes('$48.10')],
  ['currency table not math-error', !currencyHtml.includes('math-error')],
  ['currency table does not swallow heading', /<h2[^>]*>After table<\/h2>/i.test(currencyHtml)],
  ['mermaid flowchart', html.includes('class="mermaid"') && html.includes('flowchart LR')],
  ['task list', /task-list-item|checkbox/i.test(html)],
  ['heading', /<h1[\s>]/i.test(html)],
  ['heading id', /<h[1-6][^>]*\sid="/i.test(html)],
  ['code fence', /<pre[\s>]/i.test(html)],
  ['math', /class="math-block"|class="math-inline"|katex/i.test(html)],
  ['source line attrs', /data-source-line="1"/.test(html)],
  ['line numbers off by default', !html.includes('hljs-ln-num')],
  ['line numbers gutter', numbered.includes('hljs-line-numbers') && numbered.includes('hljs-ln-num')],
  ['line numbers 1 and 2', />1<\/span>/.test(numbered) && />2<\/span>/.test(numbered)],
  [
    'mermaid not numbered',
    (() => {
      const wrap = numbered.match(/<div[^>]*mermaid-wrap[^>]*>[\s\S]*?<\/div>/)
      return Boolean(wrap && !wrap[0].includes('hljs-ln-num'))
    })()
  ]
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nSmoke render checks passed.')
