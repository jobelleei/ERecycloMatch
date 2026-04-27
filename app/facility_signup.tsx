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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Camera access is required to take a photo.",
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
        text2: "Please upload your facility certification.",
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
      formData.append("confirmpass", confirmpass);
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
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Could not connect to server.",
      });
    }
  };

  return (
    <View className="flex-1 bg-backg">
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      />

      <View pointerEvents="none" style={styles.bgLayerWrapper}>
        <Image
          source={require("../assets/images/bglayer.png")}
          style={styles.bgLayerImage}
          resizeMode="cover"
        />
      </View>

      {/* Back Button */}
      <Pressable onPress={() => router.push("/")} style={styles.backButton}>
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image
          source={require("../assets/icons/icon.png")}
          style={styles.logo}
        />

        <Text className="text-3xl font-bold" style={styles.title}>
          Sign up and join the platform today!
        </Text>

        {/* 🔥 FIXED TOGGLE */}
        <View style={styles.userTypeToggle}>
          {/* Individual */}
          <Pressable
            onPress={() => {
              setUser("individual");
              router.push("/individual_signup");
            }}
            style={
              user === "individual"
                ? styles.individualTabActive
                : styles.individualTabInactive
            }
          >
            <Image
              source={require("../assets/icons/individual.png")}
              style={
                user === "individual"
                  ? styles.individualTabIconActive
                  : styles.individualTabIconInactive
              }
            />
            <Text
              style={
                user === "individual"
                  ? styles.tabTextActive
                  : styles.tabTextInactive
              }
            >
              Individual
            </Text>
          </Pressable>

          {/* Facility */}
          <Pressable
            onPress={() => setUser("facility")}
            style={
              user === "facility"
                ? styles.facilityTabActive
                : styles.facilityTabInactive
            }
          >
            <Image
              source={require("../assets/icons/facility.png")}
              style={
                user === "facility"
                  ? styles.facilityTabIconActive
                  : styles.facilityTabIconInactive
              }
            />
            <Text
              style={
                user === "facility"
                  ? styles.tabTextActive
                  : styles.tabTextInactive
              }
            >
              Facility/Shop
            </Text>
          </Pressable>
        </View>

        {/* Name */}
        <Text style={styles.firstInputLabel}>Facility Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter Facility Name"
            style={styles.textInputShort}
          />
            <Image source={require("../assets/icons/facility.png")} style={styles.inputIconLeft} />
        </View>

        {/* Location */}
        <Text style={styles.inputLabel}>Location</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your Location"
            style={styles.textInputTall}
          />
          <Image source={require("../assets/icons/location.png")} style={styles.inputIconLeft} />
        </View>

        {/* Email */}
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your Email"
            keyboardType="email-address"
            style={styles.textInputTall}
          />
          <Image source={require("../assets/icons/email.png")} style={styles.inputIconLeft} />
        </View>

        {/* Contact */}
        <Text style={styles.inputLabel}>Contact Number</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={contactNum}
            onChangeText={setContactNum}
            placeholder="Enter your Contact Number"
            keyboardType="phone-pad"
            style={styles.textInputTall}
          />
          <Image source={require("../assets/icons/telephone.png")} style={styles.inputIconLeft} />
        </View>

        {/* Password */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a Password"
            secureTextEntry={!isPasswordVisible}
            style={styles.textInputTallWithRightPadding}
          />
          <Image source={require("../assets/icons/padlock.png")} style={styles.inputIconLeft} />
        </View>

        {/* Confirm Password */}
        <Text style={styles.confirmPasswordLabel}>Confirm Password</Text>
        <View style={styles.confirmPasswordWrapper}>
          <TextInput
            value={confirmpass}
            onChangeText={setConfirmPass}
            placeholder="Confirm your Password"
            secureTextEntry={!isConfirmPasswordVisible}
            style={styles.textInputTallWithRightPadding}
          />
          <Image source={require("../assets/icons/padlock.png")} style={styles.inputIconLeft} />
        </View>

        {/* Upload */}
        <Text style={styles.uploadLabel}>
          Facility Certification
          <Text style={styles.uploadLabelSub}> (Required)</Text>
        </Text>

        <Pressable onPress={openCamera} style={styles.uploadBox}>
          {image ? (
            <>
              <Image source={{ uri: image }} style={styles.uploadedImage} />
              <Text style={styles.uploadedImageLabel}>Tap to retake</Text>
            </>
          ) : (
            <>
              <Image
                source={require("../assets/icons/camera.png")}
                style={styles.uploadIcon}
              />
              <Text style={styles.uploadPlaceholderText}>
                Tap to open camera
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.uploadHelperText}>
          This helps us verify your facility is legitimate and compliant.
        </Text>

        {/* Sign Up */}
        <Pressable onPress={handleSignUp} style={styles.signUpButton}>
          <Text className="text-white font-bold text-lg">Sign Up</Text>
        </Pressable>

        <View style={styles.socialRow} />

        {/* Sign In */}
        <Pressable
          onPress={() => router.push("/signin")}
          style={styles.signInLink}
        >
          <Text style={styles.signInLinkText}>
            Already have an account? Sign in here!
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}