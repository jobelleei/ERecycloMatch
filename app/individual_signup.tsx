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

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  // 🔥 updated image state
  const [image, setImage] = useState<any>(null);

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // ✅ prevents square crop
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

  const handleSignUp = async () => {
    if (!name || !email || !address || !password || !confirmpass) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please complete all fields",
      });
      return;
    }

    if (password !== confirmpass) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/api/individual-signup`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/signin");
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong",
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
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Back */}
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Logo */}
          <Image
            source={require("../assets/icons/icon.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>
            Sign up and join the platform today.
          </Text>

          {/* Toggle */}
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

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/individual.png")} style={styles.icon} />
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/email.png")} style={styles.icon} />
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/location.png")} style={styles.icon} />
            <TextInput
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />
          </View>

          {/* Upload */}
          <Text style={styles.label}>ID Verification</Text>

          <Pressable
            onPress={openCamera}
            style={[
              styles.uploadBox,
              image && {
                height: (image.height / image.width) * 300, // 🔥 dynamic height
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

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/padlock.png")} style={styles.icon} />
            <TextInput
              placeholder="Create a password"
              secureTextEntry={secure1}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <Pressable onPress={() => setSecure1(!secure1)}>
              <Image source={require("../assets/icons/view.png")} style={styles.eye} />
            </Pressable>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/padlock.png")} style={styles.icon} />
            <TextInput
              placeholder="Confirm your password"
              secureTextEntry={secure2}
              value={confirmpass}
              onChangeText={setConfirmPass}
              style={styles.input}
            />
            <Pressable onPress={() => setSecure2(!secure2)}>
              <Image source={require("../assets/icons/view.png")} style={styles.eye} />
            </Pressable>
          </View>

          {/* Button */}
          <Pressable style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/signin")}>
            <Text style={styles.link}>
              Already have an account? Sign In
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}