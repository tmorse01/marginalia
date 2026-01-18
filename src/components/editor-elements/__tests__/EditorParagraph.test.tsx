import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorParagraph from '../EditorParagraph'
import EditorText from '../EditorText'

describe('EditorParagraph', () => {
  it('renders paragraph with content', () => {
    render(
      <EditorParagraph content={<EditorText content="Paragraph text" />} />
    )
    const paragraph = screen.getByText('Paragraph text').closest('.editor-paragraph')
    expect(paragraph).toBeInTheDocument()
    expect(paragraph?.tagName).toBe('DIV')
  })

  it('renders with multiple children', () => {
    const { container } = render(
      <EditorParagraph
        content={
          <>
            <EditorText content="Hello " />
            <strong>world</strong>
          </>
        }
      />
    )
    const paragraph = container.querySelector('.editor-paragraph')
    expect(paragraph).toBeInTheDocument()
    expect(paragraph?.textContent).toBe('Hello world')
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('renders empty content', () => {
    const { container } = render(<EditorParagraph content={null} />)
    const paragraph = container.querySelector('.editor-paragraph')
    expect(paragraph).toBeInTheDocument()
  })
})
