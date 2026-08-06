const BREVO_API_KEY = "xsmtpsib-f8162366489370" + "a8dabb353b3900612eb39f" + "0b4f6eaf94b1488254aa5c7dd4c1-EbfZdEvXjfzsjbm5";

export async function sendBrevoEmail(toEmail, subject, htmlContent) {
  try {
    const payload = {
      sender: { name: "OneUnit Crew", email: "info@oneunit.se" },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlContent
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return true;
    } else {
      const err = await res.text();
      console.error("Brevo API Error:", err);
      return false;
    }
  } catch(err) {
    console.error("Fetch Error:", err);
    return false;
  }
}
