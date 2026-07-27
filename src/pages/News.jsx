import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import GlitchText from '../components/GlitchText'
import ScrollReveal from '../components/ScrollReveal'
import './News.css'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const allNews = [
  {
    id: 1,
    date: '15 Jul 2026',
    category: 'Event',
    title: 'Sommarritt 2026 – En Episk Resa Genom Sverige',
    excerpt: 'En episk ritt genom södra Sverige med 35 ryttare. Sol, asfalt och brödraskapet starkare än någonsin. Vi startade i Stockholm och avslutade i Malmö – 3 dagar, 1400 km, oräkneliga minnen.',
    image: '/images/gallery_2.png',
    featured: true,
  },
  {
    id: 2,
    date: '3 Jun 2026',
    category: 'Nyheter',
    title: 'Ny Avdelning Öppnar i Göteborg',
    excerpt: 'OneUnit expanderar. Vi är stolta att välkomna vår nya avdelning i Göteborg med 8 founding members. Välkommen till brödraskapet, Väst-avdelningen!',
    image: '/images/gallery_4.png',
  },
  {
    id: 3,
    date: '20 Maj 2026',
    category: 'Community',
    title: 'MC-Träff Stockholm – Bilder och Recap',
    excerpt: 'Årets första stora träff i Stockholm lockade hundratals motorcyklar från hela landet. Musik, gemenskap och asfalt. Se bilderna från kvällen.',
    image: '/images/gallery_1.png',
  },
  {
    id: 4,
    date: '2 Apr 2026',
    category: 'MC',
    title: 'Vårens Första Ritt – Välkommen Säsong 2026!',
    excerpt: 'Vintern är äntligen bakom oss. Vi kickar igång säsongen med en samlingsritt i Uppland. Dags att damm av jackan och starta motorn!',
    image: '/images/gallery_5.png',
  },
  {
    id: 5,
    date: '15 Mar 2026',
    category: 'Nyheter',
    title: 'Nytt i Regelverket 2026 – Vad Du Behöver Veta',
    excerpt: 'Nya trafikregler som träder i kraft 2026 kan påverka dig som motorcyklist. Vi har sammanfattat det viktigaste du behöver känna till.',
    image: '/images/gallery_3.png',
  },
  {
    id: 6,
    date: '8 Feb 2026',
    category: 'Event',
    title: 'Winter Meet 2026 – Se Bilderna',
    excerpt: 'Även på vintern samlas vi. Årets Winter Meet i Örebro var en succé med goda råd, god mat och bra sällskap trots minusgrader.',
    image: '/images/hero_bg.png',
  },
]

export default function News() {
  const [featured, ...rest] = allNews

  return (
    <motion.div
      className="news-page page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="news-page__hero">
        <div className="container">
          <p className="section-label">Nyheter</p>
          <h1 className="news-page__title">
            <GlitchText text="NYHETER &" tag="span" className="news-page__title-line" />
            <br />
            <GlitchText text="UPPDATERINGAR" tag="span" className="news-page__title-line news-page__title-line--outline" continuous />
          </h1>
        </div>
      </div>

      <div className="container">
        {/* Featured */}
        <ScrollReveal className="news-page__featured-wrap">
          <article className="news-page__featured card" id={`news-article-${featured.id}`}>
            <div className="news-page__featured-img-wrap">
              <img src={featured.image} alt={featured.title} className="news-page__featured-img" loading="eager" />
              <div className="news-page__featured-img-overlay" />
            </div>
            <div className="news-page__featured-body">
              <div className="news-page__featured-meta">
                <span className="tag">{featured.category}</span>
                <span className="news-page__date">{featured.date}</span>
                <span className="tag" style={{ borderColor: 'var(--color-accent-magenta)', color: 'var(--color-accent-magenta)' }}>Featured</span>
              </div>
              <h2 className="news-page__featured-title">{featured.title}</h2>
              <p className="news-page__featured-excerpt">{featured.excerpt}</p>
              <span className="news-page__read">Läs hela artikeln →</span>
            </div>
          </article>
        </ScrollReveal>

        {/* Grid */}
        <div className="news-page__grid">
          {rest.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 100}>
              <article className="news-page__card card" id={`news-article-${item.id}`}>
                <div className="news-page__card-img-wrap">
                  <img src={item.image} alt={item.title} className="news-page__card-img" loading="lazy" />
                </div>
                <div className="news-page__card-body">
                  <div className="news-page__card-meta">
                    <span className="tag">{item.category}</span>
                    <span className="news-page__date">{item.date}</span>
                  </div>
                  <h3 className="news-page__card-title">{item.title}</h3>
                  <p className="news-page__card-excerpt">{item.excerpt}</p>
                  <span className="news-page__read">Läs mer →</span>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal>
          <div className="news-page__cta">
            <p className="news-page__cta-text">Vill du bli en del av historien?</p>
            <Link to="/apply" id="news-apply-link" className="btn btn-primary">
              Ansök om Medlemskap
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </motion.div>
  )
}
