# MarkDown Viewer demo

This sample exercises **standard** Markdown and **non-standard** notations controlled by `presentation.json`.

## Standard formatting

- Bullet lists
- **Bold**, *italic*, ~~strikethrough~~
- `inline code`
- [Links](https://commonmark.org/)

### Task list

- [x] Open a Markdown file
- [x] Render Mermaid graphs
- [x] Customize presentation JSON

### Table

| Feature        | Supported |
|----------------|-----------|
| GFM tables     | Yes       |
| Mermaid        | Yes       |
| KaTeX math     | Yes       |
| Admonitions    | Yes       |

### Code

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

## Admonitions (GitHub-style)

> [!NOTE]
> Notes are good for neutral callouts.

> [!TIP]
> Tips highlight helpful advice.

> [!WARNING]
> Warnings draw attention to risk.

> [!CAUTION]
> Caution is for serious problems.

## Math (KaTeX)

Inline math: the quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

Fenced math:

```math
E = mc^2
```

## Mermaid

### Flowchart

```mermaid
flowchart LR
  A[Open file] --> B[Parse Markdown]
  B --> C{Formats?}
  C -->|Mermaid| D[Render diagram]
  C -->|Math| E[KaTeX]
  C -->|Code| F[Highlight]
  D --> G[Preview]
  E --> G
  F --> G
```

### Sequence diagram

```mermaid
sequenceDiagram
  participant User
  participant App
  participant Config
  User->>App: Open demo.md
  App->>Config: Load presentation.json
  Config-->>App: Themes & format flags
  App-->>User: Rendered preview
```

### Class diagram

```mermaid
classDiagram
  class PreviewController {
    +open(path, content)
    +setConfig(config)
  }
  class ConfigService {
    +getConfig()
    +startWatching()
  }
  PreviewController --> ConfigService : uses
```

---

Edit your user config (Help → Open presentation config…) to change theme, fonts, Mermaid theme, or disable formats.
