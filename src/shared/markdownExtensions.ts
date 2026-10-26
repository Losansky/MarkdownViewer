export const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])

/** Mermaid CLI source files. The preview draws these as SVG, not as Markdown. */
export const MERMAID_EXTENSIONS = new Set(['.mmd', '.mermaid'])

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

export function isMermaidDiagramPath(filePath: string): boolean {
  return MERMAID_EXTENSIONS.has(extensionOf(filePath))
}

/** Files the preview can open: Markdown, or a Mermaid diagram source. */
export function isPreviewDocumentPath(filePath: string): boolean {
  return isMarkdownPath(filePath) || isMermaidDiagramPath(filePath)
}
