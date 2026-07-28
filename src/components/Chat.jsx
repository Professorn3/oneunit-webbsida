import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

export default function Chat() {
  const { currentUser, userData, isAdmin, isMember } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('club_chat'); // 'club_chat' (Medlemmar) | 'admin_chat' (Admins)
  const messagesEndRef = useRef(null);

  // Visa endast widgeten om användaren är inloggad som godkänd medlem eller administratör
  const canAccessChat = currentUser && (isMember || isAdmin);

  useEffect(() => {
    if (!canAccessChat || !isOpen) return;

    // Om inte admin men admin_chat valts av misstag, tvinga till club_chat
    const roomToFetch = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;

    const q = query(
      collection(db, roomToFetch),
      orderBy('createdAt', 'asc'),
      limit(60)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeRoom, isOpen, canAccessChat, isAdmin]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  if (!canAccessChat) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;

    try {
      await addDoc(collection(db, roomTarget), {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        email: currentUser.email,
        senderName: userData?.firstName || currentUser.email.split('@')[0],
        role: isAdmin ? 'admin' : 'member'
      });
      setNewMessage('');
    } catch (err) {
      console.error("Fel vid skickande av meddelande:", err);
      alert("Kunde inte skicka meddelande: " + err.message);
    }
  };

  return (
    <>
      {/* Floating Toggle Badge (Nere till höger på skärmen) */}
      <button 
        className="chat-widget-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Öppna OneUnit Klubbchatt"
      >
        <span className="chat-toggle-icon">💬</span>
        <span>KLUBBCHATT</span>
        <span className="chat-online-pulse" title="Ansluten live till klubben" />
      </button>

      {/* Mörk Bakgrundsskydd (klicka utanför för att stänga) */}
      <div 
        className={`chat-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Uttrekkbar Drawer / Spalt */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="OneUnit Chatt-spalt">
        <header className="chat-drawer-header">
          <div className="chat-header-top">
            <div className="chat-header-title">
              <span className="chat-online-pulse" />
              <h3>ONEUNIT CHATT</h3>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} title="Stäng chatt-spalt">
              ✕
            </button>
          </div>

          {/* Rumsval (Medlemmars chatt vs Admin-chatt) */}
          <div className="chat-room-tabs">
            <button 
              className={`chat-room-tab ${activeRoom === 'club_chat' ? 'active' : ''}`}
              onClick={() => setActiveRoom('club_chat')}
            >
              🏍️ Medlemschatt
            </button>
            <button 
              className={`chat-room-tab ${activeRoom === 'admin_chat' ? 'active' : ''}`}
              onClick={() => isAdmin ? setActiveRoom('admin_chat') : alert("🛡️ Endast för administratörs-staben!")}
              disabled={!isAdmin}
              title={isAdmin ? "Byt till privat admin-kanal" : "Låst: Endast för klubbens admins"}
            >
              {isAdmin ? '🛡️ Admin-chatt' : '🔒 Admin-chatt'}
            </button>
          </div>
        </header>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
              Välkommen till {activeRoom === 'club_chat' ? 'Klubbchatten' : 'Adminchatten'}! Skriv det första meddelandet nedan. ⚡
            </p>
          ) : (
            messages.map(msg => {
              const isMe = msg.uid === currentUser.uid;
              const senderDisplay = msg.senderName || msg.email?.split('@')[0] || 'Medlem';
              return (
                <div key={msg.id} className={`chat-message ${isMe ? 'sent' : 'received'}`}>
                  <span className="msg-sender">
                    {msg.role === 'admin' ? '👑 ' : '🏍️ '}{senderDisplay} {msg.role === 'admin' ? '(Admin)' : ''}
                  </span>
                  <div className="msg-bubble">{msg.text}</div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeRoom === 'club_chat' ? "Skriv till hela klubben..." : "Skriv i interna adminkanalen..."}
            maxLength={500}
          />
          <button type="submit" className="btn-send">Skicka</button>
        </form>
      </div>
    </>
  );
}
