import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase';
import './AuthAction.css';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((emailRes) => {
          setEmail(emailRes);
          setVerifying(false);
        })
        .catch((err) => {
          setError('Ogiltig eller utgången länk. Begär en ny lösenordsåterställning.');
          setVerifying(false);
        });
    } else {
      setError('Ogiltig begäran. Återvänd till startsidan.');
      setVerifying(false);
    }
  }, [mode, oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }
    
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    
    if (newPassword.length < 8 || !hasLetters || !hasNumbers) {
      setError('Lösenordet måste vara minst 8 tecken långt och innehålla både bokstäver och siffror.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMsg('Ditt lösenord har ändrats framgångsrikt! Du kan nu logga in.');
      setError('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Kunde inte ändra lösenordet: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-action-page">
      <div className="container">
        <div className="auth-action-card">
          <h1 className="auth-action-title">LÖSENORD</h1>
          
          {verifying ? (
            <p className="auth-action-subtitle">Verifierar din länk...</p>
          ) : (
            <>
              {error && <div className="auth-action-error">{error}</div>}
              {msg && <div className="auth-action-success">{msg}</div>}

              {!error && !msg && email && (
                <>
                  <p className="auth-action-subtitle">
                    Återställer lösenordet för <strong>{email}</strong>
                  </p>
                  <form onSubmit={handleSubmit} className="auth-action-form">
                    <div className="form-group">
                      <label htmlFor="newPassword">Nytt lösenord</label>
                      <input 
                        type="password" 
                        id="newPassword" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Bekräfta lösenord</label>
                      <input 
                        type="password" 
                        id="confirmPassword" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary auth-action-btn" disabled={loading}>
                      {loading ? 'Sparar...' : 'Spara nytt lösenord'}
                    </button>
                  </form>
                </>
              )}

              <div className="auth-action-toggle">
                <Link to="/login" className="btn-link">Tillbaka till inloggning</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
