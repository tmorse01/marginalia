import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
}

export default function Logo({ className = 'w-8 h-8' }: LogoProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Get initial theme
    const getTheme = () => {
      if (typeof document !== 'undefined') {
        const dataTheme = document.documentElement.getAttribute('data-theme')
        // Check if it's a light theme or dark theme
        if (dataTheme === 'light') {
          return 'light'
        }
        // Default to dark for dark theme and other themes
        return 'dark'
      }
      return 'dark'
    }

    setTheme(getTheme())

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setTheme(getTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    // Also listen to storage changes (in case theme changes in another tab)
    const handleStorageChange = () => {
      setTheme(getTheme())
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const logoSrc = theme === 'light' ? '/logo-light.svg' : '/logo-dark.svg'

  return <img src={logoSrc} alt="Marginalia" className={className} />
}
