import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

// Utvalda MC & Broderskapets favorit-GIFs (Snabbreturer)
const CURATED_MC_GIFS = [
  { id: '1', url: 'https://media.giphy.com/media/26uf7yJncHQ9zK61G/giphy.gif', label: 'Biker Cruiser' },
  { id: '2', url: 'https://media.giphy.com/media/l41YkxvU8c7J7B3e/giphy.gif', label: 'Ride Fast' },
  { id: '3', url: 'https://media.giphy.com/media/3o7TKvxnKaLDYttZTq/giphy.gif', label: 'Burnout' },
  { id: '4', url: 'https://media.giphy.com/media/26Ff3FNWp3uD21d6/giphy.gif', label: 'Cheers & Beer' },
  { id: '5', url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif', label: 'Loyalty Respect' },
  { id: '6', url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif', label: 'Sunset Ride' },
  { id: '7', url: 'https://media.giphy.com/media/l0HlSi3AIOM3fAhX2/giphy.gif', label: 'Engine Rev' },
  { id: '8', url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', label: 'Victory Trophy' }
];

export default function Chat() {
  const { currentUser, userData, isAdmin, isMember } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('club_chat'); // 'club_chat' | 'admin_chat'
  
  // GIF Picker State
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifTab, setGifTab] = useState('curated'); // 'curated' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedGifs, setSearchedGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  
  const messagesEndRef = useRef(null);

  const canAccessChat = currentUser && (isMember || isAdmin);

  useEffect(() => {
    if (!canAccessChat || !isOpen) return;
    const roomToFetch = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;

    const q = query(
      collection(db, roomToFetch),
      orderBy('createdAt', 'asc'),
      limit(60)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
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
  }, [messages, isOpen, showGifPicker]);

  // Sök GIFs live via Giphy API (publik demokey)
  const handleSearchGifs = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingGifs(true);
    try {
      const resp = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=GlVGYHkr3WSBnllca54iNt0yFbjz7L65&q=${encodeURIComponent(searchQuery)}&limit=12&rating=g`);
      const json = await resp.json();
      if (json.data) {
        const results = json.data.map(item => ({
          id: item.id,
          url: item.images.downsized_medium?.url || item.images.fixed_height?.url
        }));
        setSearchedGifs(results);
      }
    } catch (err) {
      console.error("GIF Search Error:", err);
    }
    setLoadingGifs(false);
  };

  if (!canAccessChat) return null;

  // Skicka vanligt meddelande
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, roomTarget), {
        text: textToSend,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        email: currentUser.email,
        senderName: userData?.firstName || currentUser.email.split('@')[0],
        role: isAdmin ? 'admin' : 'member'
      });
    } catch (err) {
      console.error("Fel vid skickande:", err);
      alert("Kunde inte skicka: " + err.message);
    }
  };

  // Skicka GIF med 1 klick
  const handleSendGif = async (gifUrl) => {
    const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
    setShowGifPicker(false);

    try {
      await addDoc(collection(db, roomTarget), {
        text: '',
        gifUrl: gifUrl,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        email: currentUser.email,
        senderName: userData?.firstName || currentUser.email.split('@')[0],
        role: isAdmin ? 'admin' : 'member'
      });
    } catch (err) {
      console.error("Fel vid skickande av GIF:", err);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        className="chat-widget-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Öppna Klubbchatt"
      >
        <span className="chat-toggle-icon">💬</span>
        <span>KLUBBCHATT</span>
        <span className="chat-online-pulse" title="Live och ansluten" />
      </button>

      {/* Backdrop */}
      <div 
        className={`chat-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="OneUnit Chatt">
        <header className="chat-drawer-header">
          <div className="chat-header-top">
            <div className="chat-header-title">
              <span className="chat-online-pulse" />
              <h3>ONEUNIT CHATT</h3>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} title="Stäng chatt">
              ✕
            </button>
          </div>

          <div className="chat-room-tabs">
            <button 
              className={`chat-room-tab ${activeRoom === 'club_chat' ? 'active' : ''}`}
              onClick={() => { setActiveRoom('club_chat'); setShowGifPicker(false); }}
            >
              🏍️ Medlemschatt
            </button>
            <button 
              className={`chat-room-tab ${activeRoom === 'admin_chat' ? 'active' : ''}`}
              onClick={() => isAdmin ? { setActiveRoom('admin_chat'), setShowGifPicker(false) } : alert("🛡️ Endast för administratörs-staben!")}
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
              Välkommen till {activeRoom === 'club_chat' ? 'Klubbchatten' : 'Adminchatten'}! Skriv något eller släng in en fet GIF nedan. ⚡
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
                  
                  {/* Om det är en GIF */}
                  {msg.gifUrl ? (
                    <div className="msg-bubble gif-bubble">
                      <img src={msg.gifUrl} alt="Chat GIF" className="msg-gif-img" loading="lazy" />
                    </div>
                  ) : (
                    <div className="msg-bubble">{msg.text}</div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* GIF Picker Modal/Panel above inputs */}
        {showGifPicker && (
          <div className="gif-picker-panel">
            <div className="gif-picker-header">
              <span>🎬 Välj eller Sök Biker-GIF:</span>
              <button 
                onClick={() => setShowGifPicker(false)} 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="gif-picker-tabs">
              <button 
                className={`btn-gif-tab ${gifTab === 'curated' ? 'active' : ''}`}
                onClick={() => setGifTab('curated')}
              >
                ⚡ MC & Klubb Favoriter
              </button>
              <button 
                className={`btn-gif-tab ${gifTab === 'search' ? 'active' : ''}`}
                onClick={() => setGifTab('search')}
              >
                🔍 Sök Live
              </button>
            </div>

            {gifTab === 'search' && (
              <form onSubmit={handleSearchGifs} className="gif-search-box">
                <input 
                  type="text" 
                  placeholder="Sök GIF (t.ex. biker, ride, cheers)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  Sök
                </button>
              </form>
            )}

            {loadingGifs && <p style={{ fontSize: '0.8rem', color: '#aaaaaa' }}>⏳ Söker GIFs live i molnet...</p>}

            <div className="gif-grid">
              {(gifTab === 'curated' ? CURATED_MC_GIFS : searchedGifs).map((g) => (
                <div key={g.id || g.url} className="gif-item-thumb" onClick={() => handleSendGif(g.url)} title="Klicka för att skicka direkt!">
                  <img src={g.url} alt="GIF Thumb" />
                </div>
              ))}
            </div>
            {gifTab === 'search' && searchedGifs.length === 0 && !loadingGifs && (
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Skriv ett sökord ovan och tryck Enter!</p>
            )}
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSend} className="chat-input-area">
          <button 
            type="button" 
            className={`btn-gif-toggle ${showGifPicker ? 'active' : ''}`}
            onClick={() => setShowGifPicker(!showGifPicker)}
            title="Öppna GIF-studio"
          >
            🎬 GIF
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeRoom === 'club_chat' ? "Skriv till hela klubben..." : "Skriv i interna adminkanalen..."}
            maxLength={500}
            onFocus={() => setShowGifPicker(false)}
          />
          <button type="submit" className="btn-send">Skicka</button>
        </form>
      </div>
    </>
  );
}
