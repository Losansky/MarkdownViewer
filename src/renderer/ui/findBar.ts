/**
 * Find (Ctrl+F): current preview, all open files, or the open folder.
 * Multi-file scopes show a result list; Next/Prev walks hits and opens files.
 */

import type { FindOptions, FindScope, SearchHit } from '../../shared/types'
import { collectTextHits, findRanges, searchDocuments, SEARCH_MAX_HITS } from '../../shared/search'
import { fileName } from '../../shared/pathUtils'

const FIND_OPTIONS_KEY = 'mdv-find-options'

const HIGHLIGHT_CLASS = 'find-highlight'
const CURRENT_CLASS = 'find-current'
const MAX_HITS = SEARCH_MAX_HITS

export interface FindDocument {
  path: string
  name: string
  content: string
}

export interface FindBarHost {
  getPreviewRoot: () => HTMLElement | null
  getOpenDocuments: () => FindDocument[]
  getFolderRoot: () => string | null
  searchFolder: (query: string, options?: FindOptions) => Promise<SearchHit[]>
  openPath: (path: string) => Promise<void>
}

export class FindBar {
  private open = false
  private scope: FindScope = 'current'
  private matches: HTMLElement[] = []
  private currentIndex = -1
  private hits: SearchHit[] = []
  private currentHitIndex = -1
  private lastQuery = ''
  private searchGen = 0
  private pendingOccurrence: { path: string; occurrence: number } | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private findOptions: FindOptions = { caseSensitive: false, wholeWord: false, regex: false }
  private invalidRegex = false

  private readonly root: HTMLElement
  private readonly input: HTMLInputElement
  private readonly countEl: HTMLElement
  private readonly prevBtn: HTMLButtonElement
  private readonly nextBtn: HTMLButtonElement
  private readonly closeBtn: HTMLButtonElement
  private readonly resultsEl: HTMLElement
  private readonly scopeButtons = new Map<FindScope, HTMLButtonElement>()

