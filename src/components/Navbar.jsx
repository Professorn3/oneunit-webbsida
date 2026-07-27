import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import './Navbar.css'

const navLinks = [
  { path: '/', label: 'Hem' },
  { path: '/gallery', label: 'Galleri' },
  { path: '/news', label: 'Nyheter' },
  { path: '/apply', label: 'Ansök' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header id="navbar" className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <img src="/images/logo.png?v=2" alt="OneUnit MC" onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }} />
          <span className="navbar__logo-text" style={{ display: 'none' }}>ONE<span>UNIT</span></span>
        </Link>

        <nav className={`navbar__nav ${menuOpen ? 'navbar__nav--open' : ''}`} aria-label="Huvudnavigation">
          <ul className="navbar__list">
            {navLinks.map((link) => (
              <li key={link.path} className="navbar__item">
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  end={link.path === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="navbar__actions" style={{display: 'flex', gap: '1rem'}}>
            <Link to="/apply" className="btn btn-primary navbar__cta" onClick={() => setMenuOpen(false)}>
              Bli Medlem
            </Link>
            <Link to="/dashboard" className="btn btn-outline navbar__cta" onClick={() => setMenuOpen(false)}>
              Mina Sidor
            </Link>
          </div>
        </nav>

        <button
          id="navbar-burger"
          className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
