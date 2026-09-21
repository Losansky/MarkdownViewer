/** Keys in presentation.markdownColors.{light,dark} → CSS vars --md-<key>. */
export const MARKDOWN_COLOR_KEYS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'strong',
  'em',
  'del',
  'blockquote',
  'hr',
  'code',
  'li',
  'th'
] as const

export type MarkdownColorKey = (typeof MARKDOWN_COLOR_KEYS)[number]

export type MarkdownColorMap = Partial<Record<MarkdownColorKey, string | null>>

export interface MarkdownThemeColors {
  light?: MarkdownColorMap
  dark?: MarkdownColorMap
}

export function isMarkdownColorKey(key: string): key is MarkdownColorKey {
  return (MARKDOWN_COLOR_KEYS as readonly string[]).includes(key)
}