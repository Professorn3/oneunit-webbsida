import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';
import ScrollReveal from '../components/ScrollReveal';
import ConfirmModal from '../components/ConfirmModal';
import { compressImage } from '../utils/imageHelper';
import './Gallery.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const defaultItems = [
  { id: 'def_1', src: '/images/gallery_1.png', title: 'Nattritt', category: 'Community', type: 'image' },
  { id: 'def_2', src: '/images/gallery_2.png', title: 'Formation', category: 'Community', type: 'image' },
  { id: 'def_3', src: '/images/gallery_3.png', title: 'Maskinen', category: 'Motorcyklar', type: 'image' },
  { id: 'def_4', src: '/images/gallery_4.png', title: 'Brödraskapet', category: 'Community', type: 'image' },
  { id: 'def_5', src: '/images/gallery_5.png', title: 'Tunnel', category: 'Motorcyklar', type: 'image' },
  { id: 'def_6', src: '/images/hero_bg.png', title: 'Dimma', category: 'Motorcyklar', type: 'image' },
  { id: 'def_7', src: '/images/gallery_1.png', title: 'City Lights', category: 'Community', type: 'image' },
  { id: 'def_8', src: '/images/gallery_4.png', title: 'Gänget', category: 'Community', type: 'image' },
];

const categories = ['Alla', 'Motorcyklar', 'Community'];

