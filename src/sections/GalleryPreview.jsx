import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import './GalleryPreview.css'

const galleryItems = [
  { src: '/images/gallery_1.png', label: 'Nattritt' },
  { src: '/images/gallery_2.png', label: 'Formation' },
  { src: '/images/gallery_3.png', label: 'Maskinen' },
  { src: '/images/gallery_4.png', label: 'Brödraskapet' },
  { src: '/images/gallery_5.png', label: 'Tunnel' },
  { src: '/images/hero_bg.png', label: 'Dimma' },
]

export default function GalleryPreview() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const progressRef = useRef(null)

  // Horizontal scroll – pin the section, scroll the track
  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const progressBar = progressRef.current
    if (!section || !track) return

    const updateScroll = () => {
      const rect = section.getBoundingClientRect()
      const sectionTop = section.offsetTop
      const sectionH = section.offsetHeight
      const scrollY = window.scrollY

      const progress = (scrollY - sectionTop) / (sectionH - window.innerHeight)
      const clampedProgress = Math.max(0, Math.min(1, progress))
      const maxScroll = track.scrollWidth - track.clientWidth
      track.style.transform = `translateX(-${clampedProgress * maxScroll}px)`
      if (progressBar) {
        progressBar.style.transform = `scaleX(${clampedProgress})`
      }
    }

    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  return (
    <section ref={sectionRef} className="gallery-preview" aria-labelledby="gallery-preview-heading">
      {/* Sticky wrapper */}
      <div className="gallery-preview__sticky">
        <div className="container">
          <ScrollReveal>
            <div className="gallery-preview__header">
              <p className="section-label">Galleri</p>
              <h2 id="gallery-preview-heading" className="gallery-preview__heading">
                MOMENTS <span>IN TIME</span>
              </h2>
            </div>
          </ScrollReveal>
        </div>

        {/* Horizontal track – overflows container */}
        <div className="gallery-preview__viewport" aria-label="Bildgalleri">
          <div ref={trackRef} className="gallery-preview__track">
            {galleryItems.map((item, i) => (
              <div key={i} className="gallery-preview__item" data-index={i}>
                <div className="gallery-preview__img-wrap">
                  <img
                    src={item.src}
                    alt={item.label}
                    className="gallery-preview__img"
                    loading="lazy"
                  />
                  <div className="gallery-preview__item-overlay">
                    <span className="gallery-preview__item-label">{item.label}</span>
                  </div>
                </div>
                <div className="gallery-preview__item-num">0{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="container">
          <div className="gallery-preview__progress-container">
            <div ref={progressRef} className="gallery-preview__progress-bar" />
          </div>
        </div>

        <div className="container">
          <ScrollReveal>
            <div className="gallery-preview__footer">
              <Link to="/gallery" id="gallery-preview-link" className="btn btn-outline">
                Se Hela Galleriet →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
