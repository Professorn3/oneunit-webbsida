import { Link } from 'react-router-dom'
import GlitchText from '../components/GlitchText'
import ScrollReveal from '../components/ScrollReveal'
import './ApplyCTA.css'

export default function ApplyCTA() {
  return (
    <section className="apply-cta" aria-labelledby="apply-cta-heading">
      <div className="apply-cta__bg" aria-hidden="true">
        <div
          className="apply-cta__bg-img"
          style={{ backgroundImage: 'url(/images/gallery_2.png)' }}
        />
        <div className="apply-cta__bg-overlay" />
      </div>

      <div className="container apply-cta__content">
        <ScrollReveal>
          <p className="section-label apply-cta__label">Medlemskap</p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 id="apply-cta-heading" className="apply-cta__heading">
            <GlitchText text="Vill Du Bli" tag="span" className="apply-cta__heading-line" />
            <br />
            <GlitchText text="En Av Oss?" tag="span" className="apply-cta__heading-line apply-cta__heading-line--outline" continuous />
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="apply-cta__text">
            Vi söker alltid rätt typ av person. Inte vem som helst – utan någon som delar 
            våra värderingar, vår passion och vår respekt för bröderskapet.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="apply-cta__actions">
            <Link to="/apply" id="apply-cta-btn" className="btn btn-primary apply-cta__btn">
              Skicka in Ansökan
            </Link>
            <div className="apply-cta__badge">
              <span style={{ color: '#00f5ff' }}>▪</span>
              <span>Öppen för alla erfarna ryttare</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
