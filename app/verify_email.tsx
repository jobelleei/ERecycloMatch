import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { EMAIL_VERIFIED_URL } from "../config";
import { supabase } from "../utils/supabase";

// Supabase only allows a new confirmation email about once a minute
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    role?: string;
    approved?: string;
  }>();

  const email = typeof params.email === "string" ? params.email : "";
  const isFacility = params.role === "facility";
  const isApproved = params.approved === "1";

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const nextStepMessage = isApproved
    ? "Once verified, your account is ready and you can sign in."
    : isFacility
      ? "Once verified, please wait for admin approval of your certification before signing in."
      : // User accounts are approved automatically when the email is verified
        "Once verified, your account is approved automatically and you can sign in.";

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: EMAIL_VERIFIED_URL },
      });

      if (error) {
        Toast.show({
          type: "error",
          text1: "Could not resend link",
          text2: error.message,
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Link sent",
        text2: "Check your inbox (and spam folder) for the new link.",
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not resend link",
        text2: error?.message || "Please try again.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#DDEFD3" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              elevation: 2,
            }}
          >
            <Ionicons name="mail-open-outline" size={56} color="#1B5E20" />
          </View>
        </View>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#1B5E20",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Check Your Email
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "#555",
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 20,
            paddingHorizontal: 15,
          }}
        >
          We sent a verification link to{"\n"}
          <Text style={{ fontWeight: "bold", color: "#1B5E20" }}>{email}</Text>
        </Text>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 18,
            marginBottom: 20,
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <Text style={{ color: "#444", fontSize: 14, lineHeight: 21 }}>
            Open the email and tap the{" "}
            <Text style={{ fontWeight: "bold" }}>Verify Email</Text> button.
            {"\n\n"}
            {nextStepMessage}
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace("/signin")}
          style={{
            backgroundColor: "#1B5E20",
            padding: 16,
            borderRadius: 16,
            elevation: 2,
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Go to Sign In
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text
            style={{
              color: cooldown > 0 ? "#888" : "#2E7D32",
              fontSize: 14,
              fontWeight: "600",
              textDecorationLine: cooldown > 0 ? "none" : "underline",
            }}
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Didn’t receive the email? Resend in ${cooldown}s`
                : "Didn’t receive the email? Resend link"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
