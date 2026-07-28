import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import './Meetups.css';

// Standard-evenemang om inget lagts in i Firestore ännu
const DEFAULT_MEETUPS = [
  {
    id: 'default_1',
    title: '🔥 Vårpremiär: Kustvägen mot Varberg & BBQ',
    date: 'Lördag 15 Maj - 11:00',
    location: 'Samling vid Klubben / Centralporten',
    route: 'Göteborg -> Kungsbacka -> Kustvägen till Varbergs Fästning',
    description: 'Vår första officiella gemensamma långkörning för sæsonen! Vi cruisar söderut längs den natursköna kustvägen, stannar vid havet för gruppfoton, och avslutar med en maxad BBQ vid hamnen. Hojar tankade och redo!',
    attendees: ['Alex (Captain)', 'Rider_Marcus', 'Viktor_MC', 'Adam']
  },
  {
    id: 'default_2',
    title: '⚡ Midnattsritt: Urban Light Cruise',
    date: 'Fredag 4 Juni - 21:30',
    location: 'Götaverken / Frihamnen',
    route: 'Cityhamnen -> Hisingsbron -> Älvsborgsbroberg -> Nattfik',
    description: 'En mäktig nattlig rullning genom Göteborgs upplysta gatunät och broar. Perfekt för nattfotografering med glimmande ljus och djupt motorlyft i tunnelsträckorna.',
    attendees: ['Oliver', 'Adam', 'Kajsa_Rider', 'Erik_OneUnit']
  },
  {
    id: 'default_3',
    title: '🏆 OneUnit Annual Summer End Run & Biker Fest',
    date: 'Lördag 28 Augusti - 12:00',
    location: 'Huvuddammarna',
    route: '12 mil inåt landet -> Sjökrog -> Kvällsfest på Klubbhaket',
    description: 'Årets största höjdpunkt! En fantastisk dagskärning på svepande landsvägar följt av prisutdelning (Årets Hoj, Bästa Ljud) och exklusiv medlemskväll. Missa inte!',
    attendees: ['Hela Styrelsen', 'Adam', 'Micke', 'David_R', 'Leo', 'Stefan_V2']
  }
];

