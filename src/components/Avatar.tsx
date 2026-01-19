interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export default function Avatar({ name, size = 'md', color, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  }

  const backgroundColor = color || 'hsl(var(--brand-primary))'

  return (
    <div className={`avatar placeholder ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full text-base-100 flex items-center justify-center font-semibold`}
        style={{ backgroundColor }}
      >
        <span>{initials}</span>
      </div>
    </div>
  )
}
