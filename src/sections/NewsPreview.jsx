import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import TextReveal from '../components/TextReveal'
import { db } from '../firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import './NewsPreview.css'

export default function NewsPreview() {
  const [news, setNews] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(3))
    const unsub = onSnapshot(q, (snapshot) => {
      const list = []
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() })
      })
      setNews(list)
    })
    return () => unsub()
  }, [])

  if (news.length === 0) return null;

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
