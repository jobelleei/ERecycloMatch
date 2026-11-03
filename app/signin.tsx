import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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
import Toast from "react-native-toast-message";
import signinStyles from "./styles/signin";
import { EMAIL_VERIFIED_URL } from "../config";
import { supabase } from "../utils/supabase";
import { savePushTokenForProfile } from "../services/notifications";

export default function Signin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    console.log("SIGN IN CLICKED");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all fields.",
      });
      return;
    }

    try {
      setIsSigningIn(true);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          username,
          email,
          role,
          address,
          location,
          contact_num,
          profile_image,
          status,
          reject_reason,
          approval_source,
          approved_at,
          username_changed_at
        `,
        )
        .eq("email", cleanEmail)
        .maybeSingle();

      console.log("SUPABASE SIGNIN ERROR:", error);

      if (error) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: error.message,
        });
        return;
      }

      if (!profile) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Account not found.",
        });
        return;
      }

      const databaseStatus = String(profile.status || "")
        .trim()
        .toLowerCase();
      const databaseRole = String(profile.role || "")
        .trim()
        .toLowerCase();

      console.log("NORMALIZED STATUS:", databaseStatus);
      console.log("NORMALIZED ROLE:", databaseRole);

      /* CHECK PASSWORD WITH SUPABASE AUTH */
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError?.code === "email_not_confirmed") {
        // Send a fresh link; the old one may have expired
        await supabase.auth.resend({
          type: "signup",
          email: cleanEmail,
          options: { emailRedirectTo: EMAIL_VERIFIED_URL },
        });

        Toast.show({
          type: "info",
          text1: "Verify your email",
          text2: "We sent a new verification link to your email.",
        });

        router.replace({
          pathname: "/verify_email",
          params: {
            email: cleanEmail,
            role: databaseRole,
            approved: databaseStatus === "approved" ? "1" : "0",
          },
        } as any);
        return;
      }

      if (authError) {
        // Accounts created before Supabase Auth was used only have the
        // password in profiles. Remove this once they are all migrated.
        const { data: legacy } = await supabase
          .from("profiles")
          .select("password")
          .eq("id", profile.id)
          .maybeSingle();

        const legacyPassword = String(legacy?.password || "").trim();

        if (!legacyPassword || legacyPassword !== cleanPassword) {
          Toast.show({
            type: "error",
            text1: "Login Failed",
            text2: "Incorrect password.",
          });
          return;
        }
      }

      if (databaseStatus === "pending") {
        Toast.show({
          type: "error",
          text1: "Account Pending",
          text2: "Please wait for admin approval before signing in.",
        });
        return;
      }

      if (databaseStatus === "rejected") {
        Toast.show({
          type: "error",
          text1: "Account Rejected",
          text2:
            profile.reject_reason ||
            "Your account registration was rejected by the admin.",
        });
        return;
      }

      if (databaseStatus === "deleted") {
        Toast.show({
          type: "error",
          text1: "Account Deleted",
          text2: "This account has already been deleted.",
        });
        return;
      }

      if (databaseStatus !== "approved") {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Your account is not approved yet.",
        });
        return;
      }

      const userData = {
        id: String(profile.id || ""),
        name: profile.name || "",
        username: profile.username || "",
        email: profile.email || cleanEmail,
        address: profile.address || "",
        location: profile.location || "",
        contact_num: profile.contact_num || "",
        profile_image: profile.profile_image || "",
        profileImage: profile.profile_image || "",
        username_changed_at: profile.username_changed_at || "",
        usernameChangedAt: profile.username_changed_at || "",
        role: databaseRole,
        status: databaseStatus,
      };

      console.log("SAVED USER DATA:", userData);

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Not awaited: the notification permission prompt must not hold up sign-in
      savePushTokenForProfile(profile.id);

      Toast.show({
        type: "success",
        text1: "Welcome Back!",
        text2: "Login successful!",
      });

      if (databaseRole === "user") {
        router.replace("/user_dashboard" as any);
        return;
      }

      if (databaseRole === "facility") {
        router.replace("/facility_dashboard" as any);
        return;
      }

      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Unknown account role.",
      });
    } catch (error: any) {
      console.log("SUPABASE SIGNIN ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: error?.message || "Unable to connect to Supabase.",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          imageStyle={{
            opacity: 0.5,
          }}
        >
          <View style={signinStyles.overlay} />
        </ImageBackground>

          <Pressable
            onPress={() => router.push("/" as any)}
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

          <Text style={signinStyles.subtitle}>
            Sign in to continue recycling
          </Text>

          <Text style={signinStyles.label}>Email</Text>

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
              style={[signinStyles.input, { flex: 1 }]}
            />

            <Pressable onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/forgot_password" as any)}
            style={{
              alignSelf: "flex-start",
              marginLeft: 35,
              marginTop: 2,
            }}
          >
           <Text style={signinStyles.forgot}>Forgot your Password?</Text> 
          </Pressable> 

          <Pressable
            onPress={handleSignIn}
            style={[
              signinStyles.button,
              {
                opacity: isSigningIn ? 0.6 : 1,
              },
            ]}
            disabled={isSigningIn}
          >
            <Text style={signinStyles.buttonText}>
              {isSigningIn ? "Signing In..." : "Sign In"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
