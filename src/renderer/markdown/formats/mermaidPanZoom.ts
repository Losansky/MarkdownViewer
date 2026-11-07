/**
 * Pan and zoom for a rendered Mermaid diagram.
 * The stage uses transform-origin: center, so scale stays centered and
 * translate x/y are screen pixels (a pan step does not grow with zoom).
 */

export interface DiagramView {
  scale: number
  x: number
  y: number
}

export interface DiagramFrame {
  width: number
  height: number
}

export const MERMAID_ZOOM_MIN = 0.25
export const MERMAID_ZOOM_MAX = 8
export const MERMAID_ZOOM_FACTOR = 1.25
export const MERMAID_PAN_STEP = 64
export const MERMAID_PAN_MARGIN = 48

const VIEW_ACTIONS = [
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
  'reset'
] as const

export type MermaidViewAction = (typeof VIEW_ACTIONS)[number]

const BUTTONS: ReadonlyArray<{
  action: MermaidViewAction
  label: string
  title: string
  text?: boolean
}> = [
  { action: 'zoom-out', label: '−', title: 'Zoom out' },
  { action: 'zoom-in', label: '+', title: 'Zoom in' },
  { action: 'pan-left', label: '←', title: 'Pan left' },
  { action: 'pan-up', label: '↑', title: 'Pan up' },
  { action: 'pan-down', label: '↓', title: 'Pan down' },
  { action: 'pan-right', label: '→', title: 'Pan right' },
  { action: 'reset', label: 'Reset', title: 'Reset view', text: true }
]

export function diagramViewIdentity(): DiagramView {
  return { scale: 1, x: 0, y: 0 }
}

export function clampDiagramScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1
  return Math.min(MERMAID_ZOOM_MAX, Math.max(MERMAID_ZOOM_MIN, scale))
}

export function zoomDiagramBy(view: DiagramView, factor: number): DiagramView {
  if (!Number.isFinite(factor) || factor <= 0) return view
  const scale = clampDiagramScale(view.scale * factor)
  if (scale === view.scale) return view
  return { scale, x: view.x, y: view.y }
}

export function panDiagramBy(view: DiagramView, dx: number, dy: number): DiagramView {
  return {
    scale: view.scale,
    x: view.x + (Number.isFinite(dx) ? dx : 0),
    y: view.y + (Number.isFinite(dy) ? dy : 0)
  }
}

/** Keep at least MERMAID_PAN_MARGIN pixels of the scaled diagram inside the frame. */
export function clampDiagramOffset(
  offset: number,
  frameSize: number,
  scale: number,
  margin = MERMAID_PAN_MARGIN
): number {
  if (!Number.isFinite(offset)) return 0
  if (!Number.isFinite(frameSize) || frameSize <= 0 || !Number.isFinite(scale) || scale <= 0) {
    return offset
  }
  const half = (frameSize * scale) / 2
  const center = frameSize / 2
  const min = margin - center - half
  const max = frameSize - margin - center + half
  if (!(min <= max)) return 0
  return Math.min(max, Math.max(min, offset))
}

export function placeDiagramView(view: DiagramView, frame: DiagramFrame): DiagramView {
  return {
    scale: view.scale,
    x: clampDiagramOffset(view.x, frame.width, view.scale),
    y: clampDiagramOffset(view.y, frame.height, view.scale)
  }
}

export function applyDiagramAction(view: DiagramView, action: string): DiagramView {
  switch (action) {
    case 'zoom-in':
      return zoomDiagramBy(view, MERMAID_ZOOM_FACTOR)
    case 'zoom-out':
      return zoomDiagramBy(view, 1 / MERMAID_ZOOM_FACTOR)
    case 'pan-left':
      return panDiagramBy(view, -MERMAID_PAN_STEP, 0)
    case 'pan-right':
      return panDiagramBy(view, MERMAID_PAN_STEP, 0)
    case 'pan-up':
      return panDiagramBy(view, 0, -MERMAID_PAN_STEP)
    case 'pan-down':
      return panDiagramBy(view, 0, MERMAID_PAN_STEP)
    case 'reset':
      return diagramViewIdentity()
    default:
      return view
  }
}

export function diagramActionEnabled(view: DiagramView, action: string): boolean {
  if (action === 'zoom-in') return view.scale < MERMAID_ZOOM_MAX - 1e-4
  if (action === 'zoom-out') return view.scale > MERMAID_ZOOM_MIN + 1e-4
  return true
}

export function formatDiagramZoom(scale: number): string {
  return `${Math.round(clampDiagramScale(scale) * 100)}%`
}

export function diagramTransform(view: DiagramView): string {
  return `translate(${trimNumber(view.x)}px, ${trimNumber(view.y)}px) scale(${trimNumber(view.scale)})`
}

function trimNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  if (Object.is(rounded, -0) || rounded === 0) return '0'
  return String(rounded)
}

