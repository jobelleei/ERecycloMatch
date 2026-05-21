import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const sendOTP = async () => {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email Required",
      });

      return;
    }

    try {
      const response = await fetch(`${API_URL}/forgot_password.php`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const text = await response.text();

      console.log("FORGOT PASSWORD:", text);

      const data = JSON.parse(text);

      if (data.status === "success") {
        Toast.show({
          type: "success",

          text1: "OTP Sent",

          text2: "Check your email",
        });

        router.push({
          pathname: "/verify_otp",

          params: {
            email,
          },
        });
      } else {
        Toast.show({
          type: "error",

          text1: data.message || "Failed to send OTP",
        });
      }
    } catch (error) {
      console.log(error);

      Toast.show({
        type: "error",

        text1: "Server Error",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#DDEFD3",
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Forgot Password
      </Text>

      <Text
        style={{
          textAlign: "center",
          marginBottom: 30,
          color: "#666",
        }}
      >
        Enter your registered email to receive OTP
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter registered email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 15,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      />

      <Pressable
        onPress={sendOTP}
        style={{
          backgroundColor: "#1B5E20",
          padding: 16,
          borderRadius: 12,
          marginTop: 20,
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
          Send OTP
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
