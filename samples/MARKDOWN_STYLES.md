# Markdown tag colors

Edit `presentation.markdownColors.light` / `.dark` in `presentation.json` (Help → Open presentation config).  
`null` means “use the CSS theme default”. Reload the config (save the JSON) to preview.

Toggle **View → Theme** to compare light and dark.

## Mapping table

| Markdown | HTML | CSS selector | JSON key (`markdownColors`) | Light default | Dark default |
|---|---|---|---|---|---|
| `# heading` | `h1` | `#preview h1` | `h1` | `#1f2328` | `#e6edf3` |
| `## heading` | `h2` | `#preview h2` | `h2` | `#1f6feb` | `#58c4e8` |
| `### heading` | `h3` | `#preview h3` | `h3` | `#1f6feb` | `#58c4e8` |
| `#### heading` | `h4` | `#preview h4` | `h4` | `#1f6feb` | `#58c4e8` |
| `##### heading` | `h5` | `#preview h5` | `h5` | `#1f6feb` | `#58c4e8` |
| `###### heading` | `h6` | `#preview h6` | `h6` | `#1f6feb` | `#58c4e8` |
| paragraph | `p` | `#preview p` | `p` | `#1f2328` | `#e6edf3` |
| `[link](url)` | `a` | `#preview a` | `a` | `#1f6feb` | `#58a6ff` |
| `**bold**` | `strong` | `#preview strong` | `strong` | inherit | inherit |
| `*italic*` | `em` | `#preview em` | `em` | inherit | inherit |
| `~~strike~~` | `del` | `#preview del` | `del` | inherit | inherit |
| `- list` / `1.` | `li` | `#preview li` | `li` | inherit | inherit |
| `` `code` `` | `code` | `#preview code` | `code` | `#1f6feb` | `#58c4e8` |
| `> quote` | `blockquote` | `#preview blockquote` | `blockquote` | `#656d76` | `#8b949e` |
| `---` | `hr` | `#preview hr` | `hr` | `#d0d7de` | `#30363d` |
| table header | `th` | `#preview th` | `th` | `#1f2328` | `#e6edf3` |

### Not in `markdownColors` (other config)

| Markdown | HTML / class | Where to change |
|---|---|---|
| ` ```lang ` fence | `pre` / highlight.js | `formats.codeHighlight.theme` |
| ` ```mermaid ` | `.mermaid` | `formats.mermaid.themeVariables` / `themeVariablesDark` |
| `$math$` / `$$` | `.math-inline` / `.math-block` | inherits body color |
| `> [!NOTE]` | `.admonition-note` | `formats.admonitions.types.note.color` |
| `> [!TIP]` | `.admonition-tip` | `formats.admonitions.types.tip.color` |
| `> [!IMPORTANT]` | `.admonition-important` | `formats.admonitions.types.important.color` |
| `> [!WARNING]` | `.admonition-warning` | `formats.admonitions.types.warning.color` |
| `> [!CAUTION]` | `.admonition-caution` | `formats.admonitions.types.caution.color` |

Example in `presentation.json`:

```json
"markdownColors": {
  "dark": {
    "h2": "#58c4e8",
    "h3": "#3fb950",
    "code": "#ff7b72"
  }
}
```

---

## Live samples

# H1 heading

## H2 heading

### H3 heading

#### H4 heading

##### H5 heading

###### H6 heading

Paragraph text with a [link](https://commonmark.org/), **bold**, *italic*, ~~strike~~, and inline `code`.

- Unordered list item
- Second item

1. Ordered list item
2. Second item

- [x] Task done
- [ ] Task open

> Blockquote text

---

| Header A | Header B |
|----------|----------|
| Cell     | Cell     |

```javascript
function sample() {
  return 'fenced code'
}
```

> [!NOTE]
> Note admonition

> [!TIP]
> Tip admonition

> [!IMPORTANT]
> Important admonition

> [!WARNING]
> Warning admonition

> [!CAUTION]
> Caution admonition
