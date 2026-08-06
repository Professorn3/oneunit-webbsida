import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageHelper';
import ConfirmModal from '../components/ConfirmModal';
import './Merch.css';

export default function Merch() {
  const { isAdmin, currentUser } = useAuth();
  const [merchItems, setMerchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAdminStudio, setShowAdminStudio] = useState(false);

  // Edit State
  const [itemToEdit, setItemToEdit] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Hoodie');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editing, setEditing] = useState(false);

  // Admin studio state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hoodie');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'merch'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMerchItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Fel vid hämtning av merch:", err);
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
      setImageFile(file);
    } catch (err) {
      alert("Kunde inte hantera bilden: " + err.message);
    }
  };

  const handleCreateMerch = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title || !description) {
      alert("Vänligen ange titel och beskrivning för merch-plagget!");
      return;
    }

    setCreating(true);
    try {
      let imgUrl = '/images/gallery_1.png';

      if (imagePreview && imageFile) {
        // Ladda upp till Firebase Storage
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const fileRef = storageRef(storage, `merch_images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, blob);
        imgUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'merch'), {
        title,
        category,
        description,
        price,
        image: imgUrl,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.email || 'admin'
      });

      // Reset
      setTitle('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Fel vid skapad av merch:", err);
      alert("Kunde inte spara plagg: " + err.message);
    }
    setCreating(false);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'merch', itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error("Fel vid radering:", err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!itemToEdit || !editTitle.trim() || !editDescription.trim()) return;
    setEditing(true);
    try {
      await updateDoc(doc(db, 'merch', itemToEdit.id), {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        price: editPrice
      });
      setItemToEdit(null);
    } catch (err) {
      console.error("Fel vid uppdatering av merch:", err);
      alert("Kunde inte uppdatera merch-plagget.");
    }
    setEditing(false);
  };

  const displayItems = merchItems;

  return (
    <motion.div 
      className="merch-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <header className="merch-hero">
          <p className="merch-eyebrow">ONEUNIT · CLUB GEAR</p>
          <h1 className="merch-title">OFFICIELL MERCHANDISE</h1>
          <p className="merch-subtitle">
            Här visas klubbens officiella sortiment av huvtröjor, t-shirts, kepsar och tillbehör. 
            Vi presenterar våra kollektioner för att alla ska kunna ta del av OneUnit-stilen och se vilka plagg som bär vår sköld på vägarna.
          </p>
        </header>

        {/* --- ADMIN STUDIO FÖR ATT LÄGGA TILL TRÖJOR / MERCH (Dolt bakom +-knapp) --- */}
        {isAdmin && (
          <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showAdminStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowAdminStudio(!showAdminStudio)}
                title="Klicka för att fälla ut / in merch-studion"
                style={{
                  border: '2px solid #00f5ff',
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
                <span>{showAdminStudio ? 'Stäng Merch-modul' : 'Lägg Till Nytt Plagg'}</span>
              </button>
            </div>

            {showAdminStudio && (
              <section className="merch-admin-studio">
                <div className="studio-header">
                  <h2 className="studio-title">ADMIN MERCH-STUDIO: LÄGG UT PLAGG</h2>
                  <span className="tag" style={{ backgroundColor: '#00f5ff22', borderColor: '#00f5ff', color: '#00f5ff' }}>Aktiv Modul</span>
                </div>

            <form onSubmit={handleCreateMerch}>
              <div className="merch-form-grid">
                <div className="form-group">
                  <label>Plaggets Namn / Titel</label>
                  <input 
                    type="text" 
                    placeholder="T.ex. OneUnit Heavy Duty Biker Hoodie..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Hoodie">Hoodie / Tröja</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Keps">Keps & Mössa</option>
                    <option value="Jacka">Jacka / Väst</option>
                    <option value="Accessoar">Accessoar / Tillbehör</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pris (kr)</label>
                  <input 
                    type="text" 
                    placeholder="T.ex. 499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Beskrivning</label>
                  <textarea 
                    rows={3} 
                    placeholder="Beskriv plaggets kvalitet, passform eller detaljer (Obs: Ingen prisinformation!)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Bild / Foto på Plagget</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="photo-upload-label">
                      <span>Välj eller Fota från Mobil / Dator</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        style={{ display: 'none' }}
                      />
                    </label>
                    {imagePreview && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0a0b0e', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #00f5ff44' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        <span style={{ fontSize: '0.8rem', color: '#00ff88' }}>✓ Foto redo för publicering!</span>
                        <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={creating}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {creating ? 'Sparar i molnkatalog...' : 'PUBLICERA MERCH NU'}
              </button>
            </form>
          </section>
            )}
          </div>
        )}

        {/* --- MERCH GRID --- */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '3rem 0' }}>Laddar merch-katalog...</p>
        ) : (
          <div className="merch-grid">
            {displayItems.map((item) => (
              <article 
                key={item.id} 
                className="merch-card" 
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="merch-img-wrapper">
                  <span className="merch-tag">{item.category}</span>
                  {isAdmin && !item.id.startsWith('default_') && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setItemToEdit(item); 
                          setEditTitle(item.title || '');
                          setEditCategory(item.category || 'Hoodie');
                          setEditDescription(item.description || '');
                          setEditPrice(item.price || '');
                        }}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0, 245, 255, 0.9)', color: '#000', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        title="Redigera Merch"
                      >
                        Redigera
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                        title="Radera plagg"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        Radera
                      </button>
                    </div>
                  )}
                  <img src={item.image || '/images/gallery_1.png'} alt={item.title} className="merch-img" loading="lazy" />
                </div>

                <div className="merch-content">
                  <div>
                    <h2 className="merch-item-title">{item.title}</h2>
                    {item.price && <p style={{ fontSize: '1.2rem', color: '#00f5ff', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{item.price} kr</p>}
                    <p className="merch-item-desc">{item.description}</p>
                  </div>


                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!itemToDelete}
        title="Radera Merch?"
        message={`Vill du verkligen radera "${itemToDelete?.title}" från katalogen? Detta kan inte ångras.`}
        confirmText="Ja, radera plagg"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          onClick={() => setSelectedItem(null)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            className="lightbox__close"
            aria-label="Stäng"
            onClick={() => setSelectedItem(null)}
            style={{ zIndex: 1100 }}
          >
            ✕
          </button>
          
          <img
            src={selectedItem.image || '/images/gallery_1.png'}
            alt={selectedItem.title}
            className="lightbox__img"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '60vh', maxWidth: '90vw', objectFit: 'contain' }}
          />

          <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', padding: '0 1rem', background: 'rgba(0,0,0,0.6)', paddingBottom: '2rem', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <p className="lightbox__caption" style={{ margin: 0, position: 'relative', background: 'none', paddingBottom: '0.5rem' }}>
              {selectedItem.title}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
              <span className="tag" style={{ background: '#222' }}>{selectedItem.category}</span>
              {selectedItem.price && <span className="tag" style={{ background: '#00f5ff22', color: '#00f5ff', border: '1px solid #00f5ff' }}>{selectedItem.price} kr</span>}
            </div>
            
            <div style={{ lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-wrap', fontSize: '1rem', textAlign: 'center', maxWidth: '600px' }}>
              {selectedItem.description}
            </div>

            {isAdmin && !String(selectedItem.id).startsWith('default_') && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => { 
                    setItemToEdit(selectedItem); 
                    setEditTitle(selectedItem.title || '');
                    setEditCategory(selectedItem.category || 'Hoodie');
                    setEditDescription(selectedItem.description || '');
                    setEditPrice(selectedItem.price || '');
                    setSelectedItem(null);
                  }}
                  className="btn"
                  style={{ background: 'rgba(0, 245, 255, 0.2)', color: '#00f5ff', border: '1px solid #00f5ff' }}
                >
                  Redigera
                </button>
                <button
                  onClick={() => { 
                    setItemToDelete(selectedItem); 
                    setSelectedItem(null);
                  }}
                  className="btn"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ff4444', border: '1px solid #ff4444' }}
                >
                  Radera
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {itemToEdit && (
        <div className="upload-studio-overlay" onClick={() => setItemToEdit(null)}>
          <div className="upload-studio-card card" onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid #333', maxWidth: '600px', width: '90%', padding: '2rem', borderRadius: '12px' }}>
            <div className="upload-studio-header">
              <h2 className="glitch-text" data-text="REDIGERA MERCH">REDIGERA MERCH</h2>
              <button className="close-btn" onClick={() => setItemToEdit(null)} aria-label="Stäng redigerare">×</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="upload-studio-form">
              <div className="form-group">
                <label>Plaggets Namn / Titel</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="T.ex. OneUnit Hoodie"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.8rem', borderRadius: '4px', width: '100%' }}
                >
                  <option value="Hoodie">Hoodie / Tröja</option>
                  <option value="T-Shirt">T-Shirt</option>
                  <option value="Keps">Keps & Mössa</option>
                  <option value="Jacka">Jacka / Väst</option>
                  <option value="Accessoar">Accessoar / Tillbehör</option>
                  <option value="Ryggmärke">Ryggmärke</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pris (kr)</label>
                <input 
                  type="text" 
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  placeholder="T.ex. 499"
                />
              </div>

              <div className="form-group">
                <label>Beskrivning</label>
                <textarea 
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Beskriv plagget..."
                  rows="4"
                  required
                />
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
