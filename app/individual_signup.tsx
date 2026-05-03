import * as ImagePicker from "expo-image-picker";
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
import { API_URL } from "../config";
import styles from "./styles/individual_signup";

export default function IndividualSignup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [image, setImage] = useState<any>(null);

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  // 📸 Open Camera
  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    }
  };

  // 🔥 SIGNUP FUNCTION
  const handleSignUp = async () => {
    console.log("SIGNUP CLICKED");

    if (!name || !email || !address || !password || !confirmpass || !image) {
      Toast.show({
        type: "error",
        text1: "Please complete all fields",
      });
      return;
    }

    if (password !== confirmpass) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
      });
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("password", password);

      formData.append("id_image", {
        uri: image.uri,
        name: "upload.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/individual_signup.php`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();
      console.log("SERVER RESPONSE:", data);

      if (data.message === "Submitted for approval") {
        Toast.show({
          type: "success",
          text1: "Submitted for approval",
        });

        router.push("/signin");
      } else {
        Toast.show({
          type: "error",
          text1: data.message || "Signup failed",
        });
      }
    } catch (error) {
      console.log("FETCH ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Network error",
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background */}
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} pointerEvents="none" />
      </ImageBackground>

      {/* Back Button */}
      <Pressable onPress={() => router.push("/")} style={styles.backButton}>
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Image
            source={require("../assets/icons/icon.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>
            Sign up and join the platform today.
          </Text>

          {/* 🔥 TOGGLE ADDED */}
          <View style={styles.toggleContainer}>
            <Pressable style={styles.activeTab}>
              <Text style={styles.activeText}>Individual</Text>
            </Pressable>

            <Pressable
              style={styles.inactiveTab}
              onPress={() => router.push("/facility_signup")}
            >
              <Text style={styles.inactiveText}>Facility/Shop</Text>
            </Pressable>
          </View>

          {/* NAME */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/individual.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/email.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          {/* ADDRESS */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/location.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />
          </View>

          {/* IMAGE */}
          <Text style={styles.label}>ID Verification</Text>
          <Pressable
            onPress={openCamera}
            style={[
              styles.uploadBox,
              image && {
                height: (image.height / image.width) * 300,
              },
            ]}
          >
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={styles.uploadedImage}
              />
            ) : (
              <Text>Tap to Open Camera</Text>
            )}
          </Pressable>

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/padlock.png")}
              style={styles.icon}
            />
            <TextInput
              secureTextEntry={secure1}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              style={styles.input}
            />
            <Pressable onPress={() => setSecure1(!secure1)}>
              <Image
                source={require("../assets/icons/view.png")}
                style={styles.eye}
              />
            </Pressable>
          </View>

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/padlock.png")}
              style={styles.icon}
            />
            <TextInput
              secureTextEntry={secure2}
              value={confirmpass}
              onChangeText={setConfirmPass}
              placeholder="Confirm your password"
              style={styles.input}
            />
            <Pressable onPress={() => setSecure2(!secure2)}>
              <Image
                source={require("../assets/icons/view.png")}
                style={styles.eye}
              />
            </Pressable>
          </View>

          {/* BUTTON */}
          <Pressable
            style={[styles.button, { zIndex: 10 }]}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}