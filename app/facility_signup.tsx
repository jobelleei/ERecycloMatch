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

  const [secure, setSecure] = useState(true);

  // 🔥 store full image object
  const [image, setImage] = useState<any>(null);

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // ✅ IMPORTANT
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
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("location", location);
      formData.append("email", email);
      formData.append("contactNum", contactNum);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/api/facility-signup`, {
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            placeholder="Enter your name"
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
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
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
            placeholder="Enter contact number"
            value={contactNum}
            onChangeText={setContactNum}
            style={styles.input}
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/padlock.png")}
            style={styles.icon}
          />
          <TextInput
            placeholder="Create a password"
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Pressable onPress={() => setSecure(!secure)}>
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

        <Text style={styles.helper}>
          This help us verify your facility is legitimate and compliant
        </Text>

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
    </View>
  );
}