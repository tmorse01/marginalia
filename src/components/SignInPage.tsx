import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Github, Mail } from 'lucide-react'

export default function SignInPage() {
  const { isLoading } = useConvexAuth()
  const { signIn } = useAuthActions()

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Sign in to Marginalia</h2>
          <p className="text-base-content/70 mb-6">
            Choose your preferred sign-in method
          </p>

          <div className="space-y-3">
            <button
              className="btn btn-outline w-full gap-2"
              onClick={() => signIn('github')}
              disabled={isLoading}
            >
              <Github size={20} />
              Sign in with GitHub
            </button>

            <button
              className="btn btn-outline w-full gap-2"
              onClick={() => signIn('google')}
              disabled={isLoading}
            >
              <Mail size={20} />
              Sign in with Google
            </button>
          </div>

          {isLoading && (
            <div className="mt-4 text-center">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="ml-2 text-sm text-base-content/70">
                Signing in...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
