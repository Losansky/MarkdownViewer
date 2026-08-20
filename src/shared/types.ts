export type ThemeName = 'light' | 'dark'

export interface PresentationSettings {
  theme: ThemeName
  fontFamily: string
  fontSizePx: number
  lineHeight: number
  maxWidthPx: number
  codeFontFamily: string
  background: string | null
  foreground: string | null
}

export interface MarkdownSettings {
  breaks: boolean
  linkify: boolean
  typographer: boolean
  html: boolean
}

export interface MermaidFormatConfig {
  enabled: boolean
  fence: string
  theme: string
  themeVariables: Record<string, string>
  securityLevel: 'strict' | 'loose' | 'antiscript' | 'sandbox'
  fontFamily: string | null
}

export interface MathFormatConfig {
  enabled: boolean
  engine: 'katex'
  inlineDelimiters: [string, string][]
  blockDelimiters: [string, string][]
  throwOnError: boolean
}

export interface CodeHighlightFormatConfig {
  enabled: boolean
  theme: string
  lineNumbers: boolean
}

export interface AdmonitionTypeConfig {
  title: string
  color: string
  icon: string
}

export interface AdmonitionsFormatConfig {
  enabled: boolean
  syntax: 'github'
  types: Record<string, AdmonitionTypeConfig>
}

export interface FormatsConfig {
  mermaid: MermaidFormatConfig
  math: MathFormatConfig
  codeHighlight: CodeHighlightFormatConfig
  admonitions: AdmonitionsFormatConfig
}

/** External editor entry listed in presentation.json */
export interface EditorEntry {
  /** Stable id referenced by editors.default */
  id: string
  /** Display name in menus */
  name: string
  /** Executable or PATH command (e.g. code, notepad.exe) */
  command: string
  /**
   * Arguments; use {{file}} for the absolute file path.
   * Defaults to ["{{file}}"] when omitted or empty.
   */
  args?: string[]
}

export interface EditorsConfig {
  /** Id of the default editor in `list` */
  default: string
  list: EditorEntry[]
}

export interface PresentationConfig {
  presentation: PresentationSettings
  markdown: MarkdownSettings
  formats: FormatsConfig
  editors: EditorsConfig
}

export interface OpenedFilePayload {
  path: string
  content: string
}

export interface FileErrorPayload {
  path?: string
  message: string
}

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

export interface OpenedFolderPayload {
  rootPath: string
  tree: TreeNode
}

/** Most-recent-first paths persisted under userData/recent.json */
export interface RecentList {
  files: string[]
  folders: string[]
}

export type AppCommand =
  | 'open-file'
  | 'open-folder'
  | 'reload'
  | 'close-tab'
  | 'close-all-tabs'
  | 'refresh-folder'
  | 'toggle-sidebar'
  | 'toggle-toc'
  | 'open-in-editor'
  | 'toggle-theme'
  | 'toggle-line-numbers'
  | 'find'
  | 'find-next'
  | 'find-previous'
  | 'find-in-open-files'
  | 'find-in-folder'
  | 'print'
  | 'export-pdf'
  | 'about'

export type FindScope = 'current' | 'open-files' | 'folder'

export interface FindOptions {
  caseSensitive: boolean
  wholeWord: boolean
  regex: boolean
}

export interface SessionState {
  tabs: string[]
  activePath: string | null
  folderRoot: string | null
  tocVisible?: boolean
}

export type PathKind = 'file' | 'directory' | 'missing'

export interface ExportPdfResult {
  ok: boolean
  path?: string
  message?: string
}

export interface ConfigStatus {
  config: PresentationConfig
  warning: string | null
}

export interface SearchHit {
  path: string
  line: number
  column: number
  length: number
  snippet: string
}

/** CycloneDX 1.6 document (generated at build time). */
export type SbomDocument = Record<string, unknown>

export interface AboutInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  sbom: SbomDocument | null
}

export interface OpenEditorResult {
  ok: boolean
  message?: string
}

/** Result of resolving a preview link click (relative md, external, anchor). */
export type OpenLinkResult =
  | { kind: 'external'; ok: boolean; message?: string }
  | { kind: 'anchor'; hash: string }
  | { kind: 'file'; ok: boolean; path: string; hash: string | null; message?: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

export interface AppApi {
  openFile: () => Promise<OpenedFilePayload | null>
  openFolder: () => Promise<OpenedFolderPayload | null>
  openPath: (filePath: string) => Promise<OpenedFilePayload | null>
  reloadFile: (filePath?: string) => Promise<OpenedFilePayload | null>
  closePath: (filePath: string) => Promise<void>
  setActivePath: (filePath: string | null) => Promise<void>
  refreshFolder: (rootPath: string) => Promise<OpenedFolderPayload | null>
  /** Resolve href relative to fromFile and open (md in app, else OS / external). */
  openLink: (fromFile: string | null, href: string) => Promise<OpenLinkResult>
  getConfig: () => Promise<ConfigStatus>
  getConfigPath: () => Promise<string>
  setTheme: (theme: ThemeName) => Promise<PresentationConfig>
  setLineNumbers: (enabled: boolean) => Promise<PresentationConfig>
  getRecents: () => Promise<RecentList>
  clearRecents: () => Promise<RecentList>
  getSession: () => Promise<SessionState>
  saveSession: (state: SessionState) => Promise<void>
  openInEditor: (filePath: string, editorId?: string | null) => Promise<OpenEditorResult>
  showFileContextMenu: (filePath: string) => Promise<void>
  searchFolder: (
    rootPath: string,
    query: string,
    options?: FindOptions
  ) => Promise<SearchHit[]>
  print: () => Promise<void>
  exportPdf: () => Promise<ExportPdfResult>
  pathKind: (target: string) => Promise<PathKind>
  getAbout: () => Promise<AboutInfo>
  onFileOpened: (callback: (payload: OpenedFilePayload) => void) => () => void
  onFileError: (callback: (payload: FileErrorPayload) => void) => () => void
  onConfigUpdated: (callback: (status: ConfigStatus) => void) => () => void
  onFolderOpened: (callback: (payload: OpenedFolderPayload) => void) => () => void
  onRecentsUpdated: (callback: (list: RecentList) => void) => () => void
  onCommand: (callback: (command: AppCommand) => void) => () => void
}
