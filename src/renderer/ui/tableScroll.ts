/**
 * Wide tables scroll horizontally on the top and the bottom.
 * The top bar mirrors `.table-scroll-body` and is hidden when the table fits.
 */

let tableScrollObserver: ResizeObserver | null = null

export function clearTableScrollbars(): void {
  tableScrollObserver?.disconnect()
  tableScrollObserver = null
}

export function attachTableScrollbars(root: ParentNode): void {
  clearTableScrollbars()

  const bodies = Array.from(root.querySelectorAll<HTMLElement>('.table-scroll-body'))
  if (bodies.length === 0) return

  const observer = new ResizeObserver(() => {
    for (const body of bodies) updateTableScrollbar(body)
  })
  tableScrollObserver = observer

  for (const body of bodies) {
    bindTableScrollbar(body)
    observer.observe(body)
    const table = body.querySelector('table')
    if (table) observer.observe(table)
  }
}

function bindTableScrollbar(body: HTMLElement): void {
  if (body.dataset.tableScrollBound === '1') return
  body.dataset.tableScrollBound = '1'
  const top = tableScrollTop(body)
  if (!top) return

  let lock = false
  const link = (from: HTMLElement, to: HTMLElement): void => {
    if (lock) return
    lock = true
    to.scrollLeft = from.scrollLeft
    lock = false
  }
  body.addEventListener('scroll', () => link(body, top), { passive: true })
  top.addEventListener('scroll', () => link(top, body), { passive: true })
  updateTableScrollbar(body)
}

function updateTableScrollbar(body: HTMLElement): void {
  const top = tableScrollTop(body)
  const spacer = top?.querySelector<HTMLElement>('.table-scroll-spacer')
  if (!top || !spacer) return

  const width = body.scrollWidth
  spacer.style.width = `${width}px`
  const needed = width > body.clientWidth + 1
  top.hidden = !needed
  if (needed) top.scrollLeft = body.scrollLeft
}

function tableScrollTop(body: HTMLElement): HTMLElement | null {
  const wrap = body.parentElement
  if (!wrap) return null
  const top = wrap.querySelector(':scope > .table-scroll-top')
  return top instanceof HTMLElement ? top : null
}
