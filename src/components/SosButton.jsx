import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import pb from '../pocketbase';
import MapModal from './MapModal';
import { sendBrevoEmail } from '../utils/emailHelper';
import { sendPushNotification } from '../utils/pushHelper';
import './SosButton.css';

export default function SosButton() {
  const { currentUser, isMember, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);

  // Bara medlemmar/admins ser knappen
  if (!currentUser || (!isMember && !isAdmin)) return null;

  const handleSosConfirm = async ({ message, lat, lng, mapsLink }) => {
    setSending(true);
    try {
      // Hämta alla medlemmar för att skicka massmejl
      const users = await pb.collection('users').getFullList();
      const recipients = users.filter(u => u.email && (u.role === 'admin' || u.role === 'member'));

      if (recipients.length === 0) {
        alert("Inga medlemmar hittades.");
        setSending(false);
        return;
      }

      const senderName = currentUser.name || currentUser.email.split('@')[0];
      const subject = `🚨 NÖDLARM FRÅN ${senderName.toUpperCase()} 🚨`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #ff3b30; color: #ffffff; padding: 35px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
          <h2 style="margin-top:0; color:#fff; font-size:24px;">🚨 NÖDSITUATION 🚨</h2>
          <p style="font-size: 16px; line-height: 1.5; color:#fff;">
            <strong>${senderName}</strong> behöver omedelbar hjälp!
          </p>
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin:0; font-size: 16px; color:#fff;"><strong>Meddelande:</strong><br/>${message}</p>
          </div>
          <p style="font-size: 16px; color:#fff;">
            <strong>Plats (Google Maps):</strong><br/>
            <a href="${mapsLink}" style="color: #00f5ff; font-weight: bold; font-size: 18px;">📍 Öppna i Kartor (Kör hit!)</a>
          </p>
          <hr style="border:0; border-top: 1px solid rgba(255,255,255,0.3); margin: 30px 0;">
          <p style="font-size: 12px; color: rgba(255,255,255,0.8);">
            Detta larm skickades via OneUnit-appen till alla medlemmar. 
            Kontakta ${senderName} direkt eller åk till platsen om du är i närheten.
          </p>
        </div>
      `;

      // Vi loopar över medlemmarna. 
      // Brevo tillåter max X anrop per sekund, men vi kan antingen 
      // skicka ett mejl i taget eller ändra emailHelper till att ta en array av mail.
      // För att vara säkra gör vi individuella anrop eller skapar en array av emails.
      // emailHelper är gjord för en email, men vi kan uppdatera den! 
      // Jag använder emailHelper.js som stödjer arrays om vi uppdaterar den.
      const emails = recipients.map(u => u.email);
      
      const emailSuccess = await sendBrevoEmail(emails, subject, htmlContent);
      
      // Skicka push-notis
      const userIds = recipients.map(u => u.id);
      const pushSuccess = await sendPushNotification(
        "🚨 NÖDLARM!", 
        `${senderName} behöver omedelbar hjälp: ${message}`,
        mapsLink,
        userIds
      );
      
      if (emailSuccess || pushSuccess) {
        alert("Larmet har skickats till alla medlemmar!");
        setShowModal(false);
      } else {
        alert("Ett fel uppstod vid skickandet av larmet.");
      }
    } catch (err) {
      console.error(err);
      alert("Något gick fel: " + err.message);
    }
    setSending(false);
  };

  return (
    <>
      <button 
        className="sos-floating-btn" 
        onClick={() => setShowModal(true)}
        title="Nödlarm"
      >
        SOS
      </button>

      {showModal && (
        <MapModal
          isOpen={showModal}
          onClose={() => !sending && setShowModal(false)}
          onConfirm={handleSosConfirm}
          title="🚨 Larma Alla Medlemmar"
          messagePlaceholder="Vad har hänt? (t.ex. Punktering, behöver verktyg...)"
          confirmText={sending ? "Larmar..." : "Larma Nu!"}
        />
      )}
    </>
  );
}
