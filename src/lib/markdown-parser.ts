/**
 * Markdown parser for live preview editor
 * Parses inline markdown elements and detects line types
 */

export type Token =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string; raw: string }
  | { type: 'italic'; content: string; raw: string }
  | { type: 'code'; content: string; raw: string }
  | { type: 'link'; text: string; url: string; raw: string }
  | { type: 'strikethrough'; content: string; raw: string }

export type LineType =
  | { type: 'paragraph' }
  | { type: 'header'; level: number }
  | { type: 'unordered-list'; marker: string; indent: number }
  | { type: 'ordered-list'; number: number; indent: number }
  | { type: 'blockquote'; indent: number }
  | { type: 'horizontal-rule' }
  | { type: 'code-fence'; language?: string; isStart: boolean }
  | { type: 'empty' }

export interface ParsedLine {
  lineType: LineType
  tokens: Array<Token>
  raw: string
}

/**
 * Parse inline markdown elements in a line
 * Handles: bold, italic, code, links, strikethrough
 */
export function parseInlineMarkdown(text: string): Array<Token> {
  if (!text) return [{ type: 'text', content: '' }]

  const tokens: Array<Token> = []
  let i = 0
  let textStart = 0
  const len = text.length

  while (i < len) {
    // Treat escaped markers as literal text
    if (text[i] === '\\' && i + 1 < len) {
      i += 2
      continue
    }

    // Try to match inline elements in priority order
    // 1. Code (backticks) - highest priority, no nesting
    const codeMatch = matchCode(text, i)
    if (codeMatch) {
      // Add any text before the match
      if (textStart < codeMatch.start) {
        tokens.push({ type: 'text', content: text.slice(textStart, codeMatch.start) })
      }
      tokens.push({
        type: 'code',
        content: codeMatch.content,
        raw: codeMatch.raw,
      })
      i = codeMatch.end
      textStart = i
      continue
    }

    // 2. Links - [text](url) or [text][ref]
    const linkMatch = matchLink(text, i)
    if (linkMatch) {
      if (textStart < linkMatch.start) {
        tokens.push({ type: 'text', content: text.slice(textStart, linkMatch.start) })
      }
      tokens.push({
        type: 'link',
        text: linkMatch.text,
        url: linkMatch.url,
        raw: linkMatch.raw,
      })
      i = linkMatch.end
      textStart = i
      continue
    }

    // 3. Strikethrough - ~~text~~
    const strikethroughMatch = matchStrikethrough(text, i)
    if (strikethroughMatch) {
      if (textStart < strikethroughMatch.start) {
        tokens.push({ type: 'text', content: text.slice(textStart, strikethroughMatch.start) })
      }
      tokens.push({
        type: 'strikethrough',
        content: strikethroughMatch.content,
        raw: strikethroughMatch.raw,
      })
      i = strikethroughMatch.end
      textStart = i
      continue
    }

    // 4. Bold - **text** or __text__
    const boldMatch = matchBold(text, i)
    if (boldMatch) {
      if (textStart < boldMatch.start) {
        tokens.push({ type: 'text', content: text.slice(textStart, boldMatch.start) })
      }
      tokens.push({
        type: 'bold',
        content: boldMatch.content,
        raw: boldMatch.raw,
      })
      i = boldMatch.end
      textStart = i
      continue
    }

    // 5. Italic - *text* or _text_ (but not if it's part of bold)
    const italicMatch = matchItalic(text, i)
    if (italicMatch) {
      if (textStart < italicMatch.start) {
        tokens.push({ type: 'text', content: text.slice(textStart, italicMatch.start) })
      }
      tokens.push({
        type: 'italic',
        content: italicMatch.content,
        raw: italicMatch.raw,
      })
      i = italicMatch.end
      textStart = i
      continue
    }

    // No match, advance one character (text accumulates)
    i++
  }

  // Add remaining text
  if (textStart < len) {
    tokens.push({ type: 'text', content: text.slice(textStart) })
  }

  // Merge adjacent text tokens
  return mergeTextTokens(tokens)
}

