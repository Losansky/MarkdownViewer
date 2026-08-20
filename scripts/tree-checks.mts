/**
 * Checks that the explorer tree includes hidden folders (.kiro, .grok)
 * and still skips build/VCS directories.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildMarkdownTree } from '../src/main/markdownTree.ts'

const root = mkdtempSync(join(tmpdir(), 'mdv-tree-'))

try {
  writeFileSync(join(root, 'readme.md'), '# Root\n')
  mkdirSync(join(root, '.kiro'))
  writeFileSync(join(root, '.kiro', 'spec.md'), '# Kiro\n')
  mkdirSync(join(root, '.grok', 'docs'), { recursive: true })
  writeFileSync(join(root, '.grok', 'docs', 'notes.md'), '# Grok\n')
  mkdirSync(join(root, '.empty-hidden'))
  mkdirSync(join(root, '.git'))
  writeFileSync(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n')
  writeFileSync(join(root, '.git', 'secret.md'), '# should be skipped\n')
  mkdirSync(join(root, 'node_modules', 'pkg'), { recursive: true })
  writeFileSync(join(root, 'node_modules', 'pkg', 'README.md'), '# skip\n')
  writeFileSync(join(root, '.hidden-note.md'), '# hidden file\n')

  const tree = buildMarkdownTree(root)
  assert.ok(tree, 'tree should be built')
  const names = (tree.children ?? []).map((n) => n.name).sort()
  assert.deepEqual(names, ['.grok', '.kiro', '.hidden-note.md', 'readme.md'].sort())

  const kiro = tree.children?.find((n) => n.name === '.kiro')
  assert.equal(kiro?.type, 'directory')
  assert.equal(kiro?.children?.[0]?.name, 'spec.md')

  const grok = tree.children?.find((n) => n.name === '.grok')
  const grokDocs = grok?.children?.find((n) => n.name === 'docs')
  assert.equal(grokDocs?.children?.[0]?.name, 'notes.md')

  assert.equal(
    tree.children?.some((n) => n.name === '.git' || n.name === 'node_modules' || n.name === '.empty-hidden'),
    false
  )
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log('OK: explorer tree includes .kiro/.grok and skips .git/node_modules.')
