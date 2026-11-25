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

//Retrieve the currently stored user information from AsyncStorage.
const readStoredUser = async (): Promise<any | null> => {
  try {
    //Get the saved user data using the "user" storage key.
    const stored = await AsyncStorage.getItem("user");

    //Convert the stored JSON string into an object.
    return stored ? JSON.parse(stored) : null;
  } catch {
    //Return null if retrieving or parsing the user data fails.
    return null;
  }
};

//Main root layout component of the application.
export default function RootLayout() {
  //Run notification setup when the root layout is first mounted.
  useEffect(() => {
    //Check whether the application is running inside Expo Go.
    const isExpoGo = isRunningInExpoGo();

    //Skip notification listeners on Android when running in Expo Go.
    if (Platform.OS === "android" && isExpoGo) {
      console.log(
        "Android Expo Go detected. Notification listeners skipped.",
      );
      return;
    }

    //Store the subscription for notifications received while the app is open.
    let receivedSubscription: {
      remove: () => void;
    } | null = null;

    //Store the subscription for notification responses when users tap notifications.
    let responseSubscription: {
      remove: () => void;
    } | null = null;

    //Set up push notifications and their event listeners.
    const setupNotifications = async () => {
      try {
        //Dynamically import the Expo Notifications module.
        const Notifications = await import("expo-notifications");

        //Retrieve the currently logged-in user's stored information.
        const storedUser = await readStoredUser();

        //Save the notification token to the existing user's profile.
        if (storedUser?.id) {
          savePushTokenForProfile(storedUser.id);
        } else {
          //Register for push notifications if no stored user ID is available.
          await registerForPushNotifications();
        }

        //Listen for notifications received while the application is running.
        receivedSubscription =
          Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log("Notification received:", notification);
            },
          );

        //Listen for user interactions with received notifications.
        responseSubscription =
          Notifications.addNotificationResponseReceivedListener(
            async (response) => {
              try {
                //Get the additional data attached to the notification.
                const data: any =
                  response.notification.request.content.data || {};

                //Retrieve the user's information to determine the destination screen.
                const user = await readStoredUser();
                if (!user?.id) return;

                //Identify the user's role and select the corresponding dashboard path.
                const role = String(user.role || "").toLowerCase();
                const base =
                  role === "facility" ? "/facility_dashboard" : "/user_dashboard";

                //Navigate directly to the chat screen when the notification is a message.
                if (data.type === "message" && data.conversation_id) {
                  router.push({
                    pathname: `${base}/chat`,
                    params: { conversationId: String(data.conversation_id) },
                  } as any);
                  return;
                }

                //Determine which notification screen should be opened.
                const screen =
                  data.type === "message"
                    ? "messages"
                    : role === "facility"
                      ? "facility_notifications"
                      : "notification";

                //Navigate to the selected notification screen.
                router.push(`${base}/${screen}` as any);
              } catch (error) {
                //Log any error that occurs while handling a notification tap.
                console.log("Notification tap error:", error);
              }
            },
          );
      } catch (error) {
        //Log errors that occur during notification setup.
        console.error("Notification setup failed:", error);
      }
    };

    //Start the notification setup process.
    setupNotifications();

    //Remove notification listeners when the component is unmounted.
    return () => {
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, []);

  //Provide safe area, gesture handling, and keyboard support to the application.
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          {/* Render the main application screens and shared layout. */}
          <AppArea />

          {/* Display toast messages throughout the application. */}
          <Toast />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

//Define background colors for specific application routes.
const STRIP_COLORS: Record<string, string> = {
  "/": "#CFE8C6",
  "/signin": "#CFE8C6",
  "/individual_signup": "#CFE8C6",
  "/facility_signup": "#CFE8C6",
  "/verify_email": "#DDEFD3",
  "/forgot_password": "#DDEFD3",
  "/reset_password": "#DDEFD3",
};

//Component that manages the main application area and screen layout.
function AppArea() {
  //Get the device's safe area spacing.
  const insets = useSafeAreaInsets();

  //Get the current route path.
  const pathname = usePathname();

  //Select the background color based on the current route.
  const stripColor = STRIP_COLORS[pathname] || "#FFFFFF";

  return (
    //Main container that adjusts its bottom spacing and background color.
    <View
      style={{
        flex: 1,
        paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
        backgroundColor: stripColor,
      }}
    >
      {/* Display the application's navigation screens without default headers. */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Display the offline banner across the application. */}
      <OfflineBanner />
    </View>
  );
}