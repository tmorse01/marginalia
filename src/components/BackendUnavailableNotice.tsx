export default function BackendUnavailableNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`alert alert-warning shadow-lg ${className}`}>
      <div>
        <h3 className="font-bold">Can&apos;t connect to the backend</h3>
        <div className="text-sm mt-1 space-y-1">
          <p>
            Set <code className="text-xs bg-base-300 px-1 rounded">VITE_CONVEX_URL</code> to your{' '}
            <code className="text-xs bg-base-300 px-1 rounded">.convex.cloud</code> URL, restart the dev server, and
            reload.
          </p>
          <p>If it is already set, check your network or whether Convex is reachable.</p>
        </div>
      </div>
    </div>
  )
}
