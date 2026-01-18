/**
 * Utilities for converting between cursor positions (offsets) and line/column coordinates
 */

export interface LineCol {
  line: number
  col: number
}

/**
 * Convert a character offset to line and column coordinates
 * Lines are 0-indexed, columns are 0-indexed
 * Newline characters are included in the column count of the line they terminate
 * The first character after a newline is considered col = lineLength + 1 of the previous line
 */
export function offsetToLineCol(content: string, offset: number): LineCol {
  const clamped = Math.max(0, Math.min(content.length, offset))
  
  const lines = content.split('\n')
  let currentOffset = 0
  
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length
    const lineStart = currentOffset
    const newlinePos = i < lines.length - 1 ? lineStart + lineLength : null
    const lineEndAfterNewline = newlinePos !== null ? newlinePos + 1 : lineStart + lineLength
    
    if (clamped <= lineStart + lineLength) {
      // Within the line content (including newline position for non-last lines)
      return { line: i, col: clamped - lineStart }
    } else if (newlinePos !== null && clamped === lineEndAfterNewline) {
      // First character after newline is col = lineLength + 1 of current line
      return { line: i, col: lineLength + 1 }
    } else if (clamped > lineEndAfterNewline) {
      // Move to next line
      currentOffset = lineEndAfterNewline
      continue
    }
    
    currentOffset = lineEndAfterNewline
  }
  
  // Fallback: should not reach here
  return { line: lines.length - 1, col: lines[lines.length - 1].length }
}

/**
 * Convert line and column coordinates to a character offset
 * Lines and columns are 0-indexed
 * Column can include the newline character (col = lineLength includes the newline)
 */
export function lineColToOffset(content: string, line: number, col: number): number {
  const lines = content.split('\n')
  const clampedLine = Math.max(0, Math.min(lines.length - 1, line))

  let offset = 0
  for (let i = 0; i < clampedLine; i++) {
    offset += lines[i].length + 1 // +1 for newline
  }

  const lineLength = lines[clampedLine]?.length ?? 0
  // Allow col to be lineLength + 1 to include the newline, but clamp to actual content
  const maxCol = clampedLine < lines.length - 1 ? lineLength + 1 : lineLength
  const clampedCol = Math.max(0, Math.min(maxCol, col))
  offset += clampedCol

  return Math.min(offset, content.length)
}

/**
 * Get the line number that contains the given offset
 */
export function getLineNumber(content: string, offset: number): number {
  return offsetToLineCol(content, offset).line
}

/**
 * Get the start offset of a line
 */
export function getLineStart(content: string, line: number): number {
  const lines = content.split('\n')
  if (line < 0) {
    return 0
  }
  if (line >= lines.length) {
    return content.length
  }
  return lineColToOffset(content, line, 0)
}

/**
 * Get the end offset of a line (including newline if present)
 * Returns the position of the newline character for non-last lines, or end of content for last line
 * For non-last lines, this is the position that when used in offsetToLineCol gives col = lineLength + 1
 */
export function getLineEnd(content: string, line: number): number {
  const lines = content.split('\n')
  if (line < 0 || line >= lines.length) {
    return content.length
  }

  let offset = 0
  for (let i = 0; i < line; i++) {
    offset += lines[i].length + 1 // +1 for newline
  }
  offset += lines[line].length

  // For non-last lines, return position after newline (which is col = lineLength + 1)
  // For last line, return end of content
  if (line < lines.length - 1) {
    // Return position after newline (first char of next line)
    return offset + 1
  }
  
  return offset
}

/**
 * Get the text content of a specific line
 */
export function getLineContent(content: string, line: number): string {
  const lines = content.split('\n')
  if (line < 0 || line >= lines.length) {
    return ''
  }
  return lines[line]
}

/**
 * Get all lines as an array
 */
export function getLines(content: string): string[] {
  return content.split('\n')
}

/**
 * Check if an offset is within a line range
 */
export function isOffsetInLineRange(
  content: string,
  offset: number,
  startLine: number,
  endLine: number
): boolean {
  const { line } = offsetToLineCol(content, offset)
  return line >= startLine && line <= endLine
}