  constructor(
    private hostEl: HTMLElement,
    private host: FindBarHost
  ) {
    this.root = document.createElement('div')
    this.root.id = 'find-bar'
    this.root.hidden = true
    this.root.setAttribute('role', 'search')
    this.root.setAttribute('aria-label', 'Find')

    const row = document.createElement('div')
    row.className = 'find-row'

    this.input = document.createElement('input')
    this.input.type = 'search'
    this.input.id = 'find-input'
    this.input.placeholder = 'Find…'
    this.input.autocomplete = 'off'
    this.input.spellcheck = false
    this.input.setAttribute('aria-label', 'Find')

    const scopes = document.createElement('div')
    scopes.className = 'find-scopes'
    scopes.setAttribute('role', 'group')
    scopes.setAttribute('aria-label', 'Find scope')
    scopes.append(
      this.makeScopeButton('current', 'This file'),
      this.makeScopeButton('open-files', 'Open files'),
      this.makeScopeButton('folder', 'Open folder')
    )

    this.countEl = document.createElement('span')
    this.countEl.id = 'find-count'
    this.countEl.setAttribute('aria-live', 'polite')

    this.prevBtn = document.createElement('button')
    this.prevBtn.type = 'button'
    this.prevBtn.className = 'find-btn'
    this.prevBtn.title = 'Previous match (Shift+Enter)'
    this.prevBtn.setAttribute('aria-label', 'Previous match')
    this.prevBtn.textContent = '▲'

    this.nextBtn = document.createElement('button')
    this.nextBtn.type = 'button'
    this.nextBtn.className = 'find-btn'
    this.nextBtn.title = 'Next match (Enter)'
    this.nextBtn.setAttribute('aria-label', 'Next match')
    this.nextBtn.textContent = '▼'

    this.closeBtn = document.createElement('button')
    this.closeBtn.type = 'button'
    this.closeBtn.className = 'find-btn find-close'
    this.closeBtn.title = 'Close (Esc)'
    this.closeBtn.setAttribute('aria-label', 'Close find')
    this.closeBtn.textContent = '×'

    row.append(this.input, scopes, this.countEl, this.prevBtn, this.nextBtn, this.closeBtn)

    const optionRow = document.createElement('div')
    optionRow.className = 'find-options'
    optionRow.setAttribute('role', 'group')
    optionRow.setAttribute('aria-label', 'Find options')
    this.loadFindOptions()
    optionRow.append(
      this.makeOptionToggle('caseSensitive', 'Aa', 'Match case'),
      this.makeOptionToggle('wholeWord', 'W', 'Whole word'),
      this.makeOptionToggle('regex', '.*', 'Regular expression')
    )

    this.resultsEl = document.createElement('div')
    this.resultsEl.id = 'find-results'
    this.resultsEl.hidden = true
    this.resultsEl.setAttribute('role', 'listbox')
    this.resultsEl.setAttribute('aria-label', 'Find results')

    this.root.append(row, optionRow, this.resultsEl)
    this.hostEl.prepend(this.root)

    this.input.addEventListener('input', () => {
      this.scheduleSearch()
    })
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        this.hide()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) this.findPrevious()
        else this.findNext()
      }
    })
    this.prevBtn.addEventListener('click', () => this.findPrevious())
    this.nextBtn.addEventListener('click', () => this.findNext())
    this.closeBtn.addEventListener('click', () => this.hide())
  }

  isOpen(): boolean {
    return this.open
  }

  show(scope?: FindScope): void {
    if (scope) this.scope = scope
    this.open = true
    this.root.hidden = false
    this.syncScopeButtons()
    this.input.focus()
    this.input.select()
    void this.runSearch({ selectFirst: this.matches.length === 0 && this.hits.length === 0 })
  }

  hide(): void {
    this.open = false
    this.root.hidden = true
    this.clearHighlights()
    this.matches = []
    this.currentIndex = -1
    this.hits = []
    this.currentHitIndex = -1
    this.lastQuery = ''
    this.pendingOccurrence = null
    this.resultsEl.hidden = true
    this.resultsEl.replaceChildren()
    this.updateCount()
  }

  toggle(): void {
    if (this.open) this.hide()
    else this.show()
  }

  /** Re-run search after the preview HTML is replaced (reload / tab switch). */
  onContentChanged(): void {
    if (!this.open) return
    if (this.scope === 'current') {
      void this.runSearch({ selectFirst: true })
      return
    }
    this.applyPreviewHighlights()
    const pending = this.pendingOccurrence
    if (pending) {
      this.setPreviewOccurrence(pending.occurrence)
      this.pendingOccurrence = null
    }
    this.renderResults()
    this.updateCount()
  }

  findNext(): void {
    if (!this.open) {
      this.show()
      return
    }
    if (this.scope === 'current') {
      if (this.matches.length === 0) {
        if (this.input.value) void this.runSearch({ selectFirst: true })
        return
      }
      this.setCurrent((this.currentIndex + 1) % this.matches.length)
      return
    }
    if (this.hits.length === 0) {
      if (this.input.value.trim()) void this.runSearch({ selectFirst: true })
      return
    }
    const next = (this.currentHitIndex + 1) % this.hits.length
    void this.activateHit(next)
  }

  findPrevious(): void {
    if (!this.open) {
      this.show()
      return
    }
    if (this.scope === 'current') {
      if (this.matches.length === 0) {
        if (this.input.value) void this.runSearch({ selectFirst: true })
        return
      }
      const next =
        this.currentIndex <= 0 ? this.matches.length - 1 : this.currentIndex - 1
      this.setCurrent(next)
      return
    }
    if (this.hits.length === 0) {
      if (this.input.value.trim()) void this.runSearch({ selectFirst: true })
      return
    }
    const next =
      this.currentHitIndex <= 0 ? this.hits.length - 1 : this.currentHitIndex - 1
    void this.activateHit(next)
  }

  private makeOptionToggle(
    key: keyof FindOptions,
    label: string,
    title: string
  ): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'find-option'
    btn.textContent = label
    btn.title = title
    btn.setAttribute('aria-pressed', String(this.findOptions[key]))
    btn.classList.toggle('active', this.findOptions[key])
    btn.addEventListener('click', () => {
      this.findOptions[key] = !this.findOptions[key]
      btn.setAttribute('aria-pressed', String(this.findOptions[key]))
      btn.classList.toggle('active', this.findOptions[key])
      this.saveFindOptions()
      void this.runSearch({ selectFirst: true })
    })
    return btn
  }

  private loadFindOptions(): void {
    try {
      const raw = localStorage.getItem(FIND_OPTIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<FindOptions>
      this.findOptions = {
        caseSensitive: Boolean(parsed.caseSensitive),
        wholeWord: Boolean(parsed.wholeWord),
        regex: Boolean(parsed.regex)
      }
    } catch {
      // keep defaults
    }
  }

  private saveFindOptions(): void {
    try {
      localStorage.setItem(FIND_OPTIONS_KEY, JSON.stringify(this.findOptions))
    } catch {
      // ignore quota / private mode
    }
  }

  private highlightQuery(root: HTMLElement, query: string): HTMLElement[] {
    this.invalidRegex = false
    const rangesOrError = findRanges('\n', query, this.findOptions)
    if (rangesOrError === 'invalid-regex') {
      this.invalidRegex = true
      return []
    }
    return highlightMatches(root, query, this.findOptions)
  }

  private makeScopeButton(scope: FindScope, label: string): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'find-scope'
    btn.textContent = label
    btn.setAttribute('aria-pressed', String(scope === this.scope))
    btn.addEventListener('click', () => {
      if (this.scope === scope) return
      this.scope = scope
      this.syncScopeButtons()
      void this.runSearch({ selectFirst: true })
    })
    this.scopeButtons.set(scope, btn)
    return btn
  }

  private syncScopeButtons(): void {
    const folderRoot = this.host.getFolderRoot()
    for (const [scope, btn] of this.scopeButtons) {
      btn.setAttribute('aria-pressed', String(scope === this.scope))
      btn.classList.toggle('active', scope === this.scope)
      if (scope === 'folder') {
        btn.disabled = !folderRoot
        btn.title = folderRoot ? 'Search Markdown files in the open folder' : 'No folder is open'
      }
    }
  }

  private scheduleSearch(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    const delay = this.scope === 'folder' ? 200 : 0
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      void this.runSearch({ selectFirst: true })
    }, delay)
  }

  private async runSearch(options: { selectFirst: boolean }): Promise<void> {
    const gen = ++this.searchGen
    const query = this.input.value
    this.lastQuery = query
    this.syncScopeButtons()

    if (this.scope === 'folder' && !this.host.getFolderRoot() && this.open) {
      this.scope = 'current'
      this.syncScopeButtons()
    }

    if (this.scope === 'current') {
      this.hits = []
      this.currentHitIndex = -1
      this.resultsEl.hidden = true
      this.resultsEl.replaceChildren()
      this.runCurrentSearch(query, options)
      return
    }

    this.clearHighlights()
    this.matches = []
    this.currentIndex = -1

    const q = query.trim()
    if (!q) {
      this.hits = []
      this.currentHitIndex = -1
      this.renderResults()
      this.updateCount()
      return
    }

    let hits: SearchHit[] = []
    if (this.scope === 'open-files') {
      hits = searchDocuments(this.host.getOpenDocuments(), q, this.findOptions)
    } else {
      hits = await this.host.searchFolder(q, this.findOptions)
    }
    if (gen !== this.searchGen) return

    this.hits = hits.slice(0, MAX_HITS)
    this.currentHitIndex = this.hits.length > 0 && options.selectFirst ? 0 : -1
    this.applyPreviewHighlights()
    if (this.matches.length > 0 && options.selectFirst) {
      this.setCurrent(0)
    }
    this.renderResults()
    this.updateCount()
  }

  private runCurrentSearch(query: string, options: { selectFirst: boolean }): void {
    const root = this.host.getPreviewRoot()
    this.clearHighlights()
    this.matches = []
    this.currentIndex = -1

    const q = query.trim()
    if (!root || !q) {
      this.updateCount()
      return
    }

    this.matches = this.highlightQuery(root, q)
    if (this.invalidRegex) {
      this.updateCount()
      return
    }
    if (this.matches.length > 0 && options.selectFirst) {
      this.setCurrent(0)
    } else {
      this.updateCount()
    }
  }

  private async activateHit(index: number): Promise<void> {
    const hit = this.hits[index]
    if (!hit) return
    this.currentHitIndex = index
    this.pendingOccurrence = {
      path: hit.path,
      occurrence: occurrenceInFile(this.hits, index)
    }
    this.renderResults()
    this.updateCount()
    await this.host.openPath(hit.path)
    this.applyPreviewHighlights()
    this.setPreviewOccurrence(this.pendingOccurrence.occurrence)
  }

  private applyPreviewHighlights(): void {
    const root = this.host.getPreviewRoot()
    this.clearHighlights()
    this.matches = []
    this.currentIndex = -1
    const q = this.input.value.trim()
    if (!root || !q) return
    this.matches = this.highlightQuery(root, q)
  }

  private setPreviewOccurrence(occurrence: number): void {
    if (this.matches.length === 0) {
      this.updateCount()
      return
    }
    const index = Math.min(Math.max(occurrence, 0), this.matches.length - 1)
    this.setCurrent(index)
  }

  private setCurrent(index: number): void {
    if (this.currentIndex >= 0 && this.matches[this.currentIndex]) {
      this.matches[this.currentIndex].classList.remove(CURRENT_CLASS)
    }
    this.currentIndex = index
    const el = this.matches[index]
    if (el) {
      el.classList.add(CURRENT_CLASS)
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
    this.updateCount()
  }

  private renderResults(): void {
    const multi = this.scope !== 'current'
    const q = this.input.value.trim()
    if (!multi || !q) {
      this.resultsEl.hidden = true
      this.resultsEl.replaceChildren()
      return
    }

    this.resultsEl.hidden = false
    this.resultsEl.replaceChildren()

    if (this.scope === 'folder' && !this.host.getFolderRoot()) {
      const empty = document.createElement('div')
      empty.className = 'find-result-empty'
      empty.textContent = 'No folder is open'
      this.resultsEl.append(empty)
      return
    }

    if (this.hits.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'find-result-empty'
      empty.textContent = 'No results'
      this.resultsEl.append(empty)
      return
    }

    this.hits.forEach((hit, index) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'find-result'
      btn.setAttribute('role', 'option')
      btn.setAttribute('aria-selected', String(index === this.currentHitIndex))
      if (index === this.currentHitIndex) btn.classList.add('active')

      const loc = document.createElement('span')
      loc.className = 'find-result-loc'
      loc.textContent = `${fileName(hit.path)}:${hit.line}`
      loc.title = hit.path

      const snippet = document.createElement('span')
      snippet.className = 'find-result-snippet'
      snippet.textContent = hit.snippet

      btn.append(loc, snippet)
      btn.addEventListener('click', () => {
        void this.activateHit(index)
      })
      this.resultsEl.append(btn)
    })

    const active = this.resultsEl.querySelector('.find-result.active')
    active?.scrollIntoView({ block: 'nearest' })
  }

  private updateCount(): void {
    if (!this.open) {
      this.countEl.textContent = ''
      return
    }
    const q = this.input.value.trim()
    if (!q) {
      this.countEl.textContent = ''
      return
    }
    if (this.invalidRegex) {
      this.countEl.textContent = 'Invalid regex'
      return
    }
    if (this.scope === 'current') {
      if (this.matches.length === 0) {
        this.countEl.textContent = 'No results'
        return
      }
      this.countEl.textContent = `${this.currentIndex + 1} of ${this.matches.length}`
      return
    }
    if (this.hits.length === 0) {
      this.countEl.textContent = 'No results'
      return
    }
    const suffix = this.hits.length >= MAX_HITS ? '+' : ''
    this.countEl.textContent = `${this.currentHitIndex + 1} of ${this.hits.length}${suffix}`
  }

  private clearHighlights(): void {
    const root = this.host.getPreviewRoot()
    if (!root) return
    unwrapHighlights(root)
  }
}

