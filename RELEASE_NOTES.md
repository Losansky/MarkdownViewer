## MarkDown Viewer 1.1.7

### Changed

- Headings (`##`) and inline code use a brighter cyan/blue accent, in line with notes and tips
- Mermaid diagrams use more vivid node colors (blue / green / gold), with a separate dark-mode palette
- Live reload waits for a quiet period and a stable file size so chunked or partial writes are not shown
- Windows installer is built outside OneDrive so Setup.exe is a full NSIS package, not a stub
- Release packaging fails if Setup or portable exe is under 40 MB (rejects NSIS stubs)

### Security / libraries

- mermaid 11.17.2, KaTeX 0.18.6, markdown-it 14.3.1, Electron 43.6.0
- Transitive audit fixes (including DOMPurify); `npm audit` is clean
