import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
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

export default function individual_signup() {
  const router = useRouter();
  const [user, setUser] = useState("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri ?? null);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !address || !password) {
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

    try {
      const response = await fetch(`${API_URL}/api/individual-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ name, email, address, password, confirmpass }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success!",
          text2: "Account created successfully!",
        });
        router.push("/signin");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Something went wrong.",
        });
      }
    } catch (err) {
      console.log("Error:", err);
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

      <Pressable onPress={() => router.push("/")} style={styles.backButton}>
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/*Logo*/}
          <Image
            source={require("../assets/icons/icon.png")}
            style={styles.logo}
          />

          <Text className="text-3xl font-bold" style={styles.title}>
            Sign up and join the platform today!
          </Text>

          <View style={styles.userTypeToggle}>
            {/*Individual button*/}
            <Pressable
              onPress={() => setUser("individual")}
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

            {/*Facility button*/}
            <Pressable
              onPress={() => {
                setUser("facility");
                router.push("/facility_signup");
              }}
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

          {/*Name input*/}
          <Text className="text-1xl font-bold" style={styles.firstInputLabel}>
            Name
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your Name"
              placeholderTextColor="#999"
              style={styles.textInputShort}
            />
            <Image
              source={require("../assets/icons/individual.png")}
              style={styles.inputIconLeft}
            />
          </View>

          {/*Email input*/}
          <Text className="text-1xl font-bold" style={styles.inputLabel}>
            Email
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInputTall}
            />
            <Image
              source={require("../assets/icons/email.png")}
              style={styles.inputIconLeft}
            />
          </View>

          {/*Address input*/}
          <Text className="text-1xl font-bold" style={styles.inputLabel}>
            Address
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your Address"
              placeholderTextColor="#999"
              style={styles.textInputTall}
            />
            <Image
              source={require("../assets/icons/location.png")}
              style={styles.inputIconLeft}
            />
          </View>

          {/*ID open camera*/}
          <Text className="text-1xl font-bold" style={styles.uploadLabel}>
            {"ID Verification"}
            <Text style={styles.uploadLabelSub}> (Required)</Text>
          </Text>

          <Pressable onPress={openCamera} style={styles.uploadBox}>
            {image ? (
              <>
                <Image
                  source={{ uri: image }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
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

          {/*Password input*/}
          <Text className="text-1xl font-bold" style={styles.inputLabel}>
            Password
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a Password"
              placeholderTextColor="#999"
              secureTextEntry={!isPasswordVisible}
              style={styles.textInputTallWithRightPadding}
            />
            <Image
              source={require("../assets/icons/padlock.png")}
              style={styles.inputIconLeft}
            />
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.passwordToggle}
            >
              <Image
                source={
                  isPasswordVisible
                    ? require("../assets/icons/view.png")
                    : require("../assets/icons/hide.png")
                }
                style={styles.passwordToggleIcon}
              />
            </Pressable>
          </View>

          {/*Confirm password input*/}
          <Text className="text-1xl font-bold" style={styles.confirmPasswordLabel}>
            Confirm Password
          </Text>

          <View style={styles.confirmPasswordWrapper}>
            <TextInput
              value={confirmpass}
              onChangeText={setConfirmPass}
              placeholder="Confirm your Password"
              placeholderTextColor="#999"
              secureTextEntry={!isConfirmPasswordVisible}
              style={styles.textInputTallWithRightPadding}
            />
            <Image
              source={require("../assets/icons/padlock.png")}
              style={styles.inputIconLeft}
            />
            <Pressable
              onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              style={styles.confirmPasswordToggle}
            >
              <Image
                source={
                  isConfirmPasswordVisible
                    ? require("../assets/icons/view.png")
                    : require("../assets/icons/hide.png")
                }
                style={styles.confirmPasswordToggleIcon}
              />
            </Pressable>
          </View>

          {/*Sign up button*/}
          <Pressable onPress={handleSignUp} style={styles.signUpButton}>
            <Text className="text-white font-bold text-lg">Sign Up</Text>
          </Pressable>

          {/*Social sign up*/}
          <View style={styles.socialRow}>
            <Pressable onPress={() => router.push("/")}>
              <Image
                source={require("../assets/icons/fb.png")}
                style={styles.socialIcon}
              />
            </Pressable>

            <Pressable onPress={() => Linking.openURL("https://www.google.com")}>
              <Image
                source={require("../assets/icons/google.png")}
                style={styles.socialIcon}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/signin")}
            style={styles.signInLink}
          >
            <Text style={styles.signInLinkText}>
              Already have an account? Sign in here!
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}