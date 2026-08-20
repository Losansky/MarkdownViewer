import { readFileSync } from 'fs'

interface JsonSchema {
  type?: string | string[]
  enum?: unknown[]
  const?: unknown
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  additionalProperties?: boolean | JsonSchema
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  required?: string[]
}

let cached: { path: string; schema: JsonSchema } | null = null

function loadSchema(schemaPath: string): JsonSchema {
  if (cached?.path === schemaPath) return cached.schema
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as JsonSchema
  cached = { path: schemaPath, schema }
  return schema
}

export function validatePresentationConfig(
  config: unknown,
  schemaPath: string
): { valid: true } | { valid: false; message: string } {
  const errors: string[] = []
  try {
    const schema = loadSchema(schemaPath)
    validateValue(config, schema, '(root)', errors)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { valid: false, message: `Could not validate presentation.json: ${message}` }
  }
  if (errors.length === 0) return { valid: true }
  const shown = errors.slice(0, 5)
  if (errors.length > 5) shown.push(`…and ${errors.length - 5} more`)
  return { valid: false, message: `Invalid presentation.json — ${shown.join('; ')}` }
}

function validateValue(value: unknown, schema: JsonSchema, path: string, errors: string[]): void {
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected ${JSON.stringify(schema.const)}`)
    return
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: expected one of ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}`)
    return
  }

  const types = schema.type ? (Array.isArray(schema.type) ? schema.type : [schema.type]) : null
  if (types) {
    const ok = types.some((t) => matchesType(value, t))
    if (!ok) {
      errors.push(`${path}: expected ${types.join(' | ')}, got ${valueType(value)}`)
      return
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: must be ≥ ${schema.minimum}`)
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: must be ≤ ${schema.maximum}`)
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: expected at least ${schema.minItems} items`)
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: expected at most ${schema.maxItems} items`)
    }
    if (schema.items) {
      value.forEach((item, i) => validateValue(item, schema.items as JsonSchema, `${path}[${i}]`, errors))
    }
  }

  if (isObject(value) && schema.properties) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}: missing ${key}`)
    }
    for (const [key, child] of Object.entries(schema.properties)) {
      if (key in value) validateValue(value[key], child, `${path}.${key}`, errors)
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const key of Object.keys(value)) {
        if (key in schema.properties) continue
        validateValue(value[key], schema.additionalProperties, `${path}.${key}`, errors)
      }
    }
  }
}

function matchesType(value: unknown, type: string): boolean {
  if (type === 'null') return value === null
  if (type === 'object') return isObject(value)
  if (type === 'array') return Array.isArray(value)
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value)
  return typeof value === type
}

function valueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
