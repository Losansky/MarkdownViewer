const CSS_COLOR =
  /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|[a-z]+)$/i

export function sanitizeCssColor(color: string, fallback = '#0969da'): string {
  const trimmed = color.trim()
  return CSS_COLOR.test(trimmed) ? trimmed : fallback
}
