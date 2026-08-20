import type { TreeNode } from '../../shared/types'

export class TreeView {
  private root: TreeNode | null = null
  private expanded = new Set<string>()
  private selectedPath: string | null = null
  private onContextMenu: ((path: string) => void) | null = null

  constructor(
    private treeEl: HTMLElement,
    private emptyEl: HTMLElement,
    private titleEl: HTMLElement,
    private rootLabelEl: HTMLElement,
    private onOpenFile: (path: string) => void,
    private expandToggleEl: HTMLButtonElement | null = null
  ) {
    this.expandToggleEl?.addEventListener('click', (e) => {
      e.preventDefault()
      this.toggleExpandAll()
    })
  }

  setOnContextMenu(handler: ((path: string) => void) | null): void {
    this.onContextMenu = handler
  }

  /**
   * Replace the explorer tree.
   * When refreshing the same root, keep expand/collapse state so live updates
   * do not collapse folders the user had open.
   */
  setTree(root: TreeNode | null): void {
    const previousRoot = this.root?.path ?? null
    const sameRoot = Boolean(root && previousRoot && root.path === previousRoot)
    this.root = root

    if (!sameRoot) {
      this.expanded.clear()
    } else if (root) {
      // Drop expanded paths that no longer exist after a refresh
      const valid = collectPaths(root)
      for (const path of [...this.expanded]) {
        if (!valid.has(path)) this.expanded.delete(path)
      }
    }

    if (root) {
      this.titleEl.textContent = root.name
      this.rootLabelEl.textContent = root.path
      this.rootLabelEl.title = root.path
      this.emptyEl.hidden = true
      this.treeEl.hidden = false
    } else {
      this.titleEl.textContent = 'Explorer'
      this.rootLabelEl.textContent = ''
      this.rootLabelEl.title = ''
      this.emptyEl.hidden = false
      this.treeEl.hidden = true
    }
    this.render()
  }

  setSelected(path: string | null): void {
    if (this.selectedPath === path) return
    const previous = this.selectedPath
    this.selectedPath = path
    if (!this.updateSelectedRow(previous, path)) {
      this.render()
    }
  }

  private updateSelectedRow(previous: string | null, next: string | null): boolean {
    const rows = this.treeEl.querySelectorAll<HTMLElement>('.tree-row.file')
    if (rows.length === 0 && next) return false
    let foundNext = next === null
    for (const row of rows) {
      const rowPath = row.dataset.path ?? ''
      const selected = Boolean(next && rowPath === next)
      row.classList.toggle('selected', selected)
      if (selected) foundNext = true
      if (previous && rowPath === previous && !selected) {
        row.classList.remove('selected')
      }
    }
    return foundNext || next === null
  }

  getRootPath(): string | null {
    return this.root?.path ?? null
  }

  toggleExpandAll(): void {
    if (!this.root) return
    if (this.hasExpandedFolder()) {
      this.expanded.clear()
    } else {
      this.expanded = collectDirectoryPaths(this.root)
    }
    this.render()
  }

  private hasExpandedFolder(): boolean {
    if (!this.root) return false
    for (const path of this.expanded) {
      if (path !== this.root.path) return true
    }
    return false
  }

  private syncExpandToggle(): void {
    const btn = this.expandToggleEl
    if (!btn) return
    if (!this.root) {
      btn.hidden = true
      return
    }
    btn.hidden = false
    const expanded = this.hasExpandedFolder()
    btn.textContent = expanded ? '−' : '+'
    btn.title = expanded ? 'Collapse all' : 'Expand all'
    btn.setAttribute('aria-label', expanded ? 'Collapse all' : 'Expand all')
  }

  private toggleExpand(path: string): void {
    if (this.expanded.has(path)) {
      this.expanded.delete(path)
    } else {
      this.expanded.add(path)
    }
    this.render()
  }

  private render(): void {
    this.treeEl.replaceChildren()
    if (!this.root) {
      this.syncExpandToggle()
      return
    }

    const fragment = document.createDocumentFragment()
    for (const child of this.root.children ?? []) {
      fragment.append(this.renderNode(child, 0))
    }
    // If root itself has only files as direct children, show them under root name
    if ((this.root.children ?? []).length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tree-hint'
      empty.textContent = 'No Markdown files in this folder'
      fragment.append(empty)
    }
    this.treeEl.append(fragment)
    this.syncExpandToggle()
  }

  private renderNode(node: TreeNode, depth: number): HTMLElement {
    const row = document.createElement('div')
    row.className = 'tree-row'
    row.style.setProperty('--depth', String(depth))
    row.dataset.path = node.path
    row.dataset.type = node.type

    if (node.type === 'directory') {
      const expanded = this.expanded.has(node.path)
      row.classList.add('directory')
      if (expanded) row.classList.add('expanded')

      const twisty = document.createElement('span')
      twisty.className = 'tree-twisty'
      twisty.textContent = expanded ? '▾' : '▸'
      twisty.setAttribute('aria-hidden', 'true')

      const icon = document.createElement('span')
      icon.className = 'tree-icon folder'
      icon.textContent = expanded ? '📂' : '📁'

      const label = document.createElement('span')
      label.className = 'tree-label'
      label.textContent = node.name

      row.append(twisty, icon, label)
      row.setAttribute('role', 'treeitem')
      row.setAttribute('aria-expanded', String(expanded))
      row.tabIndex = 0

      row.addEventListener('click', (e) => {
        e.stopPropagation()
        this.toggleExpand(node.path)
      })
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.toggleExpand(node.path)
        }
      })

      const wrap = document.createElement('div')
      wrap.className = 'tree-node'
      wrap.append(row)

      if (expanded) {
        const children = document.createElement('div')
        children.className = 'tree-children'
        children.setAttribute('role', 'group')
        for (const child of node.children ?? []) {
          children.append(this.renderNode(child, depth + 1))
        }
        wrap.append(children)
      }
      return wrap
    }

    // file
    row.classList.add('file')
    if (this.selectedPath === node.path) {
      row.classList.add('selected')
    }

    const twisty = document.createElement('span')
    twisty.className = 'tree-twisty spacer'
    twisty.setAttribute('aria-hidden', 'true')

    const icon = document.createElement('span')
    icon.className = 'tree-icon file'
    icon.textContent = '📄'

    const label = document.createElement('span')
    label.className = 'tree-label'
    label.textContent = node.name
    label.title = node.path

    row.append(twisty, icon, label)
    row.setAttribute('role', 'treeitem')
    row.tabIndex = 0

    row.addEventListener('click', (e) => {
      e.stopPropagation()
      this.selectedPath = node.path
      this.render()
      this.onOpenFile(node.path)
    })
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.selectedPath = node.path
        this.render()
        this.onOpenFile(node.path)
      }
    })
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.selectedPath = node.path
      this.render()
      this.onContextMenu?.(node.path)
    })

    return row
  }
}

function collectPaths(node: TreeNode, into = new Set<string>()): Set<string> {
  into.add(node.path)
  for (const child of node.children ?? []) {
    collectPaths(child, into)
  }
  return into
}

function collectDirectoryPaths(node: TreeNode, into = new Set<string>()): Set<string> {
  if (node.type === 'directory') into.add(node.path)
  for (const child of node.children ?? []) {
    collectDirectoryPaths(child, into)
  }
  return into
}
