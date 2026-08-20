# Changelog

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
