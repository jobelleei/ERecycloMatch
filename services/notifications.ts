import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const isExpoGo = isRunningInExpoGo();

    if (Platform.OS === "android" && isExpoGo) {
      console.log(
        "Android Expo Go detected. Push notification registration skipped.",
      );

      return null;
    }

    const Notifications = await import("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

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

export async function savePushTokenForProfile(
  profileId: string | number,
): Promise<void> {
  try {
    const id = String(profileId || "").trim();
    if (!id) return;

    const token = await registerForPushNotifications();
    if (!token) return;

    const { supabase } = await import("../utils/supabase");

    await supabase
      .from("profiles")
      .update({ expo_push_token: null })
      .eq("expo_push_token", token)
      .neq("id", id);

    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", id);

    if (error) {
      console.log("SAVE PUSH TOKEN ERROR:", error.message);
    }
  } catch (error) {
    console.log("SAVE PUSH TOKEN ERROR:", error);
  }
}

export async function clearPushTokenForProfile(
  profileId: string | number,
): Promise<void> {
  try {
    const id = String(profileId || "").trim();
    if (!id) return;

    const { supabase } = await import("../utils/supabase");

    await supabase
      .from("profiles")
      .update({ expo_push_token: null })
      .eq("id", id);
  } catch (error) {
    console.log("CLEAR PUSH TOKEN ERROR:", error);
  }
}
