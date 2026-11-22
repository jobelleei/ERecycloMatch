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
import OfflineBanner from "../components/OfflineBanner";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  registerForPushNotifications,
  savePushTokenForProfile,
} from "../services/notifications";

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
        const Notifications = await import("expo-notifications");

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
        <KeyboardProvider>
          <AppArea />

          <Toast />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

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

      <OfflineBanner />
    </View>
  );
}

