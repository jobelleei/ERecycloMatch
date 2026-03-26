import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
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

export default function individual_signup() {
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Permission required to access gallery.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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
      console.log("Facility signup error:", err.message);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Could not connect to server.",
      });
    }
  };

  return (
    <View className="flex-1 bg-backg">
      {/* Background Image */}
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      />

      {/* BG Layer */}
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

        {/* Title */}
        <Text className="text-3xl font-bold" style={styles.title}>
          Sign up and join the platform today!
        </Text>

        {/* User Type Toggle */}
        <View style={styles.userTypeToggle}>
          {/* Individual Tab */}
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

          {/* Facility Tab */}
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

        {/* Facility Name Label */}
        <Text className="text-1xl font-bold" style={styles.firstInputLabel}>
          Facility Name
        </Text>

        {/* Facility Name Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter Facility Name"
            placeholderTextColor="#999"
            style={styles.textInputShort}
          />
          <Image
            source={require("../assets/icons/facility.png")}
            style={styles.inputIconLeft}
          />
        </View>

        {/* Location Label */}
        <Text className="text-1xl font-bold" style={styles.inputLabel}>
          Location
        </Text>

        {/* Location Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your Location"
            placeholderTextColor="#999"
            style={styles.textInputTall}
          />
          <Image
            source={require("../assets/icons/location.png")}
            style={styles.inputIconLeft}
          />
        </View>

        {/* Email Label */}
        <Text className="text-1xl font-bold" style={styles.inputLabel}>
          Email
        </Text>

        {/* Email Input */}
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

        {/* Contact Number Label */}
        <Text className="text-1xl font-bold" style={styles.inputLabel}>
          Contact Number
        </Text>

        {/* Contact Number Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={contactNum}
            onChangeText={setContactNum}
            placeholder="Enter your Contact Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={styles.textInputTall}
          />
          <Image
            source={require("../assets/icons/telephone.png")}
            style={styles.inputIconLeft}
          />
        </View>

        {/* Password Label */}
        <Text className="text-1xl font-bold" style={styles.inputLabel}>
          Password
        </Text>

        {/* Password Input */}
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

        {/* Confirm Password Label */}
        <Text
          className="text-1xl font-bold"
          style={styles.confirmPasswordLabel}
        >
          Confirm Password
        </Text>

        {/* Confirm Password Input */}
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
            onPress={() =>
              setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
            }
            style={styles.passwordToggle}
          >
            <Image
              source={
                isConfirmPasswordVisible
                  ? require("../assets/icons/view.png")
                  : require("../assets/icons/hide.png")
              }
              style={styles.passwordToggleIcon}
            />
          </Pressable>
        </View>

        {/* Upload Label */}
        <Text className="text-1xl font-bold" style={styles.uploadLabel}>
          {"Facility Certification"}
          <Text style={styles.uploadLabelSub}>(Required)</Text>
        </Text>

        {/* Upload Box */}
        <Pressable onPress={pickImage} style={styles.uploadBox}>
          {image ? (
            <>
              <Image
                source={{ uri: image }}
                style={styles.uploadedImage}
                resizeMode="cover"
              />
              <Text style={styles.uploadedImageLabel}>Tap to change</Text>
            </>
          ) : (
            <>
              <Image
                source={require("../assets/icons/upload.png")}
                style={styles.uploadIcon}
              />
              <Text style={styles.uploadPlaceholderText}>
                Upload Certification Document
              </Text>
            </>
          )}
        </Pressable>

        {/* Upload Helper Text */}
        <Text style={styles.uploadHelperText}>
          This help us verify your facility is legitimate and compliant
        </Text>

        {/* Sign Up Button */}
        <Pressable onPress={handleSignUp} style={styles.signUpButton}>
          <Text className="text-white font-bold text-lg">Sign Up</Text>
        </Pressable>

        {/* Social Sign Up */}
        <View style={styles.socialRow}>
          <Pressable
            onPress={() => Linking.openURL("https://www.facebook.com")}
          >
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

        {/* Sign In Link */}
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
