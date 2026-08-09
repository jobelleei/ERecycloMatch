// temp code for push notification registration

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
    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    // Remote push token requires a real device
    if (!Device.isDevice) {
      console.log(
        "Push notifications require a physical device or supported development environment.",
      );

      return null;
    }

    const currentPermission = await Notifications.getPermissionsAsync();

    let permissionStatus = currentPermission.status;

    if (permissionStatus !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();

      permissionStatus = requestedPermission.status;
    }

    if (permissionStatus !== "granted") {
      console.log("Notification permission was denied.");

      return null;
    }

    /*
     * Expo Go on Android SDK 53+
     * cannot create remote Expo push tokens.
     *
     * We skip getExpoPushTokenAsync while
     * testing with Expo Go.
     */
    const isExpoGo = Constants.appOwnership === "expo";

    if (Platform.OS === "android" && isExpoGo) {
      console.log(
        "Expo Go detected. Remote push notification registration skipped.",
      );

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

/* notif for expo sdk 53+ and eas build
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
    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    // Remote push token requires a real device
    if (!Device.isDevice) {
      console.log(
        "Push notifications require a physical device or supported development environment."
      );

      return null;
    }

    const currentPermission =
      await Notifications.getPermissionsAsync();

    let permissionStatus =
      currentPermission.status;

    if (permissionStatus !== "granted") {
      const requestedPermission =
        await Notifications.requestPermissionsAsync();

      permissionStatus =
        requestedPermission.status;
    }

    if (permissionStatus !== "granted") {
      console.log(
        "Notification permission was denied."
      );

      return null;
    }
   
    const isExpoGo =
      Constants.appOwnership === "expo";

    if (
      Platform.OS === "android" &&
      isExpoGo
    ) {
      console.log(
        "Expo Go detected. Remote push notification registration skipped."
      );

      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log(
        "EAS project ID was not found."
      );

      return null;
    }

    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    console.log(
      "EXPO PUSH TOKEN:",
      token.data
    );

    return token.data;
  } catch (error) {
    console.error(
      "Notification registration error:",
      error
    );

    return null;
  }
}

*/
