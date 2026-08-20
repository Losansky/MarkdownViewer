import { countSourceLines } from '../markdown/sourceLines'

const MIN_GAP_PX = 13

export class LineGutterController {
  private enabled = false
  private source = ''
  private observer: ResizeObserver | null = null
  private raf = 0

  constructor(
    private docViewEl: HTMLElement,
    private gutterEl: HTMLElement,
    private previewEl: HTMLElement
  ) {
    this.observer = new ResizeObserver(() => this.scheduleSync())
    this.observer.observe(this.previewEl)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.docViewEl.classList.toggle('line-numbers-on', enabled)
    if (!enabled) {
      this.gutterEl.replaceChildren()
      return
    }
    this.sync()
  }

  setSource(source: string): void {
    this.source = source
    this.scheduleSync()
  }

  clear(): void {
    this.source = ''
    this.gutterEl.replaceChildren()
  }

  dispose(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.observer?.disconnect()
    this.observer = null
  }

  private scheduleSync(): void {
    if (!this.enabled) return
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.sync()
    })
  }

  private sync(): void {
    if (!this.enabled) return
    const lineCount = countSourceLines(this.source)
    if (
      lineCount === 0 ||
      this.previewEl.hidden ||
      !this.previewEl.classList.contains('has-content')
    ) {
      this.gutterEl.replaceChildren()
      return
    }

    const gutterRect = this.gutterEl.getBoundingClientRect()
    const mapped = new Map<number, number>()
    for (const node of this.previewEl.querySelectorAll('[data-source-line]')) {
      if (!(node instanceof HTMLElement)) continue
      const line = Number(node.getAttribute('data-source-line'))
      if (!Number.isFinite(line) || line < 1 || line > lineCount) continue
      const top = node.getBoundingClientRect().top - gutterRect.top
      const prev = mapped.get(line)
      if (prev === undefined || top < prev) mapped.set(line, top)
    }

    const fallback = readPaddingTop(this.previewEl)
    const step = readLineStep(this.previewEl)
    const tops = interpolateTops(lineCount, mapped, fallback, step)

    const frag = document.createDocumentFragment()
    let lastDrawn = Number.NEGATIVE_INFINITY
    for (let i = 0; i < lineCount; i++) {
      const top = Math.max(0, tops[i] ?? fallback + i * step)
      const mappedLine = mapped.has(i + 1)
      if (!mappedLine && top - lastDrawn < MIN_GAP_PX) continue
      const span = document.createElement('span')
      span.className = 'ln'
      span.textContent = String(i + 1)
      span.style.top = `${top}px`
      frag.append(span)
      lastDrawn = top
    }
    this.gutterEl.replaceChildren(frag)
  }
}

function interpolateTops(
  lineCount: number,
  mapped: Map<number, number>,
  fallback: number,
  step: number
): number[] {
  const tops = new Array<number>(lineCount).fill(Number.NaN)
  for (const [line, y] of mapped) {
    tops[line - 1] = y
  }

  let i = 0
  while (i < lineCount) {
    if (!Number.isNaN(tops[i])) {
      i += 1
      continue
    }
    let j = i
    while (j < lineCount && Number.isNaN(tops[j])) j += 1
    const prevI = i - 1
    const prevY = prevI >= 0 ? tops[prevI] : fallback
    const nextY = j < lineCount ? tops[j] : prevY + (j - i + 1) * step
    const span = j - prevI
    for (let k = i; k < j; k++) {
      if (span <= 0) {
        tops[k] = prevY + (k - i + 1) * step
      } else {
        tops[k] = prevY + ((k - prevI) / span) * (nextY - prevY)
      }
    }
    i = j
  }
  return tops
}

function readPaddingTop(el: HTMLElement): number {
  const n = parseFloat(getComputedStyle(el).paddingTop)
  return Number.isFinite(n) ? n : 20
}

function readLineStep(el: HTMLElement): number {
  const style = getComputedStyle(el)
  const fontSize = parseFloat(style.fontSize) || 16
  const raw = style.lineHeight
  if (raw.endsWith('px')) {
    const px = parseFloat(raw)
    if (Number.isFinite(px) && px > 0) return px
  }
  const factor = parseFloat(raw)
  return fontSize * (Number.isFinite(factor) && factor > 0 ? factor : 1.6)
}
