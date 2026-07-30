import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './RideMap.css';

// Fix for default marker icons in React Leaflet with Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle clicks on the map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function RideMap() {
  const { currentUser, userData, isAdmin } = useAuth();
  const [pins, setPins] = useState([]);
  const [newPinLoc, setNewPinLoc] = useState(null);
  const [pinTitle, setPinTitle] = useState('');
  const [pinType, setPinType] = useState('Väg'); // 'Väg', 'Fikaställe', 'Fartkamera', 'Varning'
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'map_pins'), (snapshot) => {
      const p = [];
      snapshot.forEach(docSnap => {
        p.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPins(p);
    });
    return () => unsub();
  }, []);

  const handleMapClick = (latlng) => {
    setNewPinLoc(latlng);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!pinTitle || !newPinLoc) return;

    try {
      await addDoc(collection(db, 'map_pins'), {
        title: pinTitle,
        type: pinType,
        lat: newPinLoc.lat,
        lng: newPinLoc.lng,
        createdAt: serverTimestamp(),
        createdBy: userData?.firstName || currentUser.email.split('@')[0],
        uid: currentUser.uid
      });
      setNewPinLoc(null);
      setPinTitle('');
    } catch(err) {
      alert("Fel: " + err.message);
    }
  };

  const handleDeletePin = async (id) => {
    if (window.confirm('Vill du verkligen radera denna pin?')) {
      await deleteDoc(doc(db, 'map_pins', id));
    }
  };

  return (
    <div className="ridemap-page">
      <div className="container">
        <header className="ridemap-header">
          <h1>Interaktiv Ride-Karta</h1>
          <p>Klubbens gemensamma karta. Klicka var som helst för att varna för grus, lägga till fina MC-vägar eller bra samlingsplatser.</p>
        </header>

        <div className="ridemap-container">
          <MapContainer 
            center={[59.3293, 18.0686]} // Sthlm default
            zoom={10} 
            scrollWheelZoom={true}
            style={{ height: '600px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {pins.map(pin => (
              <Marker key={pin.id} position={[pin.lat, pin.lng]}>
                <Popup>
                  <div style={{ color: '#000' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{pin.title}</strong><br/>
                    <em>Kategori: {pin.type}</em><br/>
                    <small style={{ color: '#666' }}>Tillagd av: {pin.createdBy}</small>
                    {(isAdmin || pin.uid === currentUser.uid) && (
                      <div style={{ marginTop: '10px' }}>
                        <button onClick={() => handleDeletePin(pin.id)} style={{ background: '#ff0055', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Ta bort pin</button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapClickHandler onMapClick={handleMapClick} />
            
            {newPinLoc && (
              <Marker position={[newPinLoc.lat, newPinLoc.lng]}>
                <Popup>
                  <form onSubmit={handleSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                    <h4 style={{ margin: 0, color: '#000' }}>Lägg till plats</h4>
                    <input type="text" placeholder="Titel (t.ex. Bra fik)" value={pinTitle} onChange={e => setPinTitle(e.target.value)} required style={{ padding: '0.5rem', border: '1px solid #ccc' }} />
                    <select value={pinType} onChange={e => setPinType(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                      <option value="Fikaställe">☕ Fikaställe</option>
                      <option value="Bästa Asfalten">🏍️ Bästa Asfalten</option>
                      <option value="Slingerbulten">🐍 Slingerbulten</option>
                      <option value="Fartkamera">📷 Fartkamera</option>
                      <option value="Grus/Fara">⚠️ Grus/Fara</option>
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="submit" style={{ flex: 1, background: '#000', color: '#fff', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>Spara</button>
                      <button type="button" onClick={() => setNewPinLoc(null)} style={{ flex: 1, background: '#ccc', color: '#000', border: 'none', padding: '0.5rem', cursor: 'pointer' }}>Avbryt</button>
                    </div>
                  </form>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
