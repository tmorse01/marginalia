import { createFileRoute } from '@tanstack/react-router'
import ThemeSelector from '../components/ThemeSelector'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="divider"></div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">Theme</span>
            </label>
            <div className="mt-2">
              <ThemeSelector />
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Choose your preferred color theme
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
