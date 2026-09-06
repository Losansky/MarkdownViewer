## MarkDown Viewer 1.1.6

### Changed

- Wide Markdown tables use the full document pane (not the text max-width)
- Long table cells wrap; a horizontal scrollbar appears when columns still overflow the viewer
- Headings (`##`) and inline code use a brighter cyan/blue accent, in line with notes and tips
- Mermaid diagrams use more vivid node colors (blue / green / gold), with a separate dark-mode palette
- Live reload waits for a quiet period and a stable file size so chunked or partial writes are not shown
- Windows installer is built outside OneDrive so Setup.exe is a full NSIS package, not a stub

### Added

- Sample `samples/FRAMES_AND_AUTHORITIES.md` with a wide reference table

### Security / libraries

- mermaid 11.17.2, KaTeX 0.18.6, markdown-it 14.3.1, Electron 43.6.0
- Transitive audit fixes (including DOMPurify); `npm audit` is clean
