import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageHelper';
import GlitchText from '../components/GlitchText';
import ScrollReveal from '../components/ScrollReveal';
import ConfirmModal from '../components/ConfirmModal';
import './News.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const defaultNews = [
  {
    id: 'default_1',
    date: '15 Jul 2026',
    category: 'Event',
    title: 'Sommarritt 2026 – En Episk Resa Genom Sverige',
    excerpt: 'En episk ritt genom södra Sverige med 35 ryttare. Sol, asfalt och brödraskapet starkare än någonsin. Vi startade i Stockholm och avslutade i Malmö – 3 dagar, 1400 km, oräkneliga minnen.',
    image: '/images/gallery_2.png',
    featured: true,
  },
  {
    id: 'default_2',
    date: '3 Jun 2026',
    category: 'Nyheter',
    title: 'Ny Avdelning Öppnar i Göteborg',
    excerpt: 'OneUnit expanderar. Vi är stolta att välkomna vår nya avdelning i Göteborg med 8 founding members. Välkommen till brödraskapet, Väst-avdelningen!',
    image: '/images/gallery_4.png',
  },
  {
    id: 'default_3',
    date: '20 Maj 2026',
    category: 'Community',
    title: 'Träff Stockholm – Bilder och Recap',
    excerpt: 'Årets första stora träff i Stockholm lockade hundratals motorcyklar från hela landet. Musik, gemenskap och asfalt. Se bilderna från kvällen.',
    image: '/images/gallery_1.png',
  },
  {
    id: 'default_4',
    date: '2 Apr 2026',
    category: 'Allmänt',
    title: 'Vårens Första Ritt – Välkommen Säsong 2026!',
    excerpt: 'Vintern är äntligen bakom oss. Vi kickar igång säsongen med en samlingsritt i Uppland. Dags att damm av jackan och starta motorn!',
    image: '/images/gallery_5.png',
  },
  {
    id: 'default_5',
    date: '15 Mar 2026',
    category: 'Nyheter',
    title: 'Nytt i Regelverket 2026 – Vad Du Behöver Veta',
    excerpt: 'Nya trafikregler som träder i kraft 2026 kan påverka dig som motorcyklist. Vi har sammanfattat det viktigaste du behöver känna till.',
    image: '/images/gallery_3.png',
  },
  {
    id: 'default_6',
    date: '8 Feb 2026',
    category: 'Event',
    title: 'Winter Meet 2026 – Se Bilderna',
    excerpt: 'Även på vintern samlas vi. Årets Winter Meet i Örebro var en succé med goda råd, god mat och bra sällskap trots minusgrader.',
    image: '/images/hero_bg.png',
  },
];

