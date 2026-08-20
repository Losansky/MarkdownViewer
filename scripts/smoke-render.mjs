/**
 * Headless smoke test: render samples/demo.md through markdown-it pipeline pieces
 * that do not require a DOM (no Mermaid.run).
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import MarkdownIt from 'markdown-it'
import multimdTable from 'markdown-it-multimd-table'
import taskLists from 'markdown-it-task-lists'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demo = readFileSync(join(root, 'samples/demo.md'), 'utf-8')
const config = JSON.parse(readFileSync(join(root, 'config/presentation.default.json'), 'utf-8'))

const md = new MarkdownIt({
  html: config.markdown.html,
  linkify: config.markdown.linkify,
  typographer: config.markdown.typographer,
  breaks: config.markdown.breaks
})
md.use(taskLists, { enabled: true, label: true, labelAfter: true })
md.use(multimdTable)

const fence = (config.formats.mermaid.fence || 'mermaid').toLowerCase()
const defaultFence = md.renderer.rules.fence
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const info = (tokens[idx].info || '').trim().toLowerCase()
  const lang = info.split(/\s+/)[0] ?? ''
  if (lang === fence) {
    return `<div class="mermaid-wrap"><pre class="mermaid">${md.utils.escapeHtml(tokens[idx].content.trimEnd())}</pre></div>\n`
  }
  if (defaultFence) return defaultFence(tokens, idx, options, env, self)
  return self.renderToken(tokens, idx, options)
}

const html = md.render(demo)
const checks = [
  ['table', /<table[\s>]/i.test(html)],
  ['mermaid flowchart', html.includes('class="mermaid"') && html.includes('flowchart LR')],
  ['task list', /task-list-item|checkbox/i.test(html)],
  ['heading', /<h1[\s>]/i.test(html)],
  ['code fence', /<pre[\s>]/i.test(html)]
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
