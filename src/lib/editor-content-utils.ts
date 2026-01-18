/**
 * Utilities for converting between rendered content and raw markdown
 * Used by the Obsidian-style editor to extract markdown from contenteditable elements
 */

import type { Token, ParsedLine } from './markdown-parser'

/**
 * Extract raw markdown text from a rendered contenteditable line element
 * Walks through DOM nodes and reconstructs markdown syntax
 */
export function extractTextFromRenderedLine(element: HTMLElement): string {
  let result = ''
  
  // Helper to extract text from a node
  const extractFromNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      // Normalize whitespace: replace sequences of whitespace (including newlines) with a single space
      // But preserve the text content (don't trim, as spaces between elements are important)
      return text.replace(/\s+/g, ' ')
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tagName = el.tagName.toLowerCase()
      const className = el.className || ''
      
      // Check if this is a syntax marker (should be skipped in extraction)
      if (className.includes('editor-syntax-marker')) {
        return '' // Don't include syntax markers in extracted text
      }
      
      let content = ''
      for (const child of Array.from(el.childNodes)) {
        const childResult = extractFromNode(child)
        // If previous was an element and this is text starting with space, preserve it
        // Otherwise, if previous was text ending with space and this is element, we're fine
        // The key is to preserve spaces that exist in the DOM between elements and text
        content += childResult
      }
      
      // Reconstruct markdown based on element type
      if (tagName === 'strong' || className.includes('editor-bold')) {
        return `**${content}**`
      }
      if (tagName === 'em' || className.includes('editor-italic')) {
        return `*${content}*`
      }
      if (tagName === 'code' || className.includes('editor-inline-code')) {
        return `\`${content}\``
      }
      if (tagName === 'del' || className.includes('editor-strikethrough')) {
        return `~~${content}~~`
      }
      if (tagName === 'a' || className.includes('editor-link')) {
        const href = el.getAttribute('href') || ''
        return `[${content}](${href})`
      }
      if (tagName.startsWith('h') && /^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName[1], 10)
        // Normalize content: trim leading/trailing whitespace, collapse internal spaces
        const normalizedContent = content.trim().replace(/\s+/g, ' ')
        return `${'#'.repeat(level)} ${normalizedContent}`
      }
      
      // Handle list items and blockquotes - extract from content spans
      if (className.includes('editor-list-content') || className.includes('editor-blockquote-content')) {
        return content
      }
      
      // Handle list markers and blockquote markers - skip them (they're in syntax markers)
      if (className.includes('editor-list-marker') || className.includes('editor-blockquote-marker')) {
        return '' // These are handled by line type detection
      }
      
      return content
    }
    
    return ''
  }
  
  // Check if this is a header, list, or blockquote wrapper
  const firstChild = element.firstElementChild
  if (firstChild) {
    const tagName = firstChild.tagName.toLowerCase()
    const className = firstChild.className || ''
    
    // Headers
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1], 10)
      const headerContent = extractFromNode(firstChild)
      return `${'#'.repeat(level)} ${headerContent}`
    }
    
    // Lists
    if (className.includes('editor-list-item')) {
      const markerEl = firstChild.querySelector('.editor-list-marker')
      const contentEl = firstChild.querySelector('.editor-list-content')
      
      let marker = ''
      if (markerEl) {
        // Check if it's ordered or unordered
        const markerText = markerEl.textContent || ''
        if (/^\d+\./.test(markerText)) {
          marker = markerText.match(/^(\d+\.)/)?.[1] || '1.'
        } else if (/^[-*+]/.test(markerText)) {
          marker = markerText[0]
        }
      }
      
      const content = contentEl ? extractFromNode(contentEl) : ''
      return `${marker} ${content}`
    }
    
    // Blockquotes
    if (className.includes('editor-blockquote')) {
      const contentEl = firstChild.querySelector('.editor-blockquote-content')
      const content = contentEl ? extractFromNode(contentEl) : ''
      return `> ${content}`
    }
  }
  
  // Extract from all child nodes (for paragraphs)
  for (const child of Array.from(element.childNodes)) {
    result += extractFromNode(child)
  }
  
  // Normalize: collapse multiple spaces to single space, then trim
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Insert syntax markers into a line for display when focused
 * Returns the line with syntax markers inserted as text
 */
export function insertSyntaxMarkers(_line: string, _tokens: Array<Token>): string {
  // This function is used to prepare text for display with markers
  // The actual insertion happens in the rendering layer
  // This is a placeholder that returns the original line
  // The real work is done in EditorLine component
  return _line
}

