import { useEffect, useState, useRef } from 'react'
import { FileText, Users, Zap, Clock } from 'lucide-react'

interface Stat {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  description: string
}

const stats: Array<Stat> = [
  {
    icon: <FileText size={24} />,
    value: 10000,
    suffix: '+',
    label: 'Notes Created',
    description: 'By users worldwide',
  },
  {
    icon: <Clock size={24} />,
    value: 5000,
    suffix: '+',
    label: 'Hours Saved',
    description: 'With AI assistance',
  },
  {
    icon: <Users size={24} />,
    value: 2500,
    suffix: '+',
    label: 'Active Collaborators',
    description: 'Working together',
  },
  {
    icon: <Zap size={24} />,
    value: 40,
    suffix: '%',
    label: 'Faster Writing',
    description: 'With AI help',
  },
]

function AnimatedCounter({
  target,
  suffix,
  duration = 2000,
}: {
  target: number
  suffix: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasAnimated(true)
            const startTime = Date.now()
            const startValue = 0

            const animate = () => {
              const elapsed = Date.now() - startTime
              const progress = Math.min(elapsed / duration, 1)
              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4)
              const current = Math.floor(startValue + (target - startValue) * easeOutQuart)
              setCount(current)

              if (progress < 1) {
                requestAnimationFrame(animate)
              } else {
                setCount(target)
              }
            }

            animate()
          }
        })
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [target, duration, hasAnimated])

  return (
    <div ref={ref} className="stat-value text-primary">
      {count.toLocaleString()}
      {suffix}
    </div>
  )
}

export default function StatsSection() {
  return (
    <section className="py-16 px-4 bg-base-200/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Teams Worldwide
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Join thousands of users writing better notes with AI assistance.
          </p>
        </div>

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat">
              <div className="stat-figure text-primary">{stat.icon}</div>
              <div className="stat-title">{stat.label}</div>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <div className="stat-desc">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
