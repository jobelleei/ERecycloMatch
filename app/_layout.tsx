import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, usePathname } from "expo-router";
import { isRunningInExpoGo } from "expo";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
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

                // A message opens its chat; other pushes open Notifications
                if (data.type === "message" && data.conversation_id) {
                  router.push({
                    pathname: `${base}/chat`,
                    params: { conversationId: String(data.conversation_id) },
                  } as any);
                  return;
                }

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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Measures the keyboard correctly on every Android version (chat input) */}
        <KeyboardProvider>
          <AppArea />

          <Toast />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/*
 * Keeps every screen above the phone's own navigation bar (back / home /
 * recent buttons). Android draws apps edge-to-edge, so without this the
 * phone's buttons cover the app's bottom menu. With gesture navigation the
 * inset is only a few pixels, so those phones look the same as before.
 */
// Color of the strip behind the phone's navigation bar, matched to the
// screen above it so it blends in (green on welcome/sign-in screens,
// white under the dashboards' white bottom menu)
const STRIP_COLORS: Record<string, string> = {
  "/": "#CFE8C6",
  "/signin": "#CFE8C6",
  "/individual_signup": "#CFE8C6",
  "/facility_signup": "#CFE8C6",
  "/verify_email": "#DDEFD3",
  "/forgot_password": "#DDEFD3",
  "/reset_password": "#DDEFD3",
};

function AppArea() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const stripColor = STRIP_COLORS[pathname] || "#FFFFFF";

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
        backgroundColor: stripColor,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

