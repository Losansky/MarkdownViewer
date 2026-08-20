import type { AppCommand } from '../../shared/types'
import type { AppContext } from './context'

export async function dispatchCommand(ctx: AppContext, command: AppCommand): Promise<void> {
  switch (command) {
    case 'open-file':
      await window.api.openFile()
      break
    case 'open-folder':
      await window.api.openFolder()
      break
    case 'reload': {
      const active = ctx.tabs.getActivePath()
      if (active) await window.api.reloadFile(active)
      else await window.api.reloadFile()
      break
    }
    case 'close-tab': {
      const active = ctx.tabs.getActivePath()
      if (active) ctx.tabs.close(active)
      break
    }
    case 'close-all-tabs':
      ctx.tabs.closeAll()
      break
    case 'refresh-folder':
      if (ctx.state.folderRoot) await window.api.refreshFolder(ctx.state.folderRoot)
      else await window.api.openFolder()
      break
    case 'toggle-sidebar':
      ctx.appEl.classList.toggle('sidebar-collapsed')
      ctx.sidebarEl.setAttribute(
        'aria-hidden',
        ctx.appEl.classList.contains('sidebar-collapsed') ? 'true' : 'false'
      )
      break
    case 'toggle-toc':
      ctx.state.tocVisible = ctx.toc.toggle()
      ctx.persistSession()
      break
    case 'open-in-editor':
      await ctx.openActiveInEditor()
      break
    case 'toggle-theme':
      await ctx.toggleTheme()
      break
    case 'toggle-line-numbers':
      ctx.applyConfig(
        await window.api.setLineNumbers(!ctx.state.config.formats.codeHighlight.lineNumbers)
      )
      break
    case 'print':
      await window.api.print()
      break
    case 'export-pdf': {
      const result = await window.api.exportPdf()
      if (!result.ok && result.message) ctx.preview.showError(result.message)
      break
    }
    case 'find':
      ctx.findBar.show('current')
      break
    case 'find-in-open-files':
      ctx.findBar.show('open-files')
      break
    case 'find-in-folder':
      ctx.findBar.show(ctx.state.folderRoot ? 'folder' : 'current')
      break
    case 'find-next':
      ctx.findBar.findNext()
      break
    case 'find-previous':
      ctx.findBar.findPrevious()
      break
    case 'about': {
      const info = await window.api.getAbout()
      ctx.aboutDialog.show(info)
      break
    }
  }
}
