import ScrollReveal from '../components/ScrollReveal'
import TextReveal from '../components/TextReveal'
import './About.css'

const stats = [
  { value: '2019', label: 'Grundat' },
  { value: '40+', label: 'Medlemmar' },
  { value: '5', label: 'Städer' },
  { value: '∞', label: 'Broderskap' },
]

export default function About() {
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
              text="Vi rider som ett. Vi lever som ett."
              tag="h2"
              id="about-heading"
              className="about__heading"
              stagger={50}
            />

            <ScrollReveal delay={200}>
              <p className="about__body">
                OneUnit MC är inte bara ett motorcykelgäng – det är en livsstil. 
                Vi bygger gemenskap baserat på respekt, lojalitet och kärleken till 
                friheten på hjul. Sedan 2019 har vi vuxit till ett tight-knit brödraskapet 
                med ryttare från hela landet.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="about__body">
                Varje ritt är en ny historia. Varje bror är en del av helheten. 
                Det är vad OneUnit betyder – vi är alla en enhet, starkare tillsammans.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="about__values">
                {['Lojalitet', 'Respekt', 'Frihet', 'Broderskap'].map((v) => (
                  <span key={v} className="tag">{v}</span>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right – image */}
          <ScrollReveal className="about__image-col" direction="right">
            <div className="about__image-frame">
              <img
                src="/images/gallery_4.png"
                alt="OneUnit MC brödraskapet"
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
