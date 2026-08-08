import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapModal.css';

// Fix leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle clicks on the map and set marker
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Välj plats", 
  messagePlaceholder = "Skriv ett meddelande...",
  confirmText = "Skicka"
}) {
  const [position, setPosition] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setPosition(null);
      // Auto-fetch location when opened
      handleGetLocation();
    }
  }, [isOpen]);

  const handleGetLocation = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLoadingLoc(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          alert('Kunde inte hämta plats. Dra nålen manuellt på kartan.');
          setPosition({ lat: 59.3293, lng: 18.0686 }); // Default Stockholm
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("GPS stöds inte i din webbläsare.");
      setLoadingLoc(false);
      setPosition({ lat: 59.3293, lng: 18.0686 });
    }
  };

  const handleConfirm = () => {
    if (!position) {
      alert("Välj en plats på kartan först!");
      return;
    }
    if (!message.trim()) {
      alert("Du måste skriva ett meddelande!");
      return;
    }
    onConfirm({
      message,
      lat: position.lat,
      lng: position.lng,
      mapsLink: `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay">
      <div className="map-modal-content">
        <header className="map-modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="map-modal-close">✕</button>
        </header>

        <div className="map-modal-body">
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '10px' }}>
            Din plats hämtas automatiskt. Du kan också <b>klicka var som helst på kartan</b> för att flytta nålen manuellt.
          </p>
          
          <div className="map-container-wrapper">
            {position ? (
              <MapContainer 
                center={position} 
                zoom={14} 
                scrollWheelZoom={true} 
                style={{ height: '300px', width: '100%', borderRadius: '8px' }}
              >
                {/* Satellitkarta från Esri */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: '8px' }}>
                {loadingLoc ? "Söker efter din position... 🌍" : "Kunde inte ladda kartan."}
              </div>
            )}
          </div>

          <textarea
            className="map-modal-textarea"
            placeholder={messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <footer className="map-modal-footer">
          <button onClick={handleGetLocation} className="btn-secondary" style={{ marginRight: 'auto' }}>📍 Min Plats</button>
          <button onClick={onClose} className="btn-secondary">Avbryt</button>
          <button onClick={handleConfirm} className="btn-primary" style={{ background: '#ff3b30' }}>{confirmText}</button>
        </footer>
      </div>
    </div>
  );
}
