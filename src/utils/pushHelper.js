import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = "01e631d7-" + "b812-4501-" + "a7b1-86389a044642";
const REST_API_KEY = "os_v2_app_" + "ahtddv5ycjcqdj5rqy4jubcgii" + "4ukit3dpseynudnequsne3ekirrfwchlheyw5sciwu3x5gba6xqudobs5qee4s5sx4huyeebcwt6i";

export async function initOneSignal() {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // Bra för testning
      notifyButton: {
        enable: false,
      },
      promptOptions: {
        slidedown: {
          prompts: [{
            type: "push",
            autoPrompt: true,
            text: {
              actionMessage: "Vill du få notiser om larm (SOS) och återsamlingsplatser?",
              acceptButton: "Tillåt",
              cancelButton: "Nej tack"
            }
          }]
        }
      }
    });
    console.log("OneSignal initialized");
    OneSignal.Slidedown.promptPush();
  } catch (error) {
    console.error("Error initializing OneSignal:", error);
  }
}

export function loginToOneSignal(userId) {
  if (!userId) return;
  try {
    OneSignal.login(userId);
  } catch (error) {
    console.error("Error logging in to OneSignal:", error);
  }
}

export function logoutFromOneSignal() {
  try {
    OneSignal.logout();
  } catch (error) {
    console.error("Error logging out from OneSignal:", error);
  }
}

// Skickar push-notis till antingen alla (om userIds är tom array) 
// eller till specifika användare via deras PocketBase-ID (external_id).
export async function sendPushNotification(title, message, url = null, userIds = []) {
  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      headings: { "en": title, "sv": title },
      contents: { "en": message, "sv": message },
      url: url || window.location.origin
    };

    if (userIds.length > 0) {
      payload.include_aliases = {
        "external_id": userIds
      };
      payload.target_channel = "push";
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to send push notification:", err);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Fetch error sending push:", error);
    return false;
  }
}
