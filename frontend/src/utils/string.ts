export function truncate(str: string | null | undefined, max: number): string {
  if (!str) return ''
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

export function getExcerpt(content: string, maxLength: number = 145): string {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}...`
}

export function stripHtml(content: string): string {
  if (typeof window === 'undefined') {
    return content.replace(/<[^>]*>/g, ' ')
  }

  const doc = new DOMParser().parseFromString(content, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function hasMeaningfulContent(content: string): boolean {
  return stripHtml(content).length > 0
}

export function sanitizeRichText(content: string): string {
  if (typeof window === 'undefined') return content

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const allowedTags = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'div',
  ])

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
  const elements: Element[] = []
  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element)
  }

  elements.forEach(element => {
    const tag = element.tagName.toLowerCase()

    if (!allowedTags.has(tag)) {
      const parent = element.parentNode
      if (!parent) return
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element)
      }
      parent.removeChild(element)
      return
    }

    Array.from(element.attributes).forEach(attribute => {
      if (tag === 'a' && attribute.name === 'href') return
      element.removeAttribute(attribute.name)
    })

    if (tag === 'a') {
      const href = element.getAttribute('href') ?? ''
      const safe = /^(https?:|mailto:)/i.test(href)
      if (!safe) {
        element.removeAttribute('href')
      } else {
        element.setAttribute('rel', 'noopener noreferrer')
        element.setAttribute('target', '_blank')
      }
    }
  })

  return doc.body.innerHTML
}

export function hashtagsToInput(hashtags: string[] | undefined): string {
  return (hashtags ?? []).join(', ')
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function capitalizeWords(str: string): string {
  if (!str) return ''
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isEmptyString(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/** Parses a URL/search param as a positive integer, or returns null if invalid. */
export function parsePositiveIntParam(value: string | null): number | null {
  if (value == null) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
