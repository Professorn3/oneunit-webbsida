import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Fel e-post eller lösenord. Försök igen.');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Vänligen fyll i din e-postadress först för att återställa lösenordet.');
      setMsg('');
      return;
    }
    setLoading(true);
    try {
      const functions = getFunctions();
      const sendCustomReset = httpsCallable(functions, 'sendCustomPasswordResetEmail');
      await sendCustomReset({ email });
      
      setMsg('Ett officiellt återställningsmail har skickats till din e-post.');
      setError('');
    } catch (err) {
      setError('Ett fel uppstod vid återställning av lösenord: ' + err.message);
      setMsg('');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-card">
          <h1 className="login-title">Mina Sidor</h1>
          <p className="login-subtitle">
            Logga in för att komma åt medlemsportalen.
          </p>

          {error && <div className="login-error">{error}</div>}
          {msg && <div style={{ color: '#00ff88', marginBottom: '1rem', textAlign: 'center', background: 'rgba(0,255,136,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #00ff88' }}>{msg}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-postadress</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <label htmlFor="password" style={{ margin: 0 }}>Lösenord</label>
                <button type="button" onClick={handleResetPassword} style={{ background: 'none', border: 'none', color: '#00f5ff', cursor: 'pointer', fontSize: '0.85rem' }}>Glömt lösenord?</button>
              </div>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Laddar...' : 'Logga in'}
            </button>
          </form>

          <div className="login-toggle" style={{marginTop: '2rem', textAlign: 'center'}}>
            <Link to="/" className="btn-link">Tillbaka till startsidan</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
