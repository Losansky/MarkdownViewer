# Changelog

## 1.1.11 — 2026-11-07

### Added

- Each Mermaid diagram has buttons to zoom out, zoom in, pan left, up, down, and right, and to reset the view. Drag the diagram to pan. Hold Ctrl and scroll to zoom. Print and PDF export show the diagram at its normal size, without those buttons

### Security

- Electron 43.8.7. Includes the 43.8.4 File System Access blocklist fixes (macOS `/System/Volumes/Data`, `.git/hooks`, hypervisor UNC shares, malformed asar archives) and the 43.8.5–43.8.6 backports from Chromium, V8, Skia, ANGLE, libaom, libvpx, PDFium, and WebRTC
- Mermaid 12.3.0, which depends on DOMPurify ^3.4.17 (GHSA-55q2-fjhq-7xh7, GHSA-6688-9rhm-gjv2). DOMPurify 3.4.17 is still the latest release. Mermaid's nested KaTeX stays on 0.18.10; the viewer uses KaTeX 0.19.1
- `@electron/get` undici override raised to 7.30.2 (GHSA-mqg3-3v4r-cm32 / CVE-2026-116592, high, plus the moderate redirect-cache fixes in that release, including CVE-2026-120474 and CVE-2026-116630)
- minimatch 11.0.5 replaces the 9.0.9 and 10.2.6 copies under electron-builder (GHSA-g3hv-75wg-m249 / CVE-2026-118764, moderate). minimatch 3.1.5 and 5.1.9 are outside that advisory
- Rechecked 2026-11-07: npm audit and OSV report no moderate or higher vulnerabilities. Newest releases on the majors in use include Vite 6.4.5, electron-vite 3.1.0, TypeScript 5.9.3, markdown-it 14.3.3, sharp 0.35.5, highlight.js 11.12.0, and electron-builder 26.18.0. js-yaml 4.3.2, undici 6.29.1, fast-uri 3.1.9, http-cache-semantics 4.3.0, and source-map-js 1.2.2 remain the newest on those lines

## 1.1.10 — 2026-10-25

### Added

- Right-click the preview for **Copy**, **Copy as plain text**, and **Copy markdown**. **Copy** puts the selection on the clipboard as plain text and HTML, the same formats as a system copy. **Copy as plain text** copies only unformatted text. **Copy markdown** copies the source lines that cover the selection. With nothing selected, plain text and Markdown copy the whole document. A link under the pointer adds **Copy link**
- The same three commands are on the **Edit** menu
- Mermaid `.mmd` and `.mermaid` files open in the preview and render as SVG graphics. Markdown fences labeled `mmd` render the same way as `mermaid`

### Fixed

- A second `npm run dev` while the app is already running brings that window forward and prints why, instead of exiting with no window

### Security

- Electron 43.8.3, markdown-it 14.3.3, Vite 6.4.5, sharp 0.35.5, DOMPurify 3.4.17
- Mermaid 12.2.0 (its KaTeX stays on 0.18.10); the viewer uses KaTeX 0.19.1
- Transitive overrides: fast-uri 3.1.9, http-cache-semantics 4.3.0, source-map-js 1.2.2, undici 6.29.1 and 7.30.1
- Rechecked 2026-10-25: these are the newest releases on the current majors, and npm audit and OSV report no moderate or higher vulnerabilities. Electron 45, Vite 8, markdown-it 15, and TypeScript 7 were not required for a published fix

## 1.1.9 — 2026-09-21

### Security

- Release packaging (`npm run dist` and the GitHub Release workflow) runs a CVE/OSV vulnerability audit and the existing security tests **before** compiling the installer or publishing
- `js-yaml` overridden to 4.3.2 (GHSA-2883-xcg3-v3hh)

## 1.1.8 — 2026-09-20

### Fixed

- Dollar amounts in Markdown tables are no longer treated as KaTeX, so `$1,202.50 | $48.10` keeps its columns instead of spilling into the next heading or table
- **Zoom In** works from `Ctrl+=` (the `=/+` key), `Ctrl+Shift+=`, and numpad `+` (Electron’s default was `Ctrl+Plus` only, which missed the key next to minus on Windows)

### Added

- Per-tag preview colors in `presentation.markdownColors` (light / dark) for headings, links, code, quotes, and other Markdown tags
- Sample `samples/MARKDOWN_STYLES.md` mapping tags → CSS → JSON keys
- Currency vs math table in `samples/demo.md` to verify `$` handling

### Changed

- Wide tables size columns to content, wrap long cells, and clip overflow so cell text does not paint over neighbors

## 1.1.7 — 2026-09-04

### Changed

- Headings (`##`) and inline code use a brighter cyan/blue accent, in line with notes and tips
- Mermaid diagrams use more vivid node colors (blue / green / gold), with a separate dark-mode palette
- Live reload waits for a quiet period and a stable file size so chunked or partial writes are not shown
- Windows installer is built outside OneDrive so Setup.exe is a full NSIS package, not a stub
- Release packaging fails if Setup or portable exe is under 40 MB (rejects NSIS stubs)

### Security / libraries

- mermaid 11.17.2, KaTeX 0.18.6, markdown-it 14.3.1, Electron 43.6.0
- Transitive audit fixes (including DOMPurify)

## 1.1.6 — 2026-09-04

### Changed

- Wide Markdown tables use the full document pane (not the text max-width)
- Long table cells wrap; a horizontal scrollbar appears when columns still overflow the viewer

### Added

- Sample `samples/FRAMES_AND_AUTHORITIES.md` with a wide reference table

## 1.1.5 — 2026-08-19

### Added

- Restore the last session: open tabs, active file, folder, and table-of-contents visibility
- Table of contents from headings in the open file (`View` / `Options`, `Ctrl+Shift+T`)
- Find in the current file, all open files, or the open folder (`Ctrl+F`, `Ctrl+Shift+F`, `Ctrl+Shift+G`)
- Left line-number gutter on the document viewer, flush with the explorer splitter (`Options`, `Ctrl+L`)
- Optional line numbers in fenced code blocks
- Options menu labels switch between Show and Hide
- Windows file associations for `.md` and `.markdown`
- Shared unit checks in CI and the release workflow

### Changed

- Export PDF suggests the open document’s name in the same folder (`notes.md` → `notes.pdf`)
- Presentation config is schema-validated; line-number preference is stored in `presentation.json`

## 1.1.4 — 2026-08-19

- Include hidden folders such as `.kiro` and `.grok` in the explorer tree

## 1.1.3 — 2026-08-18

- KaTeX 0.18.4 and highlight.js 11.12.0
