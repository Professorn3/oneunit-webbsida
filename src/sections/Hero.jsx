import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import GlitchText from '../components/GlitchText'
import './Hero.css'

export default function Hero() {
  const heroRef = useRef(null)
  const scrollIndicatorRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  // Parallax on scroll
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const onScroll = () => {
      const scrollY = window.scrollY
      const bg = hero.querySelector('.hero__bg-video')
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

  // Setup YouTube Iframe API for seamless background loop
  useEffect(() => {
    let intervalId;

    const loadPlayer = () => {
      if (!document.getElementById('yt-player')) return;
      
      new window.YT.Player('yt-player', {
        videoId: '7icDijGRKlY',
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          start: 60,
          mute: 1,
          playsinline: 1,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            setTimeout(() => setIsVideoReady(true), 500); // fade in after play starts
            
            intervalId = setInterval(() => {
              if (event.target && event.target.getCurrentTime) {
                if (event.target.getCurrentTime() >= 119) {
                  event.target.seekTo(60, true);
                }
              }
            }, 500);
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else if (window.YT && window.YT.Player) {
      loadPlayer();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [])

  return (
    <section ref={heroRef} className="hero" aria-label="Startsida hero">
      {/* Background */}
      <div className="hero__bg-wrapper" aria-hidden="true">
        <div 
          className="hero__bg-video" 
          style={{ opacity: isVideoReady ? 1 : 0, transition: 'opacity 1.5s ease-in' }}
        >
          <div id="yt-player"></div>
        </div>
        <div className="hero__overlay" />
        <div className="hero__overlay hero__overlay--gradient" />
      </div>

      {/* Glitch scan lines */}
      <div className="hero__scanlines" aria-hidden="true" />

      {/* Content */}
      <div className="container hero__content">
        {/* Logo tillfälligt borttaget enligt önskemål */}
        <div className="hero__text">
          <h1 className="hero__title">
            <GlitchText text="ONE" tag="span" className="hero__title-line" />
            <GlitchText text="UNIT" tag="span" className="hero__title-line hero__title-line--outline" />
          </h1>
          <div className="hero__actions">
            <Link to="/apply" id="hero-apply-btn" className="btn btn-primary">
              Ansök om Medlemskap
            </Link>
            <Link to="/about" id="hero-gallery-btn" className="btn btn-outline">
              Om Oss
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
