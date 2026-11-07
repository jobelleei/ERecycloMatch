import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { supabase } from "../utils/supabase";
import styles from "./styles/index";

/*
 * Android may close the app while it is in the background. When it is
 * opened again it starts here, so check for a saved login first and go
 * straight to the dashboard instead of looking logged out.
 */
const DASHBOARDS: Record<string, string> = {
  user: "/user_dashboard",
  facility: "/facility_dashboard",
};

// Still approved? Unknown (e.g. no internet) counts as yes, so the user
// is not locked out offline.
const isStillApproved = async (userId: string): Promise<boolean> => {
  try {
    const result = await Promise.race([
      supabase.from("profiles").select("status").eq("id", userId).maybeSingle(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    if (!result || (result as any).error) return true;

    const status = String((result as any).data?.status || "")
      .trim()
      .toLowerCase();

    // Account removed from the database
    if (!(result as any).data) return false;

    return status === "approved";
  } catch {
    return true;
  }
};

export default function Index() {
  const router = useRouter();
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resumeSavedLogin = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const user = stored ? JSON.parse(stored) : null;
        const role = String(user?.role || "").toLowerCase();
        const dashboard = DASHBOARDS[role];

        if (user?.id && dashboard) {
          if (await isStillApproved(String(user.id))) {
            if (!cancelled) router.replace(dashboard as any);
            return;
          }

          // Rejected, deleted or no longer approved: forget the saved login
          await AsyncStorage.removeItem("user");
        }
      } catch (error) {
        console.log("RESUME LOGIN ERROR:", error);
      }

      if (!cancelled) setCheckingLogin(false);
    };

    resumeSavedLogin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icons/icon.png")}
        style={styles.logo}
      />

      {/* Only the logo shows while checking for a saved login */}
      {!checkingLogin && (
        <>
          <Text style={styles.title}>ERECYCLOMATCH</Text>

          <Text style={styles.subtitle}>
            Recycle Smarter. Match Faster
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/individual_signup")}
          >
            <Text style={styles.primaryText}>Get Started →</Text>
          </TouchableOpacity>

          <Text style={styles.or}>OR</Text>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/signin")}
          >
            <Text style={styles.secondaryText}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
