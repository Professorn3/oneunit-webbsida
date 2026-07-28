import { useState, useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navLinks = [
  { path: '/', label: 'Hem' },
  { path: '/gallery', label: 'Galleri' },
  { path: '/news', label: 'Nyheter' },
  { path: '/meetups', label: 'Meetups' },
  { path: '/merch', label: 'Merch' },
  { path: '/apply', label: 'Ansök' },
  { path: '/rules', label: 'Regler' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const { currentUser, userData, isMember } = useAuth()
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 50)
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true)
      } else if (currentScrollY < lastScrollY.current) {
        setHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const displayName = userData?.firstName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Medlem');

  const NavContent = () => (
    <>
      <ul className="navbar__list">
        {navLinks.map((link) => {
          if (link.path === '/meetups' && !isMember) return null;
          if (link.path === '/rules' && !isMember) return null;
          return (
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
          );
        })}
      </ul>
      <div className="navbar__actions" style={{display: 'flex', gap: '0.8rem', alignItems: 'center'}}>
        {!currentUser ? (
          <>
            <Link to="/apply" className="btn btn-primary navbar__cta" onClick={() => setMenuOpen(false)}>
              Ansök
            </Link>
            <Link to="/login" className="btn btn-outline navbar__cta" onClick={() => setMenuOpen(false)}>
              Logga In
            </Link>
          </>
        ) : (
          <Link 
            to="/dashboard" 
            className="btn btn-outline navbar__cta" 
            onClick={() => setMenuOpen(false)}
            title="Gå till kontrollpaneler"
            style={{
              borderColor: '#00ff88',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 1.4rem',
              boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
            <span>{displayName}</span>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      <header id="navbar" className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${menuOpen ? 'navbar--menu-open' : ''} ${hidden && !menuOpen ? 'navbar--hidden' : ''}`}>
        <div className="navbar__backdrop" aria-hidden="true" />
        <div className="container navbar__inner">
          <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
            <img src="/images/logo.png?v=2" alt="OneUnit MC" onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }} />
            <span className="navbar__logo-text" style={{ display: 'none' }}>ONE<span>UNIT</span></span>
          </Link>

          <nav className="navbar__nav-desktop" aria-label="Huvudnavigation">
            <NavContent />
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

      <nav className={`navbar__nav-mobile ${menuOpen ? 'navbar__nav-mobile--open' : ''}`} aria-label="Mobilnavigation">
        <NavContent />
      </nav>
    </>
  )
}
