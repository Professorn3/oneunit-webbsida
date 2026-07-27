const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// 2nd Gen ställer in standardregion och stöder automatiskt eur3 multi-regional Firestore!
setGlobalOptions({ region: "europe-west1" });

// ============================================================================
// BREVO SMTP KONFIGURATION
// ============================================================================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "b37fb4001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY || "",
  },
});

// Din officiella e-postadress över din verifierade Cloudflare/Brevo-domän:
const SENDER_EMAIL = '"OneUnit Crew" <info@oneunit.se>'; 

// ============================================================================
// 1. AUTOMATISKT VÄLKOMSTBREV TILL NYHETSBREV (newsletter_emails)
// ============================================================================
exports.sendNewsletterWelcomeV2 = onDocumentCreated("newsletter_emails/{docId}", async (event) => {
  const snap = event.data;
  if (!snap) return null;
  const data = snap.data();
  const recipientEmail = data.email;

  if (!recipientEmail) {
    console.log("Ingen e-postadress hittades i dokumentet. Avbröts.");
    return null;
  }

  const mailOptions = {
    from: SENDER_EMAIL,
    to: recipientEmail,
    subject: "Välkommen till OneUnit - Vår Exklusiva Gemenskap! 🏍️",
    html: `
      <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,245,255,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #00f5ff; margin: 0; font-size: 28px; letter-spacing: 2px;">ONE UNIT</h1>
          <p style="color: #666; font-size: 12px; margin-top: 5px; text-transform: uppercase;">Exklusivt MC Broderskap & Gemenskap</p>
        </div>
        
        <h2 style="color: #ffffff; font-size: 22px; margin-top: 20px;">Välkommen i gemenskapen! ⚡</h2>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tack för att du registrerat dig och anmält ditt intresse med adressen <strong style="color: #00f5ff;">${recipientEmail}</strong>.</p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Vi har lagt till dig på vår VIP-lista och kommer hålla dig först uppdaterad med releaser, exklusiva lanseringar och nyheter innan alla andra.</p>
        
        <div style="margin: 35px 0; padding: 20px; background: #121212; border-left: 4px solid #00f5ff; border-radius: 8px;">
          <p style="margin: 0; font-size: 15px; color: #eee;"><em>"Ride safe and stay loyal."</em></p>
        </div>
        
        <hr style="border: 0; height: 1px; background: #222222; margin: 30px 0;" />
        
        <p style="color: #777777; font-size: 13px; text-align: center; margin: 0;">
          Med vänliga hälsningar,<br />
          <strong style="color: #00f5ff;">OneUnit Crew</strong>
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Välkomstbrev (Nyhetsbrev) skickades till ${recipientEmail} (ID: ${info.messageId})`);
    return snap.ref.update({ emailSent: true, emailSentAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("Kunde inte skicka välkomstmejl via Brevo:", error);
    return snap.ref.update({ emailSent: false, emailError: error.message });
  }
});

// ============================================================================
// 2. AUTOMATISK BEKRÄFTELSE VID MC-ANSÖKAN (applications)
// ============================================================================
exports.sendApplicationConfirmationV2 = onDocumentCreated("applications/{docId}", async (event) => {
  const snap = event.data;
  if (!snap) return null;
  const appData = snap.data();
  const applicantEmail = appData.email;
  const applicantName = appData.name || "Ansökare";

  if (!applicantEmail) {
    console.log("Ingen e-post till ansökare hittades.");
    return null;
  }

  const mailOptions = {
    from: SENDER_EMAIL,
    to: applicantEmail,
    subject: "Din medlemskapansökan hos OneUnit är mottagen! 🛡️",
    html: `
      <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f5ff; margin-top: 0; font-size: 24px;">Hej ${applicantName}! 👋</h2>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tack för att du insänt din ansökan om medlemskap i OneUnit.</p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Vi har tagit emot dina uppgifter angående din motorcykel (<strong>${appData.bike || 'Ej angivet'}</strong>) från <strong>${appData.city || 'Sverige'}</strong>. Vår styrelse / crew granskar just nu dina svar och återkommer via e-post eller telefon (${appData.phone || 'din angivna kontakt'}).</p>
        <hr style="border: 0; height: 1px; background: #222222; margin: 25px 0;" />
        <p style="color: #777777; font-size: 13px; margin: 0;">Bästa hälsningar,<br /><strong style="color: #00f5ff;">OneUnit Crew</strong></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Bekräftelsemejl skickades till ansökare ${applicantEmail}`);
    return snap.ref.update({ confirmationEmailSent: true });
  } catch (error) {
    console.error("Kunde inte skicka bekräftelsemejl via Brevo:", error);
    return snap.ref.update({ confirmationEmailSent: false, error: error.message });
  }
});

// ============================================================================
// 3. KAMPANJER & MASSUTSKICK TILL ANVÄNDARE (kollektionen "users" osv)
// ============================================================================
exports.sendBroadcastCampaignV2 = onDocumentCreated("mail_campaigns/{docId}", async (event) => {
  const snap = event.data;
  if (!snap) return null;
  const data = snap.data();
  const { subject, bodyText, targetCollection = "users" } = data;

  if (!subject || !bodyText) {
    console.log("Saknar ämne (subject) eller text (bodyText). Avslutar kampanj.");
    return null;
  }

  try {
    const targetsSnap = await admin.firestore().collection(targetCollection).get();
    
    const recipients = [];
    targetsSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.email && !recipients.includes(userData.email)) {
        recipients.push(userData.email);
      }
    });

    if (recipients.length === 0) {
      console.log(`Inga e-postadresser hittades under '${targetCollection}'.`);
      return snap.ref.update({ status: "failed", errorMessage: "Inga e-postadresser hittades i samlingen" });
    }

    console.log(`Startar massutskick till ${recipients.length} unika mottagare från '${targetCollection}'...`);

    let successCount = 0;
    for (const recipient of recipients) {
      const mailOptions = {
        from: SENDER_EMAIL,
        to: recipient,
        subject: subject,
        html: `
          <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,245,255,0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #00f5ff; margin: 0; font-size: 26px; letter-spacing: 2px;">ONE UNIT</h1>
              <p style="color: #666; font-size: 12px; margin-top: 5px; text-transform: uppercase;">Exklusivt MC Broderskap</p>
            </div>
            
            <h2 style="color: #ffffff; font-size: 22px; margin-top: 15px; border-bottom: 1px solid #222; padding-bottom: 15px;">${subject}</h2>
            
            <div style="color: #dddddd; font-size: 16px; line-height: 1.7; white-space: pre-wrap; margin: 25px 0;">
${bodyText}
            </div>
            
            <hr style="border: 0; height: 1px; background: #222222; margin: 30px 0;" />
            <p style="color: #777777; font-size: 13px; text-align: center; margin: 0;">
              Ride safe and stay loyal,<br />
              <strong style="color: #00f5ff;">OneUnit Crew</strong>
            </p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        successCount++;
      } catch (mailErr) {
        console.error(`Misslyckades skicka till ${recipient}:`, mailErr.message);
      }
    }

    console.log(`Kampanj slutförd! ${successCount} av ${recipients.length} skickade med framgång.`);
    return snap.ref.update({
      status: "completed",
      recipientsCount: recipients.length,
      successCount: successCount,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Ett oväntat fel inträffade vid kampanjhantering:", error);
    return snap.ref.update({ status: "error", errorMessage: error.message });
  }
});

