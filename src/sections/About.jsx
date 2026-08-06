import { useEffect, useState } from 'react'
import pb from '../pocketbase';
import ScrollReveal from '../components/ScrollReveal'
import TextReveal from '../components/TextReveal'
import './About.css'

export default function About() {
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await pb.collection('users').getList(1, 1, { requestKey: null });
        setMemberCount(result.totalItems);
      } catch (err) {
        console.error("Kunde inte hämta antal medlemmar:", err)
      }
    }
    fetchCount()
  }, [])

  const stats = [
    { value: '2026', label: 'Grundat' },
    { value: memberCount > 0 ? memberCount : '...', label: 'Medlemmar' },
    { value: '5', label: 'Städer' },
  ]

  return (
    <section className="about section" aria-labelledby="about-heading">
      <div className="container">
        <div className="about__layout">
          {/* Left – text */}
          <div className="about__text-col">
            <ScrollReveal>
              <p className="section-label">Om Oss</p>
            </ScrollReveal>

            <TextReveal
              text="Vi rullar som ett. Vi lever som ett."
              tag="h2"
              id="about-heading"
              className="about__heading"
              stagger={50}
            />

            <ScrollReveal delay={200}>
              <p className="about__body">
                OneUnit är inte bara en grupp personer, det är en livsstil. 
                Vi bygger gemenskap baserat på respekt och lojalitet till 
                friheten på hjul. Vi har vuxit till ett gäng grabbar som 
                byggt ihop en gemenskap med riders från hela landet.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="about__body">
                Varje ride är en ny upplevelse där varje medlem är en del av helheten, 
                det är vad OneUnit betyder. Vi rullar som en pakt, vi är alla en enhet 
                och tillsammans stabilare.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="about__values">
                {['Lojalitet', 'Respekt', 'Frihet', 'Gemenskap'].map((v) => (
                  <span key={v} className="tag">{v}</span>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right – image */}
          <ScrollReveal className="about__image-col" direction="right">
            <div className="about__image-frame">
              <img
                src="/images/hero-glitch-logo.png"
                alt="OneUnit Glitch Logo"
                className="about__image"
                loading="lazy"
              />
              <div className="about__image-overlay" />
              <div className="about__image-border" />
            </div>
          </ScrollReveal>
        </div>

        {/* Stats */}
        <div className="about__stats">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 100} className="about__stat">
              <div className="about__stat-value">{stat.value}</div>
              <div className="about__stat-label">{stat.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
