# Changelog

## Unreleased

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
