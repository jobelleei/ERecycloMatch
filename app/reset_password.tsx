import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { supabase } from "../utils/supabase";

export default function ResetPassword() {
  const router = useRouter();

  useEffect(() => {
    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("Recovery session:", session);

      if (!session) {
        Toast.show({
          type: "error",
          text1: "Invalid Reset Link",
          text2: "Please request a new reset link.",
        });

        setTimeout(() => {
          router.replace("/forgot_password");
        }, 2000);
      }
    };

    checkRecoverySession();
  }, []);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (!password.trim()) {
      Toast.show({
        type: "error",
        text1: "Password Required",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password.trim(),
    });

    setLoading(false);

    if (error) {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: error.message,
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Password Updated",
      text2: "You can now sign in",
    });

    setTimeout(() => {
      router.replace("/signin");
    }, 2000);
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
          fontSize: 30,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Reset Password
      </Text>

      <Text
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: 30,
        }}
      >
        Create your new password
      </Text>

      <TextInput
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          marginBottom: 15,
        }}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          marginBottom: 20,
        }}
      />

      <Pressable
        onPress={updatePassword}
        disabled={loading}
        style={{
          backgroundColor: "#1B5E20",
          padding: 18,
          borderRadius: 14,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Update Password
          </Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}
