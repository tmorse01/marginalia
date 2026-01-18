import { useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react'

interface AlertToastProps {
  isOpen: boolean
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

export default function AlertToast({
  isOpen,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: AlertToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  }

  const alertClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  }

  return (
    <div className="toast toast-top toast-end z-[100]">
      <div className={`alert ${alertClasses[type]} shadow-lg`}>
        {icons[type]}
        <span>{message}</span>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
          <X className="size-[1.2em]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

