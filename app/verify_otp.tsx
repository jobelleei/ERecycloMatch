import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function VerifyOTP() {
  const router = useRouter();

  const { email } = useLocalSearchParams();

  const [otp, setOtp] = useState("");

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Toast.show({
        type: "error",
        text1: "Enter OTP",
      });

      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify_otp.php`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const text = await response.text();

      console.log("VERIFY OTP:", text);

      const data = JSON.parse(text);

      if (data.status === "success") {
        Toast.show({
          type: "success",

          text1: "OTP Verified",
        });

        router.push({
          pathname: "/reset_password" as any,

          params: {
            email,
          },
        });
      } else {
        Toast.show({
          type: "error",

          text1: data.message || "Invalid OTP",
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
          textAlign: "center",
        }}
      >
        Verify OTP
      </Text>

      <Text
        style={{
          textAlign: "center",
          marginVertical: 20,
          color: "#666",
        }}
      >
        Enter the OTP sent to your email
      </Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
        keyboardType="numeric"
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 15,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      />

      <Pressable
        onPress={verifyOTP}
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
          }}
        >
          Verify OTP
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
