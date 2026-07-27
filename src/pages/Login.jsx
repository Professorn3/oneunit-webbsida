import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-card">
          <h1 className="login-title">Mina Sidor</h1>
          <p className="login-subtitle">
            Logga in för att komma åt medlemsportalen.
          </p>

          {error && <div className="login-error">{error}</div>}

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
              <label htmlFor="password">Lösenord</label>
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