export { searchDocuments, collectTextHits as collectHits }

function occurrenceInFile(hits: SearchHit[], index: number): number {
  const target = hits[index]
  if (!target) return 0
  let occurrence = 0
  for (let i = 0; i < index; i++) {
    if (hits[i].path === target.path) occurrence++
  }
  return occurrence
}

function highlightMatches(
  root: HTMLElement,
  query: string,
  options: FindOptions
): HTMLElement[] {
  const marks: HTMLElement[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest('script, style, .mermaid, .find-highlight')) {
        return NodeFilter.FILTER_REJECT
      }
      const text = node.textContent ?? ''
      if (!text) return NodeFilter.FILTER_REJECT
      const ranges = findRanges(text, query, options)
      if (ranges === 'invalid-regex' || ranges.length === 0) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const textNodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    textNodes.push(current as Text)
    current = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    const ranges = findRanges(text, query, options)
    if (ranges === 'invalid-regex' || ranges.length === 0) continue
    const parts: Array<string | HTMLElement> = []
    let cursor = 0

    for (const range of ranges) {
      if (range.index > cursor) {
        parts.push(text.slice(cursor, range.index))
      }
      const mark = document.createElement('mark')
      mark.className = HIGHLIGHT_CLASS
      mark.textContent = text.slice(range.index, range.index + range.length)
      parts.push(mark)
      marks.push(mark)
      cursor = range.index + range.length
    }
    if (cursor < text.length) {
      parts.push(text.slice(cursor))
    }
    if (parts.length === 0) continue

    const parent = textNode.parentNode
    if (!parent) continue
    const frag = document.createDocumentFragment()
    for (const part of parts) {
      if (typeof part === 'string') {
        frag.append(document.createTextNode(part))
      } else {
        frag.append(part)
      }
    }
    parent.replaceChild(frag, textNode)
  }

  return marks
}

function unwrapHighlights(root: HTMLElement): void {
  const marks = root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`)
  for (const mark of marks) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark)
    }
    parent.removeChild(mark)
    parent.normalize()
  }
}
