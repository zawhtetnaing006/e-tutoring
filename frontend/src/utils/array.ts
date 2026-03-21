export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set<T[keyof T]>()
  return array.filter(item => {
    // eslint-disable-next-line security/detect-object-injection
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey =
        // eslint-disable-next-line security/detect-object-injection
        typeof key === 'function' ? String(key(item)) : String(item[key])
      // eslint-disable-next-line security/detect-object-injection
      const existingGroup = groups[groupKey]
      if (!existingGroup) {
        // eslint-disable-next-line security/detect-object-injection
        groups[groupKey] = []
      }
      // eslint-disable-next-line security/detect-object-injection
      groups[groupKey]!.push(item)
      return groups
    },
    {} as Record<string, T[]>
  )
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    // eslint-disable-next-line security/detect-object-injection
    const aVal = a[key]
    // eslint-disable-next-line security/detect-object-injection
    const bVal = b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function flatten<T>(arrays: T[][]): T[] {
  return arrays.flat()
}

export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = []
  const falsy: T[] = []

  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item)
    } else {
      falsy.push(item)
    }
  })

  return [truthy, falsy]
}

export function isEmptyArray(array: unknown[] | null | undefined): boolean {
  return !array || array.length === 0
}

export function isNotEmptyArray(array: unknown[] | null | undefined): boolean {
  return !isEmptyArray(array)
}
