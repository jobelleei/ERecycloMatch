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
  { street: "Lacson Street", barangay: "Barangay 1", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Lacson Street", barangay: "Barangay 2", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Lacson Street", barangay: "Villamonte", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Galo Street", barangay: "Barangay 3", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Gatuslao Street", barangay: "Barangay 4", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Rizal Street", barangay: "Barangay 5", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Burgos Street", barangay: "Barangay 6", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Luzuriaga Street", barangay: "Barangay 7", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Lopez Jaena Street", barangay: "Barangay 8", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Hernaez Street", barangay: "Barangay 9", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Araneta Street", barangay: "Barangay 10", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Hilado Street", barangay: "Mandalagan", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Circumferential Road", barangay: "Taculing", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Magsaysay Avenue", barangay: "Villamonte", city: "Bacolod City", province: "Negros Occidental" },
  { street: "B.S. Aquino Drive", barangay: "Taculing", city: "Bacolod City", province: "Negros Occidental" },
  { street: "North Capitol Road", barangay: "Estefania", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Gonzaga Street", barangay: "Barangay 2", city: "Bacolod City", province: "Negros Occidental" },
  { street: "Quezon Street", barangay: "Barangay 5", city: "Bacolod City", province: "Negros Occidental" },
];

type BacolodLocation = typeof BACOLOD_LOCATIONS[0];

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
  const [locationSuggestions, setLocationSuggestions] = useState<BacolodLocation[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

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

  // ✅ Contact rules
  const contactRules = [
    { label: "Must start with 09", met: contactNum.startsWith("09") },
    { label: "Must be exactly 11 digits", met: contactNum.length === 11 },
    { label: "Numbers only", met: contactNum.length > 0 && /^[0-9]+$/.test(contactNum) },
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
      met: confirmPass.length > 0 && password === confirmPass,
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

  // ✅ Rules box
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

  // ✅ Local location search — no API needed
  const handleLocationChange = (text: string) => {
    setLocation(text);
    if (text.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = BACOLOD_LOCATIONS.filter((loc) =>
      loc.barangay.toLowerCase().includes(lower) ||
      loc.street.toLowerCase().includes(lower)
    ).slice(0, 6);
    setLocationSuggestions(filtered);
    setShowLocationSuggestions(filtered.length > 0);
  };

  const handleSelectLocation = (loc: BacolodLocation) => {
    const full = loc.street
      ? `${loc.street}, ${loc.barangay}, ${loc.city}, ${loc.province}`
      : `${loc.barangay}, ${loc.city}, ${loc.province}`;
    setLocation(full);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, width: asset.width, height: asset.height });
    }
  };

  const handleSignUp = async () => {
    if (!name || !location || !email || !contactNum || !password || !confirmPass || !image) {
      Toast.show({ type: "error", text1: "Please complete all fields" });
      return;
    }
    if (!emailRules.every((r) => r.met)) {
      Toast.show({ type: "error", text1: "Only Gmail addresses are accepted", text2: "Please use a @gmail.com email address" });
      return;
    }
    if (!contactRules.every((r) => r.met)) {
      Toast.show({ type: "error", text1: "Invalid contact number", text2: "Must start with 09 and be exactly 11 digits" });
      return;
    }
    if (password !== confirmPass) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    if (!passwordRules.every((r) => r.met)) {
      Toast.show({ type: "error", text1: "Password does not meet requirements" });
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
        uri: image.uri,
        name: "upload.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/facility_signup.php`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await response.json();
      if (data.message === "Submitted for approval") {
        Toast.show({ type: "success", text1: "Submitted for approval" });
        router.push("/signin");
      } else {
        Toast.show({ type: "error", text1: data.message || "Signup failed" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Network error" });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <Pressable onPress={() => router.push("/")} style={styles.backButton}>
        <Image source={require("../assets/icons/backbutton.png")} style={styles.backButtonIcon} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("../assets/icons/icon.png")} style={styles.logo} />
        <Text style={styles.title}>Sign up and join the platform today.</Text>

        {/* TOGGLE */}
        <View style={styles.toggleContainer}>
          <Pressable style={styles.inactiveTab} onPress={() => router.push("/individual_signup")}>
            <Text style={styles.inactiveText}>Individual</Text>
          </Pressable>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeText}>Facility/Shop</Text>
          </Pressable>
        </View>

        {/* FACILITY NAME */}
        <Text style={styles.label}>Facility Name</Text>
        <View style={styles.inputBox}>
          <Image source={require("../assets/icons/individual.png")} style={styles.icon} />
          <TextInput
            placeholder="Enter facility name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* LOCATION */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.inputBox}>
          <Image source={require("../assets/icons/location.png")} style={styles.icon} />
          <TextInput
            placeholder="Type barangay or street in Bacolod..."
            value={location}
            onChangeText={handleLocationChange}
            style={styles.input}
            autoCorrect={false}
          />
        </View>

        {/* ✅ Location suggestions dropdown */}
        {showLocationSuggestions && (
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
            {locationSuggestions.map((loc, i) => (
              <Pressable
                key={i}
                onPress={() => handleSelectLocation(loc)}
                style={{
                  padding: 12,
                  borderBottomWidth: i < locationSuggestions.length - 1 ? 0.5 : 0,
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

        {/* EMAIL */}
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

        {/* CONTACT */}
        <Text style={styles.label}>Contact Number</Text>
        <View style={styles.inputBox}>
          <Image source={require("../assets/icons/telephone.png")} style={styles.icon} />
          <TextInput
            placeholder="09XXXXXXXXX"
            value={contactNum}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 11);
              setContactNum(cleaned);
            }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={11}
          />
        </View>
        <RulesBox rules={contactRules} />

        {/* PASSWORD */}
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
        <RulesBox rules={passwordRules} />

        {/* CONFIRM PASSWORD */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputBox}>
          <Image source={require("../assets/icons/padlock.png")} style={styles.icon} />
          <TextInput
            placeholder="Confirm your password"
            secureTextEntry={secure2}
            value={confirmPass}
            onChangeText={setConfirmPass}
            style={styles.input}
          />
          <Pressable onPress={() => setSecure2(!secure2)}>
            <Image source={require("../assets/icons/view.png")} style={styles.eye} />
          </Pressable>
        </View>
        <RulesBox rules={confirmRules} />

        {/* UPLOAD */}
        <Text style={styles.label}>
          Facility Certification{" "}
          <Text style={{ color: "#2E7D32" }}>(Required)</Text>
        </Text>

        {/* ✅ Upload instructions */}
        <View style={{
          width: "85%",
          backgroundColor: "rgba(255, 255, 255, 0.45)",
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          borderWidth: 0.5,
          borderColor: "rgba(200, 230, 201, 0.6)",
          alignSelf: "center",
        }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#1B5E20", marginBottom: 6 }}>
            Accepted Documents
          </Text>
          {[
            "Business Permit",
            "DTI Registration Certificate",
            "BIR Certificate of Registration",
            "SEC Registration (for corporations)",
            "Barangay Business Clearance",
          ].map((doc, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#3B6D11" }} />
              <Text style={{ fontSize: 12, color: "#444" }}>{doc}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
            Take a clear photo of the document. Make sure all text is readable and the document is not expired.
          </Text>
        </View>

        <Pressable
          onPress={openCamera}
          style={[styles.uploadBox, image && { height: (image.height / image.width) * 300 }]}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
          ) : (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 24 }}></Text>
              <Text style={{ fontSize: 13, color: "#555", fontWeight: "600" }}>
                Tap to Open Camera
              </Text>
              <Text style={{ fontSize: 11, color: "#888" }}>
                Max file size: 5MB · JPG, PNG only
              </Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.helper}>
          This helps us verify your facility is legitimate and compliant
        </Text>

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