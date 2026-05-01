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

  const [user, setUser] = useState("facility");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [contactNum, setContactNum] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Camera access is required.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri ?? null);
    }
  };

  const handleSignUp = async () => {
    if (!name || !location || !email || !contactNum || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all fields.",
      });
      return;
    }

    if (password !== confirmpass) {
      Toast.show({
        type: "error",
        text1: "Password Error",
        text2: "Passwords do not match.",
      });
      return;
    }

    if (!image) {
      Toast.show({
        type: "error",
        text1: "Missing File",
        text2: "Upload certification.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("location", location);
      formData.append("email", email);
      formData.append("contactNum", contactNum);
      formData.append("password", password);

      formData.append("certification", {
        uri: image,
        name: "certification.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/api/facility-signup`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success!",
          text2: "Facility registered successfully!",
        });
        router.push("/signin");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Something went wrong.",
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
    <View className="flex-1 bg-backg">
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require("../assets/icons/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>
          Sign up and join the platform today!
        </Text>

        {/* FIXED LABEL */}
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.uploadLabel}>
            Facility Certification
          </Text>
          <Text style={styles.uploadLabelSub}>
            {" (Required)"}
          </Text>
        </View>

        <Pressable onPress={openCamera} style={styles.uploadBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <Text style={styles.uploadPlaceholderText}>
              Tap to open camera
            </Text>
          )}
        </Pressable>

        <Pressable onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Sign Up
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}