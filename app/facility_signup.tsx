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
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

const PSGC_API = "https://psgc.gitlab.io/api";

export default function FacilitySignup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [contactNum, setContactNum] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [image, setImage] = useState<any>(null);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(`${PSGC_API}/provinces`);

      const provinceNames = response.data.map((item: any) => item.name).sort();

      setProvinces(provinceNames);
    } catch (error) {
      console.log("PROVINCES ERROR:", error);
    }
  };

  const fetchCities = async (selectedProvince: string) => {
    try {
      const provincesResponse = await axios.get(`${PSGC_API}/provinces`);

      const province = provincesResponse.data.find(
        (p: any) => p.name.toLowerCase() === selectedProvince.toLowerCase(),
      );

      if (!province) return;

      const response = await axios.get(
        `${PSGC_API}/provinces/${province.code}/cities-municipalities`,
      );

      const cityNames = response.data.map((item: any) => item.name).sort();

      setCities(cityNames);
    } catch (error) {
      console.log("CITY ERROR:", error);
    }
  };

  const fetchBarangays = async (selectedCity: string) => {
    try {
      const response = await axios.get(`${PSGC_API}/cities-municipalities`);

      const cityFound = response.data.find(
        (c: any) => c.name.toLowerCase() === selectedCity.toLowerCase(),
      );

      if (!cityFound) return;

      const barangayResponse = await axios.get(
        `${PSGC_API}/cities-municipalities/${cityFound.code}/barangays`,
      );

      const barangayNames = barangayResponse.data
        .map((item: any) => item.name)
        .sort();

      setBarangays(barangayNames);
    } catch (error) {
      console.log("BARANGAY ERROR:", error);
    }
  };

  //  Email rules
  const emailRules = [
    {
      label: "Must be a valid email address",
      met: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
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
    {
      label: "Numbers only",
      met: contactNum.length > 0 && /^[0-9]+$/.test(contactNum),
    },
  ];

  // ✅ Password rules
  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    {
      label: "At least one uppercase letter (A–Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter (a–z)",
      met: /[a-z]/.test(password),
    },
    { label: "At least one number (0–9)", met: /[0-9]/.test(password) },
    {
      label: "At least one special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
    {
      label: "No spaces allowed",
      met: password.length > 0 && !/\s/.test(password),
    },
    {
      label: "Maximum 64 characters",
      met: password.length > 0 && password.length <= 64,
    },
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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginVertical: 3,
      }}
    >
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

  // ✅ Rules box
  const RulesBox = ({
    rules,
  }: {
    rules: { label: string; met: boolean }[];
  }) => (
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
    if (
      !name ||
      !location ||
      !email ||
      !contactNum ||
      !password ||
      !confirmPass ||
      !image
    ) {
      Toast.show({ type: "error", text1: "Please complete all fields" });
      return;
    }
    if (!emailRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address",
      });
      return;
    }
    if (!contactRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid contact number",
        text2: "Must start with 09 and be exactly 11 digits",
      });
      return;
    }
    if (password !== confirmPass) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
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
        <Image
          source={require("../assets/icons/backbutton.png")}
          style={styles.backButtonIcon}
        />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* FACILITY NAME */}
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

        <Text style={styles.label}>Facility Address</Text>

        <View style={styles.inputBox}>
          <Picker
            selectedValue={country}
            onValueChange={(value) => setCountry(value)}
            style={{ flex: 1 }}
          >
            <Picker.Item label="Philippines" value="Philippines" />
          </Picker>
        </View>

        <View style={styles.inputBox}>
          <Picker
            selectedValue={province}
            onValueChange={(value) => {
              setProvince(value);
              setCity("");
              setBarangay("");
              fetchCities(value);
            }}
            style={{ flex: 1 }}
          >
            <Picker.Item label="Select Province" value="" />

            {provinces.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <View style={styles.inputBox}>
          <Picker
            selectedValue={city}
            onValueChange={(value) => {
              setCity(value);
              setBarangay("");
              fetchBarangays(value);
            }}
            style={{ flex: 1 }}
          >
            <Picker.Item label="Select City" value="" />

            {cities.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <View style={styles.inputBox}>
          <Picker
            selectedValue={barangay}
            onValueChange={(value) => {
              setBarangay(value);

              const fullAddress = `${street}, ${value}, ${city}, ${province}, ${country}`;

              setLocation(fullAddress);
            }}
            style={{ flex: 1 }}
          >
            <Picker.Item label="Select Barangay" value="" />

            {barangays.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Street / Village / Block / Lot</Text>

        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/location.png")}
            style={styles.icon}
          />

          <TextInput
            placeholder="Enter street or village"
            value={street}
            onChangeText={(text) => {
              setStreet(text);

              const fullAddress = `${text}, ${barangay}, ${city}, ${province}, ${country}`;

              setLocation(fullAddress);
            }}
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
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {email.length > 0 && emailRules.some((r) => !r.met) && (
          <RulesBox rules={emailRules.filter((r) => !r.met)} />
        )}
        {/* CONTACT */}
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
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 11);
              setContactNum(cleaned);
            }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={11}
          />
        </View>
        {contactNum.length > 0 && contactRules.some((r) => !r.met) && (
          <RulesBox rules={contactRules.filter((r) => !r.met)} />
        )}
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
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable onPress={() => setSecure1(!secure1)}>
            <Ionicons
              name={secure1 ? "eye-off" : "eye"}
              size={22}
              color="#666"
            />
          </Pressable>
        </View>
        {password.length > 0 && passwordRules.some((r) => !r.met) && (
          <RulesBox rules={passwordRules.filter((r) => !r.met)} />
        )}
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
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable onPress={() => setSecure2(!secure2)}>
            <Ionicons
              name={secure2 ? "eye-off" : "eye"}
              size={22}
              color="#666"
            />
          </Pressable>
        </View>
        {confirmPass.length > 0 && confirmRules.some((r) => !r.met) && (
          <RulesBox rules={confirmRules.filter((r) => !r.met)} />
        )}
        {/* UPLOAD */}
        <Text style={styles.label}>
          Facility Certification{" "}
          <Text style={{ color: "#2E7D32" }}>(Required)</Text>
        </Text>

        {/* Upload instructions */}
        <View
          style={{
            width: "85%",
            backgroundColor: "rgba(255, 255, 255, 0.45)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
            borderWidth: 0.5,
            borderColor: "rgba(200, 230, 201, 0.6)",
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#1B5E20",
              marginBottom: 6,
            }}
          >
            Accepted Documents
          </Text>
          {[
            "Business Permit",
            "DTI Registration Certificate",
            "BIR Certificate of Registration",
            "SEC Registration (for corporations)",
            "Barangay Business Clearance",
          ].map((doc, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginVertical: 2,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#3B6D11",
                }}
              />
              <Text style={{ fontSize: 12, color: "#444" }}>{doc}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
            Take a clear photo of the document. Make sure all text is readable
            and the document is not expired.
          </Text>
        </View>

        <Pressable
          onPress={openCamera}
          style={[
            styles.uploadBox,
            image && { height: (image.height / image.width) * 300 },
          ]}
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
