import { existsSync, readFileSync, statSync } from 'fs'

/** Quiet window after the last fs event before we start size checks. */
export const FILE_QUIET_MS = 400

/** Interval between size/mtime samples. */
export const SIZE_POLL_MS = 100

/** Consecutive identical samples required before a read. */
export const SIZE_STABLE_POLLS = 3

const STABLE_WAIT_MAX_MS = 8000
const READ_RETRY_MAX = 6
const READ_RETRY_MS = 80

const TRANSIENT_CODES = new Set(['EBUSY', 'EPERM', 'EACCES', 'ENOENT', 'UNKNOWN'])

export function isTransientFsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = (err as NodeJS.ErrnoException).code
  return typeof code === 'string' && TRANSIENT_CODES.has(code)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function tryStatFile(filePath: string): { size: number; mtimeMs: number } | null {
  try {
    if (!existsSync(filePath)) return null
    const st = statSync(filePath)
    if (!st.isFile()) return null
    return { size: st.size, mtimeMs: st.mtimeMs }
  } catch (err) {
    if (isTransientFsError(err)) return null
    throw err
  }
}

/**
 * After watch events have gone quiet, wait until size and mtime stop changing
 * (chunked / non-atomic writers), then read UTF-8 text. Returns null if the
 * file disappears. Retries transient Windows lock errors.
 */
export async function readFileWhenStable(
  filePath: string,
  isStale?: () => boolean,
  options?: { maxWaitMs?: number }
): Promise<string | null> {
  const deadline = Date.now() + (options?.maxWaitMs ?? STABLE_WAIT_MAX_MS)
  let lastSize = -1
  let lastMtime = -1
  let stableCount = 0

  while (Date.now() < deadline) {
    if (isStale?.()) return null
    const st = tryStatFile(filePath)
    if (!st) {
      stableCount = 0
      lastSize = -1
      lastMtime = -1
      await sleep(SIZE_POLL_MS)
      continue
    }
    if (st.size === lastSize && st.mtimeMs === lastMtime) {
      stableCount += 1
    } else {
      stableCount = 1
      lastSize = st.size
      lastMtime = st.mtimeMs
    }
    if (stableCount >= SIZE_STABLE_POLLS) {
      const text = await readUtf8WithRetry(filePath, isStale)
      if (text !== undefined) return text
      stableCount = 0
    }
    await sleep(SIZE_POLL_MS)
  }

  if (isStale?.()) return null
  const text = await readUtf8WithRetry(filePath, isStale)
  return text ?? null
}

async function readUtf8WithRetry(
  filePath: string,
  isStale?: () => boolean
): Promise<string | null | undefined> {
  for (let i = 0; i < READ_RETRY_MAX; i++) {
    if (isStale?.()) return null
    try {
      if (!existsSync(filePath)) return null
      return readFileSync(filePath, 'utf-8')
    } catch (err) {
      if (!isTransientFsError(err)) throw err
      await sleep(READ_RETRY_MS)
    }
  }
  return undefined
}
