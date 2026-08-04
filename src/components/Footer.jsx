import { Link } from 'react-router-dom'
import './Footer.css'

const socialLinks = [
  { label: 'Instagram', href: '#', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
    </svg>
  )},
  { label: 'Facebook', href: '#', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )},
  { label: 'YouTube', href: '#', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon fill="currentColor" stroke="none" points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02"/>
    </svg>
  )},
]

const navLinks = [
  { path: '/', label: 'Hem' },
  { path: '/gallery', label: 'Galleri' },
  { path: '/news', label: 'Nyheter' },
  { path: '/merch', label: 'Merch' },
  { path: '/contact', label: 'Kontakt' },
  { path: '/apply', label: 'Ansök' },
]

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img src="/images/logo.png?v=2" alt="OneUnit" onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }} />
              <span className="footer__logo-text" style={{ display: 'none' }}>
                ONE<span>UNIT</span>
              </span>
            </Link>
            <p className="footer__tagline">Gemenskap. Respekt. Frihet.</p>
            <div className="footer__socials">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="footer__social"
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__nav" aria-label="Sidnavigation">
            <h3 className="footer__nav-title">Navigation</h3>
            <ul className="footer__nav-list">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer__nav-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__contact">
            <h3 className="footer__nav-title">Kontakt</h3>
            <p className="footer__contact-text">
              Är du intresserad av att gå med? Skicka in din ansökan eller kontakta oss direkt.
            </p>
            <Link to="/apply" className="btn btn-outline" style={{ marginTop: '1rem' }}>
              Ansök nu
            </Link>
          </div>
        </div>

        <div className="footer__divider" />

        <div className="footer__bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', paddingBottom: '1rem' }}>
          <div>
            <p className="footer__copy" style={{ margin: '0 0 0.2rem 0', fontWeight: 600 }}>
              © {new Date().getFullYear()} OneUnit. Alla rättigheter förbehållna.
            </p>
            <p className="footer__copy footer__copy--muted" style={{ margin: 0 }}>
              One Unit. One Brotherhood.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(145deg, #10141d 0%, #0a0c12 100%)', padding: '0.5rem 1.4rem', borderRadius: '50px', border: '1px solid rgba(0, 245, 255, 0.25)', boxShadow: '0 0 20px rgba(0, 245, 255, 0.08)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a0a6b5', fontWeight: 600 }}>Powered by</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 900, color: '#00f5ff', letterSpacing: '2.5px', textShadow: '0 0 12px rgba(0,245,255,0.7)' }}>AKABIT</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
