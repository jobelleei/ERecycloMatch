import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Toast from "react-native-toast-message";

import {
  API_URL,
} from "../config";

export default function ResetPassword() {
  const router =
    useRouter();

  const {
    email,
  } =
    useLocalSearchParams();

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const resetPassword =
    async () => {
      if (
        !password ||
        !confirmPassword
      ) {
        Toast.show({
          type:
            "error",

          text1:
            "Fill all fields",
        });

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        Toast.show({
          type:
            "error",

          text1:
            "Passwords do not match",
        });

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/reset_password.php`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    email,
                    password,
                  }
                ),
            }
          );

        const text =
          await response.text();

        console.log(
          text
        );

        const data =
          JSON.parse(
            text
          );

        if (
          data.status ===
          "success"
        ) {
          Toast.show({
            type:
              "success",

            text1:
              "Password Reset Successful",
          });

          router.replace(
            "/signin"
          );
        }
      } catch (
        error
      ) {
        console.log(
          error
        );
      }
    };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent:
          "center",
        padding: 20,
        backgroundColor:
          "#DDEFD3",
      }}
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : "height"
      }
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight:
            "bold",
          textAlign:
            "center",
          marginBottom:
            20,
        }}
      >
        Reset Password
      </Text>

      <TextInput
        placeholder="New Password"
        secureTextEntry
        value={
          password
        }
        onChangeText={
          setPassword
        }
        style={{
          backgroundColor:
            "#fff",
          borderRadius:
            12,
          padding: 15,
          borderWidth:
            1,
          borderColor:
            "#ddd",
          marginBottom:
            15,
        }}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={
          confirmPassword
        }
        onChangeText={
          setConfirmPassword
        }
        style={{
          backgroundColor:
            "#fff",
          borderRadius:
            12,
          padding: 15,
          borderWidth:
            1,
          borderColor:
            "#ddd",
        }}
      />

      <Pressable
        onPress={
          resetPassword
        }
        style={{
          backgroundColor:
            "#1B5E20",
          padding: 16,
          borderRadius:
            12,
          marginTop:
            20,
        }}
      >
        <Text
          style={{
            color:
              "#fff",
            textAlign:
              "center",
            fontWeight:
              "bold",
          }}
        >
          Reset Password
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}