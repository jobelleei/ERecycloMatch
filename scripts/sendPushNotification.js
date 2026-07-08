async function sendPushNotification(pushToken, title, body) {
  if (!pushToken) {
    console.log("No Expo push token.");
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data: {
      type: "system",
    },
  };

  try {
    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();

    console.log("Push Notification Result:", result);
  } catch (err) {
    console.error("Push Notification Error:", err);
  }
}

module.exports = sendPushNotification;