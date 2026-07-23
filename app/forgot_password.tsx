import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { supabase } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const checkResetLimit = async () => {
    try {
      const lastReset = await AsyncStorage.getItem("last_reset_attempt");

      if (!lastReset) return true;

      const lastDate = new Date(lastReset);
      const today = new Date();

      const isSameDay =
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear();

      return !isSameDay;
    } catch {
      return true;
    }
  };

  const sendResetEmail = async () => {
    const canReset = await checkResetLimit();

    if (!canReset) {
      Toast.show({
        type: "info",
        text1: "Reset Limit Reached",
        text2: "Only 1 password reset attempt is allowed per day.",
      });
      if (!email.trim()) {
        return;
      }
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your registered email",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "erecyclomatch://reset_password",
        },
      );
      if (error) {
        setLoading(false);

        Toast.show({
          type: "error",
          text1: "Failed",
          text2: error.message,
        });

        return;
      }

      await AsyncStorage.setItem(
        "last_reset_attempt",
        new Date().toISOString(),
      );

      Toast.show({
        type: "success",
        text1: "Reset Link Sent",
        text2: "Check your registered email",
      });

      setTimeout(() => {
        setLoading(false);
        router.replace("/signin");
      }, 2500);
    } catch (error) {
      console.log(error);

      setLoading(false);

      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: "Please try again",
      });
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#DDEFD3",
      }}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
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
          {/* Close Button */}
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 20,
              zIndex: 10,
            }}
          >
            <Pressable onPress={() => router.replace("/signin")}>
              <Ionicons name="close" size={38} color="#1B5E20" />
            </Pressable>
          </View>

          {/* Image */}
          <View
            style={{
              alignItems: "center",
              marginTop: -30,
              marginBottom: -10,
            }}
          >
            <Image
              source={require("../assets/images/forgot-person.png")}
              style={{
                width: 320,
                height: 320,
                resizeMode: "contain",
              }}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              textAlign: "center",
              marginTop: -10,
              marginBottom: 10,
            }}
          >
            Forgot Password?
          </Text>

          {/* Description */}
          <Text
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 25,
              paddingHorizontal: 20,
            }}
          >
            A password reset link will be sent to your registered email. Open
            the email to reset your password securely.
          </Text>

          {/* Email Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 18,
              marginBottom: 25,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: "#777",
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              Enter your registered email below
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="sample.email@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "#F4F4F4",
                borderRadius: 14,
                padding: 15,
                fontSize: 15,
              }}
            />
          </View>

          {/* Button */}
          <Pressable
            onPress={sendResetEmail}
            disabled={loading}
            style={{
              backgroundColor: "#1B5E20",
              padding: 18,
              borderRadius: 18,
              opacity: loading ? 0.8 : 1,
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
                Send Reset Link
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
