import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    if (!Device.isDevice) {
      console.log(
        "Running on an emulator. Push notifications require an emulator with Google Play services."
      );
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
      throw new Error("EAS project ID was not found.");
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