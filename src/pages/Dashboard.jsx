import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userData, isAdmin, isMember } = useAuth();
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'members' | 'campaigns'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // E-post Utskicksstudio (Kampanjhantering mot Brevo)
  const [campaignTarget, setCampaignTarget] = useState('users');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState('');

  // Systeminställningar & Klubbconfig för Admins
  const [siteName, setSiteName] = useState('OneUnit MC - Official Website');
  const [siteSlogan, setSiteSlogan] = useState('Broderskap, Respekt & Lojalitet På Vägarna');
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [enableChatMedia, setEnableChatMedia] = useState(true);
  const [openForApplications, setOpenForApplications] = useState(true);
  const [clubRules, setClubRules] = useState('1. Respektera alltid brodern och emblemet.\n2. Inga diskussioner om klubbärenden utanför officiella möten.\n3. Håll alltid mc:n redo för samlingsritten.\n4. Alla betalar sin kontingent i tid.');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      // Läs systeminställningar från molnet
      getDoc(doc(db, 'settings', 'general')).then((snap) => {
        if (snap.exists()) {
          const s = snap.data();
          if (s.siteName !== undefined) setSiteName(s.siteName);
          if (s.siteSlogan !== undefined) setSiteSlogan(s.siteSlogan);
          if (s.announcementBanner !== undefined) setAnnouncementBanner(s.announcementBanner);
          if (s.enableChatMedia !== undefined) setEnableChatMedia(s.enableChatMedia);
          if (s.openForApplications !== undefined) setOpenForApplications(s.openForApplications);
          if (s.clubRules !== undefined) setClubRules(s.clubRules);
        }
      }).catch(err => console.error("Fel vid laddning av inställningar:", err));

      // Lyssna på ansökningar
      const qApps = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const unsubApps = onSnapshot(qApps, (snapshot) => {
        const apps = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          if (data.status !== 'approved') {
            apps.push(data); // Visa bara de som INTE är godkända
          }
        });
        setApplications(apps);
      });

      // Lyssna på medlemmar
      const qMembers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubMembers = onSnapshot(qMembers, (snapshot) => {
        const mems = [];
        snapshot.forEach((doc) => {
          mems.push({ id: doc.id, ...doc.data() });
        });
        setMembers(mems);
      });

      return () => {
        unsubApps();
        unsubMembers();
      };
    }
  }, [isAdmin]);

  const handleSendCampaign = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!campaignSubject || !campaignBody) {
      alert("Vänligen fyll i både ämne och dokumenttext!");
      return;
    }
    setConfirmConfig({
      title: "Starta e-postutskick?",
      message: `Vill du verkligen starta ett e-postutskick till ALLA inlagda i kollektionen "${campaignTarget}"?`,
      confirmText: "Ja, starta utskick",
      type: "warning",
      onConfirm: async () => {
        setConfirmConfig(null);
        setSendingCampaign(true);
        setCampaignStatus('');
        try {
          await addDoc(collection(db, 'mail_campaigns'), {
            targetCollection: campaignTarget,
            subject: campaignSubject,
            bodyText: campaignBody,
            status: 'pending',
            createdAt: serverTimestamp(),
            sentBy: currentUser?.email || 'admin'
          });
          setCampaignStatus('Utskicken till "' + campaignTarget + '" har nu startats! Vår molnfunktion anropar just nu Brevo och levererar mejlen.');
          setCampaignSubject('');
          setCampaignBody('');
        } catch (err) {
          console.error("Fel vid utskick:", err);
          alert("Kunde inte starta utskicken: " + err.message);
        }
        setSendingCampaign(false);
      }
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleApproveAndInvite = (app) => {
    if (!isAdmin) return;
    setConfirmConfig({
      title: "Godkänn ansökan?",
      message: `Vill du verkligen godkänna ${app.firstName} och skicka en inbjudningslänk till ${app.email}?`,
      confirmText: "Ja, godkänn & bjud in",
      type: "success",
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          // 1. Skapa en inbjudnings-token i databasen
          const inviteRef = await addDoc(collection(db, 'invites'), {
            email: app.email,
            createdAt: serverTimestamp(),
            used: false
          });

          // Länken som användaren ska klicka på
          const inviteLink = `https://oneunit.com/register?token=${inviteRef.id}`;

          // 2. Öppna ditt vanliga mail-program automatiskt med en färdig mall
          const subject = encodeURIComponent("Välkommen till OneUnit MC!");
          const body = encodeURIComponent(`Hej ${app.firstName}!\n\nDin ansökan har blivit godkänd.\n\nKlicka på länken nedan för att registrera ditt medlemskonto och få tillgång till våra privata sidor och chatt:\n${inviteLink}\n\nVälkommen till brödraskapet!\n\n/OneUnit MC Admin`);
          window.location.href = `mailto:${app.email}?subject=${subject}&body=${body}`;

          // 3. Ta bort eller markera ansökan som godkänd så den försvinner från listan
          await updateDoc(doc(db, 'applications', app.id), {
            status: 'approved'
          });
          
        } catch (err) {
          console.error(err);
          alert('Något gick fel när inbjudan skulle skapas.');
        }
      }
    });
  };

  const handleDenyApplication = (appId) => {
    setConfirmConfig({
      title: "Radera ansökan?",
      message: "Vill du verkligen radera denna ansökan permanent? Detta går inte att ångra.",
      confirmText: "Ja, radera ansökan",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig(null);
        await deleteDoc(doc(db, 'applications', appId));
      }
    });
  };

  const handleRemoveMember = (memberId, email) => {
    if (email === currentUser.email) {
      alert("Du kan inte radera dig själv!");
      return;
    }
    setConfirmConfig({
      title: "Kasta ut medlem?",
      message: `Är du helt säker på att du vill kasta ut ${email} från klubben? Deras konto raderas från systemet.`,
      confirmText: "Ja, kasta ut",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig(null);
        await deleteDoc(doc(db, 'users', memberId));
        // Obs: Detta tar bort deras rättigheter i databasen. För att radera Auth-kontot helt krävs Firebase Admin SDK (Backend), men detta räcker för att spärra dem från sidan.
      }
    });
  };

  // Filtrera medlemmar baserat på sökning
  const filteredMembers = members.filter(m => m.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!userData) return <div className="container" style={{paddingTop: '120px'}}>Laddar...</div>;

  return (
    <div className="dashboard-page">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Mina Sidor</h1>
            <p className="dashboard-subtitle">Inloggad som: {currentUser.email} ({userData.role})</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline">Logga ut</button>
        </header>

        {userData.role === 'guest' && (
          <div className="dashboard-guest-msg">
            <h2>Åtkomst Nekad</h2>
            <p>Du har loggat in, men ditt konto saknar rättigheter. Endast administratörer och godkända medlemmar har tillgång hit.</p>
          </div>
        )}

        {isMember && (
          <div className="dashboard-grid">
            <div className="dashboard-card member-card" style={{ maxWidth: '450px' }}>
              <h3>Ditt Medlemskort</h3>
              <div className="card-inner">
                <img src="/images/logo.png" alt="Logo" width="60" />
                <div>
                  <h4>{currentUser.email.split('@')[0]}</h4>
                  <p>Status: <strong style={{ color: '#00ff88' }}>Aktiv Medlem</strong></p>
                  <p>Roll: {userData.role}</p>
                  <p style={{ fontSize: '0.85rem', color: '#aaaaaa', marginTop: '0.5rem' }}>
                    <em>Klicka på knappen "Klubbchatt" nere till höger på sidan för att fälla ut klubbens realtidschatt oavsett var du befinner dig!</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="dashboard-admin-section">
            <h2 className="admin-title">Admin Panel</h2>
            
            <div className="admin-tabs">
              <button 
                className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('applications')}
              >
                Väntande Ansökningar ({applications.length})
              </button>
              <button 
                className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('members')}
              >
                Medlemsregister ({members.length})
              </button>
              <button 
                className={`btn ${activeTab === 'campaigns' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('campaigns')}
              >
                E-postutskick (users & övriga)
              </button>
              <button 
                className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('settings')}
              >
                Systeminställningar
              </button>
            </div>

            {activeTab === 'applications' && (
              <div className="applications-list">
                {applications.length === 0 ? (
                  <p>Inga nya ansökningar.</p>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="application-item">
                      <div className="app-info">
                        <h4>{app.firstName || app.name} {app.lastName || ''}</h4>
                        <p><strong>Email:</strong> {app.email} | <strong>Ålder:</strong> {app.age} | <strong>Ort:</strong> {app.city}</p>
                        <p><strong>Cykel:</strong> {app.bike}</p>
                        <p><strong>Erfarenhet:</strong> {app.experience}</p>
                        <p><strong>Motivering:</strong> {app.reason || app.motivation}</p>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <button onClick={() => handleApproveAndInvite(app)} className="btn btn-primary" style={{backgroundColor: '#00ff88', color: '#000', borderColor: '#00ff88'}}>
                          Godkänn & Skicka Inbjudan
                        </button>
                        <button onClick={() => handleDenyApplication(app.id)} className="btn btn-outline" style={{borderColor: '#ff0055', color: '#ff0055'}}>
                          Radera Ansökan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="members-list-wrapper">
                <div className="members-toolbar">
                  <input 
                    type="text" 
                    placeholder="Sök medlem via email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="members-search"
                  />
                </div>
                
                <div className="members-grid">
                  {filteredMembers.map(member => (
                    <div key={member.id} className="member-item">
                      <div className="member-avatar" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {member.role === 'admin' ? 'ADM' : 'MED'}
                      </div>
                      <div className="member-details">
                        <p className="member-email">{member.email}</p>
                        <p className="member-role">Roll: {member.role}</p>
                        <p className="member-date">Gick med: {new Date(member.createdAt).toLocaleDateString()}</p>
                      </div>
                      {member.role !== 'admin' && (
                        <button 
                          onClick={() => handleRemoveMember(member.id, member.email)} 
                          className="btn-remove-member"
                          title="Kicka medlem"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="campaign-studio card" style={{ padding: '2rem', marginTop: '1.5rem', border: '1px solid #00f5ff44', borderRadius: '14px', background: '#080808' }}>
                <h3 style={{ color: '#00f5ff', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>OneUnit Massutskick-Studio via Brevo</h3>
                <p style={{ color: '#aaaaaa', marginBottom: '2rem', fontSize: '0.95rem' }}>
                  Härifrån kan du skicka ut meddelanden med rubrik och din egen text (Body) till en hel databassamling samtidigt (t.ex. <strong>users</strong> eller prenumeranter).
                </p>
                
                <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', color: '#00f5ff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Målgrupp för utskicket:</label>
                    <select 
                      value={campaignTarget} 
                      onChange={(e) => setCampaignTarget(e.target.value)}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
                    >
                      <option value="users">Medlemskap & Register (kollektionen: "users")</option>
                      <option value="newsletter_emails">Nyhetsbrevs-listan ("newsletter_emails")</option>
                      <option value="applications">Medlemssökande ("applications")</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#00f5ff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Ämne / Rubrik (Subject text):</label>
                    <input 
                      type="text" 
                      placeholder="Skriv ett slagkraftigt ämne här..."
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontSize: '1rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#00f5ff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Meddelande / Dokument text (Body text):</label>
                    <textarea 
                      rows={8}
                      placeholder="Skriv hela meddelandets innehåll här. Det sänds med en stilren, mörk och lyxig OneUnit-inramning via Brevo..."
                      value={campaignBody}
                      onChange={(e) => setCampaignBody(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical', lineHeight: '1.6' }}
                    />
                  </div>

                  {campaignStatus && (
                    <div style={{ padding: '1.2rem', borderRadius: '8px', background: '#00ff881a', borderLeft: '4px solid #00ff88', color: '#00ff88', fontWeight: 'bold' }}>
                      {campaignStatus}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={sendingCampaign}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#00f5ff', color: '#000', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                  >
                    {sendingCampaign ? 'Registrerar utskicksorder...' : 'Skicka E-postutskick Till Hela Gruppen Nu'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ background: 'linear-gradient(145deg, #161b24 0%, #0c0e14 100%)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(0, 245, 255, 0.3)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' }}>
                <h3 style={{ borderBottom: '2px solid #00f5ff', paddingBottom: '0.8rem', color: '#fff', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span>SYSTEM- & KLUBBINSTÄLLNINGAR</span>
                </h3>
                <p style={{ color: '#a0a6b5', marginBottom: '2rem', lineHeight: '1.6' }}>
                  Här administrerar du klubbens övergripande systemkonfiguration, välkomsttexter, tillåtande av fotouppladdning samt medlemsriktlinjer. Alla ändringar slår igenom omedelbart live på hela webbplatsen.
                </p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingSettings(true);
                  setSettingsSavedMsg('');
                  try {
                    await setDoc(doc(db, 'settings', 'general'), {
                      siteName,
                      siteSlogan,
                      announcementBanner,
                      enableChatMedia,
                      openForApplications,
                      clubRules,
                      updatedAt: serverTimestamp(),
                      updatedBy: currentUser?.email || 'Admin'
                    }, { merge: true });
                    setSettingsSavedMsg('Inställningarna har sparats och är nu live på hela sajten!');
                    setTimeout(() => setSettingsSavedMsg(''), 6000);
                  } catch (err) {
                    alert('Kunde inte spara inställningar: ' + err.message);
                  }
                  setSavingSettings(false);
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#00f5ff', marginBottom: '0.5rem', fontWeight: '600' }}>Klubbens Officiella Webbnamn:</label>
                      <input 
                        type="text" 
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#080a0f', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#00f5ff', marginBottom: '0.5rem', fontWeight: '600' }}>Huvudslogan / Klubb-motto:</label>
                      <input 
                        type="text" 
                        value={siteSlogan}
                        onChange={(e) => setSiteSlogan(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#080a0f', color: '#fff' }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', color: '#ffaa00', marginBottom: '0.5rem', fontWeight: '700' }}>Live Meddelande / Banner på webbplatsen (valfritt):</label>
                      <input 
                        type="text" 
                        placeholder="Skriv ett anslag som du vill att besökare eller medlemmar ska uppmärksammas på (t.ex. Nästa klubbmöte inställt / ny tid)..."
                        value={announcementBanner}
                        onChange={(e) => setAnnouncementBanner(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ffaa0066', background: '#14110a', color: '#fff' }}
                      />
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={enableChatMedia}
                          onChange={(e) => setEnableChatMedia(e.target.checked)}
                          style={{ width: '20px', height: '20px', accentColor: '#00f5ff', cursor: 'pointer' }}
                        />
                        <span>Tillåt medlemmar att ladda upp Foton & GIFs i Klubbchatten</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={openForApplications}
                          onChange={(e) => setOpenForApplications(e.target.checked)}
                          style={{ width: '20px', height: '20px', accentColor: '#00ff88', cursor: 'pointer' }}
                        />
                        <span>Öppen för nya Medlemsansökningar & Ansök-knapp</span>
                      </label>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', color: '#00ff88', marginBottom: '0.5rem', fontWeight: '700' }}>Klubbens Officiella Riktlinjer & Regler (Redigerbar för alla medlemmar):</label>
                      <textarea 
                        rows={6}
                        value={clubRules}
                        onChange={(e) => setClubRules(e.target.value)}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.4)', background: '#0a0e0c', color: '#fff', fontFamily: 'inherit', lineHeight: '1.6' }}
                      />
                    </div>
                  </div>

                  {settingsSavedMsg && (
                    <div style={{ padding: '1.2rem', borderRadius: '8px', background: '#00ff8822', border: '1px solid #00ff88', color: '#00ff88', fontWeight: 'bold', marginBottom: '1rem' }}>
                      {settingsSavedMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#00ff88', color: '#000', fontWeight: '800', padding: '1rem 2rem', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
                  >
                    {savingSettings ? 'Sparar i databasen...' : 'SPARA & PUBLICERA SYSTEMINSTÄLLNINGAR'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        cancelText={confirmConfig?.cancelText}
        type={confirmConfig?.type}
        onConfirm={confirmConfig?.onConfirm}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
