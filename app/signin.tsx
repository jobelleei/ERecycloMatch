import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { API_URL } from "../config";
import signinStyles from "./styles/signin";

export default function Signin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const handleSignIn = async () => {
    console.log("SIGN IN CLICKED");

    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all fields.",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/signin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      console.log("RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("NOT JSON → wrong API URL or PHP error");
        return;
      }

      console.log("PARSED:", data);

      if (data.status === "success" && data.approved === true) {
        Toast.show({
          type: "success",
          text1: "Welcome Back!",
          text2: "Login successful!",
        });

        await AsyncStorage.setItem("user", JSON.stringify(data));

        if (data.role === "individual") {
          router.replace("/user_dashboard" as any);
        } else if (data.role === "facility") {
          router.replace("/facility_dashboard" as any);
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: data.message || "Invalid credentials",
        });
      }
    } catch (error) {
      console.log("ERROR:", error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Server not reachable.",
      });
    }
  };

 return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={
      Platform.OS === "ios"
        ? "padding"
        : "height"
    }
  >
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={signinStyles.container}>
        <ImageBackground
          source={require("../assets/images/firstbg.png")}
          style={signinStyles.background}
        >
          <View style={signinStyles.overlay} />
        </ImageBackground>

        <Pressable
          onPress={() => router.push("/")}
          style={signinStyles.backButton}
        >
          <Image
            source={require("../assets/icons/backbutton.png")}
            style={signinStyles.backIcon}
          />
        </Pressable>

        <Image
          source={require("../assets/icons/icon.png")}
          style={signinStyles.logo}
        />

        <Text style={signinStyles.title}>
          Welcome Back!
        </Text>

        <Text style={signinStyles.subtitle}>
          Sign in to continue recycling
        </Text>

        <Text style={signinStyles.label}>
          Email
        </Text>

        <View style={signinStyles.inputBox}>
          <Image
            source={require("../assets/icons/email.png")}
            style={signinStyles.inputIcon}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="#888"
            style={signinStyles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={signinStyles.label}>
          Password
        </Text>

        <View style={signinStyles.inputBox}>
          <Image
            source={require("../assets/icons/padlock.png")}
            style={signinStyles.inputIcon}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Password"
            placeholderTextColor="#888"
            secureTextEntry={secure}
            style={[
              signinStyles.input,
              { flex: 1 },
            ]}
          />

          <Pressable
            onPress={() =>
              setSecure(!secure)
            }
          >
            <Image
              source={require("../assets/icons/view.png")}
              style={
                signinStyles.eyeIcon
              }
            />
          </Pressable>
        </View>

        <Pressable>
          <Text
            style={signinStyles.forgot}
          >
            Forgot your Password?
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSignIn}
          style={signinStyles.button}
        >
          <Text
            style={
              signinStyles.buttonText
            }
          >
            Sign In
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);
}