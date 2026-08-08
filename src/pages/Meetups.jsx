import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '../pocketbase';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import ScrambleText from '../components/ScrambleText';
import MapModal from '../components/MapModal';
import { sendBrevoEmail } from '../utils/emailHelper';
import { sendPushNotification } from '../utils/pushHelper';
import './Meetups.css';

// Standard-evenemang om inget lagts in i Firestore ännu
const DEFAULT_MEETUPS = [];

export default function Meetups() {
  const { currentUser, isAdmin, isMember } = useAuth();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetupToDelete, setMeetupToDelete] = useState(null);
  const [showAdminStudio, setShowAdminStudio] = useState(false);
  const [mapOpenFor, setMapOpenFor] = useState(null);

  // Admin Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [route, setRoute] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [notifyChat, setNotifyChat] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMeetups = async () => {
      try {
        const records = await pb.collection('meetups').getFullList({ sort: '-created' });
        if (active) {
          setMeetups(records);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fel vid hämtning av meetups:", err);
        if (active) setLoading(false);
      }
    };
    fetchMeetups();

    pb.collection('meetups').subscribe('*', function (e) {
      if (e.action === 'create') {
        setMeetups(prev => [e.record, ...prev].sort((a,b) => new Date(b.created) - new Date(a.created)));
      } else if (e.action === 'update') {
        setMeetups(prev => prev.map(item => item.id === e.record.id ? e.record : item));
      } else if (e.action === 'delete') {
        setMeetups(prev => prev.filter(item => item.id !== e.record.id));
      }
    });

    return () => {
      active = false;
      pb.collection('meetups').unsubscribe('*');
    };
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
      await pb.collection('meetups').create({
        title,
        date,
        location,
        route: route || 'Information vid start',
        description,
        attendees: [currentUser.email.split('@')[0] + ' (Arrangör)'],
        createdBy: currentUser.email
      });

      if (notifyChat) {
        await pb.collection('club_chat').create({
          text: `🏍️ NY KLUBBTRÄFF UPPLAGD: ${title} den ${date}. Samling: ${location}. Gå in under MEETUPS för att anmäla er!`,
          senderName: 'ONEUNIT SYSTEM',
          senderEmail: currentUser.email,
          isPinned: false
        });
      }

      setTitle('');
      setDate('');
      setLocation('');
      setRoute('');
      setDescription('');
      alert("Ny Klubbträff har nu publicerats live!");
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
    const attendees = meetup.attendees || [];
    const isAttending = attendees.some(a => a.toLowerCase().includes(userName.toLowerCase()));

    try {
      if (isAttending) {
        const exactMatch = attendees.find(a => a.toLowerCase().includes(userName.toLowerCase()));
        const newAttendees = attendees.filter(a => a !== exactMatch);
        await pb.collection('meetups').update(meetup.id, {
          attendees: newAttendees
        });
      } else {
        const newAttendees = [...attendees, userName];
        await pb.collection('meetups').update(meetup.id, {
          attendees: newAttendees
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
      await pb.collection('meetups').delete(meetupToDelete.id);
      setMeetupToDelete(null);
    } catch (err) {
      console.error("Fel vid radering:", err);
    }
  };

  const handleSendRallyPoint = async ({ message, lat, lng, mapsLink }) => {
    if (!mapOpenFor) return;
    try {
      const attendeesList = mapOpenFor.attendees || [];
      if (attendeesList.length === 0) {
        alert("Ingen har anmält sig (RSVP) till denna meetup ännu!");
        setMapOpenFor(null);
        return;
      }
      
      // Vi behöver hämta användarnas emails baserat på deras displayNames i attendeesList
      const users = await pb.collection('users').getFullList();
      const targetEmails = users
        .filter(u => attendeesList.some(a => a.toLowerCase().includes(u.email.split('@')[0].toLowerCase())))
        .map(u => u.email);

      if (targetEmails.length === 0) {
        alert("Kunde inte hitta e-postadresser till de anmälda.");
        setMapOpenFor(null);
        return;
      }

      const senderName = currentUser.name || currentUser.email.split('@')[0];
      const subject = `📍 Återsamlingsplats för ${mapOpenFor.title}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; padding: 35px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
          <h2 style="margin-top:0; color:#00f5ff; font-size:24px;">📍 ÅTERSAMLINGSPLATS</h2>
          <p style="font-size: 16px; line-height: 1.5; color:#fff;">
            Admin <strong>${senderName}</strong> har angivit en samlingsplats för körningen <strong>"${mapOpenFor.title}"</strong>.
          </p>
          <div style="background: rgba(0,245,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(0,245,255,0.3);">
            <p style="margin:0; font-size: 16px; color:#fff;"><strong>Instruktioner:</strong><br/>${message}</p>
          </div>
          <p style="font-size: 16px; color:#fff;">
            <strong>Plats (Google Maps):</strong><br/>
            <a href="${mapsLink}" style="color: #00f5ff; font-weight: bold; font-size: 18px;">📍 Öppna i Kartor (Kör hit!)</a>
          </p>
          <hr style="border:0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #888;">
            Detta utskick skickades endast till de som klickat i att de kommer på detta Meetup.
          </p>
        </div>
      `;

      const emailSuccess = await sendBrevoEmail(targetEmails, subject, htmlContent);
      
      const targetUserIds = users
        .filter(u => attendeesList.some(a => a.toLowerCase().includes(u.email.split('@')[0].toLowerCase())))
        .map(u => u.id);
        
      const pushSuccess = await sendPushNotification(
        `📍 Återsamling: ${mapOpenFor.title}`, 
        message,
        mapsLink,
        targetUserIds
      );
      
      if (emailSuccess || pushSuccess) {
        alert("Återsamlingsplats och instruktioner har skickats till alla anmälda!");
        setMapOpenFor(null);
      } else {
        alert("Något gick fel med utskicket.");
      }
    } catch (e) {
      console.error(e);
      alert("Misslyckades: " + e.message);
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
            <div style={{ textTransform: 'uppercase', color: '#00f5ff', letterSpacing: '2px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>BEHÖRIGHET KRÄVS</div>
            <h2 style={{ color: '#ffffff', fontSize: '2.2rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.5px' }}>EXKLUSIV MEDLEMSZON</h2>
            <p style={{ color: '#a0a6b5', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Våra träffar, rutter och samlingsplatser är endast synliga för godkända medlemmar i gemenskapen. 
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
          <p className="meetups-eyebrow">Träffar & Rides</p>
          <h1 className="meetups-title"><ScrambleText text="MEETUPS" /></h1>
          <p className="meetups-subtitle">
            Häng med på Oneunit nästa arrangerade ride eller träff. 
            Anmäl dig nedanför om du har möjlighet att komma, då ser vi även intresset för en meetup.
          </p>
        </header>

        {/* Admin Verktyg: Skapa Nytt Meetup (Dolt bakom +-knapp) */}
        {isAdmin && (
          <div style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showAdminStudio ? '1.5rem' : '0' }}>
              <button
                onClick={() => setShowAdminStudio(!showAdminStudio)}
                title="Klicka för att fälla ut / in skaparmodulen"
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
                <span>{showAdminStudio ? 'Stäng Meetup-modul' : 'Skapa Ny Klubbträff / Meetup'}</span>
              </button>
            </div>

            {showAdminStudio && (
              <div className="admin-meetup-creator">
                <h3>ADMIN STUDIO: SKAPA NYTT MEETUP / RIDE</h3>
                <form onSubmit={handleCreateMeetup} className="meetup-form-grid">
              <div className="meetup-form-group">
                <label>Titel på Ritt / Träff:*</label>
                <input 
                  type="text" 
                  placeholder="t.ex. Sommarsvepet: Nattcruise & BBQ"
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
                  placeholder="Skriv detaljer om tankning, pauser eller evenemangets mål..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required
                />
              </div>
              <div className="meetup-form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0 1rem 0' }}>
                <input 
                  type="checkbox" 
                  id="notifyChat" 
                  checked={notifyChat}
                  onChange={(e) => setNotifyChat(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00f5ff' }}
                />
                <label htmlFor="notifyChat" style={{ color: '#00f5ff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                  Skicka en blänkare i klubbchatten om denna träff
                </label>
              </div>

              <div className="meetup-form-group full-width">
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.05rem', backgroundColor: '#00f5ff', color: '#000', cursor: 'pointer' }}>
                  {creating ? 'Publicerar mot klubben...' : 'PUBLICERA KLUBBTRÄFF NU'}
                </button>
              </div>
            </form>
          </div>
            )}
          </div>
        )}

        {/* Evenemangens Grid */}
        {displayMeetups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ddd' }}>Inga inplanerade träffar just nu.</h3>
            <p>Håll utkik, vi uppdaterar schemat löpande!</p>
          </div>
        ) : (
          <div className="meetups-grid">
            {displayMeetups.map((event) => {
            const attendeesList = event.attendees || [];
            const amIAttending = myDisplayName && attendeesList.some(a => a.toLowerCase().includes(myDisplayName.toLowerCase()));

            return (
              <div key={event.id} className="meetup-card">
                <div>
                  <span className="meetup-card-badge">KOMMANDE</span>
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
                      <button 
                        onClick={() => setMapOpenFor(mapOpenFor === event.id ? null : event.id)} 
                        style={{ marginLeft: '10px', background: 'transparent', border: '1px solid #444', color: '#00f5ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        {mapOpenFor === event.id ? 'Dölj karta' : 'Visa på karta'}
                      </button>
                    </li>
                    <li>
                      <span className="meetup-meta-icon">🛣️</span>
                      <strong>Rutt:</strong> {event.route}
                    </li>
                  </ul>

                  {mapOpenFor === event.id && (
                    <div style={{ marginTop: '1rem', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                      <iframe 
                        width="100%" 
                        height="200" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}>
                      </iframe>
                    </div>
                  )}

                  <p className="meetup-desc">{event.description}</p>

                  {/* Deltagare / RSVP Lista */}
                  <div className="meetup-attendees-box">
                    <p className="attendees-title">
                      <span>Anmälda Medlemmar:</span>
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

                {isAdmin && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => setMapOpenFor(event)} style={{ border: '1px solid #00f5ff', color: '#00f5ff', padding: '0.4rem 1rem' }}>
                      📍 Skicka Återsamlingsplats
                    </button>
                    <button className="btn-secondary" onClick={() => setMeetupToDelete(event)} style={{ border: '1px solid #ff3b30', color: '#ff3b30', padding: '0.4rem 1rem' }}>
                      Radera Meetup
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal 
        isOpen={!!meetupToDelete}
        onClose={() => setMeetupToDelete(null)}
        onConfirm={confirmDeleteMeetup}
        title="Radera Meetup?"
        message={`Är du säker på att du vill radera "${meetupToDelete?.title}"?`}
        confirmText="Ja, Radera"
        type="danger"
      />

      {mapOpenFor && (
        <MapModal
          isOpen={!!mapOpenFor}
          onClose={() => setMapOpenFor(null)}
          onConfirm={handleSendRallyPoint}
          title={`📍 Återsamlingsplats för ${mapOpenFor.title}`}
          messagePlaceholder="Skriv instruktioner, t.ex. 'Vi samlas vid pumparna om 20 minuter!'"
          confirmText="Skicka Karta till Anmälda"
        />
      )}
    </motion.div>
  );
}