export default function News() {
  const { isAdmin, currentUser } = useAuth();
  const [dbNews, setDbNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [showAdminStudio, setShowAdminStudio] = useState(false);

  // Edit State
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Event');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editDateStr, setEditDateStr] = useState('');
  const [editing, setEditing] = useState(false);

  // Admin form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Event');
  const [excerpt, setExcerpt] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDbNews(list);
      setLoading(false);
    }, (err) => {
      console.error("Fel vid hämtning av nyheter:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 900, 0.75);
      setImagePreview(dataUrl);
    } catch (err) {
      alert("Kunde inte hantera bilden: " + err.message);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title || !excerpt) {
      alert("Vänligen fyll i titel och text för nyhetsinlägget!");
      return;
    }

    setCreating(true);
    try {
      const imgUrl = imagePreview || '/images/gallery_2.png';

      await addDoc(collection(db, 'news'), {
        title,
        category,
        excerpt,
        date: dateStr || new Date().toLocaleDateString('sv-SE'),
        image: imgUrl,
        createdAt: serverTimestamp(),
        author: currentUser?.email || 'Admin',
      });

      // Reset
      setTitle('');
      setExcerpt('');
      setImagePreview(null);
    } catch (err) {
      console.error("Fel vid publicering:", err);
      alert("Kunde inte spara nyheten: " + err.message);
    }
    setCreating(false);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !articleToDelete) return;
    try {
      await deleteDoc(doc(db, 'news', articleToDelete.id));
      setArticleToDelete(null);
    } catch (err) {
      console.error("Fel vid radering:", err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!articleToEdit) return;
    setEditing(true);
    try {
      await updateDoc(doc(db, 'news', articleToEdit.id), {
        title: editTitle,
        category: editCategory,
        excerpt: editExcerpt,
        date: editDateStr
      });
      setArticleToEdit(null);
    } catch (err) {
      console.error("Fel vid uppdatering av nyhet:", err);
      alert("Kunde inte uppdatera nyheten.");
    }
    setEditing(false);
  };

  // Kombinera egna databasinlägg överst med de klassiska stanardinläggen nedanför
  const allArticles = [...dbNews, ...defaultNews];
  const [featured, ...rest] = allArticles;

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
        {/* --- ADMIN NYHETS-STUDIO (Dolt bakom +-knapp) --- */}
        {isAdmin && (
          <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showAdminStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowAdminStudio(!showAdminStudio)}
                className="btn btn-outline"
                title="Klicka för att fälla ut / in nyhetsstudion"
                style={{
                  borderColor: '#00f5ff',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.7rem 1.6rem',
                  borderRadius: '50px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)',
                  background: showAdminStudio ? '#00f5ff22' : 'transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: '1', color: '#00f5ff', fontWeight: '900' }}>{showAdminStudio ? '✕' : '+'}</span>
                <span>{showAdminStudio ? 'Stäng Nyhetsstudio' : 'Skapa Nyhet / Reportage'}</span>
              </button>
            </div>

            {showAdminStudio && (
              <section className="news-admin-studio">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f5ff', margin: 0 }}>ADMIN NYHETS-STUDIO: SKRIV NYTT INLÄGG</h2>
                  <span className="tag" style={{ backgroundColor: '#00f5ff22', borderColor: '#00f5ff', color: '#00f5ff' }}>Aktiv Modul</span>
                </div>

            <form onSubmit={handleCreateNews}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '1.2rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#c0c6d4', fontWeight: 600 }}>Artikelns Titel</label>
                  <input
                    type="text"
                    placeholder="T.ex. Nya Klubbkåkar & Höstfest..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ background: 'rgba(8,10,15,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#c0c6d4', fontWeight: 600 }}>Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: 'rgba(8,10,15,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff' }}
                  >
                    <option value="Event">Event</option>
                    <option value="Nyheter">Nyheter</option>
                    <option value="Community">Community</option>
                    <option value="Allmänt">Allmänt & Träff</option>
                    <option value="Klubba">Klubbmöte</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#c0c6d4', fontWeight: 600 }}>Datumstämpel</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    style={{ background: 'rgba(8,10,15,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff' }}
                    placeholder="T.ex. 28 Jul 2026"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#c0c6d4', fontWeight: 600 }}>Innehåll / Reportagetext</label>
                  <textarea
                    rows={4}
                    placeholder="Skriv repotage, nyheter, summeringar eller viktig info till medlemmar och besökare..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    style={{ background: 'rgba(8,10,15,0.8)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff', fontFamily: 'inherit' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#c0c6d4', fontWeight: 600 }}>Omslagsbild / Foto till artikeln</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0, 245, 255, 0.1)', border: '1px dashed #00f5ff88', color: '#00f5ff', padding: '0.8rem 1.2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <span>Välj Bild från Dator eller Mobil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {imagePreview && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0a0b0e', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #00ff8844' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        <span style={{ fontSize: '0.8rem', color: '#00ff88' }}>✓ Omslag redo!</span>
                        <button type="button" onClick={() => setImagePreview(null)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
                style={{ marginTop: '0.8rem', width: '100%' }}
              >
                {creating ? 'Publicerar live...' : 'PUBLICERA NYHET NU'}
              </button>
            </form>
          </section>
            )}
          </div>
        )}

        {/* Featured */}
        {featured && (
          <ScrollReveal className="news-page__featured-wrap">
            <article className="news-page__featured card" id={`news-article-${featured.id}`} style={{ position: 'relative' }}>
              {isAdmin && !String(featured.id).startsWith('default_') && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setArticleToEdit(featured); 
                      setEditTitle(featured.title || '');
                      setEditCategory(featured.category || 'Event');
                      setEditExcerpt(featured.excerpt || '');
                      setEditDateStr(featured.date || '');
                    }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0, 245, 255, 0.9)', color: '#000', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    title="Redigera Nyhet"
                  >
                    Redigera
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setArticleToDelete(featured); }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    title="Radera Nyhet"
                  >
                    Radera
                  </button>
                </div>
              )}
              <div className="news-page__featured-img-wrap">
                <img src={featured.image || '/images/gallery_2.png'} alt={featured.title} className="news-page__featured-img" loading="eager" />
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
        )}

        {/* Grid */}
        <div className="news-page__grid">
          {rest.map((item, i) => (
            <ScrollReveal key={item.id} delay={Math.min(i * 50, 300)}>
              <article className="news-page__card card" id={`news-article-${item.id}`} style={{ position: 'relative' }}>
                {isAdmin && !String(item.id).startsWith('default_') && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setArticleToEdit(item); 
                        setEditTitle(item.title || '');
                        setEditCategory(item.category || 'Event');
                        setEditExcerpt(item.excerpt || '');
                        setEditDateStr(item.date || '');
                      }}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0, 245, 255, 0.9)', color: '#000', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      title="Redigera Nyhet"
                    >
                      Redigera
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setArticleToDelete(item); }}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      title="Radera Nyhet"
                    >
                      Radera
                    </button>
                  </div>
                )}
                <div className="news-page__card-img-wrap">
                  <img src={item.image || '/images/gallery_1.png'} alt={item.title} className="news-page__card-img" loading="lazy" />
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

      <ConfirmModal
        isOpen={!!articleToDelete}
        title="Radera Nyhet"
        message={`Vill du verkligen radera "${articleToDelete?.title}"? Detta går inte att ångra.`}
        confirmText="Ja, radera"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setArticleToDelete(null)}
      />

      {/* Edit Modal */}
      {articleToEdit && (
        <div className="upload-studio-overlay" onClick={() => setArticleToEdit(null)}>
          <div className="upload-studio-card card" onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid #333', maxWidth: '600px', width: '90%' }}>
            <div className="upload-studio-header">
              <h2 className="glitch-text" data-text="REDIGERA NYHET">REDIGERA NYHET</h2>
              <button className="close-btn" onClick={() => setArticleToEdit(null)} aria-label="Stäng redigerare">×</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="upload-studio-form">
              <div className="form-group">
                <label>Rubrik</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Skriv nyhetsrubrik..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Kategori</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.8rem', borderRadius: '4px', width: '100%' }}
                  >
                    <option value="Nyheter">Nyheter</option>
                    <option value="Event">Event</option>
                    <option value="Community">Community</option>
                    <option value="Allmänt">Allmänt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Datum (visas på kortet)</label>
                  <input 
                    type="text" 
                    value={editDateStr}
                    onChange={(e) => setEditDateStr(e.target.value)}
                    placeholder="T.ex. 12 Okt 2026"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Brödtext / Sammanfattning</label>
                <textarea 
                  value={editExcerpt}
                  onChange={e => setEditExcerpt(e.target.value)}
                  placeholder="Skriv din nyhetstext här..."
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }} disabled={editing}>
                {editing ? 'Sparar...' : 'Spara Ändringar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
