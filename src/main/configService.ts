import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, watch, type FSWatcher } from 'fs'
import { join, dirname } from 'path'
import type { PresentationConfig, ThemeName } from '../shared/types'
import { clampPresentationConfig, deepMerge } from './security'

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
  private userConfigPath: string
  private defaultConfigPath: string
  private watcher: FSWatcher | null = null
  private onChange: ((config: PresentationConfig) => void) | null = null

  constructor() {
    this.defaultConfigPath = this.resolveDefaultConfigPath()
    this.userConfigPath = join(app.getPath('userData'), 'presentation.json')
    this.config = this.load()
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

  setOnChange(handler: (config: PresentationConfig) => void): void {
    this.onChange = handler
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

  /**
   * Persist presentation.theme to the user config and notify listeners.
   * Merges into the existing user JSON so other customizations are kept.
   */
  setTheme(theme: ThemeName): PresentationConfig {
    this.ensureUserConfig()
    let userRaw: Record<string, unknown> = {}
    try {
      const parsed = readJsonFile(this.userConfigPath)
      if (isObject(parsed)) {
        userRaw = parsed
      }
    } catch {
      // rewrite from current effective config presentation section
    }

    const presentation = isObject(userRaw.presentation)
      ? { ...userRaw.presentation }
      : {}
    presentation.theme = theme
    userRaw.presentation = presentation

    if (!userRaw.$schema) {
      userRaw.$schema = './presentation.schema.json'
    }

    const dir = dirname(this.userConfigPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(this.userConfigPath, JSON.stringify(userRaw, null, 2) + '\n', 'utf-8')

    this.config = this.load()
    this.onChange?.(this.config)
    return this.config
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
            this.config = this.load()
            this.onChange?.(this.config)
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

  private resolveDefaultConfigPath(): string {
    // Packaged: extraResources → resources/config
    // Dev: project root/config (cwd, app path, relative to out/main)
    const candidates = [
      join(process.resourcesPath, 'config', 'presentation.default.json'),
      join(app.getAppPath(), 'config', 'presentation.default.json'),
      join(process.cwd(), 'config', 'presentation.default.json'),
      join(__dirname, '../../config/presentation.default.json'),
      join(__dirname, '../../../config/presentation.default.json')
    ]
    for (const path of candidates) {
      if (existsSync(path)) return path
    }
    throw new Error(
      `Could not find presentation.default.json. Searched:\n${candidates.join('\n')}`
    )
  }

  private load(): PresentationConfig {
    const defaults = readJsonFile(this.defaultConfigPath) as PresentationConfig

    if (!existsSync(this.userConfigPath)) {
      return clampPresentationConfig(defaults, { allowHtml: allowRawHtml() })
    }

    try {
      const userRaw = readJsonFile(this.userConfigPath)
      if (!isObject(userRaw)) {
        console.warn('User presentation.json is not an object; using defaults')
        return defaults
      }
      // Strip schema metadata before merge
      const { $schema: _schema, ...userConfig } = userRaw as Record<string, unknown> & {
        $schema?: string
      }
      const merged = deepMerge(
        defaults as unknown as Record<string, unknown>,
        userConfig
      ) as unknown as PresentationConfig
      return clampPresentationConfig(merged, { allowHtml: allowRawHtml() })
    } catch (err) {
      console.warn('Invalid user presentation.json; falling back to defaults:', err)
      return clampPresentationConfig(defaults, { allowHtml: allowRawHtml() })
    }
  }
}
