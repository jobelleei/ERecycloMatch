import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import styles from "./styles/index";
import { supabase } from "../utils/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*");

        console.log("SUPABASE TEST DATA:", data);
        console.log("SUPABASE TEST ERROR:", error);

        if (error) {
          console.log("SUPABASE CONNECTION FAILED:", error.message);
        } else {
          console.log("SUPABASE CONNECTED SUCCESSFULLY");
        }
      } catch (error) {
        console.log("SUPABASE UNKNOWN ERROR:", error);
      }
    };

    testSupabaseConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icons/icon.png")}
        style={styles.logo}
      />

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
          I have already an account
        </Text>
      </TouchableOpacity>
    </View>
  );
}