/** Add pan and zoom buttons to each rendered diagram in `root`. */
export function attachMermaidPanZoom(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.mermaid-wrap').forEach((wrap) => {
    try {
      attachOne(wrap)
    } catch (err) {
      console.warn('Could not add diagram pan and zoom:', err)
    }
  })
}

function attachOne(wrap: HTMLElement): void {
  if (wrap.querySelector('.mermaid-controls')) return
  const diagram = wrap.querySelector<HTMLElement>('.mermaid')
  if (!diagram || diagram.classList.contains('error')) return
  if (!diagram.querySelector('svg')) return

  const controls = createControls()
  const viewport = document.createElement('div')
  viewport.className = 'mermaid-viewport'
  viewport.title = 'Drag to pan'
  const stage = document.createElement('div')
  stage.className = 'mermaid-stage'
  diagram.replaceWith(viewport)
  stage.append(diagram)
  viewport.append(stage)
  wrap.insertBefore(controls, viewport)

  let view = diagramViewIdentity()
  let dragging = false
  let moved = false
  let suppressClick = false
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0

  const apply = (): void => {
    view = placeDiagramView(view, {
      width: viewport.clientWidth,
      height: viewport.clientHeight
    })
    stage.style.transform = diagramTransform(view)
    syncControls(controls, view)
  }

  controls.addEventListener('click', (event) => {
    const button = eventTargetElement(event)?.closest('button[data-mermaid-action]')
    if (!(button instanceof HTMLButtonElement) || !controls.contains(button)) return
    event.preventDefault()
    event.stopPropagation()
    const action = button.getAttribute('data-mermaid-action') ?? ''
    if (!diagramActionEnabled(view, action)) return
    view = applyDiagramAction(view, action)
    apply()
  })

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    dragging = true
    moved = false
    startX = event.clientX
    startY = event.clientY
    originX = view.x
    originY = view.y
    viewport.setPointerCapture(event.pointerId)
  })

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (!moved && Math.hypot(dx, dy) < 4) return
    moved = true
    viewport.classList.add('is-panning')
    view = panDiagramBy(diagramViewAt(view, originX, originY), dx, dy)
    apply()
  })

  const endDrag = (event: PointerEvent): void => {
    if (!dragging) return
    dragging = false
    viewport.classList.remove('is-panning')
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }
    if (moved) suppressClick = true
  }
  viewport.addEventListener('pointerup', endDrag)
  viewport.addEventListener('pointercancel', endDrag)

  viewport.addEventListener('click', (event) => {
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  })

  viewport.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const factor = Math.exp(-event.deltaY * 0.0015)
      view = zoomDiagramBy(view, factor)
      apply()
    },
    { passive: false }
  )

  apply()
}

function diagramViewAt(view: DiagramView, x: number, y: number): DiagramView {
  return { scale: view.scale, x, y }
}

function createControls(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'mermaid-controls'
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', 'Diagram pan and zoom')

  const zoomOut = createButton(BUTTONS[0])
  const zoomIn = createButton(BUTTONS[1])
  bar.append(zoomOut, createZoomLabel(), zoomIn, createSeparator())
  for (const spec of BUTTONS.slice(2, 6)) bar.append(createButton(spec))
  bar.append(createSeparator(), createButton(BUTTONS[6]))
  return bar
}

function createButton(spec: (typeof BUTTONS)[number]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = spec.text ? 'mermaid-control mermaid-control-text' : 'mermaid-control'
  button.dataset.mermaidAction = spec.action
  button.title = spec.title
  button.setAttribute('aria-label', spec.title)
  button.textContent = spec.label
  return button
}

function createZoomLabel(): HTMLSpanElement {
  const label = document.createElement('span')
  label.className = 'mermaid-zoom-label'
  label.setAttribute('aria-live', 'polite')
  label.setAttribute('aria-atomic', 'true')
  label.textContent = formatDiagramZoom(1)
  label.setAttribute('aria-label', 'Zoom 100%')
  return label
}

function createSeparator(): HTMLSpanElement {
  const sep = document.createElement('span')
  sep.className = 'mermaid-controls-sep'
  sep.setAttribute('aria-hidden', 'true')
  return sep
}

function syncControls(bar: HTMLElement, view: DiagramView): void {
  const label = bar.querySelector('.mermaid-zoom-label')
  if (label) {
    const text = formatDiagramZoom(view.scale)
    label.textContent = text
    label.setAttribute('aria-label', `Zoom ${text}`)
  }
  bar.querySelectorAll<HTMLButtonElement>('button[data-mermaid-action]').forEach((button) => {
    const action = button.dataset.mermaidAction ?? ''
    button.disabled = !diagramActionEnabled(view, action)
  })
}

function eventTargetElement(event: Event): Element | null {
  const target = event.target
  if (target instanceof Element) return target
  if (target instanceof Node) return target.parentElement
  return null
}
