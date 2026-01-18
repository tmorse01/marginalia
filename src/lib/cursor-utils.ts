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
 * Newline characters are counted as the last column of their line
 * The first character after a newline starts the next line at col = 0
 */
export function offsetToLineCol(content: string, offset: number): LineCol {
  const clamped = Math.max(0, Math.min(content.length, offset))

  const lines = content.split('\n')
  let currentOffset = 0

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length
    const lineStart = currentOffset

    if (clamped <= lineStart + lineLength) {
      // Within the line content (newline is at col = lineLength for non-last lines)
      return { line: i, col: clamped - lineStart }
    }

    // Move to next line (skip newline)
    currentOffset = lineStart + lineLength + 1
  }

  // Fallback: should not reach here
  return { line: lines.length - 1, col: lines[lines.length - 1].length }
}

/**
 * Convert line and column coordinates to a character offset
 * Lines and columns are 0-indexed
 * Column is clamped to the line length (newline is at col = lineLength for non-last lines)
 */
export function lineColToOffset(content: string, line: number, col: number): number {
  const lines = content.split('\n')
  if (line < 0) {
    return 0
  }
  if (line >= lines.length) {
    return content.length
  }
  const clampedLine = line

  let offset = 0
  for (let i = 0; i < clampedLine; i++) {
    offset += lines[i].length + 1 // +1 for newline
  }

  const lineLength = lines[clampedLine]?.length ?? 0
  const clampedCol = Math.max(0, Math.min(lineLength, col))
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

  // For non-last lines, return position of newline; for last line, end of content
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
export function getLines(content: string): Array<string> {
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

/**
 * Measure the actual character width for monospace font
 * Uses a canvas-based measurement for accuracy
 */
export function measureCharWidth(fontSize: number, fontFamily: string): number {
  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    // Fallback to approximate width
    return fontSize * 0.6
  }

  context.font = `${fontSize}px ${fontFamily}`
  const metrics = context.measureText('M')
  return metrics.width
}

/**
 * Calculate column from click position, accounting for padding
 * Returns the approximate column in the raw markdown line
 */
export function clickPositionToColumn(
  clickX: number,
  paddingLeft: number,
  charWidth: number
): number {
  const x = clickX - paddingLeft
  return Math.max(0, Math.floor(x / charWidth))
}