/**
 * Detect the type of a line (header, list, blockquote, etc.)
 */
export function getLineType(line: string): LineType {
  const trimmed = line.trim()

  if (trimmed === '') {
    return { type: 'empty' }
  }

  // Horizontal rule
  if (/^[-*_]{3,}$/.test(trimmed)) {
    return { type: 'horizontal-rule' }
  }

  // Headers: # through ######
  const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
  if (headerMatch) {
    return { type: 'header', level: headerMatch[1].length }
  }

  // Code fence: ``` or ```language
  if (trimmed.startsWith('```')) {
    const language = trimmed.slice(3).trim() || undefined
    return { type: 'code-fence', language, isStart: true }
  }

  // Blockquote: > or >>>
  const blockquoteMatch = line.match(/^(>+)\s*/)
  if (blockquoteMatch) {
    return { type: 'blockquote', indent: blockquoteMatch[1].length }
  }

  // Unordered list: -, *, or +
  const unorderedMatch = line.match(/^(\s*)([-*+])\s+/)
  if (unorderedMatch) {
    return {
      type: 'unordered-list',
      marker: unorderedMatch[2],
      indent: unorderedMatch[1].length,
    }
  }

  // Ordered list: 1., 2., etc.
  const orderedMatch = line.match(/^(\s*)(\d+)\.\s+/)
  if (orderedMatch) {
    return {
      type: 'ordered-list',
      number: parseInt(orderedMatch[2], 10),
      indent: orderedMatch[1].length,
    }
  }

  return { type: 'paragraph' }
}

/**
 * Tokenize a line: combine line type detection with inline parsing
 */
