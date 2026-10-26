import { parseSourceLineRange, sliceSourceLines } from '../markdown/sourceLines'

export interface PreviewCopyPayload {
  /** True when the preview has a non-empty text selection for the system Copy command. */
  canSystemCopy: boolean
  /**
   * HTML fragment of the selection. System Copy writes this with `plainText`
   * so rich destinations keep formatting. Null when nothing is selected.
   */
  selectionHtml: string | null
  /** Selection as plain text, or the whole rendered document when nothing is selected. */
  plainText: string
  /** Markdown source lines covering the selection, or the whole file when nothing is selected. */
  markdown: string
  /** href of the link under the pointer, when the menu was opened on a link. */
  linkHref: string | null
}

const MAX_LINK_CHARS = 8192

/** Text selected in a focused field, such as Find. Null when the preview should be used. */
export function selectedFieldText(): string | null {
  const el = document.activeElement
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return null
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (end <= start) return null
  return el.value.slice(start, end)
}

export function buildPreviewCopyPayload(
  root: HTMLElement,
  source: string,
  eventTarget: EventTarget | null
): PreviewCopyPayload {
  const selection = selectionInside(root)
  const plainText = selection ? selection.toString() : renderedPlainText(root)
  const markdown = selection ? markdownForSelection(root, selection, source) : source
  return {
    canSystemCopy: selection != null,
    selectionHtml: selection ? selectionFragmentHtml(selection) : null,
    plainText,
    markdown,
    linkHref: linkHrefFromTarget(root, eventTarget)
  }
}

function selectionFragmentHtml(sel: Selection): string {
  const range = sel.getRangeAt(0)
  const holder = document.createElement('div')
  holder.append(range.cloneContents())
  for (const el of holder.querySelectorAll('.hljs-ln-num')) el.remove()
  return holder.innerHTML
}

function selectionInside(root: HTMLElement): Selection | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null
  if (!sel.toString()) return null
  return sel
}

function linkHrefFromTarget(root: HTMLElement, target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null
  const anchor = target.closest('a[href]')
  if (!anchor || !root.contains(anchor)) return null
  const href = anchor.getAttribute('href')
  if (!href || href.length > MAX_LINK_CHARS) return null
  return href
}

/**
 * Whole rendered document as plain text. Line-number gutter text inside code
 * fences is hidden for the read so it is not included.
 */
function renderedPlainText(root: HTMLElement): string {
  const nums = [...root.querySelectorAll<HTMLElement>('.hljs-ln-num')]
  const previous = nums.map((el) => el.style.display)
  for (const el of nums) el.style.display = 'none'
  try {
    return root.innerText.replace(/\s+$/u, '')
  } finally {
    nums.forEach((el, i) => {
      el.style.display = previous[i] ?? ''
    })
  }
}

function markdownForSelection(root: HTMLElement, sel: Selection, source: string): string {
  const span = lineSpanForSelection(root, sel.getRangeAt(0))
  if (!span) return source
  const slice = sliceSourceLines(source, span.start, span.end)
  return slice || source
}

function lineSpanForSelection(
  root: HTMLElement,
  range: Range
): { start: number; end: number } | null {
  const overlapping = overlappingSourceBlocks(root, range)
  if (overlapping.length === 0) return null
  const tight = overlapping.filter(
    (el) => !overlapping.some((other) => other !== el && el.contains(other))
  )
  const span = unionLineRange(tight)
  if (!span) return null

  const startNode = range.startContainer
  const endNode = range.endContainer
  const startInsideTight = tight.some((el) => el === startNode || el.contains(startNode))
  const endInsideTight = tight.some((el) => el === endNode || el.contains(endNode))

  let start = span.start
  let end = span.end
  if (!startInsideTight || !endInsideTight) {
    for (const ancestor of overlapping) {
      if (tight.includes(ancestor)) continue
      if (!tight.some((el) => ancestor.contains(el))) continue
      const lines = lineRangeOf(ancestor)
      if (!lines) continue
      if (!startInsideTight) start = Math.min(start, lines.start)
      if (!endInsideTight) end = Math.max(end, lines.end)
    }
  }
  return { start, end }
}

function overlappingSourceBlocks(root: HTMLElement, range: Range): HTMLElement[] {
  const hits: HTMLElement[] = []
  for (const el of root.querySelectorAll<HTMLElement>('[data-source-line]')) {
    if (rangeOverlapsElement(range, el)) hits.push(el)
  }
  return hits
}

/** True when the range covers some of the element's contents, not only a shared boundary. */
function rangeOverlapsElement(range: Range, el: Element): boolean {
  const nodeRange = document.createRange()
  try {
    nodeRange.selectNodeContents(el)
  } catch {
    return false
  }
  return (
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
  )
}

function lineRangeOf(el: Element): { start: number; end: number } | null {
  return parseSourceLineRange(
    el.getAttribute('data-source-line'),
    el.getAttribute('data-source-line-end')
  )
}

function unionLineRange(blocks: readonly Element[]): { start: number; end: number } | null {
  let start = Number.POSITIVE_INFINITY
  let end = 0
  for (const el of blocks) {
    const lines = lineRangeOf(el)
    if (!lines) continue
    start = Math.min(start, lines.start)
    end = Math.max(end, lines.end)
  }
  if (!Number.isFinite(start) || end < start) return null
  return { start, end }
}
