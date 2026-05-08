import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
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

  //  Email rules — always visible
  const emailRules = [
    {
      label: "Must be a @gmail.com address",
      met: /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email),
    },
    {
      label: "No spaces allowed",
      met: email.length > 0 && !/\s/.test(email),
    },
  ];

  //  Password rules — always visible
  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "No spaces allowed", met: password.length > 0 && !/\s/.test(password) },
  ];

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

    if (!emailRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use a valid @gmail.com address",
      });
      return;
    }

    if (!passwordRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Password",
        text2: "Password must be at least 8 characters with no spaces",
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

  //  Reusable bullet rule row
  const RuleItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 }}>
      <View style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: met ? "#3B6D11" : "transparent",
        borderWidth: 1.5,
        borderColor: met ? "#3B6D11" : "#aaa",
      }} />
      <Text style={{
        fontSize: 12,
        color: met ? "#27500A" : "#888",
        fontWeight: met ? "600" : "400",
      }}>
        {label}
      </Text>
    </View>
  );

  //  Reusable rules box
  const RulesBox = ({ rules }: { rules: { label: string; met: boolean }[] }) => (
    <View style={{
      width: "85%",
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 10,
      marginTop: -6,
      marginBottom: 12,
      borderWidth: 0.5,
      borderColor: "#c8e6c9",
      alignSelf: "center",
    }}>
      {rules.map((rule, i) => (
        <RuleItem key={i} label={rule.label} met={rule.met} />
      ))}
    </View>
  );

  return (
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

      <Text style={signinStyles.title}>Welcome Back!</Text>
      <Text style={signinStyles.subtitle}>Sign in to continue recycling</Text>

      {/* EMAIL */}
      <Text style={signinStyles.label}>Email</Text>
      <View style={signinStyles.inputBox}>
        <Image
          source={require("../assets/icons/email.png")}
          style={signinStyles.inputIcon}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your Gmail address"
          placeholderTextColor="#888"
          style={signinStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/*  Email rules — always visible */}
      <RulesBox rules={emailRules} />

      {/* PASSWORD */}
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
        <Pressable onPress={() => setSecure(!secure)}>
          <Image
            source={require("../assets/icons/view.png")}
            style={signinStyles.eyeIcon}
          />
        </Pressable>
      </View>

      {/*  Password rules — always visible */}
      <RulesBox rules={passwordRules} />

      <Pressable>
        <Text style={signinStyles.forgot}>Forgot your Password?</Text>
      </Pressable>

      <Pressable onPress={handleSignIn} style={signinStyles.button}>
        <Text style={signinStyles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}