import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import GlitchText from '../components/GlitchText'
import './Hero.css'

export default function Hero() {
  const heroRef = useRef(null)
  const scrollIndicatorRef = useRef(null)

  // Parallax on scroll
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const onScroll = () => {
      const scrollY = window.scrollY
      const bg = hero.querySelector('.hero__bg')
      if (bg) bg.style.transform = `translateY(${scrollY * 0.4}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Animate in on mount
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    setTimeout(() => el.classList.add('hero--loaded'), 100)
  }, [])

  return (
    <section ref={heroRef} className="hero" aria-label="Startsida hero">
      {/* Background */}
      <div className="hero__bg-wrapper" aria-hidden="true">
        <div
          className="hero__bg"
          style={{ backgroundImage: 'url(/images/hero_bg.png)' }}
        />
        <div className="hero__overlay" />
        <div className="hero__overlay hero__overlay--gradient" />
      </div>

      {/* Glitch scan lines */}
      <div className="hero__scanlines" aria-hidden="true" />

      {/* Content */}
      <div className="container hero__content">
        <div className="hero__logo-wrapper">
          <img
            src="/images/logo.png"
            alt="OneUnit MC"
            className="hero__logo-img"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>

        <div className="hero__text">
          <p className="hero__eyebrow">⚡ OFFICIELL HEMSIDA FÖR ONEUNIT MC ⚡</p>
          <h1 className="hero__title">
            <GlitchText text="ONE" tag="span" className="hero__title-line" />
            <br />
            <GlitchText text="UNIT" tag="span" className="hero__title-line hero__title-line--outline" />
          </h1>
          <p className="hero__subtitle">
            Gemenskap&nbsp;·&nbsp;Respekt&nbsp;·&nbsp;Lojalitet&nbsp;·&nbsp;Broderskap
          </p>
          <div className="hero__actions">
            <Link to="/apply" id="hero-apply-btn" className="btn btn-primary">
              Ansök om Medlemskap
            </Link>
            <Link to="/gallery" id="hero-gallery-btn" className="btn btn-outline">
              Se Galleri
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div ref={scrollIndicatorRef} className="hero__scroll" aria-hidden="true">
          <div className="hero__scroll-line" />
          <span className="hero__scroll-text">Scrolla</span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="hero__corner hero__corner--tl" aria-hidden="true" />
      <div className="hero__corner hero__corner--br" aria-hidden="true" />
    </section>
  )
}
