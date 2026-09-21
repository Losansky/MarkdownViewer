/** Subset of Electron.Input used to detect Zoom In. */
export interface ZoomKeyInput {
  type: string
  key: string
  code: string
  control: boolean
  meta: boolean
  alt: boolean
}

/**
 * Ctrl/Cmd + the =/+ key (with or without Shift) or numpad +.
 * Electron's default zoomIn role is Plus-only and misses Ctrl+= on Windows.
 */
export function isZoomInShortcut(input: ZoomKeyInput): boolean {
  if (input.type !== 'keyDown') return false
  if (input.alt) return false
  const cmdOrCtrl = process.platform === 'darwin' ? input.meta : input.control
  if (!cmdOrCtrl) return false
  return input.code === 'Equal' || input.code === 'NumpadAdd' || input.key === '+'
}
