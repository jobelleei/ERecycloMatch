import { Stack } from "expo-router";
import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { registerForPushNotifications } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    // Android Expo Go does not support remote push notifications.
    const isExpoGo = Constants.appOwnership === "expo";

    if (Platform.OS === "android" && isExpoGo) {
      console.log(
        "Android Expo Go detected. Notification listeners skipped.",
      );
      return;
    }

    let receivedSubscription: {
      remove: () => void;
    } | null = null;

    let responseSubscription: {
      remove: () => void;
    } | null = null;

    const setupNotifications = async () => {
      try {
        // Only load expo-notifications when it is supported.
        const Notifications = await import("expo-notifications");

        const token = await registerForPushNotifications();

        if (token) {
          console.log("EXPO PUSH TOKEN:", token);
        }

        receivedSubscription =
          Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log("Notification received:", notification);
            },
          );

        responseSubscription =
          Notifications.addNotificationResponseReceivedListener(
            (response) => {
              console.log("Notification pressed:", response);
            },
          );
      } catch (error) {
        console.error("Notification setup failed:", error);
      }
    };

    setupNotifications();

    return () => {
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      <Toast />
    </GestureHandlerRootView>
  );
}

