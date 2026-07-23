import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

import { registerForPushNotifications } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          console.log("EXPO PUSH TOKEN:", token);
        }
      })
      .catch((error: unknown) => {
        console.error("Notification setup failed:", error);
      });
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification pressed:", response);
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {/* THIS IS WHAT ENABLES TOAST */}
      <Toast />
    </>
  );
}
