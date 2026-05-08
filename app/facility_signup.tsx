import * as ImagePicker from "expo-image-picker";
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
import Toast from "react-native-toast-message";
import { API_URL } from "../config";
import styles from "./styles/facility_signup";

export default function FacilitySignup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [contactNum, setContactNum] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  const [image, setImage] = useState<any>(null);

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

  const handleSignUp = async () => {
    // 1. Check all fields filled
    if (
      !name ||
      !location ||
      !email ||
      !contactNum ||
      !password ||
      !confirmPass ||
      !image
    ) {
      Toast.show({
        type: "error",
        text1: "Please complete all fields",
      });
      return;
    }

    // 2. ✅ Gmail only check
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    if (!isValidEmail) {
      Toast.show({
        type: "error",
        text1: "Only Gmail addresses are accepted",
        text2: "Please use a @gmail.com email address",
      });
      return;
    }

    // 3. ✅ PH phone number check (must start with 09, exactly 11 digits)
    const isValidPhone = /^09\d{9}$/.test(contactNum);
    if (!isValidPhone) {
      Toast.show({
        type: "error",
        text1: "Invalid contact number",
        text2: "Must start with 09 and be 11 digits (e.g. 09123456789)",
      });
      return;
    }

    // 4. Check passwords match
    if (password !== confirmPass) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
      });
      return;
    }

    // 5. ✅ Password policy check
    const passwordRules = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*]/.test(password),
      !/\s/.test(password),
      password.length <= 64,
    ];
    if (!passwordRules.every(Boolean)) {
      Toast.show({
        type: "error",
        text1: "Password does not meet requirements",
      });
      return;
    }

    // 6. Everything passed — proceed with signup
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("location", location);
      formData.append("email", email);
      formData.append("contactNum", contactNum);
      formData.append("password", password);

      formData.append("certification", {
        uri: image.uri,
        name: "upload.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/facility_signup.php`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();

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
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Back */}
      <Pressable onPress={() => router.push("/")} style={styles.backButton}>
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image
          source={require("../assets/icons/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Sign up and join the platform today.</Text>

        {/* TOGGLE */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={styles.inactiveTab}
            onPress={() => router.push("/individual_signup")}
          >
            <Text style={styles.inactiveText}>Individual</Text>
          </Pressable>

          <Pressable style={styles.activeTab}>
            <Text style={styles.activeText}>Facility/Shop</Text>
          </Pressable>
        </View>

        {/* Facility Name */}
        <Text style={styles.label}>Facility Name</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/individual.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="Enter facility name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/location.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="Enter your location"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/email.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="Enter your Gmail address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Contact */}
        <Text style={styles.label}>Contact Number</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/telephone.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="09XXXXXXXXX"
            value={contactNum}
            onChangeText={(text) => {
              // ✅ Only allow digits, max 11 characters
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 11);
              setContactNum(cleaned);
            }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={11}
          />
        </View>

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/padlock.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="Create a password"
            secureTextEntry={secure1}
            value={password}
            onChangeText={setPassword}
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
            placeholder="Confirm your password"
            secureTextEntry={secure2}
            value={confirmPass}
            onChangeText={setConfirmPass}
            style={styles.input}
          />
          <Pressable onPress={() => setSecure2(!secure2)}>
            <Image
              source={require("../assets/icons/view.png")}
              style={styles.eye}
            />
          </Pressable>
        </View>

        {/* Upload */}
        <Text style={styles.label}>
          Facility Certification{" "}
          <Text style={{ color: "#2E7D32" }}>(Required)</Text>
        </Text>

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
            <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
          ) : (
            <Text>Tap to Open Camera</Text>
          )}
        </Pressable>

        <Text style={styles.helper}>
          This helps us verify your facility is legitimate and compliant
        </Text>

        {/* Button */}
        <Pressable style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/signin")}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
