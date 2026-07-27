import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const pos = useRef({ x: -100, y: -100 })
  const current = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      // Smooth lerp follow
      current.current.x += (pos.current.x - current.current.x) * 0.12
      current.current.y += (pos.current.y - current.current.y) * 0.12

      if (cursorRef.current) {
        cursorRef.current.style.left = `${current.current.x}px`
        cursorRef.current.style.top = `${current.current.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const onEnter = () => setHovered(true)
    const onLeave = () => setHovered(false)

    window.addEventListener('mousemove', onMove)
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Only show on desktop
  if (window.matchMedia('(max-width: 768px)').matches) return null

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${hovered ? 'hovered' : ''}`}
      aria-hidden="true"
    />
  )
}
