/// <reference path="../pb_data/types.d.ts" />

const SENDER_EMAIL = { name: "OneUnit Crew", email: "info@oneunit.se" };
const BREVO_API_KEY = "xsmtpsib-f8162366489370" + "a8dabb353b3900612eb39f" + "0b4f6eaf94b1488254aa5c7dd4c1-EbfZdEvXjfzsjbm5";

function sendBrevoEmail(toEmail, subject, htmlContent) {
    try {
        const payload = {
            sender: SENDER_EMAIL,
            to: [{ email: toEmail }],
            subject: subject,
            htmlContent: htmlContent
        };

        const res = $http.send({
            url: "https://api.brevo.com/v3/smtp/email",
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "api-key": BREVO_API_KEY,
                "content-type": "application/json",
                "accept": "application/json"
            },
            timeout: 10 // sekunder
        });
        
        console.log("Brevo API Response Status: " + res.statusCode);
        return res.statusCode === 201;
    } catch(err) {
        console.error("Brevo API Error: " + err);
        return false;
    }
}

// 1. Välkomstbrev (newsletter_emails)
onRecordAfterCreateSuccess((e) => {
    const email = e.record.get("email");
    if (!email) return;

    const html = `
    <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #00f5ff; margin: 0; font-size: 28px; letter-spacing: 2px;">ONE UNIT</h1>
            <p style="color: #666; font-size: 12px; margin-top: 5px; text-transform: uppercase;">Exklusivt MC Broderskap & Gemenskap</p>
        </div>
        <h2 style="color: #ffffff; font-size: 22px; margin-top: 20px;">Välkommen i gemenskapen! ⚡</h2>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tack för att du registrerat dig och anmält ditt intresse med adressen <strong style="color: #00f5ff;">${email}</strong>.</p>
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
    `;

    console.log("Skickar Välkomstmejl till " + email);
    sendBrevoEmail(email, "Välkommen till OneUnit - Vår Exklusiva Gemenskap! 🏍️", html);
}, "newsletter_emails");


// 2. Ansökan (applications)
onRecordAfterCreateSuccess((e) => {
    const email = e.record.get("email");
    const name = e.record.get("name") || "Ansökare";
    const bike = e.record.get("bike") || "Ej angivet";
    const city = e.record.get("city") || "Sverige";
    const phone = e.record.get("phone") || "din angivna kontakt";

    if (!email) return;

    const html = `
    <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00f5ff; margin-top: 0; font-size: 24px;">Hej ${name}! 👋</h2>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Tack för att du insänt din ansökan om medlemskap i OneUnit.</p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Vi har tagit emot dina uppgifter angående din motorcykel (<strong>${bike}</strong>) från <strong>${city}</strong>. Vår styrelse / crew granskar just nu dina svar och återkommer via e-post eller telefon (${phone}).</p>
        <hr style="border: 0; height: 1px; background: #222222; margin: 25px 0;" />
        <p style="color: #777777; font-size: 13px; margin: 0;">Bästa hälsningar,<br /><strong style="color: #00f5ff;">OneUnit Crew</strong></p>
    </div>
    `;

    console.log("Skickar Ansökningsbekräftelse till " + email);
    sendBrevoEmail(email, "Din medlemskapansökan hos OneUnit är mottagen! 🛡️", html);
}, "applications");


// 3. Massutskick (mail_campaigns)
onRecordAfterCreateSuccess((e) => {
    processCampaign(e.record);
}, "mail_campaigns");

onRecordAfterUpdateSuccess((e) => {
    if (e.record.get("status") === "pending") {
        processCampaign(e.record);
    }
}, "mail_campaigns");

function processCampaign(record) {
    const subject = record.get("subject");
    const bodyText = record.get("bodyText");
    const targetCollection = record.get("targetCollection") || "users";

    if (!subject || !bodyText) return;

    console.log("Startar kampanj: " + subject);

    // Sätt status till sending
    record.set("status", "sending");
    try { $app.save(record); } catch(e) { try { $app.dao().saveRecord(record); } catch(e2){} }

    try {
        let records = [];
        try {
            records = $app.findAllRecords(targetCollection);
        } catch(e) {
            try {
                records = $app.dao().findRecordsByExpr(targetCollection);
            } catch(e2) {
                console.error("Kunde inte hitta mottagare.");
            }
        }

        let successCount = 0;

        for (let i = 0; i < records.length; i++) {
            const email = records[i].get("email");
            if (email) {
                const html = `
                <div style="font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 35px; border-radius: 16px; border: 1px solid #1f1f1f; max-width: 600px; margin: 0 auto;">
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
                `;
                
                if (sendBrevoEmail(email, subject, html)) {
                    successCount++;
                }
                
                // Sov 150ms mellan mejlen för att inte bli spärrad av Brevo
                $os.sleep(150); 
            }
        }
        
        console.log("Kampanj slutförd. Skickade " + successCount + " mejl.");
        
        record.set("status", "completed");
        record.set("sentBy", "System");
        try { $app.save(record); } catch(e) { try { $app.dao().saveRecord(record); } catch(e2){} }

    } catch (err) {
        console.error("Kampanjen kraschade: " + err);
        record.set("status", "failed");
        try { $app.save(record); } catch(e) { try { $app.dao().saveRecord(record); } catch(e2){} }
    }
}
