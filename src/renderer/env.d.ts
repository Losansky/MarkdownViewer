/// <reference types="vite/client" />

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginWithOptions<{
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }>
  export default plugin
}

declare module 'markdown-it-multimd-table' {
  import type MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginWithOptions<{
    multiline?: boolean
    rowspan?: boolean
    headerless?: boolean
    multibody?: boolean
    aotolabel?: boolean
  }>
  export default plugin
}

declare module '*.css' {
  const css: string
  export default css
}

declare module '*.css?url' {
  const url: string
  export default url
}
