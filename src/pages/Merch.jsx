import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageHelper';
import ConfirmModal from '../components/ConfirmModal';
import './Merch.css';

const DEFAULT_MERCH = [
  {
    id: 'default_1',
    title: 'OneUnit Official Hoodie - Night Edition',
    category: 'Hoodie',
    description: 'Vår officiella tunga huvtröja med förstärkta sömmar och broderat OneUnit-ryggemblem. Perfekt att bära under skinnpajen eller vid svala kvällsritt.',
    image: '/images/gallery_1.png'
  },
  {
    id: 'default_2',
    title: 'Broderskap Biker Tee',
    category: 'T-Shirt',
    description: '100% premium ekologisk bomull med diskret OneUnit-sköld på brösten och klubbmotto bak. Slitstark och byggd för mc-livet.',
    image: '/images/gallery_2.png'
  },
  {
    id: 'default_3',
    title: 'OneUnit Cruiser Keps & Beanie',
    category: 'Accessoar',
    description: 'Snygga klubbmössor och flat-brim kepsar med präglat metallmärke. Håller håret på plats när hjälmen åker av.',
    image: '/images/gallery_4.png'
  },
  {
    id: 'default_4',
    title: 'Club Emblem Leather Patch',
    category: 'Ryggmärke',
    description: 'Vårt stoltaste klockade väst-ryggmärke. Endast för fullvärdiga medlemmar i brödraskapet som bevisat sin lojalitet på vägarna.',
    image: '/images/gallery_5.png'
  }
];

export default function Merch() {
  const { isAdmin, currentUser } = useAuth();
  const [merchItems, setMerchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAdminStudio, setShowAdminStudio] = useState(false);

  // Admin studio state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hoodie');
  const [description, setDescription] = useState('');
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
      // Om en ny bild valt använder vi Preview base64, annars standardbild
      const imgUrl = imagePreview || '/images/gallery_1.png';

      await addDoc(collection(db, 'merch'), {
        title,
        category,
        description,
        image: imgUrl,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.email || 'admin'
      });

      // Reset
      setTitle('');
      setDescription('');
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

  // Visa databaskatalogen, eller standard OM databasen är tom
  const displayItems = merchItems.length > 0 ? merchItems : DEFAULT_MERCH;

  return (
    <motion.div 
      className="merch-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <header className="merch-hero">
          <p className="merch-eyebrow">ONEUNIT MC · CLUB GEAR & KLÄDSEL</p>
          <h1 className="merch-title">OFFICIELL MERCHANDISE</h1>
          <p className="merch-subtitle">
            Här visas klubbens officiella sortiment av huvtröjor, t-shirts, kepsar och tillbehör. 
            Vi presenterar våra kollektioner för att alla ska kunna ta del av OneUnit-stilen och se vilka plagg som bär vårt broderskaps sköld på vägarna.
          </p>
        </header>

        {/* --- ADMIN STUDIO FÖR ATT LÄGGA TILL TRÖJOR / MERCH (Dolt bakom +-knapp) --- */}
        {isAdmin && (
          <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showAdminStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowAdminStudio(!showAdminStudio)}
                className="btn btn-outline"
                title="Klicka för att fälla ut / in merch-studion"
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
              <article key={item.id} className="merch-card">
                <div className="merch-img-wrapper">
                  <span className="merch-tag">{item.category}</span>
                  {isAdmin && !item.id.startsWith('default_') && (
                    <button 
                      className="btn-delete-merch" 
                      onClick={() => setItemToDelete(item)}
                      title="Radera plagg"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', borderRadius: '6px' }}
                    >
                      Radera
                    </button>
                  )}
                  <img src={item.image || '/images/gallery_1.png'} alt={item.title} className="merch-img" loading="lazy" />
                </div>

                <div className="merch-content">
                  <div>
                    <h2 className="merch-item-title">{item.title}</h2>
                    <p className="merch-item-desc">{item.description}</p>
                  </div>

                  <div className="merch-footer-badge">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
                    <span>OneUnit MC Official Club Gear</span>
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
    </motion.div>
  );
}
