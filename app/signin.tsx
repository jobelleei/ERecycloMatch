import { useRouter } from "expo-router";
import { useState } from "react";

import {
  Image,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { API_URL } from "../config";
import signinStyles from "./styles/signin";

export default function Signin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // ✅ SUCCESS LOGIN
      if (data.status === "success") {
        Toast.show({
          type: "success",
          text1: "Welcome Back!",
          text2: "Login successful!",
        });

        // optional: role-based navigation
        if (data.role === "individual") {
          router.replace("/dashboard");
        } else if (data.role === "facility") {
          router.replace("/dashboard");
        }

      } else {
        // ❌ ERROR CASES (pending, rejected, invalid)
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: data.message,
        });
      }

    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Server not reachable.",
      });
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      
      {/* Background */}
      <ImageBackground
        source={require("../assets/images/firstbg.png")}
        style={signinStyles.backgroundImage}
      />

      {/* Overlay */}
      <Image
        source={require("../assets/images/bglayer.png")}
        style={signinStyles.bgLayer}
        resizeMode="cover"
      />

      {/* Back Button */}
      <Pressable
        onPress={() => router.push("/")}
        style={signinStyles.backButton}
      >
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={signinStyles.backButtonIcon}
        />
      </Pressable>

      {/* Logo */}
      <Image
        source={require("../assets/icons/icon.png")}
        style={signinStyles.logo}
      />

      {/* Title */}
      <Text style={signinStyles.welcomeText}>
        Welcome Back!
      </Text>

      <Text style={signinStyles.subtitleText}>
        Sign in to continue recycling.
      </Text>

      {/* Email */}
      <Text style={signinStyles.emailLabel}>
        Email
      </Text>

      <View style={signinStyles.emailInputWrapper}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Email"
          placeholderTextColor="#D3D3D3"
          style={signinStyles.textInput}
        />
      </View>

      {/* Password */}
      <Text style={signinStyles.passwordLabel}>
        Password
      </Text>

      <View style={signinStyles.passwordInputWrapper}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry={true}
          style={signinStyles.textInput}
        />
      </View>

      {/* Sign In */}
      <Pressable
        onPress={handleSignIn}
        style={signinStyles.signInButton}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
          Sign In
        </Text>
      </Pressable>

      {/* Forgot Password */}
      <Pressable>
        <Text style={{ marginTop: 10 }}>
          Forgot Password?
        </Text>
      </Pressable>

    </View>
  );
}