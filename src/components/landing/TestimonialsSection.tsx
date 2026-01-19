import { Quote } from 'lucide-react'
import Avatar from '../Avatar'

interface Testimonial {
  quote: string
  author: string
  role: string
}

const testimonials: Array<Testimonial> = [
  {
    quote:
      'Marginalia has transformed how our team collaborates on documentation. The AI assistant helps us write clearer, more structured docs, and real-time editing means we can iterate together seamlessly.',
    author: 'Sarah Chen',
    role: 'Engineering Lead',
  },
  {
    quote:
      'The inline comments feature is a game-changer. We can have focused discussions right where they matter, and resolving comments as we go keeps our notes clean and actionable.',
    author: 'Michael Rodriguez',
    role: 'Product Manager',
  },
  {
    quote:
      'As a researcher, I love how Marginalia helps me organize complex ideas. The AI suggestions improve my writing clarity, and markdown-first means I can export to any format I need.',
    author: 'Dr. Emily Watson',
    role: 'Research Scientist',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-16 px-4 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Users Are Saying
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Join thousands of users who are writing better notes with Marginalia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="card bg-base-200 border border-base-300 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="card-body">
                <div className="mb-4">
                  <Quote size={24} className="brand-primary opacity-50" />
                </div>
                <p className="text-base-content/80 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={testimonial.author} size="md" />
                  <div>
                    <div className="font-semibold text-base-content">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
