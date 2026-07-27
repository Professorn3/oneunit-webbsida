import { useEffect, useRef } from 'react'

/**
 * TextReveal – animates text lines sliding up from below,
 * similar to mojam.co's "full-up" text animation.
 *
 * Props:
 *   text      - string or array of strings (one per line)
 *   tag       - wrapper element tag (default 'div')
 *   className - extra classes on wrapper
 *   stagger   - delay between each word in ms (default 60)
 *   threshold - IO threshold (default 0.2)
 */
export default function TextReveal({
  text,
  tag: Tag = 'div',
  className = '',
  stagger = 60,
  threshold = 0.2,
}) {
  const ref = useRef(null)

  const lines = Array.isArray(text) ? text : [text]
  const words = lines.join(' ').split(' ')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const spans = el.querySelectorAll('.tr-word')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          spans.forEach((span, i) => {
            setTimeout(() => {
              span.style.transform = 'translateY(0)'
              span.style.opacity = '1'
            }, i * stagger)
          })
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [stagger, threshold])

  return (
    <Tag ref={ref} className={className} aria-label={lines.join(' ')}>
      {words.map((word, i) => (
        <span key={i} className="text-reveal-wrapper" style={{ marginRight: '0.3em' }}>
          <span
            className="tr-word"
            style={{
              display: 'inline-block',
              transform: 'translateY(110%)',
              opacity: 0,
              transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Tag>
  )
}
