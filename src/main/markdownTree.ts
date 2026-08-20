import { readdirSync, existsSync, statSync, type Dirent } from 'fs'
import { basename, join, extname } from 'path'
import type { TreeNode } from '../shared/types'

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])

/** Build output / VCS internals — not document folders. Hidden dirs like .kiro stay in the tree. */
const SKIP_DIR_NAMES = new Set(['node_modules', 'out', 'dist', '.git'])

function isMarkdownFile(fileName: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(fileName).toLowerCase())
}

function sortTreeNodes(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/** Build a tree of directories that contain Markdown files (and the files themselves). */
export function buildMarkdownTree(rootPath: string): TreeNode | null {
  if (!existsSync(rootPath)) return null

  let rootStat
  try {
    rootStat = statSync(rootPath)
  } catch {
    return null
  }

  if (!rootStat.isDirectory()) return null

  const children = walkMarkdownTree(rootPath)
  return {
    name: basename(rootPath) || rootPath,
    path: rootPath,
    type: 'directory',
    children
  }
}

function walkMarkdownTree(dirPath: string): TreeNode[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }

  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue

    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      const childNodes = walkMarkdownTree(fullPath)
      if (childNodes.length > 0) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children: childNodes
        })
      }
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file'
      })
    }
  }

  nodes.sort(sortTreeNodes)
  return nodes
}
