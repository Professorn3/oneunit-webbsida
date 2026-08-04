import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { db } from '../firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import './GalleryPreview.css'

const defaultGalleryItems = [];

export default function GalleryPreview() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const progressRef = useRef(null)
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems)

  useEffect(() => {
    const fetchTopGallery = async () => {
      try {
        const q = query(collection(db, 'gallery'), orderBy('likeCount', 'desc'), limit(10))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const fetchedItems = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              src: data.src,
              label: data.title || data.category
            }
          })
          
          if (fetchedItems.length < 10) {
            const needed = 10 - fetchedItems.length
            const extras = defaultGalleryItems.slice(0, needed)
            setGalleryItems([...fetchedItems, ...extras])
          } else {
            setGalleryItems(fetchedItems)
          }
        }
      } catch (err) {
        console.error("Fel vid laddning av top galleri", err)
      }
    }
    fetchTopGallery()
  }, [])

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

  if (galleryItems.length === 0) return null;

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
