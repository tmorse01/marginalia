/**
 * Utility functions for editor cursor positioning and marker extraction
 */

/**
 * Map raw markdown column to rendered DOM offset
 * Accounts for syntax markers when line is focused
 */
export function getRenderedOffsetFromRawCol(
  line: string,
  rawCol: number,
  isFocused: boolean
): number {
  if (!isFocused) {
    return rawCol
  }

  const trimmed = line.trim()
  let prefixLength = 0
  const leadingWhitespace = line.length - trimmed.length

  // Account for line type prefix (##, -, >, etc.)
  if (trimmed.startsWith('#')) {
    const match = trimmed.match(/^(#{1,6})\s+/)
    if (match) {
      prefixLength = match[0].length
    }
  } else if (/^[-*+]\s+/.test(trimmed)) {
    prefixLength = 2
  } else if (/^\d+\.\s+/.test(trimmed)) {
    const match = trimmed.match(/^(\d+)\.\s+/)
    if (match) {
      prefixLength = match[0].length
    }
  } else if (trimmed.startsWith('>')) {
    const match = line.match(/^(>+)\s*/)
    if (match) {
      prefixLength = match[0].length
    }
  }

  // If cursor is in leading whitespace, return as-is
  if (rawCol <= leadingWhitespace) {
    return rawCol
  }

  // Map to rendered position (add prefix length)
  const offsetInContent = rawCol - leadingWhitespace
  return leadingWhitespace + prefixLength + offsetInContent
}

/**
 * Calculate the rendered text offset up to a given range, excluding syntax markers
 * This matches how findTextNodeAtOffset counts offsets
 */
export function getRenderedTextOffsetUpToRange(
  element: HTMLElement,
  range: Range
): number {
  let offset = 0
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        // Skip syntax markers (same logic as findTextNodeAtOffset)
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          if (el.className && el.className.includes('editor-syntax-marker')) {
            return NodeFilter.FILTER_REJECT
          }
        }
        return NodeFilter.FILTER_ACCEPT
      },
    }
  )

  let node: Node | null = null
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0
      
      // Check if range end is before, within, or after this text node
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      
      const compareStart = range.compareBoundaryPoints(Range.END_TO_START, nodeRange)
      const compareEnd = range.compareBoundaryPoints(Range.END_TO_END, nodeRange)
      
      if (compareStart > 0) {
        // Range end is after this node, count all of it
        offset += textLength
      } else if (compareEnd <= 0) {
        // Range end is before this node, we're done
        break
      } else {
        // Range end is within this node
        const partialRange = document.createRange()
        partialRange.setStart(node, 0)
        partialRange.setEnd(range.endContainer, range.endOffset)
        offset += partialRange.toString().length
        break
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (!el.className || !el.className.includes('editor-syntax-marker')) {
        // For non-syntax-marker elements, we need to check if range is within
        // But since we're walking text nodes, we'll handle it when we encounter text nodes
        // This branch is mainly for structure, the actual counting happens at text nodes
      }
    }
  }

  return offset
}

/**
 * Find the text node and offset at a given character offset in the DOM
 */
export function findTextNodeAtOffset(
  element: HTMLElement,
  offset: number
): { node: Node | null; offset: number } {
  let currentOffset = 0
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        // Skip syntax markers
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          if (el.className && el.className.includes('editor-syntax-marker')) {
            return NodeFilter.FILTER_REJECT
          }
        }
        return NodeFilter.FILTER_ACCEPT
      },
    }
  )

  let node: Node | null = null
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0
      if (currentOffset + textLength >= offset) {
        return {
          node,
          offset: offset - currentOffset,
        }
      }
      currentOffset += textLength
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // For elements, we count their text content
      const textContent = node.textContent || ''
      // Skip syntax markers - they don't count toward offset
      const el = node as HTMLElement
      if (!el.className || !el.className.includes('editor-syntax-marker')) {
        if (currentOffset + textContent.length >= offset) {
          // Recurse into this element
          return findTextNodeAtOffset(el, offset - currentOffset)
        }
        currentOffset += textContent.length
      }
    }
  }

  // If we didn't find it, return the last text node
  const lastTextNode = getLastTextNode(element)
  if (lastTextNode) {
    return {
      node: lastTextNode,
      offset: lastTextNode.textContent?.length || 0,
    }
  }

  return { node: null, offset: 0 }
}

/**
 * Get the last text node in an element
 */
export function getLastTextNode(element: HTMLElement): Node | null {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip syntax markers
        const parent = node.parentElement
        if (parent && parent.className && parent.className.includes('editor-syntax-marker')) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    }
  )

  let lastNode: Node | null = null
  let node: Node | null = null
  while ((node = walker.nextNode())) {
    lastNode = node
  }

  return lastNode
}

/**
 * Extract bold markers from raw markdown
 */
export function extractBoldMarkers(raw: string): [string, string] | null {
  if (raw.startsWith('**') && raw.endsWith('**')) {
    return ['**', '**']
  }
  if (raw.startsWith('__') && raw.endsWith('__')) {
    return ['__', '__']
  }
  return null
}

/**
 * Extract italic markers from raw markdown
 */
export function extractItalicMarkers(raw: string): [string, string] | null {
  if (raw.startsWith('*') && raw.endsWith('*') && !raw.startsWith('**')) {
    return ['*', '*']
  }
  if (raw.startsWith('_') && raw.endsWith('_') && !raw.startsWith('__')) {
    return ['_', '_']
  }
  return null
}

/**
 * Extract code markers (backticks) from raw markdown
 */
export function extractCodeMarkers(raw: string): [string, string] | null {
  // Find the opening backticks
  let start = 0
  while (start < raw.length && raw[start] === '`') {
    start++
  }
  if (start === 0) return null

  // Find the closing backticks
  let end = raw.length - 1
  let closingCount = 0
  while (end >= 0 && raw[end] === '`') {
    closingCount++
    end--
  }
  if (closingCount === 0) return null

  const opening = raw.slice(0, start)
  const closing = raw.slice(end + 1)
  return [opening, closing]
}
