
import { useState } from 'react';
import pb from '../pocketbase';
import { Link } from 'react-router-dom';
import GlitchText from '../components/GlitchText';
import './ComingSoon.css';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // 1. Spara e-post för nyhetsbrevet i databasen
      await pb.collection('newsletter_emails').create({
        email
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Något gick fel. Försök igen senare.');
    }
    setLoading(false);
  };

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-bg" />

      <div className="container coming-soon-content">
        <img src="/images/logo.png" alt="OneUnit Logo" className="coming-soon-logo" />

        <h1 className="coming-soon-title">
          <GlitchText text="UNDER" tag="span" />
          <br />
          <GlitchText text="CONSTRUCTION" tag="span" className="outline-text" />
        </h1>

        <p className="coming-soon-subtitle">
          Vi bygger något stort. Skriv upp dig på listan för att få en inbjudan när vi slår upp portarna.
        </p>

        {submitted ? (
          <div className="coming-soon-success">
            <h3>Tack!</h3>
            <p>Vi hör av oss när sidan är live.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="coming-soon-form">
            <input
              type="email"
              placeholder="Din e-postadress..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Skickar...' : 'Håll mig uppdaterad'}
            </button>
          </form>
        )}
      </div>

      <div className="coming-soon-footer">
        <Link to="/login" className="admin-backdoor">Admin Login</Link>
      </div>
    </div>
  );
}