export default function Gallery() {
  const { currentUser, isMember, isAdmin } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Alla');
  const [lightbox, setLightbox] = useState(null);
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Upload Studio State
  const [showUploadStudio, setShowUploadStudio] = useState(false);
  const [title, setTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Motorcyklar');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Parallax hooks
  const { scrollYProgress } = useScroll();
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const yMedium = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDbItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Fel vid hämtning av galleri:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1400, 1400, 0.85);
      setImagePreview(compressed);
    } catch (err) {
      console.error("Fel vid bildbehandling:", err);
      alert("Kunde inte behandla bilden.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isMember) {
      alert("Endast godkända medlemmar kan ladda upp till galleriet.");
      return;
    }
    if (!imagePreview) {
      alert("Vänligen välj en bild att ladda upp.");
      return;
    }
    if (!title.trim()) {
      alert("Vänligen ange en titel eller beskrivning för bilden.");
      return;
    }

    setUploading(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        title,
        category: uploadCategory,
        src: imagePreview,
        type: 'image',
        uploaderEmail: currentUser?.email || 'Okänd Medlem',
        uploaderName: currentUser?.email?.split('@')[0] || 'Medlem',
        likes: [],
        likeCount: 0,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setImagePreview(null);
      setShowUploadStudio(false);
    } catch (err) {
      console.error("Fel vid uppladdning:", err);
      alert("Kunde inte ladda upp fil till galleriet: " + err.message);
    }
    setUploading(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'gallery', itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error("Fel vid radering av bild:", err);
    }
  };

  const handleToggleLike = async (item, e) => {
    e.stopPropagation();
    if (!currentUser || String(item.id).startsWith('def_')) return;
    
    const uid = currentUser.uid;
    const itemRef = doc(db, 'gallery', item.id);
    const isLiked = item.likes && item.likes.includes(uid);
    
    try {
      if (isLiked) {
        await updateDoc(itemRef, {
          likes: arrayRemove(uid),
          likeCount: increment(-1)
        });
      } else {
        await updateDoc(itemRef, {
          likes: arrayUnion(uid),
          likeCount: increment(1)
        });
      }
    } catch (err) {
      console.error("Fel vid uppdatering av like:", err);
    }
  };

  // Mappa om gamla kategorier till de nya för att undvika databasstrul
  const mappedDbItems = dbItems.map(item => {
    let cat = item.category;
    if (cat === 'Ritter' || cat === 'Community') cat = 'Community';
    if (cat === 'MC' || cat === 'Motorcyklar') cat = 'Motorcyklar';
    return { ...item, category: cat };
  });

  const combinedItems = [...mappedDbItems, ...defaultItems];
  let filtered = [];

  if (activeCategory === 'Alla') {
    const communityItems = combinedItems.filter(item => item.category === 'Community');
    const otherItems = combinedItems.filter(item => item.category !== 'Community');
    
    let commIndex = 0;
    let otherIndex = 0;
    
    // Första 10 prioriterar Community starkt
    while (commIndex < communityItems.length || otherIndex < otherItems.length) {
      if (filtered.length < 10) {
        if (filtered.length % 3 !== 2 && commIndex < communityItems.length) {
          filtered.push(communityItems[commIndex++]);
        } else if (otherIndex < otherItems.length) {
          filtered.push(otherItems[otherIndex++]);
        } else if (commIndex < communityItems.length) {
          filtered.push(communityItems[commIndex++]);
        }
      } else {
        // Efter 10 blandas de
        if (filtered.length % 2 === 0 && commIndex < communityItems.length) {
          filtered.push(communityItems[commIndex++]);
        } else if (otherIndex < otherItems.length) {
          filtered.push(otherItems[otherIndex++]);
        } else if (commIndex < communityItems.length) {
          filtered.push(communityItems[commIndex++]);
        }
      }
    }
  } else {
    filtered = combinedItems.filter(item => item.category === activeCategory);
  }

  return (
    <motion.div
      className="gallery-page page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="gallery-page__hero">
        <div className="container">
          <p className="section-label">Galleri</p>
          <h1 className="gallery-page__title">
            <GlitchText text="BILDER &" tag="span" className="gallery-page__title-line" />
            <br />
            <GlitchText text="VIDEOS" tag="span" className="gallery-page__title-line gallery-page__title-line--outline" continuous />
          </h1>
        </div>
      </div>

      <div className="container">
        {/* Medlem: Ladda upp ny bild (Dolt bakom + knapp) */}
        {isMember && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showUploadStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowUploadStudio(!showUploadStudio)}
                className="btn btn-outline"
                title="Klicka för att ladda upp foto till galleriet"
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
                  background: showUploadStudio ? '#00f5ff22' : 'transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: '1', color: '#00f5ff', fontWeight: '900' }}>{showUploadStudio ? '✕' : '+'}</span>
                <span>{showUploadStudio ? 'Stäng Uppladdning' : 'Ladda Upp Nytt Foto'}</span>
              </button>
            </div>

            {showUploadStudio && (
              <div style={{ background: 'linear-gradient(145deg, #141821 0%, #0a0c12 100%)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(0, 245, 255, 0.3)', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                <h3 style={{ borderBottom: '2px solid #00f5ff', paddingBottom: '0.8rem', color: '#ffffff', margin: '0 0 1.5rem', fontSize: '1.3rem', fontWeight: 800 }}>
                  PUBLICERA TILL OFFICIELLA GALLERIET
                </h3>
                <p style={{ color: '#a0a6b5', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Som godkänd medlem kan du ladda upp foton direkt till galleriets flöde. Din bild blir omedelbart synlig för alla besökare och gäster på webbplatsen.
                </p>
                
                <form onSubmit={handleUpload}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#c0c6d4', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>Titel eller Bildbeskrivning:</label>
                      <input 
                        type="text" 
                        placeholder="T.ex. Nattstopp vid hamnen..." 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#c0c6d4', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>Kategori:</label>
                      <select 
                        value={uploadCategory} 
                        onChange={(e) => setUploadCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff' }}
                      >
                        <option value="Motorcyklar">Motorcyklar</option>
                        <option value="Community">Community</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', color: '#c0c6d4', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Välj Bild från Mobil eller Dator:</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label className="btn btn-outline" style={{ padding: '0.7rem 1.4rem', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Välj Foto Att Ladda Upp</span>
                          <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                        </label>

                        {imagePreview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#07080a', padding: '0.4rem 1rem', borderRadius: '10px', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                            <span style={{ color: '#00ff88', fontSize: '0.85rem', fontWeight: 700 }}>Foto optimerat och redo för publicering</span>
                            <button type="button" onClick={() => setImagePreview(null)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={uploading || !imagePreview} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 800, backgroundColor: '#00f5ff', color: '#000', cursor: 'pointer', border: 'none', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {uploading ? 'Publicerar bild till galleriet...' : 'Publicera Foto i Gallerit'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Filter */}
        <div className="gallery-page__filters" role="tablist" aria-label="Filtrera galleri">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`gallery-filter-${cat.toLowerCase()}`}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`gallery-page__filter ${activeCategory === cat ? 'gallery-page__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="gallery-page__grid" role="list">
          {filtered.map((item, i) => {
            const parallaxY = i % 3 === 1 ? yFast : i % 3 === 2 ? yMedium : 0;
            return (
            <ScrollReveal key={item.id} delay={i * 40} className="gallery-page__item" role="listitem" style={{ position: 'relative' }}>
              <motion.div style={{ y: parallaxY, height: '100%' }}>
              {(isAdmin || (currentUser && currentUser.email === item.uploaderEmail)) && !String(item.id).startsWith('def_') && (
                <button
                  onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 10,
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.7rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                  title="Radera foto"
                >
                  Radera
                </button>
              )}
              <button
                id={`gallery-item-${item.id}`}
                className="gallery-page__img-btn"
                onClick={() => setLightbox(item)}
                aria-label={`Öppna ${item.title}`}
                style={{ width: '100%', height: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <div className="gallery-page__img-wrap">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="gallery-page__img"
                    loading="lazy"
                  />
                  <div className="gallery-page__img-overlay">
                    <span className="gallery-page__img-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                    </span>
                    <span className="gallery-page__img-label">{item.title}</span>
                  </div>
                </div>
                <div className="gallery-page__img-meta">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                      <span className="tag" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>{item.category}</span>
                      <span className="gallery-page__img-title">
                        {item.title}
                        {item.uploaderName && <span style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'normal', marginTop: '0.2rem' }}>Foto av: {item.uploaderName}</span>}
                      </span>
                    </div>
                    {!String(item.id).startsWith('def_') && (
                      <button 
                        onClick={(e) => handleToggleLike(item, e)}
                        style={{ 
                          background: 'rgba(0,0,0,0.6)', 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '50px', 
                          border: '1px solid ' + ((item.likes && currentUser && item.likes.includes(currentUser.uid)) ? '#00f5ff' : '#333'), 
                          color: (item.likes && currentUser && item.likes.includes(currentUser.uid)) ? '#00f5ff' : '#888', 
                          cursor: currentUser ? 'pointer' : 'default', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          fontSize: '1rem',
                          marginLeft: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                        title={currentUser ? "Gilla bild" : "Logga in för att gilla"}
                      >
                        👍 <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.likeCount || 0}</span>
                      </button>
                    )}
                  </div>
                </div>
              </button>
              </motion.div>
            </ScrollReveal>
          )})}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <button
            id="lightbox-close"
            className="lightbox__close"
            aria-label="Stäng"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.title}
            className="lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="lightbox__caption">
            {lightbox.title}
            {lightbox.uploaderName && ` (av ${lightbox.uploaderName})`}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Radera Galleribild"
        message={`Är du säker på att du vill radera "${itemToDelete?.title}" permanent från klubbens galleri?`}
        confirmText="Radera Permanent"
        cancelText="Avbryt"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </motion.div>
  );
}

