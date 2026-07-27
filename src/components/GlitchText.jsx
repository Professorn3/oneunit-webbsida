import { useRef, useEffect } from 'react'
import './GlitchText.css'

/**
 * GlitchText – renders text with a CSS glitch animation.
 * Props:
 *   text       - the text content
 *   tag        - HTML tag ('h1', 'h2', 'span', etc.) default 'span'
 *   className  - extra class names
 *   continuous - if true, glitch runs continuously; otherwise on hover
 */
export default function GlitchText({ text, tag: Tag = 'span', className = '', continuous = false }) {
  return (
    <Tag
      className={`glitch-text ${continuous ? 'glitch-text--continuous' : ''} ${className}`}
      data-text={text}
      aria-label={text}
    >
      {text}
    </Tag>
  )
}
