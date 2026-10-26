## MarkDown Viewer 1.1.10

### Added

- Right-click the preview to **Copy** the selection (system plain text and HTML), **Copy as plain text**, or **Copy markdown**. With nothing selected, plain text and Markdown copy the whole document. Right-click a link for **Copy link**
- **Edit** menu: Copy, Copy as plain text, Copy markdown
- Open `.mmd` and `.mermaid` files to preview the diagram as an SVG graphic. `mmd` fences in Markdown do the same

### Fixed

- A second `npm run dev` while the app is already running brings that window forward instead of exiting with no window

### Security

- Electron 43.8.3, markdown-it 14.3.3, Vite 6.4.5, sharp 0.35.5, DOMPurify 3.4.17, Mermaid 12.2.0, KaTeX 0.19.1
- Rechecked before release: newest patches on these majors, and npm audit and OSV report no moderate or higher vulnerabilities

## MarkDown Viewer 1.1.9

### Security

- Release packaging runs a CVE/OSV vulnerability audit and security tests **before** compiling the installer or publishing to GitHub
- `js-yaml` overridden to 4.3.2 (GHSA-2883-xcg3-v3hh)
