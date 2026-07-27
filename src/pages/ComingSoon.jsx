
import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      await addDoc(collection(db, 'newsletter_emails'), {
        email,
        createdAt: serverTimestamp()
      });

      // 2. Skapa utskicksorder i kollektionen 'mail' (Triggare för Firebase Trigger Email + Brevo SMTP)
      try {
        await addDoc(collection(db, 'mail'), {
          to: [email],
          message: {
            subject: "Välkommen till OneUnit - Vår Exklusiva Gemenskap! 🏍️",
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #222; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00f5ff; margin-top: 0; font-size: 24px;">Välkommen i gemenskapen! ⚡</h2>
                <p style="color: #cccccc; font-size: 16px; line-height: 1.5;">Tack för att du skrivit upp din adress (<strong>${email}</strong>) hos OneUnit.</p>
                <p style="color: #cccccc; font-size: 16px; line-height: 1.5;">Vi har lagt till dig på vår VIP-lista och kommer höra av oss direkt till dig med nyheter, förhandsåtkomst till releaser och spännande exklusivt innehåll så fort vi drar igång.</p>
                <hr style="border: 0; height: 1px; background: #222; margin: 25px 0;" />
                <p style="color: #777777; font-size: 14px; margin: 0;">Ride safe and stay loyal,<br /><strong style="color: #00f5ff;">OneUnit Crew</strong></p>
              </div>
            `
          }
        });
      } catch (mailErr) {
        console.error("Kunde inte registrera mejlutskicket:", mailErr);
        // Anmälan sparas givetvis tryggt i nyhetsbrevskollektionen ändå
      }

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