export default function Meetups() {
  const { currentUser, isAdmin, isMember } = useAuth();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetupToDelete, setMeetupToDelete] = useState(null);
  const [showAdminStudio, setShowAdminStudio] = useState(false);

  // Admin Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [route, setRoute] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'meetups'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMeetups(list);
      setLoading(false);
    }, (err) => {
      console.error("Fel vid hämtning av meetups:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Hantera skapande av nytt Meetup (Endast för Admins)
  const handleCreateMeetup = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title || !date || !location) {
      alert("Fyll i minst Titel, Datum och Plats!");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'meetups'), {
        title,
        date,
        location,
        route: route || 'Information vid start',
        description,
        attendees: [currentUser.email.split('@')[0] + ' (Arrangör)'],
        createdAt: serverTimestamp(),
        createdBy: currentUser.email
      });
      setTitle('');
      setDate('');
      setLocation('');
      setRoute('');
      setDescription('');
      alert("⚡ Ny Klubbträff har nu publicerats live!");
    } catch (err) {
      console.error(err);
      alert("Fel vid skapande: " + err.message);
    }
    setCreating(false);
  };

  // Hantera deltagande (RSVP)
  const handleToggleRSVP = async (meetup) => {
    if (!currentUser) {
      alert("Logga in som medlem för att anmäla ditt deltagande!");
      return;
    }
    if (meetup.id.startsWith('default_')) {
      alert("Detta är ett demo-evenemang. Skapa eller vänta på ett livetime-utskick från Admin i databaser för att anmäla deg!");
      return;
    }

    const userName = currentUser.email.split('@')[0];
    const isAttending = (meetup.attendees || []).some(a => a.toLowerCase().includes(userName.toLowerCase()));
    const docRef = doc(db, 'meetups', meetup.id);

    try {
      if (isAttending) {
        // Hitta exakta namngrupperingen att ta bort
        const exactMatch = (meetup.attendees || []).find(a => a.toLowerCase().includes(userName.toLowerCase()));
        await updateDoc(docRef, {
          attendees: arrayRemove(exactMatch)
        });
      } else {
        await updateDoc(docRef, {
          attendees: arrayUnion(userName)
        });
      }
    } catch (err) {
      console.error("Fel vid RSVP:", err);
      alert("Kunde inte uppdatera deltagarlista: " + err.message);
    }
  };

  const confirmDeleteMeetup = async () => {
    if (!isAdmin || !meetupToDelete) return;
    try {
      await deleteDoc(doc(db, 'meetups', meetupToDelete.id));
      setMeetupToDelete(null);
    } catch (err) {
      console.error("Fel vid radering:", err);
    }
  };

  // Använd de färdiga standard-träffarna om listan är tom i databasen
  const displayMeetups = meetups.length > 0 ? meetups : DEFAULT_MEETUPS;
  const myDisplayName = currentUser ? currentUser.email.split('@')[0] : '';

  if (!isMember) {
    return (
      <div className="meetups-page" style={{ paddingTop: '150px', paddingBottom: '150px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '650px', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(145deg, #161b24 0%, #0c0e14 100%)', padding: '3.5rem 2.5rem', borderRadius: '24px', border: '1px solid #00f5ff44', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.5px' }}>EXKLUSIV MEDLEMSZON</h2>
            <p style={{ color: '#a0a6b5', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Våra MC-träffar, körvägar och samlingsplatser är endast synliga för godkända medlemmar i brödraskapet. 
              Gäster och besökare saknar behörighet att se schema och mötesinformation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/apply" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Ansök om Medlemskap</a>
              <a href="/login" className="btn btn-outline" style={{ padding: '0.8rem 2rem' }}>Logga In</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="meetups-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        <header className="meetups-hero">
          <p className="meetups-eyebrow">⚡ OneUnit MC · Broderskap På Vägarna ⚡</p>
          <h1 className="meetups-title">MEETUPS & KLUBBTRÄFFAR</h1>
          <p className="meetups-subtitle">
            Haka på klubben på nästa arrangerade ritt, bandag eller samling. 
            Anmäl ditt deltagande direkt nedan och rid sida vid sida i formation.
          </p>
        </header>

        {/* Admin Verktyg: Skapa Nytt Meetup (Dolt bakom +-knapp) */}
        {isAdmin && (
          <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showAdminStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowAdminStudio(!showAdminStudio)}
                className="btn btn-outline"
                title="Klicka för att fälla ut / in skaparmodulen"
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
                <span>{showAdminStudio ? 'Stäng Meetup-modul' : 'Skapa Ny Klubbträff / Meetup'}</span>
              </button>
            </div>

            {showAdminStudio && (
              <div className="admin-meetup-creator">
                <h3>👑 Admin Studio: Skapa Nytt Meetup / Ride</h3>
                <form onSubmit={handleCreateMeetup} className="meetup-form-grid">
              <div className="meetup-form-group">
                <label>Titel på Ritt / Träff:*</label>
                <input 
                  type="text" 
                  placeholder="t.ex. 🔥 Sommarsvepet: Nattcorsa & BBQ"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="meetup-form-group">
                <label>Datum & Tidpunkt:*</label>
                <input 
                  type="text" 
                  placeholder="t.ex. Lördag 24 Juli - Kl. 12:00"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="meetup-form-group">
                <label>Samlingsplats:*</label>
                <input 
                  type="text" 
                  placeholder="t.ex. Klubbhakets gårdsled"
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  required 
                />
              </div>

              <div className="meetup-form-group">
                <label>Rutt / Färdplan (Valfritt):</label>
                <input 
                  type="text" 
                  placeholder="t.ex. City -> Kustvägen -> Hamnkällaren"
                  value={route} 
                  onChange={(e) => setRoute(e.target.value)} 
                />
              </div>

              <div className="meetup-form-group full-width">
                <label>Beskrivning & Information:</label>
                <textarea 
                  rows={3} 
                  placeholder="Skriv detaljer om klädsel, tankning, pauser eller evenemangets mål..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required
                />
              </div>

              <div className="meetup-form-group full-width">
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.05rem', backgroundColor: '#00f5ff', color: '#000', cursor: 'pointer' }}>
                  {creating ? '⏳ Publicerar mot klubben...' : '🚀 PUBLICERA KLUBBTRÄFF NU'}
                </button>
              </div>
            </form>
          </div>
            )}
          </div>
        )}

        {/* Evenemangens Grid */}
        <div className="meetups-grid">
          {displayMeetups.map((event) => {
            const attendeesList = event.attendees || [];
            const amIAttending = myDisplayName && attendeesList.some(a => a.toLowerCase().includes(myDisplayName.toLowerCase()));

            return (
              <div key={event.id} className="meetup-card">
                <div>
                  <span className="meetup-card-badge">🏍️ Kommande Ritt</span>
                </div>
                
                <div className="meetup-card-body">
                  <h3 className="meetup-card-title">{event.title}</h3>

                  <ul className="meetup-meta-list">
                    <li>
                      <span className="meetup-meta-icon">📅</span>
                      <strong>Datum:</strong> {event.date}
                    </li>
                    <li>
                      <span className="meetup-meta-icon">📍</span>
                      <strong>Samling:</strong> {event.location}
                    </li>
                    <li>
                      <span className="meetup-meta-icon">🛣️</span>
                      <strong>Rutt:</strong> {event.route}
                    </li>
                  </ul>

                  <p className="meetup-desc">{event.description}</p>

                  {/* Deltagare / RSVP Lista */}
                  <div className="meetup-attendees-box">
                    <p className="attendees-title">
                      <span>Anmälda Biker-Broder & Syster:</span>
                      <span style={{ color: '#fff' }}>({attendeesList.length} st)</span>
                    </p>
                    <div className="attendee-chips">
                      {attendeesList.map((att, idx) => {
                        const isThisMe = myDisplayName && att.toLowerCase().includes(myDisplayName.toLowerCase());
                        return (
                          <span key={idx} className={`attendee-chip ${isThisMe ? 'is-me' : ''}`}>
                            🏍 {att}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* RSVP Åtgärdsknappar */}
                  <div className="meetup-card-actions">
                    {(isMember || isAdmin) ? (
                      <button 
                        onClick={() => handleToggleRSVP(event)} 
                        className={`btn-rsvp ${amIAttending ? 'leave' : 'join'}`}
                      >
                        {amIAttending ? '❌ Avmäl mig' : '⚡ JAG KOMMER!'}
                      </button>
                    ) : (
                      <div className="meetup-guest-notice">
                        Logga in på ditt medlemskonto för att anmäla deg till ritten!
                      </div>
                    )}

                    {isAdmin && !event.id.startsWith('default_') && (
                      <button 
                        onClick={() => setMeetupToDelete(event)} 
                        className="btn-delete-meetup"
                        title="Radera Meetup"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!meetupToDelete}
        title="Radera Meetup"
        message={`Vill du verkligen radera "${meetupToDelete?.title}" permanent? Detta går inte att ångra.`}
        confirmText="Ja, radera permanent"
        cancelText="Avbryt"
        type="danger"
        onConfirm={confirmDeleteMeetup}
        onCancel={() => setMeetupToDelete(null)}
      />
    </motion.div>
  );
}
