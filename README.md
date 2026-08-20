# MarkDown Viewer

A Windows desktop Markdown viewer built with **Electron**, **Vite**, and **TypeScript**.

Open a Markdown file through a native file dialog and preview formatted content, including common non-standard notations such as **Mermaid** diagrams, **KaTeX** math, syntax-highlighted code, and GitHub-style admonitions.

Presentation of those formats is controlled by a **JSON configuration** file.

## Download

Get the latest Windows build from [Releases](https://github.com/Losansky/MarkdownViewer/releases):

- **MarkDown Viewer Setup x.y.z.exe** — NSIS installer (Start menu / desktop shortcuts)
- **MarkDown Viewer x.y.z.exe** — portable app (no install)

The current installer is unsigned, so Windows SmartScreen may warn on first run. Choose **More info → Run anyway** if you trust the build.

## Requirements

- Node.js 22+ (LTS recommended) to build from source
- Windows 10/11 for packaged builds (also runs on macOS/Linux via Electron)

## Quick start

```bash
npm install
npm run dev
```

Then use the menu **File → Open Folder…** (or **Open File…** / `Ctrl+O`) and open `samples` or `samples/demo.md`.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile main, preload, and renderer to `out/` |
| `npm run typecheck` | TypeScript check |
| `npm run sbom` | Generate `build/sbom.json` (CycloneDX, used by Help → About) |
| `npm start` | Run the production build (after `build`) |
| `npm run test:security` | Security helper unit checks |
| `npm run test:tree` | Explorer tree unit checks (hidden folders, skip list) |
| `npm run smoke` | Headless Markdown pipeline smoke test |
| `npm run dist` | Build the Windows installer and portable exe into `release/` |

## Features

- Native **File** menu: Open File, Open Folder, Open Recent, Reload, Close Tab
- **Open in external editor** (configured editors + default; File menu and context menus)
- **Dark mode** theme (`View → Theme`, or `Ctrl+Shift+D`)
- **Recent files & folders** (persisted under userData; welcome screen + sidebar + menu)
- **Left sidebar** explorer: folder tree of Markdown files, including hidden folders such as `.kiro` and `.grok`
- **Tabs** for multiple open documents (middle-click or × to close)
- **Relative links** resolve against the open file (e.g. `chapters/_index.md` opens that path in a tab)
- GFM-style Markdown (tables, task lists, strikethrough, autolinks)
- **Mermaid** fenced blocks (` ```mermaid `)
- **Math** via KaTeX (`$…$`, `$$…$$`, ` ```math `)
- **Syntax highlighting** (highlight.js)
- **GitHub-style admonitions** (`> [!NOTE]`, etc.)
- Live **file watch** (preview updates when an open file changes on disk)
- Folder tree starts **collapsed**; **+ / −** in the explorer header expands or collapses all folders
- **Find** (`Ctrl+F`) in the current file, all open files, or the open folder
- **Help → About** with app version and a scrollable SBOM (packages + CycloneDX JSON)
- User **presentation.json** with schema; changes reload live when the config file is saved

## Configuration

On first launch the app copies the default config to:

```
%APPDATA%\markdown-viewer\presentation.json
```

Recent files/folders are stored alongside it as `recent.json` (most recent first, max 12 each). Missing paths are pruned when the list is shown.

(Exact folder name follows Electron `userData` for this package.)

You can also open the config folder from the menu: **Help → Open presentation config…**

### Defaults

Shipped defaults live in [`config/presentation.default.json`](config/presentation.default.json).  
JSON Schema: [`config/presentation.schema.json`](config/presentation.schema.json).

### Example options

```json
{
  "presentation": {
    "theme": "dark",
    "fontSizePx": 18,
    "maxWidthPx": 900
  },
  "editors": {
    "default": "vscode",
    "list": [
      {
        "id": "vscode",
        "name": "Visual Studio Code",
        "command": "code",
        "args": ["{{file}}"]
      },
      {
        "id": "notepad",
        "name": "Notepad",
        "command": "notepad.exe",
        "args": ["{{file}}"]
      }
    ]
  },
  "formats": {
    "mermaid": {
      "enabled": true,
      "theme": "default"
    },
    "math": {
      "enabled": true
    },
    "codeHighlight": {
      "enabled": true,
      "theme": "github"
    },
    "admonitions": {
      "enabled": true
    }
  }
}
```

Unknown format keys are ignored so you can extend the file later. Invalid user config falls back to defaults without crashing the app.

### External editors

Configure editors under `editors` in `presentation.json`:

| Key | Purpose |
|-----|---------|
| `editors.default` | Id of the default editor in `list` |
| `editors.list[].id` | Stable id |
| `editors.list[].name` | Label in menus |
| `editors.list[].command` | Executable / PATH command |
| `editors.list[].args` | Args; use `{{file}}` for the absolute path (default `["{{file}}"]`) |

**Open in editor:**

- **File → Open in …** (`Ctrl+E`) — default editor for the active tab
- **File → Open with** — pick any configured editor (or system default)
- **Right-click** a tab, tree file, or the preview — context menu with default + other editors

If `list` is empty, the app falls back to the OS file association.

### Theme (dark mode)

Set `"presentation.theme": "dark"` or `"light"`, or use **View → Theme** / `Ctrl+Shift+D`.  
When mermaid `theme` is `"default"` (or `"auto"`), diagrams follow the app theme. Light code themes such as `github` auto-map to dark variants in dark mode.

### Per-format controls

| Key | Purpose |
|-----|---------|
| `formats.mermaid` | Enable/disable, fence name, Mermaid theme, security level |
| `formats.math` | Enable/disable KaTeX, delimiters, error behavior |
| `formats.codeHighlight` | Enable/disable, highlight.js theme name |
| `formats.admonitions` | Enable/disable, colors/titles per alert type |
| `presentation` | Theme, typography, content max width |
| `editors` | External editors for Open in Editor |
| `markdown` | markdown-it options (`breaks`, `linkify`, `html`, …) |

## Project layout

```
config/                 Default JSON config + schema
samples/demo.md         Feature showcase
src/main/               Electron main process (dialog, FS, IPC)
src/preload/            contextBridge API
src/renderer/           UI + Markdown pipeline + format modules
src/shared/             Shared TypeScript types
```

## Security notes

- Local files are treated as trusted for preview.
- `contextIsolation` is on, the renderer is sandboxed, and Node is not exposed.
- Raw HTML in Markdown is forced off (`markdown.html: false`) unless `MDV_ALLOW_HTML=1` in a dev build.
- Mermaid `securityLevel` is limited to `strict` or `sandbox`.
- Only Markdown paths can be opened in-app. Preview links may use `http(s)`, `mailto`, and `tel`; other local types need a confirm dialog and an allowlisted extension.
- External `http(s)` links open in the system browser.

## Releasing

Version lives in `package.json`. CI runs typecheck, security checks, smoke, and a production compile on every push and pull request to `main`.

To publish a new Windows build:

1. Bump `"version"` in `package.json` (for example `1.1.3`).
2. Commit the change to `main`.
3. Tag and push:

```bash
git tag v1.1.3
git push origin main
git push origin v1.1.3
```

Pushing a `v*` tag runs [.github/workflows/release.yml](.github/workflows/release.yml), which builds the installer and portable exe and attaches them to a GitHub Release.

## Contributing

- Open a [bug report](https://github.com/Losansky/MarkdownViewer/issues/new?template=bug_report.yml) or [feature request](https://github.com/Losansky/MarkdownViewer/issues/new?template=feature_request.yml).
- Keep pull requests focused. Run `npm run typecheck`, `npm run test:security`, and `npm run smoke` before opening a PR.
- Do not commit `node_modules/`, `out/`, or `release/`.

## License

[MIT](LICENSE)
