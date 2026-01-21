import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { LogIn, UserPlus } from 'lucide-react'

export default function SignInPage() {
  const { isLoading } = useConvexAuth()
  const { signIn } = useAuthActions()
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    if (isSignUp && !email.trim()) {
      setError('Email is required for sign up')
      return
    }

    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      if (isSignUp) {
        formData.append('email', email)
        formData.append('flow', 'signUp')
      } else {
        formData.append('flow', 'signIn')
      }

      await signIn('password', formData)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
      console.error('[AUTH] Sign in error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">
            {isSignUp ? 'Create Account' : 'Sign in to Marginalia'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {isSignUp && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required={isSignUp}
                />
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={8}
              />
              {isSignUp && (
                <label className="label">
                  <span className="label-text-alt">Must be at least 8 characters</span>
                </label>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="divider">OR</div>

          <button
            className="btn btn-ghost w-full"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setPassword('')
            }}
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
