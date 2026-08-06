import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import pb from '../pocketbase';
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



const categories = ['Alla', 'Motorcyklar', 'Community'];

export default function Gallery() {
  const { currentUser, isMember, isAdmin } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Alla');
  const [lightbox, setLightbox] = useState(null);
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Edit State
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Motorcyklar');
  const [editing, setEditing] = useState(false);

  // Upload Studio State
  const [showUploadStudio, setShowUploadStudio] = useState(false);
  const [title, setTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Motorcyklar');
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Parallax hooks
  const { scrollYProgress } = useScroll();
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const yMedium = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    let active = true;
    const fetchGallery = async () => {
      try {
        const records = await pb.collection('gallery').getFullList({ sort: '-created' });
        if (active) {
          setDbItems(records);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fel vid hämtning av galleri:", err);
        if (active) setLoading(false);
      }
    };
    fetchGallery();
    
    pb.collection('gallery').subscribe('*', function (e) {
      if (e.action === 'create') {
        setDbItems(prev => [e.record, ...prev].sort((a,b) => new Date(b.created) - new Date(a.created)));
      } else if (e.action === 'update') {
        setDbItems(prev => prev.map(item => item.id === e.record.id ? e.record : item));
      } else if (e.action === 'delete') {
        setDbItems(prev => prev.filter(item => item.id !== e.record.id));
      }
    });

    return () => {
      active = false;
      pb.collection('gallery').unsubscribe('*');
    };
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          alert('Videon är för lång! Max 60 sekunder tillåts.');
          e.target.value = '';
          return;
        }
        setVideoFile(file);
        setImagePreview(URL.createObjectURL(file));
      };
      video.onerror = () => {
        // Fallback for unsupported video formats like some .mov
        setVideoFile(file);
        setImagePreview('/images/gallery_1.png');
      };
      video.src = URL.createObjectURL(file);
      return;
    }

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file, 800, 0.7);
        setVideoFile(null);
        setImagePreview(compressed);
      } catch (err) {
        console.error("Fel vid bildbehandling:", err);
        alert("Kunde inte behandla bilden.");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isMember) {
      alert("Endast godkända medlemmar kan ladda upp till galleriet.");
      return;
    }
    if (!imagePreview && !videoFile) {
      alert("Vänligen välj en bild eller video att ladda upp.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', uploadCategory);
      formData.append('type', videoFile ? 'video' : 'image');
      formData.append('uploaderEmail', currentUser?.email || 'Okänd Medlem');
      formData.append('uploaderName', currentUser?.email?.split('@')[0] || 'Medlem');
      formData.append('likeCount', 0);

      if (videoFile) {
        formData.append('media', videoFile);
      } else if (imagePreview) {
        const res = await fetch(imagePreview);
        const blob = await res.blob();
        formData.append('media', blob, 'image.jpg');
      }

      await pb.collection('gallery').create(formData);
      
      setTitle('');
      setImagePreview(null);
      setVideoFile(null);
      setUploadProgress(0);
      setShowUploadStudio(false);
    } catch (err) {
      console.error("Fel vid uppladdning:", err);
      alert("Kunde inte ladda upp filen till galleriet: " + err.message);
    }
    setUploading(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await pb.collection('gallery').delete(itemToDelete.id);
      setItemToDelete(null);
    } catch (err) {
      console.error("Fel vid radering av bild:", err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!itemToEdit || !editTitle.trim()) return;
    setEditing(true);
    try {
      await pb.collection('gallery').update(itemToEdit.id, {
        title: editTitle,
        category: editCategory
      });
      setItemToEdit(null);
    } catch (err) {
      console.error("Fel vid uppdatering:", err);
      alert("Kunde inte uppdatera bilden.");
    }
    setEditing(false);
  };

  const handleToggleLike = async (item, e) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const uid = currentUser.id;
    const isLiked = item.likes && item.likes.includes(uid);
    
    try {
      if (isLiked) {
        const newLikes = item.likes.filter(id => id !== uid);
        await pb.collection('gallery').update(item.id, {
          likes: newLikes,
          likeCount: newLikes.length
        });
        if (lightbox && lightbox.id === item.id) {
          setLightbox(prev => ({ ...prev, likes: newLikes, likeCount: newLikes.length }));
        }
      } else {
        const newLikes = [...(item.likes || []), uid];
        await pb.collection('gallery').update(item.id, {
          likes: newLikes,
          likeCount: newLikes.length
        });
        if (lightbox && lightbox.id === item.id) {
          setLightbox(prev => ({ ...prev, likes: newLikes, likeCount: newLikes.length }));
        }
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

  const combinedItems = [...mappedDbItems];
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
      <div className="container" style={{ paddingTop: '8rem' }}>
        {/* Medlem: Ladda upp ny bild (Dolt bakom + knapp) */}
        {isMember && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showUploadStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowUploadStudio(!showUploadStudio)}
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
                        <label className="btn" style={{ padding: '0.7rem 1.4rem', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #444', color: '#fff', background: '#222' }}>
                          <span>Välj Bild eller Video (Max 60s)</span>
                          <input type="file" accept="image/*,video/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                        </label>

                        {imagePreview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#07080a', padding: '0.4rem 1rem', borderRadius: '10px', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
                            {videoFile ? (
                              <video src={imagePreview} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} muted />
                            ) : (
                              <img src={imagePreview} alt="Preview" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                            )}
                            <span style={{ color: '#00ff88', fontSize: '0.85rem', fontWeight: 700 }}>{videoFile ? 'Video redo' : 'Foto optimerat och redo'}</span>
                            <button type="button" onClick={() => { setImagePreview(null); setVideoFile(null); }} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={uploading || !imagePreview} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 800, backgroundColor: '#00f5ff', color: '#000', cursor: 'pointer', border: 'none', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {uploading ? (videoFile ? `Laddar upp video... (detta kan ta en stund)` : 'Publicerar bild till galleriet...') : 'Publicera i Galleriet'}
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
              <button
                id={`gallery-item-${item.id}`}
                className="gallery-page__img-btn"
                onClick={() => setLightbox(item)}
                aria-label={`Öppna ${item.title}`}
                style={{ width: '100%', height: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <div className="gallery-page__img-wrap">
                  {item.type === 'video' ? (
                    <video
                      src={pb.files.getURL(item, item.media)}
                      className="gallery-page__img"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={pb.files.getURL(item, item.media)}
                      alt={item.title}
                      className="gallery-page__img"
                      loading="lazy"
                    />
                  )}
                  <div className="gallery-page__img-overlay">
                    <span className="gallery-page__img-icon">
                      {item.type === 'video' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                      )}
                    </span>
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
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            id="lightbox-close"
            className="lightbox__close"
            aria-label="Stäng"
            onClick={() => setLightbox(null)}
            style={{ zIndex: 1100 }}
          >
            ✕
          </button>
          
          {lightbox.type === 'video' ? (
            <video
              src={pb.files.getURL(lightbox, lightbox.media)}
              controls
              autoPlay
              className="lightbox__img"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh', maxWidth: '90vw' }}
            />
          ) : (
            <img
              src={pb.files.getURL(lightbox, lightbox.media)}
              alt={lightbox.title}
              className="lightbox__img"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh', maxWidth: '90vw' }}
            />
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            {lightbox.title && (
              <p className="lightbox__caption" style={{ margin: 0, position: 'relative', background: 'none' }}>
                {lightbox.title}
                {lightbox.uploaderName && ` (av ${lightbox.uploaderName})`}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
              {currentUser && (
                <button 
                  onClick={(e) => handleToggleLike(lightbox, e)}
                  style={{ 
                    background: 'rgba(0,0,0,0.6)', 
                    padding: '0.6rem 1.2rem', 
                    borderRadius: '50px', 
                    border: '1px solid ' + ((lightbox.likes && lightbox.likes.includes(currentUser.id)) ? '#00f5ff' : '#333'), 
                    color: (lightbox.likes && lightbox.likes.includes(currentUser.id)) ? '#00f5ff' : '#888', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '1.1rem',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold'
                  }}
                  title="Gilla bild"
                >
                  👍 <span>{lightbox.likeCount || 0}</span>
                </button>
              )}

              {(isAdmin || (currentUser && currentUser.email === lightbox.uploaderEmail)) && (
                <>
                  <button
                    onClick={() => { 
                      setItemToEdit(lightbox); 
                      setEditTitle(lightbox.title || '');
                      setEditCategory(lightbox.category || 'Motorcyklar');
                      setLightbox(null);
                    }}
                    className="btn"
                    style={{ background: 'rgba(0, 245, 255, 0.2)', color: '#00f5ff', border: '1px solid #00f5ff', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: 'bold' }}
                  >
                    Redigera
                  </button>
                  <button
                    onClick={() => { 
                      setItemToDelete(lightbox); 
                      setLightbox(null);
                    }}
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ff4444', border: '1px solid #ff4444', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: 'bold' }}
                  >
                    Radera
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Radera Galleribild"
        message={`Är du säker på att du vill radera "${itemToDelete?.title}" permanent från klubbens galleri?`}
        confirmText="Ja, radera bild"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Edit Modal */}
      {itemToEdit && (
        <div className="upload-studio-overlay" onClick={() => setItemToEdit(null)}>
          <div className="upload-studio-card card" onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid #333', maxWidth: '600px', width: '90%', padding: '2rem', borderRadius: '12px' }}>
            <div className="upload-studio-header">
              <h2 className="glitch-text" data-text="REDIGERA BILD">REDIGERA BILD</h2>
              <button className="close-btn" onClick={() => setItemToEdit(null)} aria-label="Stäng redigerare">×</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="upload-studio-form">
              <div className="form-group">
                <label>Titel / Beskrivning</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="T.ex. Nattritt i city"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <div className="category-select-grid">
                  {categories.filter(c => c !== 'Alla').map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-select-btn ${editCategory === cat ? 'active' : ''}`}
                      onClick={() => setEditCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#00f5ff', color: '#000', fontWeight: 'bold' }} disabled={editing}>
                {editing ? 'Sparar...' : 'Spara Ändringar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
