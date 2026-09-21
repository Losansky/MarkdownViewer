## MarkDown Viewer 1.1.8

### Fixed

- Dollar amounts in Markdown tables are no longer treated as KaTeX, so `$1,202.50 | $48.10` keeps its columns instead of spilling into the next heading or table
- **Zoom In** works from `Ctrl+=` (the `=/+` key), `Ctrl+Shift+=`, and numpad `+`

### Added

- Per-tag preview colors in `presentation.markdownColors` (light / dark) for headings, links, code, quotes, and other Markdown tags
- Sample `samples/MARKDOWN_STYLES.md` mapping tags → CSS → JSON keys
- Currency vs math table in `samples/demo.md` to verify `$` handling

### Changed

- Wide tables size columns to content, wrap long cells, and clip overflow so cell text does not paint over neighbors
