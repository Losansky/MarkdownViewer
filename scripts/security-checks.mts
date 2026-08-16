/**
 * Unit checks for 1.1.2 hardening helpers (no Electron, no DOM).
 */
import assert from 'node:assert/strict'
import {
  clampPresentationConfig,
  deepMerge,
  isAllowedExternalHref,
  isDangerousHref,
  isMarkdownPath,
  isOsOpenablePath,
  isUnsafeMergeKey
} from '../src/main/security.ts'
import type { PresentationConfig } from '../src/shared/types.ts'

const base = {
  a: 1,
  nested: { keep: true, theme: 'light' }
}

const merged = deepMerge(
  base,
  JSON.parse(
    '{"__proto__":{"polluted":true},"constructor":{"name":"hack"},"prototype":{"x":1},"nested":{"theme":"dark"},"extra":2}'
  ) as Record<string, unknown>
)

assert.equal(isUnsafeMergeKey('__proto__'), true)
assert.equal((merged as { extra: number }).extra, 2)
assert.equal(merged.nested.theme, 'dark')
assert.equal(merged.nested.keep, true)
assert.equal(
  Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted'),
  false,
  'deepMerge must not pollute Object.prototype'
)

const sample: PresentationConfig = {
  presentation: {
    theme: 'light',
    fontFamily: 'Segoe UI',
    fontSizePx: 16,
    lineHeight: 1.6,
    maxWidthPx: 1100,
    codeFontFamily: 'Consolas',
    background: null,
    foreground: null
  },
  markdown: {
    breaks: false,
    linkify: true,
    typographer: true,
    html: true
  },
  formats: {
    mermaid: {
      enabled: true,
      fence: 'mermaid',
      theme: 'default',
      themeVariables: {},
      securityLevel: 'loose',
      fontFamily: null
    },
    math: {
      enabled: true,
      engine: 'katex',
      inlineDelimiters: [['$', '$']],
      blockDelimiters: [['$$', '$$']],
      throwOnError: false
    },
    codeHighlight: { enabled: true, theme: 'github', lineNumbers: false },
    admonitions: { enabled: true, syntax: 'github', types: {} }
  },
  editors: { default: '', list: [] }
}

const clamped = clampPresentationConfig(sample, { allowHtml: false })
assert.equal(clamped.markdown.html, false)
assert.equal(clamped.formats.mermaid.securityLevel, 'strict')

const allowedHtml = clampPresentationConfig(sample, { allowHtml: true })
assert.equal(allowedHtml.markdown.html, true)

const sandbox = clampPresentationConfig(
  {
    ...sample,
    formats: {
      ...sample.formats,
      mermaid: { ...sample.formats.mermaid, securityLevel: 'sandbox' }
    }
  },
  { allowHtml: false }
)
assert.equal(sandbox.formats.mermaid.securityLevel, 'sandbox')

assert.equal(isMarkdownPath('C:\\docs\\note.md'), true)
assert.equal(isMarkdownPath('C:\\docs\\note.markdown'), true)
assert.equal(isMarkdownPath('C:\\docs\\note.exe'), false)
assert.equal(isMarkdownPath('C:\\docs\\note.md.txt'), false)

assert.equal(isOsOpenablePath('C:\\docs\\spec.pdf'), true)
assert.equal(isOsOpenablePath('C:\\docs\\photo.png'), true)
assert.equal(isOsOpenablePath('C:\\docs\\payload.exe'), false)
assert.equal(isOsOpenablePath('C:\\docs\\payload.lnk'), false)
assert.equal(isOsOpenablePath('C:\\docs\\run.bat'), false)

assert.equal(isAllowedExternalHref('https://example.com'), true)
assert.equal(isAllowedExternalHref('http://example.com'), true)
assert.equal(isAllowedExternalHref('mailto:a@b.com'), true)
assert.equal(isAllowedExternalHref('tel:+15551212'), true)
assert.equal(isAllowedExternalHref('//cdn.example.com/x'), true)
assert.equal(isDangerousHref('javascript:alert(1)'), true)
assert.equal(isDangerousHref('data:text/html,hi'), true)
assert.equal(isDangerousHref('vbscript:msgbox'), true)
assert.equal(isAllowedExternalHref('javascript:alert(1)'), false)

console.log('OK: security helper checks passed.')
