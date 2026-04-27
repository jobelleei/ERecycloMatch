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

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
      const response = await fetch(`${API_URL}/api/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Welcome Back!",
          text2: "Login successful!",
        });
        router.replace("/dashboard");

      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Something went wrong.",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Could not connect to server.",
      });
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-backg">
      <ImageBackground
        source={require("../assets/images/firstbg.png")}
        style={signinStyles.backgroundImage}
      />

      <Image
        source={require("../assets/images/bglayer.png")}
        style={signinStyles.bgLayer}
        resizeMode="cover"
      />

      {/*Back Button*/}
      <Pressable
        onPress={() => router.push("/")}
        style={signinStyles.backButton}
      >
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={signinStyles.backButtonIcon}
        />
      </Pressable>

      {/*Logo*/}
      <Image
        source={require("../assets/icons/icon.png")}
        style={signinStyles.logo}
      />

      <Text className="text-4xl font-bold" style={signinStyles.welcomeText}>
        Welcome Back!
      </Text>

      <Text className="text-1xl" style={signinStyles.subtitleText}>
        Sign in to continue recycling.
      </Text>

      {/*Email*/}
      <Text className="text-1xl font-bold" style={signinStyles.emailLabel}>
        Email
      </Text>

      {/*Email Input*/}
      <View style={signinStyles.emailInputWrapper}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Email"
          placeholderTextColor="#D3D3D3"
          style={[
            signinStyles.textInput,
            signinStyles.textInputWithLeftPadding,
          ]}
        />
        <Image
          source={require("../assets/icons/email.png")}
          style={signinStyles.inputIconLeft}
        />
      </View>

      {/*Password*/}
      <Text className="text-1xl font-bold" style={signinStyles.passwordLabel}>
        Password
      </Text>

      {/*Password Input*/}
      <View style={signinStyles.passwordInputWrapper}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry={!isPasswordVisible}
          style={[
            signinStyles.textInput,
            signinStyles.textInputWithRightPadding,
          ]}
        />
        <Image
          source={require("../assets/icons/padlock.png")}
          style={signinStyles.inputIconLeft}
        />

        {/*Show/Hide Password*/}
        <Pressable
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={signinStyles.inputIconRight}
        >
          <Image
            source={
              isPasswordVisible
                ? require("../assets/icons/hide.png")
                : require("../assets/icons/view.png")
            }
            style={signinStyles.inputIconRightImage}
          />
        </Pressable>
      </View>

      {/*Forgot Password*/}
      <Pressable
        onPress={() => router.push("/")}
        style={signinStyles.forgotPassword}
      >
        <Text className="text-sm">Forgot Password?</Text>
      </Pressable>

      {/* Sign In Button 
      <Pressable onPress={handleSignIn} style={signinStyles.signInButton}>
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </Pressable> */}

      {/*Sign In Button*/}  
      <Pressable
        onPress={() => router.push("/dashboard")}
        style={signinStyles.signInButton}>
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </Pressable>
      </View>
  );
}