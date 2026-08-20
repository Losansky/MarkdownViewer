export const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])

function extensionOf(filePath: string): string {
  const base = filePath.replace(/^.*[/\\]/, '')
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot).toLowerCase()
}

export function isMarkdownExtension(ext: string): boolean {
  return MARKDOWN_EXTENSIONS.has(ext.toLowerCase())
}

export function isMarkdownFileName(fileName: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extensionOf(fileName))
}

export function isMarkdownPath(filePath: string): boolean {
  return isMarkdownFileName(filePath)
}
