import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, watch, type FSWatcher } from 'fs'
import { join, dirname } from 'path'
import type { PresentationConfig, ThemeName, ConfigStatus } from '../shared/types'
import { clampPresentationConfig, deepMerge } from './security'
import { validatePresentationConfig } from './configValidation'

function allowRawHtml(): boolean {
  return process.env.MDV_ALLOW_HTML === '1' && !app.isPackaged
}

function readJsonFile(path: string): unknown {
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw) as unknown
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class ConfigService {
  private config: PresentationConfig
  private warning: string | null = null
  private userConfigPath: string
  private defaultConfigPath: string
  private schemaPath: string
  private watcher: FSWatcher | null = null
  private onChange: ((status: ConfigStatus) => void) | null = null

  constructor() {
    this.defaultConfigPath = this.resolveDefaultConfigPath('presentation.default.json')
    this.schemaPath = this.resolveDefaultConfigPath('presentation.schema.json')
    this.userConfigPath = join(app.getPath('userData'), 'presentation.json')
    const loaded = this.load()
    this.config = loaded.config
    this.warning = loaded.warning
  }

  getStatus(): ConfigStatus {
    return { config: this.config, warning: this.warning }
  }

  getConfig(): PresentationConfig {
    return this.config
  }

  getUserConfigPath(): string {
    return this.userConfigPath
  }

  getDefaultConfigPath(): string {
    return this.defaultConfigPath
  }

  setOnChange(handler: (status: ConfigStatus) => void): void {
    this.onChange = handler
  }

  private notify(): void {
    this.onChange?.(this.getStatus())
  }

  ensureUserConfig(): void {
    if (existsSync(this.userConfigPath)) return
    const dir = dirname(this.userConfigPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    const defaults = readFileSync(this.defaultConfigPath, 'utf-8')
    writeFileSync(this.userConfigPath, defaults, 'utf-8')
  }

  private mergeUserJsonField(
    mutator: (userRaw: Record<string, unknown>) => void
  ): PresentationConfig {
    this.ensureUserConfig()
    let userRaw: Record<string, unknown> = {}
    try {
      const parsed = readJsonFile(this.userConfigPath)
      if (isObject(parsed)) userRaw = parsed
    } catch {
      // rewrite below
    }
    mutator(userRaw)
    if (!userRaw.$schema) {
      userRaw.$schema = './presentation.schema.json'
    }
    const dir = dirname(this.userConfigPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(this.userConfigPath, JSON.stringify(userRaw, null, 2) + '\n', 'utf-8')
    const loaded = this.load()
    this.config = loaded.config
    this.warning = loaded.warning
    this.notify()
    return this.config
  }

  setTheme(theme: ThemeName): PresentationConfig {
    return this.mergeUserJsonField((userRaw) => {
      const presentation = isObject(userRaw.presentation) ? { ...userRaw.presentation } : {}
      presentation.theme = theme
      userRaw.presentation = presentation
    })
  }

  setLineNumbers(enabled: boolean): PresentationConfig {
    return this.mergeUserJsonField((userRaw) => {
      const formats = isObject(userRaw.formats) ? { ...userRaw.formats } : {}
      const codeHighlight = isObject(formats.codeHighlight)
        ? { ...formats.codeHighlight }
        : {}
      codeHighlight.lineNumbers = enabled
      formats.codeHighlight = codeHighlight
      userRaw.formats = formats
    })
  }

  startWatching(): void {
    this.ensureUserConfig()
    if (this.watcher) return

    let debounce: NodeJS.Timeout | null = null
    try {
      this.watcher = watch(this.userConfigPath, { persistent: false }, () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(() => {
          try {
            const loaded = this.load()
            this.config = loaded.config
            this.warning = loaded.warning
            this.notify()
          } catch (err) {
            console.warn('Failed to reload presentation config:', err)
          }
        }, 200)
      })
    } catch (err) {
      console.warn('Could not watch presentation config:', err)
    }
  }

  stopWatching(): void {
    this.watcher?.close()
    this.watcher = null
  }

  private resolveDefaultConfigPath(fileName: string): string {
    const candidates = [
      join(process.resourcesPath, 'config', fileName),
      join(app.getAppPath(), 'config', fileName),
      join(process.cwd(), 'config', fileName),
      join(__dirname, '../../config', fileName),
      join(__dirname, '../../../config', fileName)
    ]
    for (const path of candidates) {
      if (existsSync(path)) return path
    }
    throw new Error(`Could not find ${fileName}. Searched:\n${candidates.join('\n')}`)
  }

  private load(): { config: PresentationConfig; warning: string | null } {
    const defaults = readJsonFile(this.defaultConfigPath) as PresentationConfig
    let warning: string | null = null

    if (!existsSync(this.userConfigPath)) {
      return {
        config: clampPresentationConfig(defaults, { allowHtml: allowRawHtml() }),
        warning: null
      }
    }

    try {
      const userRaw = readJsonFile(this.userConfigPath)
      if (!isObject(userRaw)) {
        warning = 'User presentation.json is not an object; using defaults.'
        return {
          config: clampPresentationConfig(defaults, { allowHtml: allowRawHtml() }),
          warning
        }
      }

      const validation = validatePresentationConfig(userRaw, this.schemaPath)
      if (!validation.valid) {
        warning = validation.message
      }

      const { $schema: _schema, ...userConfig } = userRaw as Record<string, unknown> & {
        $schema?: string
      }
      const merged = deepMerge(
        defaults as unknown as Record<string, unknown>,
        userConfig
      ) as unknown as PresentationConfig
      return {
        config: clampPresentationConfig(merged, { allowHtml: allowRawHtml() }),
        warning
      }
    } catch (err) {
      warning =
        err instanceof Error
          ? `Invalid user presentation.json: ${err.message}`
          : 'Invalid user presentation.json; using defaults.'
      return {
        config: clampPresentationConfig(defaults, { allowHtml: allowRawHtml() }),
        warning
      }
    }
  }
}
