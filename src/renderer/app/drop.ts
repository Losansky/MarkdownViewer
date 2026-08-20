import { isMarkdownPath } from '../../shared/markdownExtensions'

export function bindFileDrop(
  target: HTMLElement,
  handlers: {
    openFile: (path: string) => Promise<void>
    openFolder: (path: string) => Promise<void>
    pathKind: (path: string) => Promise<'file' | 'directory' | 'missing'>
  }
): void {
  target.addEventListener('dragover', (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'copy'
    target.classList.add('is-drop-target')
  })

  target.addEventListener('dragleave', (event) => {
    if (event.target === target) target.classList.remove('is-drop-target')
  })

  target.addEventListener('drop', (event) => {
    target.classList.remove('is-drop-target')
    if (!hasFiles(event)) return
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files ?? [])
    void handleDroppedFiles(files, handlers)
  })
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

async function handleDroppedFiles(
  files: File[],
  handlers: {
    openFile: (path: string) => Promise<void>
    openFolder: (path: string) => Promise<void>
    pathKind: (path: string) => Promise<'file' | 'directory' | 'missing'>
  }
): Promise<void> {
  for (const file of files) {
    const filePath = (file as File & { path?: string }).path
    if (!filePath) continue
    const kind = await handlers.pathKind(filePath)
    if (kind === 'directory') {
      await handlers.openFolder(filePath)
    } else if (kind === 'file' && isMarkdownPath(filePath)) {
      await handlers.openFile(filePath)
    }
  }
}
