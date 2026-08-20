/** GitHub-style heading slug (matches createPipeline heading_ids ruler). */

export function slugifyHeading(text: string, slugCounts: Map<string, number>): string {
  let slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
  if (!slug) slug = 'section'
  const count = slugCounts.get(slug) ?? 0
  slugCounts.set(slug, count + 1)
  if (count > 0) slug = `${slug}-${count}`
  return slug
}

export interface HeadingEntry {
  level: number
  text: string
  id: string
}

/** Extract ATX headings (# …) from markdown source for table of contents. */
export function extractHeadings(source: string): HeadingEntry[] {
  const headings: HeadingEntry[] = []
  const slugCounts = new Map<string, number>()
  const lines = source.split(/\r?\n/)
  let inFence = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed)
    if (!match) continue

    const level = match[1].length
    const text = match[2].replace(/\s+#*\s*$/, '').trim()
    if (!text) continue

    const id = slugifyHeading(text, slugCounts)
    headings.push({ level, text, id })
  }

  return headings
}
