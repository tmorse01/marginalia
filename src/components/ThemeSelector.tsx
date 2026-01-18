import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'night', label: 'Night' },
  { value: 'forest', label: 'Forest' },
  { value: 'synthwave', label: 'Synthwave' },
  { value: 'retro', label: 'Retro' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'valentine', label: 'Valentine' },
  { value: 'halloween', label: 'Halloween' },
  { value: 'garden', label: 'Garden' },
  { value: 'aqua', label: 'Aqua' },
  { value: 'lofi', label: 'Lofi' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'wireframe', label: 'Wireframe' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'black', label: 'Black' },
  { value: 'business', label: 'Business' },
] as const

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<string>('dark')

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setCurrentTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  const currentThemeLabel = THEMES.find((t) => t.value === currentTheme)?.label || 'Dark'

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <Palette size={16} />
        <span className="hidden sm:inline">{currentThemeLabel}</span>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300"
      >
        {THEMES.map((theme) => (
          <li key={theme.value}>
            <button
              onClick={() => handleThemeChange(theme.value)}
              className={`flex items-center justify-between ${
                currentTheme === theme.value ? 'active' : ''
              }`}
            >
              <span>{theme.label}</span>
              {currentTheme === theme.value && (
                <span className="badge badge-primary badge-sm">Active</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

