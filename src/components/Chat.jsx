import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageHelper';
import './Chat.css';

// Utvalda Klubb-favorit-GIFs (Snabbreturer)
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
  const [uploadingImg, setUploadingImg] = useState(false);

  // Poll State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Ja', 'Nej', 'Kanske']);
  
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

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const dataUrl = await compressImage(file, 800, 0.7);
      const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
      
      await addDoc(collection(db, roomTarget), {
        text: '',
        imageUrl: dataUrl,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        email: currentUser.email,
        senderName: userData?.firstName || currentUser.email.split('@')[0],
        role: isAdmin ? 'admin' : 'member'
      });
    } catch (err) {
      console.error("Fel vid bilduppladdning:", err);
      alert("Kunde inte ladda upp bild: " + err.message);
    }
    setUploadingImg(false);
    if (e.target) e.target.value = null;
  };

  const handleTogglePin = async (msgId, currentPin) => {
    if (!isAdmin) return;
    try {
      const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
      await updateDoc(doc(db, roomTarget, msgId), { isPinned: !currentPin });
    } catch(err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!isAdmin) return;
    if (!window.confirm("Radera detta meddelande?")) return;
    try {
      const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
      await deleteDoc(doc(db, roomTarget, msgId));
    } catch(err) { console.error(err); }
  };

  const handleClearChat = async () => {
    if (!isAdmin) return;
    if (!window.confirm("Är du säker på att du vill rensa HELA chatten i detta rum?")) return;
    try {
      const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
      const q = query(collection(db, roomTarget));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, roomTarget, d.id)));
      await Promise.all(deletePromises);
    } catch(err) { console.error("Kunde inte rensa chatt", err); }
  };

  const handleSendPoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      alert("En omröstning behöver minst 2 alternativ.");
      return;
    }

    const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
    try {
      await addDoc(collection(db, roomTarget), {
        isPoll: true,
        question: pollQuestion,
        options: validOptions.map(opt => ({ text: opt, votes: 0 })),
        votedUsers: [], // Array of uids who voted
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        email: currentUser.email,
        senderName: userData?.firstName || currentUser.email.split('@')[0],
        role: isAdmin ? 'admin' : 'member'
      });
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['Ja', 'Nej', 'Kanske']);
    } catch (err) {
      alert("Fel vid skapande av omröstning: " + err.message);
    }
  };

  const handleVote = async (msgId, optionIndex, msgData) => {
    if (msgData.votedUsers?.includes(currentUser.uid)) {
      alert("Du har redan röstat på denna.");
      return;
    }
    const roomTarget = (!isAdmin && activeRoom === 'admin_chat') ? 'club_chat' : activeRoom;
    const updatedOptions = [...msgData.options];
    updatedOptions[optionIndex].votes += 1;
    
    try {
      await updateDoc(doc(db, roomTarget, msgId), {
        options: updatedOptions,
        votedUsers: arrayUnion(currentUser.uid)
      });
    } catch(err) { console.error(err); }
  };

  const pinnedMessages = messages.filter(m => m.isPinned);
  const regularMessages = messages.filter(m => !m.isPinned);

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        className="chat-widget-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Öppna Klubbchatt"
      >
        <span style={{ fontSize: '0.9rem', letterSpacing: '2px', fontWeight: 'bold' }}>CHATT</span>
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
              Medlemschatt
            </button>
            <button 
              className={`chat-room-tab ${activeRoom === 'admin_chat' ? 'active' : ''}`}
              onClick={() => {
                if (isAdmin) {
                  setActiveRoom('admin_chat');
                  setShowGifPicker(false);
                } else {
                  alert("Endast för administratörs-staben!");
                }
              }}
              disabled={!isAdmin}
              title={isAdmin ? "Byt till privat admin-kanal" : "Låst: Endast för klubbens admins"}
            >
              {isAdmin ? 'Admin-chatt' : 'Admin-chatt (Låst)'}
            </button>
          </div>
          {isAdmin && (
            <div style={{ textAlign: 'right', marginTop: '0.5rem', marginRight: '1rem' }}>
              <button onClick={handleClearChat} style={{ background: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s' }}>Rensa Chatt</button>
            </div>
          )}
        </header>

        <div className="chat-messages">
          {pinnedMessages.length > 0 && (
            <div className="chat-pinned-section">
              <div style={{ fontSize: '0.7rem', color: '#00f5ff', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>📌 Fäst Meddelande</div>
              {pinnedMessages.map(msg => (
                <div key={'pin-'+msg.id} className="chat-message received" style={{ borderLeft: '3px solid #00f5ff', background: 'rgba(0,245,255,0.05)' }}>
                  <div className="msg-bubble" style={{ background: 'transparent', padding: '0.5rem' }}>
                    <strong>{msg.senderName}:</strong> {msg.text || (msg.isPoll ? `[Omröstning] ${msg.question}` : '[Media]')}
                    {isAdmin && (
                      <span style={{ display: 'inline-flex', gap: '8px', marginLeft: '10px' }}>
                        <button onClick={() => handleTogglePin(msg.id, true)} style={{ background: 'none', border: 'none', color: '#ff0055', cursor: 'pointer', fontSize: '0.8rem' }}>Lossa</button>
                        <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '0.8rem' }}>Radera</button>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <hr style={{ borderColor: '#222', margin: '1rem 0' }} />
            </div>
          )}

          {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
              Välkommen till {activeRoom === 'club_chat' ? 'Klubbchatten' : 'Adminchatten'}! Skriv något eller släng in en fet GIF nedan. ⚡
            </p>
          ) : (
            regularMessages.map(msg => {
              const isMe = msg.uid === currentUser.uid;
              const senderDisplay = msg.senderName || msg.email?.split('@')[0] || 'Medlem';
              return (
                <div key={msg.id} className={`chat-message ${isMe ? 'sent' : 'received'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
                    <span className="msg-sender">
                      {msg.role === 'admin' ? '👑 ' : '🏍️ '}{senderDisplay} {msg.role === 'admin' ? '(Admin)' : ''}
                    </span>
                    {isAdmin && (
                      <span style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleTogglePin(msg.id, !!msg.isPinned)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem' }} title="Fäst meddelande">📌</button>
                        <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '0.8rem' }} title="Radera meddelande">🗑️</button>
                      </span>
                    )}
                  </div>
                  
                  {msg.isPoll ? (
                    <div className="msg-bubble poll-bubble" style={{ border: '1px solid #333', minWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', color: '#00f5ff' }}>📊 {msg.question}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {msg.options.map((opt, i) => {
                          const totalVotes = msg.options.reduce((acc, curr) => acc + curr.votes, 0);
                          const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                          const hasVoted = msg.votedUsers?.includes(currentUser.uid);
                          return (
                            <button 
                              key={i}
                              onClick={() => handleVote(msg.id, i, msg)}
                              disabled={hasVoted}
                              style={{
                                background: hasVoted ? 'rgba(255,255,255,0.1)' : '#111',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '0.5rem',
                                color: '#fff',
                                cursor: hasVoted ? 'default' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'rgba(0, 245, 255, 0.2)', width: `${percentage}%`, transition: 'width 0.5s' }} />
                              <span style={{ position: 'relative', zIndex: 1 }}>{opt.text}</span>
                              <span style={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: '#00f5ff' }}>{opt.votes > 0 ? `${opt.votes} (${percentage}%)` : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem', textAlign: 'right' }}>
                        {msg.votedUsers?.length || 0} röster
                      </div>
                    </div>
                  ) : msg.gifUrl ? (
                    <div className="msg-bubble gif-bubble">
                      <img src={msg.gifUrl} alt="Chat GIF" className="msg-gif-img" loading="lazy" />
                    </div>
                  ) : msg.imageUrl ? (
                    <div className="msg-bubble gif-bubble" style={{ overflow: 'hidden', padding: 0 }}>
                      <img 
                        src={msg.imageUrl} 
                        alt="Chat Foto" 
                        className="msg-gif-img" 
                        loading="lazy" 
                        style={{ borderRadius: '8px', maxHeight: '250px', width: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                        onClick={() => window.open(msg.imageUrl, '_blank')} 
                        title="Klicka för att öppna bilden" 
                      />
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
              <span style={{ fontWeight: 'bold' }}>Välj eller Sök Biker-GIF:</span>
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
                Klubb-Favoriter
              </button>
              <button 
                className={`btn-gif-tab ${gifTab === 'search' ? 'active' : ''}`}
                onClick={() => setGifTab('search')}
              >
                Sök Live
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

            {loadingGifs && <p style={{ fontSize: '0.8rem', color: '#aaaaaa' }}>Söker GIFs live i molnet...</p>}

            <div className="gif-grid">
              {(gifTab === 'curated' ? CURATED_MC_GIFS : searchedGifs).map((g) => (
                <div key={g.id || g.url} className="gif-item-thumb" onClick={() => handleSendGif(g.url)} title="Klicka för att skicka direkt">
                  <img src={g.url} alt="GIF Thumb" />
                </div>
              ))}
            </div>
            {gifTab === 'search' && searchedGifs.length === 0 && !loadingGifs && (
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Skriv ett sökord ovan och tryck Enter</p>
            )}
          </div>
        )}

        {/* Poll Creator Modal/Panel */}
        {showPollCreator && (
          <div className="gif-picker-panel" style={{ height: 'auto', bottom: '70px' }}>
            <div className="gif-picker-header">
              <span style={{ fontWeight: 'bold' }}>Skapa Omröstning</span>
              <button onClick={() => setShowPollCreator(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSendPoll} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem' }}>
              <input type="text" placeholder="Ställ en fråga (t.ex. Vart kör vi?)" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #333', background: '#0a0a0a', color: '#fff' }} />
              
              {pollOptions.map((opt, i) => (
                <input key={i} type="text" placeholder={`Alternativ ${i+1}`} value={opt} onChange={e => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #222', background: '#111', color: '#fff' }} />
              ))}
              
              {pollOptions.length < 5 && (
                <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} style={{ background: 'none', border: 'none', color: '#00f5ff', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem' }}>+ Lägg till alternativ</button>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem' }}>Skapa Omröstning</button>
            </form>
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSend} className="chat-input-area">
          <button 
            type="button" 
            className={`btn-gif-toggle ${showPollCreator ? 'active' : ''}`}
            onClick={() => { setShowPollCreator(!showPollCreator); setShowGifPicker(false); }}
            title="Skapa Omröstning"
            style={{ fontWeight: 700, fontSize: '0.8rem' }}
          >
            📊
          </button>
          
          <button 
            type="button" 
            className={`btn-gif-toggle ${showGifPicker ? 'active' : ''}`}
            onClick={() => { setShowGifPicker(!showGifPicker); setShowPollCreator(false); }}
            title="Öppna GIF-studio"
            style={{ fontWeight: 700 }}
          >
            GIF
          </button>

          <label 
            className="btn-gif-toggle" 
            title="Ladda upp foto från dator / telefon" 
            style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.6rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {uploadingImg ? '...' : 'FOTO'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploadingImg} 
              style={{ display: 'none' }} 
            />
          </label>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={activeRoom === 'club_chat' ? "Skriv till hela klubben..." : "Skriv i interna adminkanalen..."}
            maxLength={500}
            onFocus={() => { setShowGifPicker(false); setShowPollCreator(false); }}
          />
          <button type="submit" className="btn-send">Skicka</button>
        </form>
      </div>
    </>
  );
}