/**
 * Remove syntax markers from a line that was edited with markers visible
 * This is used when converting edited content back to raw markdown
 */
export function removeSyntaxMarkers(lineWithMarkers: string): string {
  // Remove syntax markers that might have been inserted during editing
  // This is a fallback - the main extraction should use extractTextFromRenderedLine
  
  let result = lineWithMarkers
  
  // Remove header markers at start
  result = result.replace(/^#{1,6}\s+/, '')
  
  // Remove list markers
  result = result.replace(/^(\s*)([-*+]|\d+\.)\s+/, '$1')
  
  // Remove blockquote markers
  result = result.replace(/^>+\s*/, '')
  
  // Note: Inline markers (**, *, `, etc.) are handled by extractTextFromRenderedLine
  // which reconstructs them based on DOM structure
  
  return result
}

/**
 * Get the raw markdown offset that corresponds to a rendered position
 * Accounts for syntax markers when line is focused
 */
export function getRawOffsetFromRendered(
  parsed: ParsedLine,
  renderedOffset: number,
  isFocused: boolean
): number {
  const { lineType, tokens } = parsed
  let rawOffset = 0
  let renderedStartOffset = 0
  
  // Account for line type prefix
  // When focused, the prefix is visible in the rendered DOM
  // When unfocused, the prefix is not visible, but we need to account for it in raw offset
  if (lineType.type === 'header') {
    const prefixLength = lineType.level + 1 // "# ".length
    if (isFocused) {
      // Prefix is visible, so rendered offset includes it
      renderedStartOffset = prefixLength
    }
    // Always add prefix to raw offset since it exists in raw markdown
    rawOffset = prefixLength
  } else if (lineType.type === 'unordered-list') {
    const prefixLength = lineType.marker.length + 1 // "- ".length
    if (isFocused) {
      renderedStartOffset = prefixLength
    }
    rawOffset = prefixLength
  } else if (lineType.type === 'ordered-list') {
    const numStr = lineType.number.toString()
    const prefixLength = numStr.length + 2 // "1. ".length
    if (isFocused) {
      renderedStartOffset = prefixLength
    }
    rawOffset = prefixLength
  } else if (lineType.type === 'blockquote') {
    const prefixLength = lineType.indent + 1 // "> ".length
    if (isFocused) {
      renderedStartOffset = prefixLength
    }
    rawOffset = prefixLength
  }
  
  // Adjust rendered offset: if unfocused, we need to account for the prefix that's not in the DOM
  // If focused, the rendered offset already includes the prefix
  const adjustedRenderedOffset = isFocused ? renderedOffset : renderedOffset + renderedStartOffset
  
  // Walk through tokens to find where the rendered offset falls
  let currentRenderedOffset = renderedStartOffset
  
  for (const token of tokens) {
    const tokenRenderedLength = getTokenRenderedLength(token, isFocused)
    
    if (adjustedRenderedOffset <= currentRenderedOffset + tokenRenderedLength) {
      // Cursor is within this token
      const offsetInToken = adjustedRenderedOffset - currentRenderedOffset
      const rawOffsetInToken = getRawOffsetInToken(token, offsetInToken, isFocused)
      return rawOffset + rawOffsetInToken
    }
    
    currentRenderedOffset += tokenRenderedLength
    rawOffset += getTokenRawLength(token)
  }
  
  return rawOffset
}

/**
 * Get the rendered position that corresponds to a raw markdown offset
 */
export function getRenderedOffsetFromRaw(
  parsed: ParsedLine,
  rawOffset: number,
  isFocused: boolean
): number {
  const { lineType, tokens } = parsed
  let renderedOffset = 0
  let currentRawOffset = 0
  
  // Add offset for line type prefix
  if (isFocused) {
    if (lineType.type === 'header') {
      renderedOffset += lineType.level + 1
      currentRawOffset += lineType.level + 1
    } else if (lineType.type === 'unordered-list') {
      renderedOffset += lineType.marker.length + 1
      currentRawOffset += lineType.marker.length + 1
    } else if (lineType.type === 'ordered-list') {
      const numStr = lineType.number.toString()
      renderedOffset += numStr.length + 2
      currentRawOffset += numStr.length + 2
    } else if (lineType.type === 'blockquote') {
      renderedOffset += lineType.indent + 1
      currentRawOffset += lineType.indent + 1
    }
  }
  
  // Walk through tokens
  for (const token of tokens) {
    const tokenRawLength = getTokenRawLength(token)
    
    if (rawOffset <= currentRawOffset + tokenRawLength) {
      // Cursor is within this token
      const offsetInToken = rawOffset - currentRawOffset
      const renderedOffsetInToken = getRenderedOffsetInToken(token, offsetInToken, isFocused)
      return renderedOffset + renderedOffsetInToken
    }
    
    currentRawOffset += tokenRawLength
    renderedOffset += getTokenRenderedLength(token, isFocused)
  }
  
  return renderedOffset
}

/**
 * Get the rendered length of a token (accounting for syntax markers)
 */
function getTokenRenderedLength(token: Token, isFocused: boolean): number {
  switch (token.type) {
    case 'text':
      return token.content.length
    case 'bold':
      return token.content.length + (isFocused ? 4 : 0) // **content**
    case 'italic':
      return token.content.length + (isFocused ? 2 : 0) // *content*
    case 'code':
      return token.content.length + (isFocused ? 2 : 0) // `content`
    case 'strikethrough':
      return token.content.length + (isFocused ? 4 : 0) // ~~content~~
    case 'link':
      if (isFocused) {
        return token.text.length + token.url.length + 4 // [text](url)
      }
      return token.text.length
    default:
      // TypeScript doesn't know this can't happen, but we handle it safely
      return 0
  }
}

/**
 * Get the raw markdown length of a token
 */
function getTokenRawLength(token: Token): number {
  switch (token.type) {
    case 'text':
      return token.content.length
    case 'bold':
    case 'italic':
    case 'code':
    case 'strikethrough':
      return token.raw.length
    case 'link':
      return token.raw.length
    default:
      // TypeScript doesn't know this can't happen, but we handle it safely
      return 0
  }
}

/**
 * Get the raw offset within a token from a rendered offset
 */
function getRawOffsetInToken(
  token: Token,
  renderedOffset: number,
  isFocused: boolean
): number {
  if (token.type === 'text') {
    return renderedOffset
  }
  
  if (isFocused) {
    // Account for opening markers
    let markerLength = 0
    let contentLength = 0
    let isLink = false
    
    if (token.type === 'bold') {
      markerLength = 2
      contentLength = token.content.length
    } else if (token.type === 'italic') {
      markerLength = 1
      contentLength = token.content.length
    } else if (token.type === 'code') {
      markerLength = 1
      contentLength = token.content.length
    } else if (token.type === 'strikethrough') {
      markerLength = 2
      contentLength = token.content.length
    } else {
      // token.type must be 'link' at this point
      markerLength = 1 // [
      contentLength = token.text.length
      isLink = true
    }
    
    if (renderedOffset < markerLength) {
      return 0 // Cursor is in the opening marker
    }
    
    const contentOffset = renderedOffset - markerLength
    
    if (contentOffset > contentLength) {
      return getTokenRawLength(token) // Cursor is after the content
    }
    
    // Cursor is in the content
    if (isLink) {
      // For links, we need to account for ](url) after content
      return markerLength + contentOffset // Position in [text](url)
    }
    
    return markerLength + contentOffset
  }
  
  // Not focused, no markers
  return renderedOffset
}

/**
 * Get the rendered offset within a token from a raw offset
 */
function getRenderedOffsetInToken(
  token: Token,
  rawOffset: number,
  isFocused: boolean
): number {
  if (token.type === 'text') {
    return rawOffset
  }
  
  let contentLength = 0
  if (token.type === 'link') {
    contentLength = token.text.length
  } else {
    contentLength = token.content.length
  }
  
  if (isFocused) {
    // Account for opening markers
    let markerLength = 0
    if (token.type === 'bold') markerLength = 2
    else if (token.type === 'italic') markerLength = 1
    else if (token.type === 'code') markerLength = 1
    else if (token.type === 'strikethrough') markerLength = 2
    else markerLength = 1 // token.type must be 'link' at this point
    
    if (rawOffset < markerLength) {
      return rawOffset // Cursor is in the opening marker
    }
    
    const contentOffset = rawOffset - markerLength
    if (contentOffset > contentLength) {
      return markerLength + contentLength // Cursor is after the content
    }
    
    return markerLength + contentOffset
  }
  
  // Not focused, map directly
  return Math.min(rawOffset, contentLength)
}
