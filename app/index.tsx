import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { supabase } from "../utils/supabase";
import styles from "./styles/index";

//Dashboard routes based on the user's role
const DASHBOARDS: Record<string, string> = {
  user: "/user_dashboard",
  facility: "/facility_dashboard",
};

//Checks if the user's account is still approved
const isStillApproved = async (userId: string): Promise<boolean> => {
  try {
    const result = await Promise.race([
      supabase.from("profiles").select("status").eq("id", userId).maybeSingle(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    //Allow login if the request fails or times out
    if (!result || (result as any).error) return true;

    const status = String((result as any).data?.status || "")
      .trim()
      .toLowerCase();

    //Reject login if no profile is found
    if (!(result as any).data) return false;

    return status === "approved";
  } catch {
    //Avoid blocking login if an unexpected error occurs
    return true;
  }
};

export default function Index() {
  const router = useRouter();
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    let cancelled = false;

    //Checks for a previously saved login
    const resumeSavedLogin = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const user = stored ? JSON.parse(stored) : null;
        const role = String(user?.role || "").toLowerCase();
        const dashboard = DASHBOARDS[role];

        //Redirect approved users to their respective dashboards
        if (user?.id && dashboard) {
          if (await isStillApproved(String(user.id))) {
            if (!cancelled) router.replace(dashboard as any);
            return;
          }

          //Remove saved login if the account is no longer approved
          await AsyncStorage.removeItem("user");
        }
      } catch (error) {
        console.log("RESUME LOGIN ERROR:", error);
      }

      //Show the welcome screen after checking the saved login
      if (!cancelled) setCheckingLogin(false);
    };

    resumeSavedLogin();

    //Prevents state updates after the component is unmounted
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      {/* App logo */}
      <Image
        source={require("../assets/icons/icon.png")}
        style={styles.logo}
      />

      {/* Show welcome screen after login checking is complete */}
      {!checkingLogin && (
        <>
          <Text style={styles.title}>ERECYCLOMATCH</Text>

          <Text style={styles.subtitle}>
            Recycle Smarter. Match Faster
          </Text>

          {/* Navigate to individual registration */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/individual_signup")}
          >
            <Text style={styles.primaryText}>Get Started →</Text>
          </TouchableOpacity>

          <Text style={styles.or}>OR</Text>

          {/* Navigate to the sign-in screen */}
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