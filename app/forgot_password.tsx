import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { supabase } from "../utils/supabase";

export default function ForgotPassword() {
  const router = useRouter();

  //Stores the email, loading state, and resend cooldown
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  //Checks if a previous reset request is still within the cooldown
  useEffect(() => {
    const checkCooldown = async () => {
      try {
        const lastReset = await AsyncStorage.getItem("last_reset_attempt");
        if (!lastReset) return;

        const elapsedSeconds = Math.floor(
          (Date.now() - new Date(lastReset).getTime()) / 1000,
        );

        if (elapsedSeconds < 60) {
          setCooldown(60 - elapsedSeconds);
        }
      } catch (e) {
        console.log("Cooldown error:", e);
      }
    };

    checkCooldown();
  }, []);

  //Updates the countdown every second
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  //Validates the email and sends the password reset code
  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();

    //Checks if the email field is empty
    if (!cleanEmail) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your registered email address.",
      });
      return;
    }

    //Checks if the email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email format.",
      });
      return;
    }

    //Prevents multiple reset requests during the cooldown
    if (cooldown > 0) {
      Toast.show({
        type: "info",
        text1: "Please Wait",
        text2: `You can request another code in ${cooldown}s.`,
      });
      return;
    }

    setLoading(true);

    try {
      //Checks if the email belongs to a registered account
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!profile) {
        Toast.show({
          type: "error",
          text1: "Account Not Found",
          text2: "No registered account found with this email.",
        });
        setLoading(false);
        return;
      }

      //Requests a password reset code through Supabase
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (resetError) {
        Toast.show({
          type: "error",
          text1: "Failed to Send",
          text2: resetError.message || "Failed to send verification code.",
        });
        setLoading(false);
        return;
      }

      //Saves the request time to enforce the 60-second cooldown
      await AsyncStorage.setItem(
        "last_reset_attempt",
        new Date().toISOString(),
      );
      setCooldown(60);

      Toast.show({
        type: "success",
        text1: "OTP Code Sent",
        text2: "Check your email inbox for your 6-digit code.",
      });

      //Opens the reset password screen with the email and OTP mode
      router.push({
        pathname: "/reset_password",
        params: { email: cleanEmail, mode: "otp" },
      } as any);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: error?.message || "Please check your network and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#DDEFD3" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View style={{ position: "absolute", top: 10, left: 20, zIndex: 10 }}>
            <Pressable onPress={() => router.replace("/signin")}>
              <Ionicons name="arrow-back" size={28} color="#1B5E20" />
            </Pressable>
          </View>

          {/* Forgot password illustration */}
          <View
            style={{ alignItems: "center", marginTop: 10, marginBottom: -10 }}
          >
            <Image
              source={require("../assets/images/forgot-person.png")}
              style={{ width: 260, height: 260, resizeMode: "contain" }}
            />
          </View>

          {/* Page title */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
              color: "#1B5E20",
            }}
          >
            Forgot Password?
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
            Enter your registered email address below. We will send you a
            6-digit verification code to reset your password.
          </Text>

          {/* Email input container */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 18,
              marginBottom: 16,
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Text
              style={{
                color: "#666",
                marginBottom: 8,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Registered Email Address
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F4F4F4",
                borderRadius: 14,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="mail-outline" size={20} color="#777" />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, padding: 14, fontSize: 15, color: "#333" }}
              />
            </View>
          </View>

          {/* Send OTP button with cooldown countdown */}
          <Pressable
            onPress={handleSendOtp}
            disabled={loading || cooldown > 0}
            style={{
              backgroundColor: cooldown > 0 ? "#81C784" : "#1B5E20",
              padding: 16,
              borderRadius: 16,
              elevation: 2,
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {cooldown > 0
                  ? `Resend Code in ${cooldown}s`
                  : "Send Verification Code"}
              </Text>
            )}
          </Pressable>

          {/* Redirects back to sign in */}
          <Pressable
            onPress={() => router.replace("/signin")}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text style={{ color: "#666", fontSize: 14, fontWeight: "500" }}>
              Remember your password?{" "}
              <Text style={{ color: "#1B5E20", fontWeight: "bold" }}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}