import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const sendResetEmail = async () => {
    if (!email.trim()) {
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
          redirectTo: "exp://192.168.254.144:8081/--/reset_password",
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Buttons */}
          <View
            style={{
              position: "absolute",
              top: 60,
              left: 20,
              right: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color="#1B5E20" />
            </Pressable>

            <Pressable onPress={() => router.replace("/signin")}>
              <Ionicons name="close" size={30} color="#1B5E20" />
            </Pressable>
          </View>

          {/* Image */}
          <View
            style={{
              alignItems: "center",
              marginTop: 10,
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
            A reset link will be sent to your registered email where you can
            securely create a new password.
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
