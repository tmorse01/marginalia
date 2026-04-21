import { useSyncExternalStore } from 'react'

/** DaisyUI themes where a light Shiki grammar theme reads best on `base-200` */
const LIGHT_SYNTAX_UI_THEMES = new Set([
  'light',
  'garden',
  'pastel',
  'lofi',
  'aqua',
  'wireframe',
  'retro',
  'valentine',
])

function subscribeTheme(listener: () => void) {
  const el = document.documentElement
  const observer = new MutationObserver(listener)
  observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function readSyntaxTheme(): 'github-light' | 'github-dark' {
  const name = document.documentElement.getAttribute('data-theme') ?? 'dark'
  return LIGHT_SYNTAX_UI_THEMES.has(name) ? 'github-light' : 'github-dark'
}

export function useSyntaxHighlightTheme(): 'github-light' | 'github-dark' {
  return useSyncExternalStore(subscribeTheme, readSyntaxTheme, () => 'github-dark')
}
