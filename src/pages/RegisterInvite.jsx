import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import './Login.css'; // Återanvänder samma CSS

export default function RegisterInvite() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kolla om token finns i URL (t.ex. /register?token=XYZ)
    const checkToken = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Ogiltig eller saknad inbjudningslänk.');
        setCheckingToken(false);
        return;
      }

      try {
        // Kontrollera om inbjudan finns i databasen
        const inviteRef = doc(db, 'invites', token);
        const inviteSnap = await getDoc(inviteRef);
        
        if (inviteSnap.exists()) {
          setEmail(inviteSnap.data().email); // Förifyll mejlen från inbjudan
          setValidToken(token);
        } else {
          setError('Inbjudningslänken har gått ut eller är ogiltig.');
        }
      } catch (err) {
        setError('Ett fel uppstod vid kontroll av inbjudan.');
      }
      setCheckingToken(false);
    };

    checkToken();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validToken) return;

    setError('');
    setLoading(true);

    try {
      // 1. Skapa kontot
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Skapa användardokument direkt som 'member' (eftersom de blev inbjudna)
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email: email,
        role: 'member',
        createdAt: new Date().toISOString()
      });

      // 3. Ta bort inbjudan så den inte kan användas igen
      await deleteDoc(doc(db, 'invites', validToken));

      navigate('/dashboard');
    } catch (err) {
      setError('Kunde inte skapa konto. ' + err.message.replace('Firebase: ', ''));
    }
    
    setLoading(false);
  };

  if (checkingToken) {
    return <div className="login-page"><div className="container" style={{textAlign: 'center', color: '#fff'}}>Kontrollerar inbjudan...</div></div>;
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-card">
          <h1 className="login-title">Acceptera Inbjudan</h1>
          <p className="login-subtitle">
            Skapa ditt lösenord för att gå med i OneUnit.
          </p>

          {error ? (
            <div className="login-error">{error}</div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">E-postadress</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  disabled // Låst till e-posten de blev inbjudna på
                  required 
                  style={{ opacity: 0.7 }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Välj Lösenord</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
              
              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Skapar konto...' : 'Gå med nu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
