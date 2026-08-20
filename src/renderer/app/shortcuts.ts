import type { AppCommand } from '../../shared/types'
import type { AppContext } from './context'

export function bindKeyboardShortcuts(
  ctx: AppContext,
  dispatch: (command: AppCommand) => void
): void {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    const mod = e.ctrlKey || e.metaKey

    if (mod && key === 'f' && e.shiftKey && !e.altKey) {
      e.preventDefault()
      dispatch('find-in-open-files')
      return
    }
    if (mod && key === 'f' && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      dispatch('find')
      return
    }
    if (mod && key === 'g' && e.shiftKey && !e.altKey) {
      e.preventDefault()
      dispatch('find-in-folder')
      return
    }
    if (key === 'f3' || (mod && key === 'g' && !e.altKey)) {
      e.preventDefault()
      dispatch(e.shiftKey ? 'find-previous' : 'find-next')
      return
    }
    if (e.key === 'Escape' && ctx.aboutDialog.isOpen()) {
      e.preventDefault()
      ctx.aboutDialog.hide()
      return
    }
    if (e.key === 'Escape' && ctx.findBar.isOpen()) {
      if (document.activeElement?.id !== 'find-input') {
        e.preventDefault()
        ctx.findBar.hide()
      }
      return
    }

    if (!mod) return

    if (key === 'o' && e.shiftKey) {
      e.preventDefault()
      dispatch('open-folder')
    } else if (key === 'o') {
      e.preventDefault()
      dispatch('open-file')
    } else if (key === 'w' && e.shiftKey) {
      e.preventDefault()
      dispatch('close-all-tabs')
    } else if (key === 'w') {
      e.preventDefault()
      dispatch('close-tab')
    } else if (key === 'b') {
      e.preventDefault()
      dispatch('toggle-sidebar')
    } else if (key === 't' && e.shiftKey) {
      e.preventDefault()
      dispatch('toggle-toc')
    } else if (key === 'r' && e.shiftKey) {
      e.preventDefault()
      dispatch('refresh-folder')
    } else if (key === 'e') {
      e.preventDefault()
      dispatch('open-in-editor')
    } else if (key === 'd' && e.shiftKey) {
      e.preventDefault()
      dispatch('toggle-theme')
    } else if (key === 'l' && !e.shiftKey) {
      e.preventDefault()
      dispatch('toggle-line-numbers')
    } else if (key === 'r' && !e.shiftKey) {
      e.preventDefault()
      dispatch('reload')
    } else if (key === 'p' && e.shiftKey) {
      e.preventDefault()
      dispatch('export-pdf')
    } else if (key === 'p') {
      e.preventDefault()
      dispatch('print')
    }
  })
}
