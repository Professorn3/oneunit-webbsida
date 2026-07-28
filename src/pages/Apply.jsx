import { useState } from 'react'
import { motion } from 'framer-motion'
import GlitchText from '../components/GlitchText'
import ScrollReveal from '../components/ScrollReveal'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import './Apply.css'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const requirements = [
  { icon: '▪', text: 'Har ett giltigt MC-körkort (minst A2)' },
  { icon: '▪', text: 'Äger en motorcykel med motor ≥ 500cc' },
  { icon: '▪', text: 'Respekterar broderskap och lojalitet' },
  { icon: '▪', text: 'Är bosatt i Sverige' },
]

export default function Apply() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', age: '', city: '', email: '', phone: '',
    bike: '', experience: '', reason: '', howFound: '',
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.age.trim() || !form.city.trim() || !form.email.trim() || !form.phone.trim() || !form.bike.trim() || !form.experience || !form.reason.trim() || !form.howFound) {
      alert("Vänligen fyll i alla fält och spalter i formuläret innan du skickar in din ansökan.")
      return
    }
    setLoading(true)
    
    try {
      await addDoc(collection(db, 'applications'), {
        ...form,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error("Fel vid inskickning: ", error)
      alert("Något gick fel vid inskickning. Försök igen.")
    }
    
    setLoading(false)
  }

  return (
    <motion.div
      className="apply-page page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hero */}
      <div className="apply-page__hero">
        <div className="container">
          <p className="section-label">Ansökan</p>
          <h1 className="apply-page__title">
            <GlitchText text="ANSÖK OM" tag="span" className="apply-page__title-line" />
            <br />
            <GlitchText text="MEDLEMSKAP" tag="span" className="apply-page__title-line apply-page__title-line--outline" continuous />
          </h1>
          <p className="apply-page__subtitle">
            Vi väljer noggrant. Är du rätt person?
          </p>
        </div>
      </div>

      {submitted ? (
        /* Success state */
        <div className="container apply-page__success">
          <div className="apply-page__success-box">
            <div className="apply-page__success-icon" aria-hidden="true">✓</div>
            <h2 className="apply-page__success-title">Ansökan Mottagen</h2>
            <p className="apply-page__success-text">
              Tack för din ansökan, <strong>{form.name}</strong>. Vi granskar alla ansökningar noggrant 
              och återkommer via e-post inom 2–4 veckor. Tills dess – håll motorn igång.
            </p>
            <p className="apply-page__success-sub">One Unit. One Brotherhood.</p>
          </div>
        </div>
      ) : (
        <div className="container apply-page__body">
          {/* Requirements */}
          <ScrollReveal className="apply-page__requirements">
            <h2 className="apply-page__section-title">Krav för Ansökan</h2>
            <ul className="apply-page__req-list" aria-label="Krav för medlemskap">
              {requirements.map((req, i) => (
                <li key={i} className="apply-page__req-item">
                  <span className="apply-page__req-icon" aria-hidden="true">{req.icon}</span>
                  <span>{req.text}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal className="apply-page__form-wrap" delay={150}>
            <form
              id="apply-form"
              className="apply-page__form"
              onSubmit={handleSubmit}
              aria-label="Ansökningsformulär"
            >
              <h2 className="apply-page__section-title">Fyll i Formuläret</h2>

              {/* Row 1 */}
              <div className="apply-page__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-name">Fullständigt Namn *</label>
                  <input
                    id="apply-name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="För- och Efternamn"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-age">Ålder *</label>
                  <input
                    id="apply-age"
                    name="age"
                    type="number"
                    className="form-input"
                    placeholder="ex. 28"
                    min="16"
                    max="80"
                    value={form.age}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="apply-page__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-city">Stad / Ort *</label>
                  <input
                    id="apply-city"
                    name="city"
                    type="text"
                    className="form-input"
                    placeholder="ex. Stockholm"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-email">E-post *</label>
                  <input
                    id="apply-email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="din@email.se"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="apply-page__row">
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-phone">Telefonnummer *</label>
                  <input
                    id="apply-phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="ex. 070-123 45 67"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-bike">Din Motorcykel *</label>
                  <input
                    id="apply-bike"
                    name="bike"
                    type="text"
                    className="form-input"
                    placeholder="ex. Harley-Davidson Sportster 1200"
                    value={form.bike}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="form-group">
                <label className="form-label" htmlFor="apply-experience">Erfarenhet av MC (år) *</label>
                <select
                  id="apply-experience"
                  name="experience"
                  className="form-select"
                  value={form.experience}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Välj antal år...</option>
                  <option value="1-2">1–2 år</option>
                  <option value="3-5">3–5 år</option>
                  <option value="6-10">6–10 år</option>
                  <option value="10+">10+ år</option>
                </select>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label className="form-label" htmlFor="apply-reason">
                  Varför vill du gå med i OneUnit? *
                </label>
                <textarea
                  id="apply-reason"
                  name="reason"
                  className="form-textarea"
                  placeholder="Berätta om dig själv och varför du vill bli en del av OneUnit MC..."
                  value={form.reason}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* How found */}
              <div className="form-group">
                <label className="form-label" htmlFor="apply-how-found">Hur hittade du oss? *</label>
                <select
                  id="apply-how-found"
                  name="howFound"
                  className="form-select"
                  value={form.howFound}
                  onChange={handleChange}
                  required
                >
                  <option value="">Välj alternativ...</option>
                  <option value="social">Sociala medier</option>
                  <option value="friend">Via en vän / medlem</option>
                  <option value="event">På ett event</option>
                  <option value="search">Google / Sökning</option>
                  <option value="other">Annat</option>
                </select>
              </div>

              <button id="apply-submit-btn" type="submit" className="btn btn-primary apply-page__submit" disabled={loading}>
                {loading ? 'Skickar...' : 'Skicka Ansökan'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <p className="apply-page__disclaimer">
                Din ansökan behandlas konfidentiellt. Vi kontaktar dig via angiven e-post inom 2–4 veckor.
              </p>
            </form>
          </ScrollReveal>
        </div>
      )}
    </motion.div>
  )
}
