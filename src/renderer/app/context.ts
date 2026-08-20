import type { PresentationConfig } from '../../shared/types'
import type { PreviewController } from '../ui/preview'
import type { TabManager } from '../ui/tabs'
import type { TreeView } from '../ui/tree'
import type { FindBar } from '../ui/findBar'
import type { TocPanel } from '../ui/toc'
import type { AboutDialog } from '../ui/aboutDialog'
import type { AppState } from './state'

export interface AppContext {
  appEl: HTMLElement
  sidebarEl: HTMLElement
  preview: PreviewController
  tabs: TabManager
  tree: TreeView
  findBar: FindBar
  toc: TocPanel
  aboutDialog: AboutDialog
  state: AppState
  applyConfig: (config: PresentationConfig, warning?: string | null) => void
  persistSession: () => void
  toggleTheme: () => Promise<void>
  openActiveInEditor: () => Promise<void>
}
