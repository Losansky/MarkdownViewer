import type { PresentationConfig, RecentList } from '../../shared/types'

export class AppState {
  folderRoot: string | null = null
  recents: RecentList = { files: [], folders: [] }
  config!: PresentationConfig
  tocVisible = false
  pendingScrollHash: string | null = null
}
