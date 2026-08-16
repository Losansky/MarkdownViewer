import type { RecentList } from '../../shared/types'

function fileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path
}

export function hasRecents(list: RecentList): boolean {
  return list.files.length > 0 || list.folders.length > 0
}

/**
 * Render clickable recent lists into a container.
 * `variant` controls compact sidebar vs. roomy welcome layout.
 */
export function renderRecentsPanel(
  container: HTMLElement,
  list: RecentList,
  options: {
    variant: 'sidebar' | 'welcome'
    onOpenFile: (path: string) => void
    onOpenFolder: (path: string) => void
    onClear?: () => void
  }
): void {
  container.replaceChildren()

  const intro = document.createElement('p')
  intro.className = 'recents-intro'
  if (options.variant === 'sidebar') {
    intro.innerHTML = 'Use <strong>File → Open Folder…</strong> to browse Markdown files.'
  } else {
    intro.textContent = 'Open a Markdown file or folder to get started.'
  }
  container.append(intro)

  if (!hasRecents(list)) {
    const empty = document.createElement('p')
    empty.className = 'recents-empty-hint'
    empty.textContent =
      options.variant === 'welcome'
        ? 'Recently opened items will appear here.'
        : 'No recent items yet.'
    container.append(empty)
    return
  }

  if (list.folders.length > 0) {
    container.append(
      buildSection('Recent folders', list.folders, 'folder', options.onOpenFolder)
    )
  }
  if (list.files.length > 0) {
    container.append(buildSection('Recent files', list.files, 'file', options.onOpenFile))
  }

  if (options.onClear) {
    const clear = document.createElement('button')
    clear.type = 'button'
    clear.className = 'recents-clear'
    clear.textContent = 'Clear recent'
    clear.addEventListener('click', () => options.onClear?.())
    container.append(clear)
  }
}

function buildSection(
  title: string,
  paths: string[],
  kind: 'file' | 'folder',
  onOpen: (path: string) => void
): HTMLElement {
  const section = document.createElement('section')
  section.className = 'recents-section'

  const heading = document.createElement('h3')
  heading.className = 'recents-heading'
  heading.textContent = title
  section.append(heading)

  const list = document.createElement('ul')
  list.className = 'recents-list'
  list.setAttribute('role', 'list')

  for (const path of paths) {
    const item = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `recents-item recents-item-${kind}`
    button.title = path

    const icon = document.createElement('span')
    icon.className = 'recents-icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = kind === 'folder' ? '📁' : '📄'

    const name = document.createElement('span')
    name.className = 'recents-name'
    name.textContent = fileName(path)

    const pathEl = document.createElement('span')
    pathEl.className = 'recents-path'
    pathEl.textContent = path

    button.append(icon, name, pathEl)
    button.addEventListener('click', () => onOpen(path))
    item.append(button)
    list.append(item)
  }

  section.append(list)
  return section
}
