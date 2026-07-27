import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import TextReveal from '../components/TextReveal'
import './NewsPreview.css'

const news = [
  {
    id: 1,
    date: '15 Jul 2026',
    category: 'Event',
    title: 'Sommarritt 2026 – Recap',
    excerpt: 'En episk ritt genom södra Sverige med 35 ryttare. Sol, asfalts och brödraskapet starkare än någonsin.',
    image: '/images/gallery_2.png',
  },
  {
    id: 2,
    date: '3 Jun 2026',
    category: 'Nyheter',
    title: 'Ny Avdelning i Göteborg',
    excerpt: 'OneUnit expanderar. Vi är stolta att välkomna vår nya avdelning i Göteborg med 8 founding members.',
    image: '/images/gallery_1.png',
  },
  {
    id: 3,
    date: '20 Maj 2026',
    category: 'Community',
    title: 'MC-Träff Sthlm – Bilder',
    excerpt: 'Årets första stora träff i Stockholm. Hundratals motorcyklar, musik och gemenskap. Se bilderna här.',
    image: '/images/gallery_5.png',
  },
]

export default function NewsPreview() {
  return (
    <section className="news-preview section" aria-labelledby="news-preview-heading">
      <div className="container">
        <ScrollReveal>
          <p className="section-label">Senaste</p>
        </ScrollReveal>

        <div className="news-preview__header">
          <TextReveal
            text="Nyheter & Uppdateringar"
            tag="h2"
            id="news-preview-heading"
            className="news-preview__heading"
          />
          <ScrollReveal direction="right">
            <Link to="/news" id="news-all-link" className="btn btn-outline news-preview__all-link">
              Alla Nyheter →
            </Link>
          </ScrollReveal>
        </div>

        <div className="news-preview__grid">
          {news.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 120} className="news-preview__card-wrap">
              <Link to="/news" id={`news-card-${item.id}`} className="news-preview__card card">
                <div className="news-preview__card-img-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="news-preview__card-img"
                    loading="lazy"
                  />
                  <div className="news-preview__card-img-overlay" />
                </div>
                <div className="news-preview__card-body">
                  <div className="news-preview__card-meta">
                    <span className="tag">{item.category}</span>
                    <span className="news-preview__card-date">{item.date}</span>
                  </div>
                  <h3 className="news-preview__card-title">{item.title}</h3>
                  <p className="news-preview__card-excerpt">{item.excerpt}</p>
                  <span className="news-preview__card-read">Läs mer →</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
