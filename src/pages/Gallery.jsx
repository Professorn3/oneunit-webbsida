import { useState } from 'react'
import { motion } from 'framer-motion'
import GlitchText from '../components/GlitchText'
import ScrollReveal from '../components/ScrollReveal'
import './Gallery.css'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const allItems = [
  { id: 1, src: '/images/gallery_1.png', title: 'Nattritt', category: 'Ritter', type: 'image' },
  { id: 2, src: '/images/gallery_2.png', title: 'Formation', category: 'Ritter', type: 'image' },
  { id: 3, src: '/images/gallery_3.png', title: 'Maskinen', category: 'MC', type: 'image' },
  { id: 4, src: '/images/gallery_4.png', title: 'Brödraskapet', category: 'Community', type: 'image' },
  { id: 5, src: '/images/gallery_5.png', title: 'Tunnel', category: 'Ritter', type: 'image' },
  { id: 6, src: '/images/hero_bg.png', title: 'Dimma', category: 'MC', type: 'image' },
  { id: 7, src: '/images/gallery_1.png', title: 'City Lights', category: 'Community', type: 'image' },
  { id: 8, src: '/images/gallery_4.png', title: 'Gänget', category: 'Community', type: 'image' },
]

const categories = ['Alla', 'Ritter', 'MC', 'Community']

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('Alla')
  const [lightbox, setLightbox] = useState(null)

  const filtered = activeCategory === 'Alla'
    ? allItems
    : allItems.filter(item => item.category === activeCategory)

  return (
    <motion.div
      className="gallery-page page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="gallery-page__hero">
        <div className="container">
          <p className="section-label">Galleri</p>
          <h1 className="gallery-page__title">
            <GlitchText text="BILDER &" tag="span" className="gallery-page__title-line" />
            <br />
            <GlitchText text="VIDEOS" tag="span" className="gallery-page__title-line gallery-page__title-line--outline" continuous />
          </h1>
        </div>
      </div>

      {/* Filter */}
      <div className="container">
        <div className="gallery-page__filters" role="tablist" aria-label="Filtrera galleri">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`gallery-filter-${cat.toLowerCase()}`}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`gallery-page__filter ${activeCategory === cat ? 'gallery-page__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="gallery-page__grid" role="list">
          {filtered.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 60} className="gallery-page__item" role="listitem">
              <button
                id={`gallery-item-${item.id}`}
                className="gallery-page__img-btn"
                onClick={() => setLightbox(item)}
                aria-label={`Öppna ${item.title}`}
              >
                <div className="gallery-page__img-wrap">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="gallery-page__img"
                    loading="lazy"
                  />
                  <div className="gallery-page__img-overlay">
                    <span className="gallery-page__img-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                    </span>
                    <span className="gallery-page__img-label">{item.title}</span>
                  </div>
                </div>
                <div className="gallery-page__img-meta">
                  <span className="tag">{item.category}</span>
                  <span className="gallery-page__img-title">{item.title}</span>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <button
            id="lightbox-close"
            className="lightbox__close"
            aria-label="Stäng"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.title}
            className="lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="lightbox__caption">{lightbox.title}</p>
        </div>
      )}
    </motion.div>
  )
}
