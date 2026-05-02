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
  const [secure, setSecure] = useState(true);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "success") {
        Toast.show({
          type: "success",
          text1: "Welcome Back!",
          text2: "Login successful!",
        });

        router.replace("/dashboard");
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: data.message,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Server not reachable.",
      });
    }
  };

  return (
    <View style={signinStyles.container}>
      {/* Background */}
      <ImageBackground
        source={require("../assets/images/firstbg.png")}
        style={signinStyles.background}
      >
        <View style={signinStyles.overlay} />
      </ImageBackground>

      {/* Back Button */}
      <Pressable
        onPress={() => router.push("/")}
        style={signinStyles.backButton}
      >
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={signinStyles.backIcon}
        />
      </Pressable>

      {/* Logo */}
      <Image
        source={require("../assets/icons/icon.png")}
        style={signinStyles.logo}
      />

      {/* Texts */}
      <Text style={signinStyles.title}>Welcome Back!</Text>
      <Text style={signinStyles.subtitle}>
        Sign in to continue recycling
      </Text>

      {/* Email */}
      <Text style={signinStyles.label}>Email</Text>
      <View style={signinStyles.inputBox}>
        <Image
          source={require("../assets/icons/email.png")}
          style={signinStyles.inputIcon}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Email"
          placeholderTextColor="#888"
          style={signinStyles.input}
        />
      </View>

      {/* Password */}
      <Text style={signinStyles.label}>Password</Text>
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
          style={signinStyles.input}
        />

        <Pressable
          onPress={() => setSecure(!secure)}
          style={{ padding: 5 }}
        >
          <Image
            source={require("../assets/icons/view.png")}
            style={signinStyles.eyeIcon}
          />
        </Pressable>
      </View>

      {/* Forgot */}
      <Pressable>
        <Text style={signinStyles.forgot}>Forgot your Password?</Text>
      </Pressable>

      {/* Button */}
      <Pressable onPress={handleSignIn} style={signinStyles.button}>
        <Text style={signinStyles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}