import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(''); // 'idle', 'loading', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'unread'
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="contact-page page-container">
      <div className="container contact-container">
        <h1 className="contact-title">Kontakta Oss</h1>
        <p className="contact-subtitle">
          Har du frågor, förslag eller funderingar kring klubben? Skriv till oss så återkommer vi så snart som möjligt.
        </p>

        {status === 'success' ? (
          <div className="contact-success">
            <h2>Meddelande Skickat!</h2>
            <p>Tack för att du kontaktar OneUnit. Vi återkommer till dig på din e-postadress.</p>
            <button className="btn btn-primary" onClick={() => setStatus('idle')}>Skicka ett till meddelande</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Ditt Namn</label>
              <input 
                type="text" 
                id="name" 
                required 
                placeholder="Skriv ditt förnamn & efternamn..."
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">E-postadress</label>
              <input 
                type="email" 
                id="email" 
                required 
                placeholder="Din e-post vi kan svara till..."
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Meddelande</label>
              <textarea 
                id="message" 
                required 
                rows="6"
                placeholder="Hur kan vi hjälpa dig?"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>
            
            {status === 'error' && (
              <div className="form-error">Något gick fel, försök igen senare.</div>
            )}
            
            <button type="submit" className="btn btn-primary contact-submit-btn" disabled={status === 'loading'}>
              {status === 'loading' ? 'Skickar...' : 'Skicka Meddelande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
