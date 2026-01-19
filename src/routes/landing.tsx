import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '../components/LandingPage'

export const Route = createFileRoute('/landing')({
  component: LandingPageRoute,
})

function LandingPageRoute() {
  return <LandingPage />
}
