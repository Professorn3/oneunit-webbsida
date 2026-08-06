import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import TextReveal from '../components/TextReveal'
import pb from '../pocketbase';
import './NewsPreview.css'

export default function NewsPreview() {
  const [news, setNews] = useState([])

  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      try {
        const result = await pb.collection('news').getList(1, 3, { sort: '-created' });
        if (active) setNews(result.items);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNews();
    return () => { active = false; };
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
                    src={item.image && !item.image.startsWith('/images') ? pb.files.getURL(item, item.image) : '/images/gallery_1.png'}
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
