import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { isRunningInExpoGo } from "expo";
import { useEffect } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  registerForPushNotifications,
  savePushTokenForProfile,
} from "../services/notifications";

// The signed-in user saved by signin.tsx, or null
const readStoredUser = async (): Promise<any | null> => {
  try {
    const stored = await AsyncStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export default function RootLayout() {
  useEffect(() => {
    // Android Expo Go does not support remote push notifications.
    const isExpoGo = isRunningInExpoGo();

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

        // Already signed in on this phone: make sure pushes for this
        // account come here. Otherwise just ask for permission early.
        const storedUser = await readStoredUser();

        if (storedUser?.id) {
          savePushTokenForProfile(storedUser.id);
        } else {
          await registerForPushNotifications();
        }

        receivedSubscription =
          Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log("Notification received:", notification);
            },
          );

        // Tapping a push opens Messages for a chat, otherwise Notifications
        responseSubscription =
          Notifications.addNotificationResponseReceivedListener(
            async (response) => {
              try {
                const data: any =
                  response.notification.request.content.data || {};
                const user = await readStoredUser();
                if (!user?.id) return;

                const role = String(user.role || "").toLowerCase();
                const base =
                  role === "facility" ? "/facility_dashboard" : "/user_dashboard";
                const screen =
                  data.type === "message"
                    ? "messages"
                    : role === "facility"
                      ? "facility_notifications"
                      : "notification";

                router.push(`${base}/${screen}` as any);
              } catch (error) {
                console.log("Notification tap error:", error);
              }
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

