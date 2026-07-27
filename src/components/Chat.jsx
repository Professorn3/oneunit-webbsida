import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

export default function Chat() {
  const { currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('club_chat'); // 'club_chat' or 'admin_chat'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, activeRoom),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, activeRoom), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: currentUser.uid,
      email: currentUser.email,
      role: isAdmin ? 'admin' : 'member'
    });

    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{activeRoom === 'club_chat' ? 'Klubbchatt' : 'Admin Chatt'}</h3>
        {isAdmin && (
          <div className="room-toggle">
            <button 
              className={`btn ${activeRoom === 'club_chat' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveRoom('club_chat')}
            >
              Klubb
            </button>
            <button 
              className={`btn ${activeRoom === 'admin_chat' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveRoom('admin_chat')}
            >
              Admin
            </button>
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.uid === currentUser.uid ? 'sent' : 'received'}`}>
            <span className="msg-sender">{msg.email.split('@')[0]} {msg.role === 'admin' && '🛡️'}</span>
            <div className="msg-bubble">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..." 
        />
        <button type="submit" className="btn btn-primary">Skicka</button>
      </form>
    </div>
  );
}
