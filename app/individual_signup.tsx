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

const ID_TYPES = [
  "Student ID",
  "National ID",
  "Driver's License",
  "PhilHealth",
  "Senior Citizen ID",
  "UMID",
  "PWD Card",
];

const BACOLOD_LOCATIONS = [
  { street: "", barangay: "Barangay 1", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 2", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 3", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 4", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 5", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 6", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 7", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 8", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 9", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 10", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 11", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 12", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 13", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 14", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 15", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 16", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 17", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 18", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 19", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 20", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 21", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 22", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 23", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Barangay 24", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Alijis", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Banago", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Bata", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Cabug", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Estefania", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Felisa", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Granada", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Handumanan", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Mandalagan", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Mansilingan", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Montevista", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Pahanocoy", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Punta Taytay", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Singcang-Airport", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Sum-ag", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Taculing", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Tangub", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Tanza", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Villamonte", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Vista Alegre", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Shopping", city: "Bacolod City", province: "Negros Occidental" },
  { street: "", barangay: "Circumferential", city: "Bacolod City", province: "Negros Occidental" },
];

type Location = typeof BACOLOD_LOCATIONS[0];

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
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

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

  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a–z)", met: /[a-z]/.test(password) },
    { label: "At least one number (0–9)", met: /[0-9]/.test(password) },
    { label: "At least one special character (!@#$%^&*)", met: /[!@#$%^&*]/.test(password) },
    { label: "No spaces allowed", met: password.length > 0 && !/\s/.test(password) },
    { label: "Maximum 64 characters", met: password.length > 0 && password.length <= 64 },
  ];

  const confirmRules = [
    {
      label: "Passwords match",
      met: confirmpass.length > 0 && password === confirmpass,
    },
  ];

  const RuleItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: met ? "#3B6D11" : "transparent",
          borderWidth: 1.5,
          borderColor: met ? "#3B6D11" : "#aaa",
        }}
      />
      <Text
        style={{
          fontSize: 12,
          color: met ? "#27500A" : "#888",
          fontWeight: met ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </View>
  );

  const RulesBox = ({ rules }: { rules: { label: string; met: boolean }[] }) => (
    <View
      style={{
        width: "85%",
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        borderRadius: 8,
        padding: 10,
        marginTop: -6,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: "rgba(200, 230, 201, 0.6)",
        alignSelf: "center",
      }}
    >
      {rules.map((rule, i) => (
        <RuleItem key={i} label={rule.label} met={rule.met} />
      ))}
    </View>
  );

  const handleAddressChange = (text: string) => {
    setAddress(text);

    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lower = text.toLowerCase();

    const filtered = BACOLOD_LOCATIONS.filter(
      (loc) =>
        loc.barangay.toLowerCase().includes(lower) ||
        loc.street.toLowerCase().includes(lower)
    ).slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelectAddress = (loc: Location) => {
    const full = loc.street
      ? `${loc.street}, ${loc.barangay}, ${loc.city}, ${loc.province}`
      : `${loc.barangay}, ${loc.city}, ${loc.province}`;

    setAddress(full);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Camera permission is required",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
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
    console.log("SIGNUP CLICKED");

    if (!name || !email || !address || !password || !confirmpass || !image || !idType) {
      Toast.show({
        type: "error",
        text1: "Please complete all fields",
      });
      return;
    }

    if (!emailRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please use a valid @gmail.com address",
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

    if (!passwordRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Password does not meet requirements",
      });
      return;
    }

    try {
      const imageName = image.uri.split("/").pop() || "id_image.jpg";

      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("address", address.trim());
      formData.append("password", password);
      formData.append("id_type", idType);

      formData.append("id_image", {
        uri: Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
        name: imageName,
        type: "image/jpeg",
      } as any);

      console.log("API URL:", `${API_URL}/individual_signup.php`);

      const response = await fetch(`${API_URL}/individual_signup.php`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      console.log("RAW RESPONSE:", rawText);

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "Server did not return JSON",
          text2: "Check your PHP file or API URL",
        });
        return;
      }

      console.log("SERVER RESPONSE:", data);

      if (data.status === "success" || data.message === "Submitted for approval") {
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
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} pointerEvents="none" />
      </ImageBackground>

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
          <Image source={require("../assets/icons/icon.png")} style={styles.logo} />

          <Text style={styles.title}>Sign up and join the platform today.</Text>

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

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/email.png")} style={styles.icon} />
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
          <RulesBox rules={emailRules} />

          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/location.png")} style={styles.icon} />
            <TextInput
              placeholder="Type barangay or street in Bacolod..."
              value={address}
              onChangeText={handleAddressChange}
              style={styles.input}
              autoCorrect={false}
            />
          </View>

          {showSuggestions && (
            <View
              style={{
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
              }}
            >
              {suggestions.map((loc, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSelectAddress(loc)}
                  style={{
                    padding: 12,
                    borderBottomWidth: i < suggestions.length - 1 ? 0.5 : 0,
                    borderBottomColor: "#e0e0e0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1B5E20" }}>
                    {loc.street ? `${loc.street}, ${loc.barangay}` : loc.barangay}
                  </Text>

                  <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {loc.city}, {loc.province}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

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

          {dropdownOpen && (
            <View
              style={{
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
              }}
            >
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
                  <Text
                    style={{
                      fontSize: 14,
                      color: idType === type ? "#1B5E20" : "#333",
                      fontWeight: idType === type ? "600" : "400",
                    }}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

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
              <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
            ) : (
              <Text>Tap to Open Camera</Text>
            )}
          </Pressable>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/padlock.png")} style={styles.icon} />

            <TextInput
              secureTextEntry={secure1}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              style={styles.input}
            />

            <Pressable onPress={() => setSecure1(!secure1)}>
              <Image source={require("../assets/icons/view.png")} style={styles.eye} />
            </Pressable>
          </View>
          <RulesBox rules={passwordRules} />

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Image source={require("../assets/icons/padlock.png")} style={styles.icon} />

            <TextInput
              secureTextEntry={secure2}
              value={confirmpass}
              onChangeText={setConfirmPass}
              placeholder="Confirm your password"
              style={styles.input}
            />

            <Pressable onPress={() => setSecure2(!secure2)}>
              <Image source={require("../assets/icons/view.png")} style={styles.eye} />
            </Pressable>
          </View>
          <RulesBox rules={confirmRules} />

          <Pressable style={[styles.button, { zIndex: 10 }]} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}