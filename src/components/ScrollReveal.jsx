import { useEffect, useRef } from 'react'

/**
 * ScrollReveal – wraps children and triggers reveal animation on scroll.
 * Uses IntersectionObserver for performance.
 *
 * Props:
 *   className  - class applied to wrapper div
 *   direction  - 'up' | 'left' | 'right' (default 'up')
 *   delay      - CSS transition delay in ms (default 0)
 *   threshold  - IntersectionObserver threshold (default 0.15)
 *   children
 */
export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  threshold = 0.15,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.transitionDelay = `${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  const dirClass =
    direction === 'left' ? 'reveal-left' :
    direction === 'right' ? 'reveal-right' :
    'reveal'

  return (
    <div ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </div>
  )
}
