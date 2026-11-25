import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { supabase } from "../utils/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string }>();

  //Setting the current password reset step
  const [mode, setMode] = useState<"otp" | "new_password">(
    params.mode === "new_password" ? "new_password" : "otp",
  );

  //Store the user's email and OTP code
  const [emailInput, setEmailInput] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  //Store the new password and visibility settings
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  //Verify the OTP code entered by the user
  const handleVerifyOtp = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanToken = otpCode.trim();

    //Check if the email is empty
    if (!cleanEmail) {
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter your registered email address.",
      });
      return;
    }

    //Check if the OTP code is valid
    if (!cleanToken || cleanToken.length < 6) {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "Please enter the verification code sent to your email.",
      });
      return;
    }

    setVerifyingOtp(true);
    try { //Verify the recovery code using Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "recovery",
      });

      if (error) { //Display an error if verification fails
        Toast.show({
          type: "error",
          text1: "Verification Failed",
          text2: error.message || "Invalid or expired OTP code.",
        });
        return;
      }

      console.log("OTP verified for user ID:", data?.user?.id);

      //Proceed to the new password screen
      Toast.show({
        type: "success",
        text1: "Code Verified",
        text2: "Please create your new password.",
      });

      setMode("new_password");
    } catch (err: any) { //Handle unexpected verification errors
      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: err?.message || "Unable to verify code.",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

   //Update the user's password
  const handleUpdatePassword = async () => {
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();
    const targetEmail = (
      emailInput || (typeof params.email === "string" ? params.email : "")
    )
      .trim()
      .toLowerCase();

    if (!cleanPassword) { //Check if the new password is empty
      Toast.show({
        type: "error",
        text1: "Password Required",
        text2: "Please enter your new password.",
      });
      return;
    }

    //Require at least 6 characters
    if (cleanPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password Too Short",
        text2: "Password must be at least 6 characters.",
      });
      return;
    }

    //Check if both passwords match
    if (cleanPassword !== cleanConfirm) {
      Toast.show({
        type: "error",
        text1: "Passwords Do Not Match",
        text2: "Please verify that both passwords match.",
      });
      return;
    }

    setUpdating(true);

    try { //Save the new password to Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          password: cleanPassword,
        });

      if (authError) { //Stop if the password update fails
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: authError.message,
        });
        return;
      }

      if (targetEmail) { //Clear the old password field in the profile table
        const { data: updatedRows, error: dbError } = await supabase
          .from("profiles")
          .update({ password: null })
          .eq("email", targetEmail)
          .select();

        if (dbError) { //Handle database update errors
          console.error("Profiles update error:", dbError);
          Toast.show({
            type: "error",
            text1: "Database Error",
            text2: "Failed to update profile password: " + dbError.message,
          });
          return;
        }

        console.log("Profile rows updated:", updatedRows);
      }

      await supabase.auth.signOut(); //Sign out after successfully changing the password

      Toast.show({
        type: "success",
        text1: "Password Updated!",
        text2: "Your password has been changed. Please sign in.",
      });

      setTimeout(() => { //Return to the sign-in screen
        router.replace("/signin");
      }, 1400);
    } catch (err: any) {
      Toast.show({ //Handle unexpected password update errors
        type: "error",
        text1: "Error",
        text2: err?.message || "Failed to update password.",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#DDEFD3" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ position: "absolute", top: 10, left: 20, zIndex: 10 }}>
            <Pressable onPress={() => router.replace("/signin")}>
              <Ionicons name="arrow-back" size={28} color="#1B5E20" />
            </Pressable>
          </View>

           {/* Header image */}
          <View 
            style={{ alignItems: "center", marginTop: 10, marginBottom: -10 }}
          >
            <Image
              source={require("../assets/images/forgot-person.png")}
              style={{ width: 240, height: 240, resizeMode: "contain" }}
            />
          </View>

          {/* OTP verification screen */}
          {mode === "otp" && (
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#1B5E20",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Enter OTP Code
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  color: "#555",
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 20,
                  paddingHorizontal: 15,
                }}
              >
                Enter the verification code sent to your email.
              </Text>

              {/* Email and OTP input fields */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 20,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: "#666",
                    marginBottom: 8,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Registered Email
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F4F4F4",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color="#777" />
                  <TextInput
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      padding: 14,
                      fontSize: 15,
                      color: "#333",
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: "#666",
                    marginBottom: 8,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Verification Code
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F4F4F4",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#777"
                  />
                  <TextInput
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="Enter Code"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={8}
                    style={{
                      flex: 1,
                      padding: 14,
                      fontSize: 18,
                      fontWeight: "bold",
                      letterSpacing: 4,
                      color: "#1B5E20",
                    }}
                  />
                </View>
              </View>

              {/* Verify OTP button */}
              <Pressable
                onPress={handleVerifyOtp}
                disabled={verifyingOtp}
                style={{
                  backgroundColor: "#1B5E20",
                  padding: 16,
                  borderRadius: 16,
                  elevation: 2,
                  marginBottom: 15,
                }}
              >
                {verifyingOtp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Verify Code
                  </Text>
                )}
              </Pressable>

              {/* Request a new OTP code */}
              <Pressable
                onPress={() => router.replace("/forgot_password")}
                style={{ alignItems: "center", paddingVertical: 8 }}
              >
                <Text
                  style={{
                    color: "#2E7D32",
                    fontSize: 14,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  Didn't receive a code? Request new code
                </Text>
              </Pressable>
            </View>
          )}

          {/* New password screen */}
          {mode === "new_password" && (
            <View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#1B5E20",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Create New Password
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  color: "#555",
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 20,
                  paddingHorizontal: 15,
                }}
              >
                Choose a secure password of at least 6 characters.
              </Text>

              {/* New password input fields */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 20,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: "#666",
                    marginBottom: 8,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  New Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F4F4F4",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#777" />
                  <TextInput
                    placeholder="At least 6 characters"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      padding: 14,
                      fontSize: 15,
                      color: "#333",
                    }}
                  />

                  {/* Toggle password visibility */}
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#777"
                    />
                  </Pressable>
                </View>

                <Text
                  style={{
                    color: "#666",
                    marginBottom: 8,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Confirm New Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F4F4F4",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#777" />
                  <TextInput
                    placeholder="Repeat new password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      padding: 14,
                      fontSize: 15,
                      color: "#333",
                    }}
                  />

                  {/* Toggle confirm password visibility */}
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#777"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Update password button */}
              <Pressable
                onPress={handleUpdatePassword}
                disabled={updating}
                style={{
                  backgroundColor: "#1B5E20",
                  padding: 16,
                  borderRadius: 16,
                  elevation: 2,
                  marginBottom: 15,
                }}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
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
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