export function tokenizeLine(line: string): ParsedLine {
  const lineType = getLineType(line)

  // For code fences, don't parse inline markdown
  if (lineType.type === 'code-fence') {
    return {
      lineType,
      tokens: [{ type: 'text', content: line }],
      raw: line,
    }
  }

  // For headers, remove the # prefix before parsing
  let contentToParse = line
  if (lineType.type === 'header') {
    contentToParse = line.replace(/^#{1,6}\s+/, '')
  }

  // For lists, remove the marker before parsing
  if (lineType.type === 'unordered-list') {
    contentToParse = line.replace(/^\s*[-*+]\s+/, '')
  } else if (lineType.type === 'ordered-list') {
    contentToParse = line.replace(/^\s*\d+\.\s+/, '')
  } else if (lineType.type === 'blockquote') {
    contentToParse = line.replace(/^>+\s*/, '')
  }

  const tokens = parseInlineMarkdown(contentToParse)

  return {
    lineType,
    tokens,
    raw: line,
  }
}

// Helper functions for matching inline elements

function matchCode(text: string, start: number): { start: number; end: number; content: string; raw: string } | null {
  if (text[start] !== '`') return null

  let backticks = 1
  let i = start + 1
  while (i < text.length && text[i] === '`') {
    backticks++
    i++
  }

  // Find matching closing backticks
  const searchStart = i
  while (i < text.length) {
    if (text[i] === '`') {
      let closingCount = 1
      let j = i + 1
      while (j < text.length && text[j] === '`') {
        closingCount++
        j++
      }
      if (closingCount >= backticks) {
        const content = text.slice(searchStart, i)
        const raw = text.slice(start, j)
        return { start, end: j, content, raw }
      }
      i = j
    } else {
      i++
    }
  }

  return null // Unclosed code
}

function matchLink(text: string, start: number): { start: number; end: number; text: string; url: string; raw: string } | null {
  if (text[start] !== '[') return null

  // Find closing ]
  let i = start + 1
  let escaped = false
  while (i < text.length) {
    if (escaped) {
      escaped = false
      i++
      continue
    }
    if (text[i] === '\\') {
      escaped = true
      i++
      continue
    }
    if (text[i] === ']') {
      break
    }
    i++
  }

  if (i >= text.length || text[i] !== ']') return null

  const linkText = text.slice(start + 1, i)
  i++ // Skip ]

  // Check for (url) format
  if (i < text.length && text[i] === '(') {
    const urlStart = i + 1
    let urlEnd = urlStart
    let urlEscaped = false
    while (urlEnd < text.length) {
      if (urlEscaped) {
        urlEscaped = false
        urlEnd++
        continue
      }
      if (text[urlEnd] === '\\') {
        urlEscaped = true
        urlEnd++
        continue
      }
      if (text[urlEnd] === ')') {
        break
      }
      urlEnd++
    }

    if (urlEnd < text.length && text[urlEnd] === ')') {
      const url = text.slice(urlStart, urlEnd)
      const raw = text.slice(start, urlEnd + 1)
      return { start, end: urlEnd + 1, text: linkText, url, raw }
    }
  }

  return null
}

function matchStrikethrough(text: string, start: number): { start: number; end: number; content: string; raw: string } | null {
  if (text[start] !== '~' || text[start + 1] !== '~') return null

  // Find closing ~~
  let i = start + 2
  while (i < text.length - 1) {
    if (text[i] === '~' && text[i + 1] === '~') {
      const content = text.slice(start + 2, i)
      const raw = text.slice(start, i + 2)
      return { start, end: i + 2, content, raw }
    }
    i++
  }

  return null // Unclosed strikethrough
}

function matchBold(text: string, start: number): { start: number; end: number; content: string; raw: string } | null {
  // Try **text** first
  if (text[start] === '*' && text[start + 1] === '*') {
    let i = start + 2
    while (i < text.length - 1) {
      if (text[i] === '*') {
        let runLength = 1
        while (i + runLength < text.length && text[i + runLength] === '*') {
          runLength++
        }
        if (runLength >= 2) {
          const closingStart =
            runLength % 2 === 1 && runLength >= 3 ? i + runLength - 2 : i
          const content = text.slice(start + 2, closingStart)
          const raw = text.slice(start, closingStart + 2)
          return { start, end: closingStart + 2, content, raw }
        }
        i += runLength
        continue
      }
      i++
    }
  }

  // Try __text__
  if (text[start] === '_' && text[start + 1] === '_') {
    let i = start + 2
    while (i < text.length - 1) {
      if (text[i] === '_' && text[i + 1] === '_') {
        const content = text.slice(start + 2, i)
        const raw = text.slice(start, i + 2)
        return { start, end: i + 2, content, raw }
      }
      i++
    }
  }

  return null
}

function matchItalic(text: string, start: number): { start: number; end: number; content: string; raw: string } | null {
  // Single * (not **)
  if (text[start] === '*' && text[start + 1] !== '*') {
    let i = start + 1
    while (i < text.length) {
      if (text[i] === '*' && (i === text.length - 1 || text[i + 1] !== '*')) {
        const content = text.slice(start + 1, i)
        const raw = text.slice(start, i + 1)
        return { start, end: i + 1, content, raw }
      }
      i++
    }
  }

  // Single _ (not __ and not part of word boundary issues)
  if (text[start] === '_' && text[start + 1] !== '_') {
    // Check word boundary - _ should be followed by non-whitespace
    if (start + 1 < text.length && /\S/.test(text[start + 1])) {
      let i = start + 1
      while (i < text.length) {
        if (text[i] === '_' && (i === text.length - 1 || text[i + 1] !== '_')) {
          const content = text.slice(start + 1, i)
          const raw = text.slice(start, i + 1)
          return { start, end: i + 1, content, raw }
        }
        i++
      }
    }
  }

  return null
}

function mergeTextTokens(tokens: Array<Token>): Array<Token> {
  const merged: Array<Token> = []
  let currentText = ''

  for (const token of tokens) {
    if (token.type === 'text') {
      currentText += token.content
    } else {
      if (currentText) {
        merged.push({ type: 'text', content: currentText })
        currentText = ''
      }
      merged.push(token)
    }
  }

  if (currentText) {
    merged.push({ type: 'text', content: currentText })
  }

  return merged.length > 0 ? merged : [{ type: 'text', content: '' }]
}

