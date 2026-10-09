import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    /*
     * Android Expo Go does not support remote push notifications.
     * Do not even import expo-notifications in this case.
     */
    const isExpoGo = Constants.appOwnership === "expo";

    if (Platform.OS === "android" && isExpoGo) {
      console.log(
        "Android Expo Go detected. Push notification registration skipped.",
      );

      return null;
    }

    // Import expo-notifications only when it is actually supported.
    const Notifications = await import("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    // Remote push token requires a physical device
    if (!Device.isDevice) {
      console.log(
        "Push notifications require a physical device or supported development environment.",
      );

      return null;
    }

    const currentPermission =
      await Notifications.getPermissionsAsync();

    let permissionStatus = currentPermission.status;

    if (permissionStatus !== "granted") {
      const requestedPermission =
        await Notifications.requestPermissionsAsync();

      permissionStatus = requestedPermission.status;
    }

    if (permissionStatus !== "granted") {
      console.log("Notification permission was denied.");

      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log("EAS project ID was not found.");

      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("EXPO PUSH TOKEN:", token.data);

    return token.data;
  } catch (error) {
    console.error("Notification registration error:", error);

    return null;
  }
}