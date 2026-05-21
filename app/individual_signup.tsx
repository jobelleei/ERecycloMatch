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
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const PSGC_API = "https://psgc.gitlab.io/api";

const ID_TYPES = [
  "Student ID",
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
  const [country, setCountry] = useState("Philippines");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [image, setImage] = useState<any>(null);
  const [idType, setIdType] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

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

  const confirmRules = [
    {
      label: "Passwords match",
      met: confirmpass.length > 0 && password === confirmpass,
    },
  ];

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

    if (
      !name ||
      !email ||
      !address ||
      !password ||
      !confirmpass ||
      !image ||
      !idType
    ) {
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
        text2: "Please enter a valid email address",
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
        uri:
          Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
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

      if (
        data.status === "success" ||
        data.message === "Submitted for approval"
      ) {
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
  <SafeAreaView
    style={{ flex: 1 }}
    edges={["top"]}
  >      
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
          <Image
            source={require("../assets/icons/icon.png")}
            style={styles.logo}
          />

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
            <Image
              source={require("../assets/icons/individual.png")}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="#7a7a7a"
            />
          </View>

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
              placeholderTextColor="#7a7a7a"
              autoCorrect={false}
            />
          </View>
          <RulesBox rules={emailRules} />

 <Text style={styles.label}>Address</Text>

{/* COUNTRY */}
<View style={styles.inputBox}>
  <Picker
    selectedValue={country}
    onValueChange={(value) => {
      setCountry(value);
    }}
    mode="dropdown"
    dropdownIconColor="#666"
    style={{
      width: "100%",
      color: "#333",
    }}
  >
    <Picker.Item
      label="Philippines"
      value="Philippines"
    />
  </Picker>
</View>

{/* PROVINCE */}
<View style={styles.inputBox}>
  <Picker
    selectedValue={province}
    onValueChange={(value) => {
      setProvince(value);
      setCity("");
      setBarangay("");

      if (value) {
        fetchCities(value);
      }
    }}
    mode="dropdown"
    dropdownIconColor="#666"
    style={{
      width: "100%",
      color: "#333",
    }}
  >
    <Picker.Item
      label="Select Province"
      value=""
    />

    {provinces.map(
      (item, index) => (
        <Picker.Item
          key={index}
          label={item}
          value={item}
        />
      )
    )}
  </Picker>
</View>

{/* CITY / MUNICIPALITY */}
<View style={styles.inputBox}>
  <Picker
    selectedValue={city}
    onValueChange={(value) => {
      setCity(value);
      setBarangay("");

      if (value) {
        fetchBarangays(value);
      }
    }}
    enabled={!!province}
    mode="dropdown"
    dropdownIconColor="#666"
    style={{
      width: "100%",
      color: province
        ? "#333"
        : "#999",
    }}
  >
    <Picker.Item
      label="Select City / Municipality"
      value=""
    />

    {cities.map(
      (item, index) => (
        <Picker.Item
          key={index}
          label={item}
          value={item}
        />
      )
    )}
  </Picker>
</View>

{/* BARANGAY */}
<View style={styles.inputBox}>
  <Picker
    selectedValue={barangay}
    onValueChange={(value) => {
      setBarangay(value);

      const fullAddress =
        `${street}, ${value}, ${city}, ${province}, ${country}`;

      setAddress(fullAddress);
    }}
    enabled={!!city}
    mode="dropdown"
    dropdownIconColor="#666"
    style={{
      width: "100%",
      color: city
        ? "#333"
        : "#999",
    }}
  >
    <Picker.Item
      label="Select Barangay"
      value=""
    />

    {barangays.map(
      (item, index) => (
        <Picker.Item
          key={index}
          label={item}
          value={item}
        />
      )
    )}
  </Picker>
</View>

{/* STREET */}
<Text style={styles.label}>
  Street / Village / Block / Lot
</Text>

<View style={styles.inputBox}>
  <Image
    source={require(
      "../assets/icons/location.png"
    )}
    style={styles.icon}
  />

  <TextInput
    placeholder="Enter street or village name"
    placeholderTextColor="#7a7a7a"
    value={street}
    onChangeText={(text) => {
      setStreet(text);

      const fullAddress =
        `${text}, ${barangay}, ${city}, ${province}, ${country}`;

      setAddress(fullAddress);
    }}
    style={styles.input}
  />
</View>

          <Text style={styles.label}>Street / Village / Block / Lot</Text>

          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/location.png")}
              style={styles.icon}
            />

            <TextInput
              placeholder="Enter street or village name"
              placeholderTextColor="#7a7a7a"
              value={street}
              onChangeText={(text) => {
                setStreet(text);

                const fullAddress = `${text}, ${barangay}, ${city}, ${province}, ${country}`;

                setAddress(fullAddress);
              }}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Type of ID</Text>
          <Pressable
            onPress={() => setDropdownOpen(!dropdownOpen)}
            style={[styles.inputBox, { justifyContent: "space-between" }]}
          >
            <Text
              style={{ color: idType ? "#000" : "#aaa", flex: 1, fontSize: 14 }}
            >
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
                    backgroundColor:
                      idType === type ? "rgba(27,94,32,0.08)" : "#fff",
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
          <RulesBox rules={passwordRules} />

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
          <RulesBox rules={confirmRules} />

          <Pressable
            style={[styles.button, { zIndex: 10 }]}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
