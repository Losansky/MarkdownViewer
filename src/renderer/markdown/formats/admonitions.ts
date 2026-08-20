import type MarkdownIt from 'markdown-it'
import type { AdmonitionsFormatConfig } from '../../../shared/types'
import { sanitizeCssColor } from '../../../shared/cssUtils'

/**
 * GitHub-style alerts:
 *
 * > [!NOTE]
 * > content
 */
export function applyAdmonitions(md: MarkdownIt, config: AdmonitionsFormatConfig): void {
  if (!config.enabled) return

  const types = new Map(
    Object.entries(config.types).map(([k, v]) => [k.toLowerCase(), v])
  )

  md.core.ruler.after('block', 'github_admonitions', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type !== 'blockquote_open') continue

      // Find first inline content in the blockquote
      let j = i + 1
      let inlineIdx = -1
      while (j < tokens.length && tokens[j].type !== 'blockquote_close') {
        if (tokens[j].type === 'inline' && inlineIdx === -1) {
          inlineIdx = j
        }
        j++
      }
      if (inlineIdx === -1) continue

      const inline = tokens[inlineIdx]
      const match = inline.content.match(/^\[!([A-Za-z]+)\]\s*(?:\n|$)/)
      if (!match) continue

      const kind = match[1].toLowerCase()
      const typeConfig = types.get(kind)
      if (!typeConfig) continue

      // Mark the blockquote open token
      token.attrSet('class', `admonition admonition-${kind}`)
      token.attrSet('data-admonition', kind)
      token.attrSet('style', `--admonition-color: ${sanitizeCssColor(typeConfig.color)}`)

      // Strip marker from inline content
      inline.content = inline.content.replace(/^\[![A-Za-z]+\]\s*/, '')

      // Insert a title paragraph after blockquote_open
      const titleOpen = new state.Token('paragraph_open', 'p', 1)
      titleOpen.attrSet('class', 'admonition-title')
      const titleInline = new state.Token('inline', '', 0)
      titleInline.content = typeConfig.title
      titleInline.children = []
      const textToken = new state.Token('text', '', 0)
      textToken.content = typeConfig.title
      titleInline.children.push(textToken)
      const titleClose = new state.Token('paragraph_close', 'p', -1)

      tokens.splice(i + 1, 0, titleOpen, titleInline, titleClose)
    }
  })
}

