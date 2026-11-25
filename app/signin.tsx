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

  //Storing the user's login details and screen states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  //Handling user sign-in
  const handleSignIn = async () => {
    console.log("SIGN IN CLICKED");

    //Removing extra spaces and convert the email to lowercase
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    //Checking if all required fields are filled in
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

      //Getting user's profile details from the database
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

      //Checking if there was an error retrieving the profile
      if (error) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: error.message,
        });
        return;
      }

      //Checkingif the email is registered
      if (!profile) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Account not found.",
        });
        return;
      }

      //Standardize the account status and role for checking
      const databaseStatus = String(profile.status || "")
        .trim()
        .toLowerCase();
      const databaseRole = String(profile.role || "")
        .trim()
        .toLowerCase();

      console.log("NORMALIZED STATUS:", databaseStatus);
      console.log("NORMALIZED ROLE:", databaseRole);

      //Verify the user's email and password through Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      //If the email is not verified, send another verification link
      if (authError?.code === "email_not_confirmed") {
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

      //Stop the login if Supabase Auth rejects the password
      if (authError) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2:
            authError.code === "invalid_credentials"
              ? "Incorrect password."
              : authError.message,
        });
        return;
      }

      //Checking if the account is still waiting for admin approval
      if (databaseStatus === "pending") {
        Toast.show({
          type: "error",
          text1: "Account Pending",
          text2: "Please wait for admin approval before signing in.",
        });
        return;
      }

      //Check if the account was rejected by the admin
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

      //Prevent deleted accounts from signing in
      if (databaseStatus === "deleted") {
        Toast.show({
          type: "error",
          text1: "Account Deleted",
          text2: "This account has already been deleted.",
        });
        return;
      }

      //Only approved accounts can continue to the dashboard
      if (databaseStatus !== "approved") {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Your account is not approved yet.",
        });
        return;
      }

      //Preparing the user's information for local storage
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

      //Saving user's information for use in other screens
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      //Saving the device's push notification token
      savePushTokenForProfile(profile.id);

      //Show a confirmation message after successful login
      Toast.show({
        type: "success",
        text1: "Welcome Back!",
        text2: "Login successful!",
      });

       //Navigate to the dashboard based on the user's role
      if (databaseRole === "user") {
        router.replace("/user_dashboard" as any);
        return;
      }

      if (databaseRole === "facility") {
        router.replace("/facility_dashboard" as any);
        return;
      }

      //Show an error if the account has an unsupported role
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Unknown account role.",
      });
    } catch (error: any) {
      console.log("SUPABASE SIGNIN ERROR:", error);

      //Show a message if the connection or login process fails
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
