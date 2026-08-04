import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userData, isAdmin, isMember, isBanned } = useAuth();
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'members' | 'campaigns' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Member Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberChatLogs, setMemberChatLogs] = useState(null);
  const [loadingChatLogs, setLoadingChatLogs] = useState(false);
  const [patchName, setPatchName] = useState('');

  // Garage State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileBike, setProfileBike] = useState('');
  const [profileInsta, setProfileInsta] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Sync profile state when userData loads
  useEffect(() => {
    if (userData) {
      setProfileBike(userData.bike || '');
      setProfileInsta(userData.instagram || '');
    }
  }, [userData]);

  // E-post Utskicksstudio (Kampanjhantering mot Brevo)
  const [campaignTarget, setCampaignTarget] = useState('users');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState('');

  // Systeminställningar & Klubbconfig för Admins
  const [siteName, setSiteName] = useState('OneUnit MC - Official Website');
  const [siteSlogan, setSiteSlogan] = useState('Gemenskap, Respekt & Lojalitet På Vägarna');
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [enableChatMedia, setEnableChatMedia] = useState(true);
  const [openForApplications, setOpenForApplications] = useState(true);
  const [clubRules, setClubRules] = useState('1. Respektera alltid medlemmarna och emblemet.\n2. Inga diskussioner om klubbärenden utanför officiella möten.\n3. Håll alltid mc:n redo för samlingsritten.\n4. Alla betalar sin kontingent i tid.');
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

  const handleChangePassword = async () => {
    setResetLoading(true);
    setResetMsg('');
    try {
      const functions = getFunctions(auth.app, 'europe-west1');
      const sendCustomReset = httpsCallable(functions, 'sendCustomPasswordResetEmail');
      await sendCustomReset({ email: currentUser.email, origin: window.location.origin });
      setResetMsg('Ett mail har skickats till din e-postadress. Klicka på länken i mailet för att byta ditt lösenord.');
      setTimeout(() => setResetMsg(''), 10000); // Hide after 10s
    } catch (err) {
      alert('Kunde inte skicka återställningslänk: ' + err.message);
    }
    setResetLoading(false);
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

  // --- MEMBER MANAGEMENT FUNCTIONS ---

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        bike: profileBike,
        instagram: profileInsta
      });
      setEditingProfile(false);
      // Update local context manually or rely on AuthContext reload (AuthContext doesn't auto-reload doc on update, but it's fine for simple display, wait, we might need to refresh page or rely on snapshot. Let's just alert.)
    } catch (err) {
      alert("Fel vid sparning: " + err.message);
    }
    setSavingProfile(false);
  };

  const handleAwardPatch = async (memberId) => {
    if (!patchName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', memberId), {
        patches: arrayUnion(patchName)
      });
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember({ ...selectedMember, patches: [...(selectedMember.patches || []), patchName] });
      }
      setPatchName('');
    } catch (err) {
      alert("Kunde inte dela ut patch: " + err.message);
    }
  };

  const handleRemovePatch = async (memberId, patch) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        patches: arrayRemove(patch)
      });
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember({ ...selectedMember, patches: selectedMember.patches.filter(p => p !== patch) });
      }
    } catch (err) {
      alert("Fel vid radering av patch.");
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { role: newRole });
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember({ ...selectedMember, role: newRole });
      }
    } catch (err) {
      alert("Kunde inte ändra roll: " + err.message);
    }
  };

  const handleToggleBan = (member) => {
    if (member.email === currentUser.email) {
      alert("Du kan inte spärra dig själv!");
      return;
    }
    const isCurrentlyBanned = !!member.isBanned;
    
    setConfirmConfig({
      title: isCurrentlyBanned ? "Häv spärr?" : "Spärra användare?",
      message: isCurrentlyBanned 
        ? `Är du säker på att du vill häva spärren för ${member.email}?`
        : `Är du säker på att du vill SPÄRRA ${member.email}? Deras konto loggas omedelbart ut och nekas all åtkomst till systemet.`,
      confirmText: isCurrentlyBanned ? "Ja, Häv Spärr" : "Ja, Spärra Konto",
      type: isCurrentlyBanned ? "success" : "danger",
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateDoc(doc(db, 'users', member.id), { isBanned: !isCurrentlyBanned });
          if (selectedMember && selectedMember.id === member.id) {
            setSelectedMember({ ...selectedMember, isBanned: !isCurrentlyBanned });
          }
        } catch (err) {
          alert("Gick inte att uppdatera spärrstatus: " + err.message);
        }
      }
    });
  };

  const handleFetchUserChat = async (uid) => {
    setLoadingChatLogs(true);
    setMemberChatLogs([]);
    try {
      const msgs = [];
      const qClub = query(collection(db, 'club_chat'), where('uid', '==', uid));
      const qAdmin = query(collection(db, 'admin_chat'), where('uid', '==', uid));
      
      const [clubSnap, adminSnap] = await Promise.all([getDocs(qClub), getDocs(qAdmin)]);
      clubSnap.forEach(d => msgs.push({ id: d.id, room: 'Klubbchatt', ...d.data() }));
      adminSnap.forEach(d => msgs.push({ id: d.id, room: 'Adminchatt', ...d.data() }));
      
      // Sortera nyast först
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setMemberChatLogs(msgs);
    } catch (err) {
      console.error(err);
      alert("Kunde inte hämta chattloggar. Saknar index i databasen.");
    }
    setLoadingChatLogs(false);
  };


  // Filtrera medlemmar baserat på sökning (namn, email, roll)
  const filteredMembers = members.filter(m => {
    const s = searchQuery.toLowerCase();
    const fullName = ((m.firstName || '') + ' ' + (m.lastName || '')).toLowerCase();
    return m.email.toLowerCase().includes(s) || fullName.includes(s) || (m.role || '').toLowerCase().includes(s);
  });

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

        {isBanned && (
          <div className="dashboard-guest-msg" style={{ borderColor: '#ff0055', backgroundColor: 'rgba(255,0,85,0.05)' }}>
            <h2 style={{ color: '#ff0055' }}>KONTO SPÄRRAT</h2>
            <p>Ditt konto har blivit permanent spärrat av en administratör. Du har inte längre tillgång till OneUnit MC:s system, chatt eller paneler.</p>
          </div>
        )}

        {userData.role === 'guest' && !isBanned && (
          <div className="dashboard-guest-msg">
            <h2>Åtkomst Nekad</h2>
            <p>Du har loggat in, men ditt konto saknar rättigheter. Endast administratörer och godkända medlemmar har tillgång hit.</p>
          </div>
        )}

        {isMember && !isBanned && (
          <div className="dashboard-grid">
            <div className="dashboard-card member-card" style={{ maxWidth: '450px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Ditt Garage & Medlemskort</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleChangePassword} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} disabled={resetLoading}>
                    {resetLoading ? 'Skickar...' : 'Byt Lösenord'}
                  </button>
                  <button onClick={() => setEditingProfile(!editingProfile)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    {editingProfile ? 'Avbryt' : 'Redigera'}
                  </button>
                </div>
              </div>
              
              {resetMsg && (
                <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', margin: '1rem 1.5rem 0 1.5rem', fontSize: '0.9rem' }}>
                  {resetMsg}
                </div>
              )}
              
              <div className="card-inner" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                  <img src="/images/logo.png" alt="Logo" width="60" style={{ height: 'fit-content' }} />
                  <div>
                    <h4>{userData.firstName || currentUser.email.split('@')[0]}</h4>
                    <p>Status: <strong style={{ color: '#00f5ff' }}>Aktiv Medlem</strong></p>
                    <p>Roll: {userData.role}</p>
                  </div>
                </div>

                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Min Motorcykel (Modell & År):</label>
                      <input type="text" value={profileBike} onChange={e => setProfileBike(e.target.value)} placeholder="T.ex. Harley-Davidson Fat Boy '21" style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Instagram-namn:</label>
                      <input type="text" value={profileInsta} onChange={e => setProfileInsta(e.target.value)} placeholder="@oneunit_rider" style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
                    </div>
                    <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ padding: '0.8rem' }}>
                      {savingProfile ? 'Sparar...' : 'Spara Profil'}
                    </button>
                  </form>
                ) : (
                  <div style={{ width: '100%' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Motorcykel:</strong> {userData.bike || 'Inte angiven'}</p>
                    <p style={{ marginBottom: '1.5rem' }}><strong>Instagram:</strong> {userData.instagram ? <a href={`https://instagram.com/${userData.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#00f5ff' }}>{userData.instagram}</a> : 'Inte angiven'}</p>
                    
                    <h5 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fff' }}>Utmärkelser & Patches</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(!userData.patches || userData.patches.length === 0) ? (
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Inga patches utdelade ännu.</span>
                      ) : (
                        userData.patches.map((patch, idx) => (
                          <span key={idx} style={{ background: '#111', border: '1px solid #00f5ff', color: '#00f5ff', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800 }}>
                            {patch}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        )}

        {isAdmin && !isBanned && (
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
                Medlemshantering ({members.length})
              </button>
              <button 
                className={`btn ${activeTab === 'campaigns' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('campaigns')}
              >
                E-postutskick
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
                        <button onClick={() => handleApproveAndInvite(app)} className="btn btn-outline" style={{borderColor: '#fff', color: '#fff'}}>
                          Godkänn & Bjud In
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
                    placeholder="Sök på namn, email eller roll..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="members-search"
                  />
                </div>
                
                <div className="members-grid">
                  {filteredMembers.map(member => (
                    <div key={member.id} className="member-item" style={{ border: member.isBanned ? '1px solid #ff0055' : '' }}>
                      <div className="member-avatar" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: member.isBanned ? '#ff0055' : '' }}>
                        {member.isBanned ? 'BAN' : (member.role === 'admin' ? 'ADM' : 'MED')}
                      </div>
                      <div className="member-details">
                        <p className="member-name" style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="member-email">{member.email}</p>
                        <p className="member-role">Roll: <strong style={{color: member.isBanned ? '#ff0055' : '#fff'}}>{member.isBanned ? 'SPÄRRAD' : member.role}</strong></p>
                      </div>
                      <button 
                        onClick={() => setSelectedMember(member)} 
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        Hantera
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KAMPANJER & INSTÄLLNINGAR FINNS KVAR HÄR UNDER... */}
            {activeTab === 'campaigns' && (
              <div className="campaign-studio card" style={{ padding: '2rem', marginTop: '1.5rem', border: '1px solid #333', borderRadius: '14px', background: '#080808' }}>
                <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>OneUnit Massutskick-Studio</h3>
                <p style={{ color: '#aaaaaa', marginBottom: '2rem', fontSize: '0.95rem' }}>
                  Skicka ut meddelanden med rubrik och text till en hel databassamling samtidigt via Brevo.
                </p>
                
                <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Målgrupp:</label>
                    <select 
                      value={campaignTarget} 
                      onChange={(e) => setCampaignTarget(e.target.value)}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontSize: '1rem' }}
                    >
                      <option value="users">Medlemsregister ("users")</option>
                      <option value="newsletter_emails">Nyhetsbrev ("newsletter_emails")</option>
                      <option value="applications">Sökande ("applications")</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Ämne / Rubrik:</label>
                    <input 
                      type="text" 
                      placeholder="Skriv ett slagkraftigt ämne..."
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.95rem' }}>Meddelande (Body):</label>
                    <textarea 
                      rows={6}
                      placeholder="Meddelandets innehåll..."
                      value={campaignBody}
                      onChange={(e) => setCampaignBody(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', border: '1px solid #222', background: '#121212', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                  {campaignStatus && (
                    <div style={{ padding: '1.2rem', borderRadius: '8px', background: '#ffffff1a', borderLeft: '4px solid #fff', color: '#fff', fontWeight: 'bold' }}>{campaignStatus}</div>
                  )}
                  <button type="submit" disabled={sendingCampaign} className="btn btn-outline" style={{ marginTop: '0.5rem', padding: '1rem', width: '100%' }}>
                    {sendingCampaign ? 'Skickar...' : 'Skicka E-postutskick Nu'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ background: '#0a0a0a', padding: '2.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.8rem', color: '#fff', margin: '0 0 1.5rem' }}>
                  SYSTEM- & KLUBBINSTÄLLNINGAR
                </h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingSettings(true);
                  try {
                    await setDoc(doc(db, 'settings', 'general'), {
                      siteName, siteSlogan, announcementBanner, enableChatMedia, openForApplications, clubRules, updatedAt: serverTimestamp()
                    }, { merge: true });
                    setSettingsSavedMsg('Inställningarna har sparats!');
                    setTimeout(() => setSettingsSavedMsg(''), 4000);
                  } catch (err) { alert('Fel: ' + err.message); }
                  setSavingSettings(false);
                }}>
                  <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem' }}>Webbnamn:</label>
                      <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', border: '1px solid #333' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem' }}>Huvudslogan:</label>
                      <input type="text" value={siteSlogan} onChange={(e) => setSiteSlogan(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', border: '1px solid #333' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem' }}>Live Meddelande / Banner:</label>
                      <input type="text" value={announcementBanner} onChange={(e) => setAnnouncementBanner(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', border: '1px solid #333' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableChatMedia} onChange={(e) => setEnableChatMedia(e.target.checked)} />
                        <span>Tillåt Fotouppladdning i Chatt</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                        <input type="checkbox" checked={openForApplications} onChange={(e) => setOpenForApplications(e.target.checked)} />
                        <span>Öppen för Ansökningar</span>
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#fff', marginBottom: '0.5rem' }}>Klubbregler (Visas på regler-sidan):</label>
                      <textarea rows={6} value={clubRules} onChange={(e) => setClubRules(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', border: '1px solid #333' }} />
                    </div>
                  </div>
                  {settingsSavedMsg && <div style={{ color: '#fff', marginBottom: '1rem' }}>{settingsSavedMsg}</div>}
                  <button type="submit" disabled={savingSettings} className="btn btn-outline" style={{ width: '100%' }}>
                    {savingSettings ? 'Sparar...' : 'SPARA INSTÄLLNINGAR'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Management Modal Overlay */}
      {selectedMember && (
        <div className="manage-modal-overlay" onClick={() => { setSelectedMember(null); setMemberChatLogs(null); }}>
          <div className="manage-modal-content" onClick={e => e.stopPropagation()}>
            <header className="manage-modal-header">
              <h2>Hantera Medlem: {selectedMember.firstName} {selectedMember.lastName}</h2>
              <button className="manage-modal-close" onClick={() => { setSelectedMember(null); setMemberChatLogs(null); }}>✕</button>
            </header>

            <div className="manage-modal-body">
              <div className="manage-section">
                <h3>Information</h3>
                <p><strong>E-post:</strong> {selectedMember.email}</p>
                <p><strong>Gick med:</strong> {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : 'Okänt'}</p>
                <p><strong>Nuvarande Roll:</strong> {selectedMember.role}</p>
                <p><strong>Status:</strong> {selectedMember.isBanned ? <span style={{color: '#ff0055'}}>SPÄRRAD (BANNED)</span> : <span style={{color: '#888'}}>Aktiv</span>}</p>
              </div>

              <div className="manage-section">
                <h3>Ändra Roll & Behörighet</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleChangeRole(selectedMember.id, 'admin')}
                    disabled={selectedMember.role === 'admin'}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Gör till Admin
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleChangeRole(selectedMember.id, 'member')}
                    disabled={selectedMember.role === 'member'}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Gör till Medlem
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleChangeRole(selectedMember.id, 'guest')}
                    disabled={selectedMember.role === 'guest'}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Gör till Gäst
                  </button>
                </div>
              </div>

              <div className="manage-section">
                <h3>Digitala Patches / Utmärkelser</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {(!selectedMember.patches || selectedMember.patches.length === 0) ? (
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Inga patches</span>
                  ) : (
                    selectedMember.patches.map((patch, idx) => (
                      <span key={idx} style={{ background: '#111', border: '1px solid #00f5ff', color: '#00f5ff', padding: '0.3rem 0.6rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {patch}
                        <button onClick={() => handleRemovePatch(selectedMember.id, patch)} style={{ background: 'none', border: 'none', color: '#ff0055', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>✕</button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={patchName} onChange={e => setPatchName(e.target.value)} placeholder="T.ex. 🏁 Night Ride '26" style={{ flex: 1, padding: '0.6rem', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                  <button className="btn btn-outline" onClick={() => handleAwardPatch(selectedMember.id)}>Dela ut</button>
                </div>
              </div>

              <div className="manage-section">
                <h3>Spärra Konto (IP/Ban)</h3>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>
                  Genom att spärra användaren nekas de omedelbart all framtida åtkomst till systemet.
                </p>
                <button 
                  className="btn" 
                  style={{ backgroundColor: selectedMember.isBanned ? '#333' : '#ff0055', color: '#fff' }}
                  onClick={() => handleToggleBan(selectedMember)}
                >
                  {selectedMember.isBanned ? 'Häv Spärr' : 'Spärra Användare'}
                </button>
              </div>

              <div className="manage-section">
                <h3>Granska Aktivitet & Chatt</h3>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleFetchUserChat(selectedMember.id)}
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  {loadingChatLogs ? 'Hämtar...' : 'Hämta alla inlägg från chatten'}
                </button>

                {memberChatLogs && (
                  <div className="manage-chat-logs">
                    <h4>{memberChatLogs.length} meddelanden hittades:</h4>
                    {memberChatLogs.length === 0 ? (
                      <p style={{ color: '#666' }}>Ingen aktivitet hittades.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {memberChatLogs.map(log => (
                          <li key={log.id} style={{ background: '#111', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                              <span>Rum: {log.room}</span>
                              <span>{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : ''}</span>
                            </div>
                            {log.text && <p style={{ color: '#fff', fontSize: '0.95rem' }}>{log.text}</p>}
                            {log.gifUrl && <img src={log.gifUrl} alt="GIF" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '0.5rem' }} />}
                            {log.imageUrl && <img src={log.imageUrl} alt="Upload" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '0.5rem' }} />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
