import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import pb from '../pocketbase';
import ScrollReveal from '../components/ScrollReveal';

export default function Ticket() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const record = await pb.collection('contacts').getOne(id);
        if (record) {
          setTicket(record);
        } else {
          setTicket(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    
    try {
      await pb.collection('contacts').update(id, {
        status: 'unread',
        replies: [...(ticket.replies || []), {
          text: replyText,
          sender: 'user',
          createdAt: new Date().toISOString()
        }]
      });
      
      // Uppdatera state lokalt
      setTicket(prev => ({
        ...prev,
        status: 'unread',
        replies: [...(prev.replies || []), {
          text: replyText,
          sender: 'user',
          createdAt: new Date().toISOString()
        }]
      }));
      setReplyText('');
    } catch (err) {
      alert("Fel vid skickande av svar: " + err.message);
    }
    setSending(false);
  };

  if (loading) return <div className="page-wrapper container"><h2 style={{marginTop: '100px'}}>Laddar ärende...</h2></div>;
  if (!ticket) return <div className="page-wrapper container"><h2 style={{marginTop: '100px'}}>Ärendet hittades inte.</h2><p>Länken kan vara felaktig eller ärendet är borttaget.</p></div>;

  return (
    <div className="page-wrapper container" style={{ maxWidth: '800px', paddingTop: '120px', paddingBottom: '120px' }}>
      <ScrollReveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>Ärende: {ticket.name}</h1>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>#{ticket.id.slice(0,8).toUpperCase()}</span>
        </div>
        
        <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
            Ditt ursprungliga meddelande ({ticket.created ? new Date(ticket.created).toLocaleString() : ''})
          </p>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#fff', fontSize: '1rem', lineHeight: '1.6' }}>{ticket.message}</p>
        </div>
        
        {ticket.replies && ticket.replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
            <h3 style={{ color: '#00f5ff', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>Ärendehistorik</h3>
            {ticket.replies.map((reply, idx) => {
              const isAdmin = reply.sender === 'admin';
              return (
                <div key={idx} style={{ 
                  background: isAdmin ? '#0d1a24' : '#151515', 
                  borderLeft: isAdmin ? '3px solid #00f5ff' : '3px solid #555',
                  padding: '1.5rem', 
                  borderRadius: '6px',
                  marginLeft: isAdmin ? '0' : '2rem',
                  marginRight: isAdmin ? '2rem' : '0'
                }}>
                  <p style={{ fontSize: '0.75rem', color: isAdmin ? '#00f5ff' : '#aaa', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                    {isAdmin ? 'Svar från Support' : 'Ditt svar'} <span style={{ color: '#666', fontWeight: 'normal' }}>· {new Date(reply.createdAt).toLocaleString()}</span>
                  </p>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: '#eee' }}>{reply.text}</p>
                </div>
              );
            })}
          </div>
        )}
        
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#fff' }}>Svara på ärendet</h3>
          <form onSubmit={handleSend}>
            <textarea 
              rows={5} 
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Skriv ditt svar här..."
              style={{ width: '100%', padding: '1rem', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '6px', marginBottom: '1.5rem', resize: 'vertical', fontSize: '1rem' }}
              required
            />
            <button type="submit" disabled={sending} className="btn" style={{ background: '#00f5ff', color: '#000', padding: '12px 24px', fontSize: '1rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              {sending ? 'Skickar...' : 'Skicka Svar'}
            </button>
          </form>
        </div>
      </ScrollReveal>
    </div>
  );
}
