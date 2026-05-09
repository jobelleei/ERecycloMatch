import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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

const ID_TYPES = [
  "National ID",
  "Driver's License",
  "PhilHealth",
  "Senior Citizen ID",
  "UMID",
  "PWD Card",
];

export default function IndividualSignup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [image, setImage] = useState<any>(null);
  const [idType, setIdType] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  // ✅ Email rules
  const emailRules = [
    {
      label: "Must be a @gmail.com address",
      met: /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email),
    },
    {
      label: "No spaces allowed",
      met: email.length > 0 && !/\s/.test(email),
    },
  ];

  // ✅ Password rules
  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a–z)", met: /[a-z]/.test(password) },
    { label: "At least one number (0–9)", met: /[0-9]/.test(password) },
    { label: "At least one special character (!@#$%^&*)", met: /[!@#$%^&*]/.test(password) },
    { label: "No spaces allowed", met: password.length > 0 && !/\s/.test(password) },
    { label: "Maximum 64 characters", met: password.length > 0 && password.length <= 64 },
  ];

  // ✅ Confirm password rules
  const confirmRules = [
    {
      label: "Passwords match",
      met: confirmpass.length > 0 && password === confirmpass,
    },
  ];

  // ✅ Reusable bullet rule row
  const RuleItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 }}>
      <View style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: met ? "#3B6D11" : "transparent",
        borderWidth: 1.5,
        borderColor: met ? "#3B6D11" : "#aaa",
      }} />
      <Text style={{
        fontSize: 12,
        color: met ? "#27500A" : "#888",
        fontWeight: met ? "600" : "400",
      }}>
        {label}
      </Text>
    </View>
  );

  // ✅ Rules box with lighter opacity
  const RulesBox = ({ rules }: { rules: { label: string; met: boolean }[] }) => (
    <View style={{
      width: "85%",
      backgroundColor: "rgba(255, 255, 255, 0.45)",
      borderRadius: 8,
      padding: 10,
      marginTop: -6,
      marginBottom: 12,
      borderWidth: 0.5,
      borderColor: "rgba(200, 230, 201, 0.6)",
      alignSelf: "center",
    }}>
      {rules.map((rule, i) => (
        <RuleItem key={i} label={rule.label} met={rule.met} />
      ))}
    </View>
  );

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

    // 1. Check all fields filled
    if (!name || !email || !address || !password || !confirmpass || !image || !idType) {
      Toast.show({
        type: "error",
        text1: "Please complete all fields",
      });
      return;
    }

    // 2. Gmail check
    if (!emailRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use a valid @gmail.com address",
      });
      return;
    }

    // 3. Passwords match
    if (password !== confirmpass) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
      });
      return;
    }

    // 4. Password policy
    if (!passwordRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Password does not meet requirements",
      });
      return;
    }

    // 5. Everything passed — proceed with signup
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("password", password);
      formData.append("id_type", idType);
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

          {/* TOGGLE */}
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
              placeholder="Enter your Gmail address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* ✅ Email rules */}
          <RulesBox rules={emailRules} />

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

          {/* ✅ ID TYPE DROPDOWN */}
          <Text style={styles.label}>Type of ID</Text>
          <Pressable
            onPress={() => setDropdownOpen(!dropdownOpen)}
            style={[styles.inputBox, { justifyContent: "space-between" }]}
          >
            <Text style={{ color: idType ? "#000" : "#aaa", flex: 1, fontSize: 14 }}>
              {idType || "Select ID type"}
            </Text>
            <Text style={{ color: "#666", fontSize: 12 }}>
              {dropdownOpen ? "▲" : "▼"}
            </Text>
          </Pressable>

          {/* ✅ Dropdown options */}
          {dropdownOpen && (
            <View style={{
              width: "85%",
              backgroundColor: "#fff",
              borderRadius: 10,
              borderWidth: 0.5,
              borderColor: "#c8e6c9",
              marginTop: -8,
              marginBottom: 12,
              alignSelf: "center",
              overflow: "hidden",
              zIndex: 99,
            }}>
              {ID_TYPES.map((type, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setIdType(type);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: 12,
                    borderBottomWidth: i < ID_TYPES.length - 1 ? 0.5 : 0,
                    borderBottomColor: "#e0e0e0",
                    backgroundColor: idType === type ? "rgba(27,94,32,0.08)" : "#fff",
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    color: idType === type ? "#1B5E20" : "#333",
                    fontWeight: idType === type ? "600" : "400",
                  }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

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

          {/* ✅ Password rules */}
          <RulesBox rules={passwordRules} />

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

          {/* ✅ Confirm password rules */}
          <RulesBox rules={confirmRules} />

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