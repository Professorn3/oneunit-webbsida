import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import pb from '../pocketbase';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { compressImage } from '../utils/imageHelper';
import { sendBrevoEmail } from '../utils/emailHelper';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, userData, isAdmin, isMember, isBanned } = useAuth();
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'members' | 'contacts' | 'campaigns' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Member Management State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberChatLogs, setMemberChatLogs] = useState(null);
  const [loadingChatLogs, setLoadingChatLogs] = useState(false);
  const [patchName, setPatchName] = useState('');

  // Garage State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBike, setProfileBike] = useState('');
  const [profileInstagram, setProfileInstagram] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Sync profile state when userData loads
  useEffect(() => {
    if (userData) {
      setProfileName(userData.name || '');
      setProfileBike(userData.bike || '');
      setProfileInstagram(userData.instagram || '');
    }
  }, [userData]);

  // E-post Utskicksstudio (Kampanjhantering mot Brevo)
  const [campaignTarget, setCampaignTarget] = useState('users');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState('');
  
  // E-postsvar
  const [replyContactId, setReplyContactId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Systeminställningar & Klubbconfig för Admins
  const [siteName, setSiteName] = useState('OneUnit - Official Website');
  const [siteSlogan, setSiteSlogan] = useState('Gemenskap, Respekt & Lojalitet På Vägarna');
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [enableChatMedia, setEnableChatMedia] = useState(true);
  const [openForApplications, setOpenForApplications] = useState(true);
  const [clubRules, setClubRules] = useState('1. Respektera alltid medlemmarna och emblemet.\n2. Inga diskussioner om klubbärenden utanför officiella möten.\n3. Håll dig alltid redo för samlingen.\n4. Alla betalar sin kontingent i tid.');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        if (isAdmin && active) {
          try {
            const settingsRes = await pb.collection('settings').getFirstListItem('id != ""');
            if (settingsRes.siteName !== undefined) setSiteName(settingsRes.siteName);
            if (settingsRes.siteSlogan !== undefined) setSiteSlogan(settingsRes.siteSlogan);
            if (settingsRes.announcementBanner !== undefined) setAnnouncementBanner(settingsRes.announcementBanner);
            if (settingsRes.enableChatMedia !== undefined) setEnableChatMedia(settingsRes.enableChatMedia);
            if (settingsRes.openForApplications !== undefined) setOpenForApplications(settingsRes.openForApplications);
            if (settingsRes.clubRules !== undefined) setClubRules(settingsRes.clubRules);
          } catch(e) { console.log('No settings found'); }

          const apps = await pb.collection('applications').getFullList({ filter: "status = 'pending'" });
          // Sortera på frontend istället för att undvika PocketBase 400-error
          apps.sort((a, b) => new Date(b.created) - new Date(a.created));
          if (active) setApplications(apps);

          const msgs = await pb.collection('contacts').getFullList({ sort: '-created' });
          if (active) setContacts(msgs);
        }

        if (isMember && active) {
          const mems = await pb.collection('users').getFullList({ sort: '-created' });
          if (active) setMembers(mems);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };
    
    fetchData();

    return () => {
      active = false;
    };
  }, [isAdmin, isMember, currentUser]);

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
        setCampaignStatus('Hämtar mottagare...');
        try {
          const records = await pb.collection(campaignTarget).getFullList();
          let successCount = 0;
          
          console.log("Hittade följande antal mottagare i databasen:", records.length);
          setCampaignStatus(`Skickar mejl till ${records.length} mottagare... Det kan ta en stund.`);
          
          for (let i = 0; i < records.length; i++) {
            const email = records[i].email;
            console.log(`Bearbetar mottagare ${i+1}:`, email);
            if (email) {
              const html = `
                <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #00f5ff; margin: 0; font-size: 26px; letter-spacing: 2px;">ONE UNIT</h1>
                        <p style="color: #666; font-size: 12px; margin-top: 5px; text-transform: uppercase;">Exklusivt MC Broderskap</p>
                    </div>
                    <h2 style="color: #ffffff; font-size: 22px; margin-top: 15px; border-bottom: 1px solid #222; padding-bottom: 15px;">${campaignSubject}</h2>
                    <div style="color: #dddddd; font-size: 16px; line-height: 1.7; white-space: pre-wrap; margin: 25px 0;">
                        ${campaignBody}
                    </div>
                    <hr style="border: 0; height: 1px; background: #222222; margin: 30px 0;" />
                    <p style="color: #777777; font-size: 13px; text-align: center; margin: 0;">
                        Ride safe and stay loyal,<br />
                        <strong style="color: #00f5ff;">OneUnit Crew</strong>
                    </p>
                </div>
              `;
              
              console.log(`Skickar anrop till Brevo för: ${email}...`);
              const sent = await sendBrevoEmail(email, campaignSubject, html);
              if (sent) {
                console.log(`✅ Mejl skickat framgångsrikt till: ${email}`);
                successCount++;
              } else {
                console.error(`❌ Misslyckades att skicka till: ${email}`);
              }
              
              await new Promise(r => setTimeout(r, 150));
            } else {
              console.warn(`Användare på index ${i} saknar e-postadress!`);
            }
          }

          console.log(`Utskick slutfört. Totalt lyckade: ${successCount}/${records.length}`);

          await pb.collection('mail_campaigns').create({
            targetCollection: campaignTarget,
            subject: campaignSubject,
            bodyText: campaignBody,
            status: 'completed',
            sentBy: currentUser?.email || 'admin'
          });

          setCampaignStatus(`Utskicket är klart! ${successCount} mejl skickades framgångsrikt.`);
          setCampaignSubject('');
          setCampaignBody('');
        } catch (err) {
          console.error("Fel vid utskick:", err);
          alert("Kunde inte starta utskicken: " + err.message);
          setCampaignStatus('Utskicket kraschade.');
        }
        setSendingCampaign(false);
      }
    });
  };

  const handleLogout = async () => {
    pb.authStore.clear();
    window.location.href = '/';
  };

  const handleChangePassword = async () => {
    setResetLoading(true);
    setResetMsg('');
    try {
      await pb.collection('users').requestPasswordReset(currentUser.email);
      setResetMsg('Ett mail har skickats till din e-postadress. Klicka på länken i mailet för att byta ditt lösenord.');
      setTimeout(() => setResetMsg(''), 10000);
    } catch (err) {
      alert('Kunde inte skicka återställningslänk: ' + err.message);
    }
    setResetLoading(false);
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      const compressed = await compressImage(file, 400, 0.8);
      formData.append('avatar', compressed);
      await pb.collection('users').update(currentUser.id, formData);
      window.location.reload();
    } catch (err) {
      alert("Kunde inte ladda upp profilbild: " + err.message);
    }
  };

  const handleApproveAndInvite = (app) => {
    if (!isAdmin) return;
    setConfirmConfig({
      title: "Godkänn ansökan?",
      message: `Vill du verkligen godkänna ${app.name} och skicka en inbjudningslänk via e-post till ${app.email}?`,
      confirmText: "Ja, godkänn & bjud in",
      type: "success",
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const inviteRef = await pb.collection('invites').create({
            email: app.email,
            name: app.name || '',
            instagram: app.instagram || '',
            bike: app.bike || '',
            used: false
          });

          const inviteLink = `https://oneunit.se/register?token=${inviteRef.id}`;
          const subject = "Välkommen till OneUnit!";
          const html = `
            <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00f5ff; margin-top: 0; font-size: 24px;">Hej ${app.name}! 👋</h2>
                <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Din ansökan har blivit godkänd.</p>
                <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Klicka på länken nedan för att registrera ditt medlemskonto och få tillgång till våra privata sidor och chatt:</p>
                <div style="margin: 25px 0; text-align: center;">
                    <a href="${inviteLink}" style="background-color: #00f5ff; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Registrera Konto</a>
                </div>
                <hr style="border: 0; height: 1px; background: #222222; margin: 25px 0;" />
                <p style="color: #777777; font-size: 13px; margin: 0;">Välkommen till gemenskapen!<br /><strong style="color: #00f5ff;">OneUnit Admin</strong></p>
            </div>
          `;
          
          await sendBrevoEmail(app.email, subject, html);

          await pb.collection('applications').delete(app.id);
          setApplications(prev => prev.filter(a => a.id !== app.id));
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
        await pb.collection('applications').delete(appId);
        setApplications(prev => prev.filter(a => a.id !== appId));
      }
    });
  };

  const handleMarkContactRead = async (contactId) => {
    await pb.collection('contacts').update(contactId, { status: 'read' });
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: 'read' } : c));
  };
  
  const handleDeleteContact = async (id) => {
    try {
      await pb.collection('contacts').delete(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Kunde inte radera meddelandet');
    }
  };

  const handleSendReply = async (contact) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const currentReplies = contact.replies || [];
      const newReply = { text: replyText, sender: 'admin', createdAt: new Date().toISOString() };
      const updatedContact = await pb.collection('contacts').update(contact.id, {
        status: 'replied',
        replies: [...currentReplies, newReply]
      });
      
      setContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
      
      const subject = "Svar från OneUnit";
      const html = `
          <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #222; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00f5ff; margin-top: 0; font-size: 24px;">Svar på ditt meddelande</h2>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${replyText}</p>
            <hr style="border: 0; height: 1px; background: #222; margin: 25px 0;" />
            <p style="color: #777777; font-size: 14px; margin: 0;">Du skrev:<br/><br/><i>${contact.message}</i></p>
          </div>
      `;
      
      await sendBrevoEmail(contact.email, subject, html);
      
      setReplyContactId(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Fel vid skickande av e-post: ' + err.message);
    }
    setSendingReply(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await pb.collection('users').update(currentUser.id, {
        name: profileName,
        bike: profileBike,
        instagram: profileInstagram
      });
      setEditingProfile(false);
      window.location.reload();
    } catch (err) {
      alert("Fel vid sparning: " + err.message);
    }
    setSavingProfile(false);
  };

  const handleAwardPatch = async (memberId) => {
    if (!patchName.trim()) return;
    try {
      const member = members.find(m => m.id === memberId);
      const currentPatches = member.patches || [];
      const updatedUser = await pb.collection('users').update(memberId, {
        patches: [...currentPatches, patchName]
      });
      setMembers(prev => prev.map(m => m.id === memberId ? updatedUser : m));
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(updatedUser);
      }
      setPatchName('');
    } catch (err) {
      alert("Kunde inte dela ut patch: " + err.message);
    }
  };

  const handleRemovePatch = async (memberId, patch) => {
    try {
      const member = members.find(m => m.id === memberId);
      const updatedPatches = (member.patches || []).filter(p => p !== patch);
      const updatedUser = await pb.collection('users').update(memberId, {
        patches: updatedPatches
      });
      setMembers(prev => prev.map(m => m.id === memberId ? updatedUser : m));
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(updatedUser);
      }
    } catch (err) {
      alert("Fel vid radering av patch.");
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      const updatedUser = await pb.collection('users').update(memberId, { role: newRole });
      setMembers(prev => prev.map(m => m.id === memberId ? updatedUser : m));
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(updatedUser);
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
          const updatedUser = await pb.collection('users').update(member.id, { isBanned: !isCurrentlyBanned });
          setMembers(prev => prev.map(m => m.id === member.id ? updatedUser : m));
          if (selectedMember && selectedMember.id === member.id) {
            setSelectedMember(updatedUser);
          }
        } catch (err) {
          alert("Gick inte att uppdatera spärrstatus: " + err.message);
        }
      }
    });
  };

  const handleDeleteMember = (member) => {
    if (member.email === currentUser.email) {
      alert("Du kan inte radera ditt eget konto härifrån!");
      return;
    }
    setConfirmConfig({
      title: "Radera konto permanent?",
      message: `Är du Helt säker på att du vill radera ${member.email}? Deras konto och data kommer att försvinna för alltid. Detta går INTE att ångra!`,
      confirmText: "Ja, Radera Konto",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await pb.collection('users').delete(member.id);
          setMembers(prev => prev.filter(m => m.id !== member.id));
          if (selectedMember && selectedMember.id === member.id) {
            setSelectedMember(null);
          }
        } catch (err) {
          alert("Kunde inte radera kontot: " + err.message);
        }
      }
    });
  };

  const handleFetchUserChat = async (uid) => {
    setLoadingChatLogs(true);
    setMemberChatLogs([]);
    try {
      const clubSnap = await pb.collection('club_chat').getFullList({ filter: `user = '${uid}'`, sort: '-created' });
      const adminSnap = await pb.collection('admin_chat').getFullList({ filter: `user = '${uid}'`, sort: '-created' });
      
      const msgs = [];
      clubSnap.forEach(d => msgs.push({ id: d.id, room: 'Klubbchatt', ...d }));
      adminSnap.forEach(d => msgs.push({ id: d.id, room: 'Adminchatt', ...d }));
      
      msgs.sort((a, b) => new Date(b.created) - new Date(a.created));
      setMemberChatLogs(msgs);
    } catch (err) {
      console.error(err);
      alert("Kunde inte hämta chattloggar.");
    }
    setLoadingChatLogs(false);
  };


  // Filtrera medlemmar baserat på sökning (namn, email, roll)
  const filteredMembers = members.filter(m => {
    const s = searchQuery.toLowerCase();
    const fullName = (m.name || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    const role = (m.role || '').toLowerCase();
    return email.includes(s) || fullName.includes(s) || role.includes(s);
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
            <p>Ditt konto har blivit permanent spärrat av en administratör. Du har inte längre tillgång till OneUnit:s system, chatt eller paneler.</p>
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
            <div className="dashboard-card member-card" style={{ maxWidth: '500px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, flex: '1 1 auto' }}>Ditt Garage & Medlemskort</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flex: '0 0 auto' }}>
                  <button onClick={handleChangePassword} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }} disabled={resetLoading}>
                    {resetLoading ? 'Skickar...' : 'Byt Lösenord'}
                  </button>
                  <button onClick={() => setEditingProfile(!editingProfile)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    {editingProfile ? 'Avbryt' : 'Redigera'}
                  </button>
                </div>
              </div>
              
              {resetMsg && (
                <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', margin: '1rem 0 0 0', fontSize: '0.9rem' }}>
                  {resetMsg}
                </div>
              )}
              
              <div className="card-inner" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem', alignItems: 'center' }}>
                  
                  <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0, overflow: 'hidden', borderRadius: '50%', border: '2px solid #333' }}>
                    <img src={userData.avatar ? pb.files.getURL(userData, userData.avatar) : "/images/hero-glitch-logo.png"} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {editingProfile && (
                      <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', cursor: 'pointer', padding: '4px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        Ändra
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePicUpload} />
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.2rem' }}>{userData.name || currentUser.email.split('@')[0]}</h4>
                    <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>Status: <strong style={{ color: '#00f5ff' }}>Aktiv Medlem</strong></p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Roll: {userData.role}</p>
                  </div>
                </div>

                {editingProfile ? (
                  <form onSubmit={handleSaveProfile} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Namn:</label>
                      <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Ditt namn" style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Min Motorcykel (Modell & År):</label>
                      <input type="text" value={profileBike} onChange={e => setProfileBike(e.target.value)} placeholder="T.ex. Harley-Davidson Fat Boy '21" style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Instagram-namn:</label>
                      <input type="text" value={profileInstagram} onChange={e => setProfileInstagram(e.target.value)} placeholder="@oneunit_rider" style={{ width: '100%', padding: '0.8rem', background: '#0a0b0f', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
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
            
            <div className="dashboard-card member-directory-card" style={{ width: '100%', marginTop: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Klubbmedlemmar ({members.filter(m => m.role === 'member' || m.role === 'admin').length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {members.filter(m => m.role === 'member' || m.role === 'admin').map(member => (
                  <div key={member.id} style={{ background: '#0a0b0f', border: '1px solid #222', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #333', marginBottom: '0.8rem', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#555' }}>
                      <img src={member.avatar ? pb.files.getURL(member, member.avatar) : "/images/hero-glitch-logo.png"} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', color: '#fff' }}>{member.name || (member.email ? member.email.split('@')[0] : 'Okänd')}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>{member.role === 'admin' ? 'ADMIN' : 'MEDLEM'}</p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#aaa', minHeight: '2.5rem' }}>
                      {member.bike || 'Hoj ej angiven'}
                    </p>
                    {member.instagram ? (
                      <a href={`https://instagram.com/${member.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#00f5ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        📸 Instagram
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#444' }}>Inget konto</span>
                    )}
                  </div>
                ))}
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
                style={applications.length > 0 ? { borderColor: '#00f5ff', color: '#00f5ff', textShadow: '0 0 5px rgba(0, 245, 255, 0.5)', boxShadow: '0 0 8px rgba(0, 245, 255, 0.2)' } : {}}
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
                className={`btn ${activeTab === 'contacts' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('contacts')}
                style={contacts.filter(c => c.status === 'unread').length > 0 ? { borderColor: '#00f5ff', color: '#00f5ff', textShadow: '0 0 5px rgba(0, 245, 255, 0.5)', boxShadow: '0 0 8px rgba(0, 245, 255, 0.2)' } : {}}
              >
                Kontaktmeddelanden ({contacts.filter(c => c.status === 'unread').length})
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
                        <h4>{app.name}</h4>
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
                      <div className="member-avatar" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: 'transparent' }}>
                        <img src={member.avatar ? pb.files.getURL(member, member.avatar) : "/images/hero-glitch-logo.png"} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                      </div>
                      <div className="member-details">
                        <p className="member-name" style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                          {member.name}
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

            {activeTab === 'contacts' && (
              <div className="applications-list">
                {contacts.length === 0 ? (
                  <p>Inga kontaktmeddelanden.</p>
                ) : (
                  contacts.map(c => (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                      <div className="application-item" style={{ borderLeft: c.status === 'replied' ? '4px solid #00f5ff' : (c.status === 'unread' ? '4px solid #ffcc00' : '4px solid #333'), margin: 0 }}>
                      <div className="app-info" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0 }}>{c.name}</h4>
                          {c.status === 'replied' && <span style={{ background: 'rgba(0,245,255,0.1)', color: '#00f5ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>🟢 BESVARAD</span>}
                        </div>
                        <p style={{ marginTop: '0.5rem' }}><strong>E-post:</strong> <a href={`mailto:${c.email}`} style={{ color: '#00f5ff' }}>{c.email}</a></p>
                        <p><strong>Skickat:</strong> {new Date(c.created).toLocaleString()}</p>
                        
                        <div style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #222' }}>
                          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{c.message}</p>
                        </div>

                        {c.replies && c.replies.length > 0 && (
                          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <h5 style={{ color: '#00f5ff', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ärendehistorik (Ticket)</h5>
                            {c.replies.map((reply, idx) => (
                              <div key={idx} style={{ 
                                background: reply.sender === 'admin' ? '#0d1a24' : '#1a1a1a', 
                                borderLeft: reply.sender === 'admin' ? '3px solid #00f5ff' : '3px solid #777',
                                padding: '1rem', 
                                borderRadius: '4px' 
                              }}>
                                <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 0.5rem 0' }}>
                                  {reply.sender === 'admin' ? 'Svar från Support' : 'Svar från Kunden'} · {new Date(reply.createdAt).toLocaleString()}
                                </p>
                                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.9rem' }}>{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start'}}>
                        {c.status === 'unread' && (
                          <button onClick={() => handleMarkContactRead(c.id)} className="btn btn-outline" style={{borderColor: '#fff', color: '#fff'}}>
                            Markera som läst
                          </button>
                        )}
                        <button onClick={() => setReplyContactId(replyContactId === c.id ? null : c.id)} className="btn btn-outline" style={{borderColor: '#00f5ff', color: '#00f5ff'}}>
                          {replyContactId === c.id ? 'Avbryt Svar' : 'Svara via E-post'}
                        </button>
                        <button onClick={() => handleDeleteContact(c.id)} className="btn btn-outline" style={{borderColor: '#ff0055', color: '#ff0055'}}>
                          Radera
                        </button>
                      </div>
                    </div>
                    {replyContactId === c.id && (
                      <div style={{ marginTop: '0.5rem', background: '#111', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                        <textarea 
                          rows={4} 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          placeholder={`Skriv ditt svar till ${c.name}...`}
                          style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '6px', marginBottom: '1rem', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button 
                            onClick={() => handleSendReply(c)} 
                            disabled={sendingReply} 
                            className="btn" 
                            style={{ background: '#00f5ff', color: '#000' }}
                          >
                            {sendingReply ? 'Skickar...' : 'Skicka Svar (E-post)'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )))
                }
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
      {selectedMember && createPortal(
        <div className="manage-modal-overlay" onClick={() => { setSelectedMember(null); setMemberChatLogs(null); }}>
          <div className="manage-modal-content" onClick={e => e.stopPropagation()}>
            <header className="manage-modal-header">
              <h2>Hantera Medlem: {selectedMember.name}</h2>
              <button className="manage-modal-close" onClick={() => { setSelectedMember(null); setMemberChatLogs(null); }}>✕</button>
            </header>

            <div className="manage-modal-body">
              <div className="manage-section">
                <h3>Information</h3>
                <p><strong>E-post:</strong> {selectedMember.email}</p>
                <p><strong>Gick med:</strong> {selectedMember.created ? new Date(selectedMember.created).toLocaleDateString() : 'Okänt'}</p>
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
                <button 
                  className="btn btn-outline" 
                  style={{ color: '#ff0055', borderColor: '#ff0055', marginTop: '1rem', width: '100%' }}
                  onClick={() => handleDeleteMember(selectedMember)}
                >
                  Radera Konto Permanent
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
                              <span>{new Date(log.created).toLocaleString()}</span>
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
        </div>,
        document.body
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
