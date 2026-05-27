import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Toast from "react-native-toast-message";
import styles from "./styles/individual_signup";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import { supabase } from "../utils/supabase";

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
  const mapRef = useRef<MapView | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");

  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);

  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");

  const [image, setImage] = useState<any>(null);
  const [idType, setIdType] = useState("");

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mapLatitude, setMapLatitude] = useState<number | null>(null);
  const [mapLongitude, setMapLongitude] = useState<number | null>(null);

  const [mapSearchText, setMapSearchText] = useState("");
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownTitle, setDropdownTitle] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [dropdownOnSelect, setDropdownOnSelect] = useState<
    ((value: string) => void) | null
  >(null);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const openDropdown = (
    title: string,
    options: string[],
    onSelect: (value: string) => void,
  ) => {
    setDropdownTitle(title);
    setDropdownOptions(options);
    setDropdownOnSelect(() => onSelect);
    setDropdownVisible(true);
  };

  const selectDropdownValue = (value: string) => {
    if (dropdownOnSelect) {
      dropdownOnSelect(value);
    }

    setDropdownVisible(false);
  };

  const updateFullAddress = (
    newStreet = street,
    newBarangay = barangay,
    newCity = city,
    newProvince = province,
  ) => {
    const parts = [newProvince, newCity, newBarangay, newStreet].filter(
      (part) => String(part).trim() !== "",
    );

    setAddress(parts.join(", "));
  };

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(`${PSGC_API}/provinces`);
      const provinceNames = response.data.map((item: any) => item.name).sort();

      setProvinces(provinceNames);
    } catch (error) {
      console.log("PROVINCES ERROR:", error);
      setProvinces([]);
    }
  };

  const fetchCities = async (selectedProvince: string) => {
    try {
      const provincesResponse = await axios.get(`${PSGC_API}/provinces`);

      const provinceFound = provincesResponse.data.find(
        (p: any) => p.name.toLowerCase() === selectedProvince.toLowerCase(),
      );

      if (!provinceFound) {
        setCities([]);
        return;
      }

      const response = await axios.get(
        `${PSGC_API}/provinces/${provinceFound.code}/cities-municipalities`,
      );

      const cityNames = response.data.map((item: any) => item.name).sort();

      setCities(cityNames);
    } catch (error) {
      console.log("CITY ERROR:", error);
      setCities([]);
    }
  };

  const fetchBarangays = async (selectedCity: string) => {
    try {
      const response = await axios.get(`${PSGC_API}/cities-municipalities`);

      const cityFound = response.data.find(
        (c: any) => c.name.toLowerCase() === selectedCity.toLowerCase(),
      );

      if (!cityFound) {
        setBarangays([]);
        return;
      }

      const barangayResponse = await axios.get(
        `${PSGC_API}/cities-municipalities/${cityFound.code}/barangays`,
      );

      const barangayNames = barangayResponse.data
        .map((item: any) => item.name)
        .sort();

      setBarangays(barangayNames);
    } catch (error) {
      console.log("BARANGAY ERROR:", error);
      setBarangays([]);
    }
  };

  const moveMapToSelectedAddress = async (
    selectedProvince: string,
    selectedCity: string,
    selectedBarangay: string,
  ) => {
    try {
      const parts = [
        selectedBarangay,
        selectedCity,
        selectedProvince,
        "Philippines",
      ].filter((part) => String(part).trim() !== "");

      const searchAddress = parts.join(", ");

      if (!selectedProvince || !selectedCity) {
        return;
      }

      console.log("MOVING USER MAP TO:", searchAddress);

      const results = await Location.geocodeAsync(searchAddress);

      console.log("USER MAP GEOCODE RESULT:", results);

      if (results && results.length > 0) {
        const lat = results[0].latitude;
        const lng = results[0].longitude;

        setMapLatitude(lat);
        setMapLongitude(lng);
        setMapSearchText(searchAddress);

        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: selectedBarangay ? 0.01 : 0.03,
            longitudeDelta: selectedBarangay ? 0.01 : 0.03,
          },
          700,
        );

        await updateAddressFromPin(
          lat,
          lng,
          selectedProvince,
          selectedCity,
          selectedBarangay,
        );
      }
    } catch (error) {
      console.log("MOVE USER MAP TO SELECTED ADDRESS ERROR:", error);
    }
  };

  const updateAddressFromPin = async (
    lat: number,
    lng: number,
    selectedProvince = province,
    selectedCity = city,
    selectedBarangay = barangay,
  ) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      console.log("USER REVERSE GEOCODE RESULT:", results);

      let exactStreet = "";

      if (results && results.length > 0) {
        const place: any = results[0];

        exactStreet = [
          place.name,
          place.street,
          place.district,
          place.subregion,
        ]
          .filter((part) => String(part || "").trim() !== "")
          .join(", ");
      }

      if (!exactStreet.trim()) {
        exactStreet = `Selected location (${lat.toFixed(6)}, ${lng.toFixed(
          6,
        )})`;
      }

      setStreet(exactStreet);

      updateFullAddress(
        exactStreet,
        selectedBarangay,
        selectedCity,
        selectedProvince,
      );
    } catch (error) {
      console.log("USER REVERSE GEOCODE ERROR:", error);

      const fallbackStreet = `Selected location (${lat.toFixed(
        6,
      )}, ${lng.toFixed(6)})`;

      setStreet(fallbackStreet);

      updateFullAddress(
        fallbackStreet,
        selectedBarangay,
        selectedCity,
        selectedProvince,
      );
    }
  };

  const searchMapLocation = async () => {
    try {
      const cleanSearch = mapSearchText.trim();

      if (!cleanSearch) {
        Toast.show({
          type: "error",
          text1: "Enter a location",
          text2: "Please type an address or place first.",
        });
        return;
      }

      Keyboard.dismiss();
      setIsSearchingMap(true);

      const searchParts = [cleanSearch, barangay, city, province, "Philippines"]
        .filter((part) => String(part).trim() !== "")
        .join(", ");

      console.log("SEARCHING MAP LOCATION:", searchParts);

      const results = await Location.geocodeAsync(searchParts);

      console.log("MAP SEARCH RESULT:", results);

      if (!results || results.length === 0) {
        Toast.show({
          type: "error",
          text1: "Location not found",
          text2: "Try typing a more specific address.",
        });
        return;
      }

      const lat = results[0].latitude;
      const lng = results[0].longitude;

      setMapLatitude(lat);
      setMapLongitude(lng);

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700,
      );

      await updateAddressFromPin(lat, lng);

      Toast.show({
        type: "success",
        text1: "Location found",
        text2: "The map pin was moved to the searched location.",
      });
    } catch (error) {
      console.log("SEARCH MAP LOCATION ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: "Unable to search this location.",
      });
    } finally {
      setIsSearchingMap(false);
    }
  };

  const getCurrentUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Location permission required",
          text2: "Please allow location access to auto-fill your address.",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      setMapLatitude(lat);
      setMapLongitude(lng);
      setMapSearchText("");

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700,
      );

      await updateAddressFromPin(lat, lng);

      Toast.show({
        type: "success",
        text1: "Address location set",
        text2: "This only fills your signup address.",
      });
    } catch (error) {
      console.log("GET USER CURRENT LOCATION ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Location error",
        text2: "Failed to get current location.",
      });
    }
  };

  const emailRules = [
    {
      label: "Enter a valid email address",
      met: email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    },
    {
      label: "No spaces allowed",
      met: email.length > 0 && !/\s/.test(email),
    },
  ];

  const usernameRules = [
    {
      label: "At least 4 characters",
      met: username.trim().length >= 4,
    },
    {
      label: "No spaces allowed",
      met: username.length > 0 && !/\s/.test(username),
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

  const DropdownBox = ({
    value,
    placeholder,
    options,
    disabled = false,
    onSelect,
  }: {
    value: string;
    placeholder: string;
    options: string[];
    disabled?: boolean;
    onSelect: (value: string) => void;
  }) => (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        openDropdown(placeholder, options, onSelect);
      }}
      style={[
        styles.inputBox,
        {
          justifyContent: "space-between",
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: value ? "#333" : "#7a7a7a",
        }}
      >
        {value || placeholder}
      </Text>

      <Text style={{ color: "#666", fontSize: 13 }}>▼</Text>
    </Pressable>
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

  const getImageExtension = (uri: string) => {
    const cleanUri = uri.split("?")[0];
    const extension = cleanUri.split(".").pop()?.toLowerCase();

    if (extension === "png") return "png";
    if (extension === "webp") return "webp";
    if (extension === "jpeg") return "jpeg";
    if (extension === "jpg") return "jpg";

    return "jpg";
  };

  const getContentType = (extension: string) => {
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    if (extension === "jpeg") return "image/jpeg";
    return "image/jpeg";
  };

  const uploadIdImage = async () => {
    if (!image?.uri) {
      throw new Error("No ID image selected");
    }

    const extension = getImageExtension(image.uri);
    const contentType = getContentType(extension);

    const safeUsername =
      username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "") || "user";

    const filePath = `individual-ids/${safeUsername}-${Date.now()}.${extension}`;

    console.log("UPLOADING ID IMAGE TO:", filePath);

    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("id-images")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    console.log("ID IMAGE UPLOAD DATA:", uploadData);
    console.log("ID IMAGE UPLOAD ERROR:", uploadError);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("id-images").getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSignUp = async () => {
    console.log("SIGNUP CLICKED");

    const finalAddress =
      address ||
      [province, city, barangay, street]
        .filter((part) => String(part).trim() !== "")
        .join(", ");

    if (
      !name.trim() ||
      !email.trim() ||
      !username.trim() ||
      !province ||
      !city ||
      !barangay ||
      !street.trim() ||
      !finalAddress ||
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

    if (!usernameRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid Username",
        text2: "Username must have at least 4 characters and no spaces.",
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
      setIsSubmitting(true);

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();

      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id, email, username")
        .or(`email.eq.${cleanEmail},username.eq.${cleanUsername}`)
        .maybeSingle();

      if (checkError) {
        console.log("CHECK USER ERROR:", checkError);

        Toast.show({
          type: "error",
          text1: "Unable to check account",
          text2: checkError.message,
        });

        return;
      }

      if (existingUser) {
        Toast.show({
          type: "error",
          text1: "Account already exists",
          text2: "Email or username is already used.",
        });

        return;
      }

      const idImageUrl = await uploadIdImage();

      /* CREATE AUTH USER */
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
            username: cleanUsername,
            role: "user",
          },
        },
      });

      if (authError) {
        Toast.show({
          type: "error",
          text1: "Signup failed",
          text2: authError.message,
        });

        return;
      }

      /* SAVE TO PROFILES */
      const { data: insertData, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            name: name.trim(),
            email: cleanEmail,
            username: cleanUsername,
            password: password,
            role: "user",
            address: finalAddress,
            location: finalAddress,
            id_type: idType,
            id_image: idImageUrl,
            profile_image: null,
            status: "pending",
            reject_reason: null,
          },
        ])
        .select();
      /*const idImageUrl = await uploadIdImage();

      const { data: insertData, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            name: name.trim(),
            email: cleanEmail,
            username: cleanUsername,
            password: password,
            role: "user",
            address: finalAddress,
            location: finalAddress,
            id_type: idType,
            id_image: idImageUrl,
            profile_image: null,
            status: "pending",
            reject_reason: null,
          },
        ])
        .select();*/

      console.log("SUPABASE INSERT DATA:", insertData);
      console.log("SUPABASE INSERT ERROR:", insertError);

      if (insertError) {
        Toast.show({
          type: "error",
          text1: "Signup failed",
          text2: insertError.message,
        });

        return;
      }

      Toast.show({
        type: "success",
        text1: "Submitted for approval",
        text2: "Please wait for admin approval before signing in.",
      });

      router.push("/signin");
    } catch (error: any) {
      console.log("SUPABASE SIGNUP ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Signup failed",
        text2: error?.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#DDEFD3",
      }}
      edges={["top"]}
    >
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
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
        style={{
          flex: 1,
          backgroundColor: "transparent",
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              flexGrow: 1,
              paddingBottom: 80,
              backgroundColor: "transparent",
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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

          <Text
            style={{
              width: "85%",
              alignSelf: "center",
              marginTop: -6,
              marginBottom: 10,
              fontSize: 11,
              color: "#2E7D32",
              fontWeight: "500",
              lineHeight: 15,
            }}
          >
            Please use a working email address. Your approval or rejection
            message will be sent to this email.
          </Text>

          {email.length > 0 && emailRules.some((r) => !r.met) && (
            <RulesBox rules={emailRules.filter((r) => !r.met)} />
          )}

          <Text style={styles.label}>Username</Text>
          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/individual.png")}
              style={styles.icon}
            />

            <TextInput
              placeholder="Create a username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              placeholderTextColor="#7a7a7a"
              autoCorrect={false}
            />
          </View>

          {username.length > 0 && usernameRules.some((r) => !r.met) && (
            <RulesBox rules={usernameRules.filter((r) => !r.met)} />
          )}

          <Text style={styles.label}>Address</Text>

          <DropdownBox
            value={province}
            placeholder="Select Province"
            options={provinces}
            onSelect={(value) => {
              setProvince(value);
              setCity("");
              setBarangay("");
              setStreet("");
              setMapSearchText("");
              setMapLatitude(null);
              setMapLongitude(null);
              setCities([]);
              setBarangays([]);

              updateFullAddress("", "", "", value);

              if (value) {
                fetchCities(value);
              }
            }}
          />

          <DropdownBox
            value={city}
            placeholder="Select City / Municipality"
            options={cities}
            disabled={!province}
            onSelect={(value) => {
              setCity(value);
              setBarangay("");
              setStreet("");
              setMapSearchText("");
              setBarangays([]);

              updateFullAddress("", "", value, province);

              if (value) {
                fetchBarangays(value);
                moveMapToSelectedAddress(province, value, "");
              }
            }}
          />

          <DropdownBox
            value={barangay}
            placeholder="Select Barangay"
            options={barangays}
            disabled={!city}
            onSelect={(value) => {
              setBarangay(value);
              setStreet("");
              setMapSearchText("");

              updateFullAddress("", value, city, province);

              if (value) {
                moveMapToSelectedAddress(province, city, value);
              }
            }}
          />

          <View style={styles.inputBox}>
            <Image
              source={require("../assets/icons/location.png")}
              style={styles.icon}
            />

            <TextInput
              placeholder="Auto-filled after selecting map location"
              placeholderTextColor="#7a7a7a"
              value={street}
              editable={false}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Map Address Auto-Fill</Text>

          <View
            style={{
              width: "85%",
              alignSelf: "center",
              backgroundColor: "rgba(255, 255, 255, 0.45)",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              borderWidth: 0.5,
              borderColor: "rgba(200, 230, 201, 0.6)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#444",
                marginBottom: 8,
                lineHeight: 16,
              }}
            >
              Type an address above the map, tap the map, or use your current
              location to auto-fill your address. This will be displayed in your
              profile.
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <TextInput
                placeholder="Search address or place"
                placeholderTextColor="#777"
                value={mapSearchText}
                onChangeText={setMapSearchText}
                onSubmitEditing={searchMapLocation}
                returnKeyType="search"
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#c8e6c9",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: Platform.OS === "ios" ? 12 : 9,
                  fontSize: 13,
                  color: "#222",
                }}
              />

              {mapSearchText.trim().length > 0 && (
                <Pressable
                  onPress={() => setMapSearchText("")}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#e8f5e9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#2E7D32",
                      fontSize: 20,
                      fontWeight: "700",
                      marginTop: -2,
                    }}
                  >
                    ×
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={searchMapLocation}
              disabled={isSearchingMap}
              style={{
                backgroundColor: isSearchingMap ? "#8aa887" : "#2E7D32",
                paddingVertical: 11,
                borderRadius: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {isSearchingMap ? "Searching..." : "Search Location"}
              </Text>
            </Pressable>

            <View
              style={{
                height: 260,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#ddd",
              }}
            >
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: mapLatitude || 10.3157,
                  longitude: mapLongitude || 123.8854,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                onPress={async (event) => {
                  const lat = event.nativeEvent.coordinate.latitude;
                  const lng = event.nativeEvent.coordinate.longitude;

                  setMapLatitude(lat);
                  setMapLongitude(lng);

                  await updateAddressFromPin(lat, lng);
                }}
              >
                {mapLatitude !== null && mapLongitude !== null && (
                  <Marker
                    coordinate={{
                      latitude: mapLatitude,
                      longitude: mapLongitude,
                    }}
                    draggable
                    title="Selected Address"
                    description="For address auto-fill only"
                    pinColor="green"
                    onDragEnd={async (event) => {
                      const lat = event.nativeEvent.coordinate.latitude;
                      const lng = event.nativeEvent.coordinate.longitude;

                      setMapLatitude(lat);
                      setMapLongitude(lng);

                      await updateAddressFromPin(lat, lng);
                    }}
                  />
                )}
              </MapView>
            </View>

            <Pressable
              onPress={getCurrentUserLocation}
              style={{
                backgroundColor: "#2E7D32",
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Use Current Location
              </Text>
            </Pressable>

            {mapLatitude !== null && mapLongitude !== null && (
              <Text
                style={{
                  fontSize: 11,
                  color: "#2E7D32",
                  marginTop: 8,
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Address location selected.
              </Text>
            )}
          </View>

          <Text style={styles.label}>Type of ID</Text>

          <Pressable
            onPress={() =>
              openDropdown("Type of ID", ID_TYPES, (value) => {
                setIdType(value);
              })
            }
            style={[styles.inputBox, { justifyContent: "space-between" }]}
          >
            <Text
              style={{
                color: idType ? "#333" : "#7a7a7a",
                flex: 1,
                fontSize: 14,
              }}
            >
              {idType || "Select ID type"}
            </Text>

            <Text style={{ color: "#666", fontSize: 13 }}>▼</Text>
          </Pressable>

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
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#7a7a7a"
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
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#7a7a7a"
            />

            <Pressable onPress={() => setSecure2(!secure2)}>
              <Ionicons
                name={secure2 ? "eye-off" : "eye"}
                size={22}
                color="#666"
              />
            </Pressable>
          </View>

          {confirmpass.length > 0 && confirmRules.some((r) => !r.met) && (
            <RulesBox rules={confirmRules.filter((r) => !r.met)} />
          )}

          <Pressable
            style={[
              styles.button,
              {
                zIndex: 10,
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.25)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={() => setDropdownVisible(false)}
        >
          <Pressable
            style={{
              width: "100%",
              maxHeight: "70%",
              backgroundColor: "#fff",
              borderRadius: 18,
              overflow: "hidden",
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <View
              style={{
                padding: 16,
                backgroundColor: "#2E7D32",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {dropdownTitle}
              </Text>
            </View>

            <ScrollView>
              {dropdownOptions.length > 0 ? (
                dropdownOptions.map((option, index) => (
                  <Pressable
                    key={`${option}-${index}`}
                    onPress={() => selectDropdownValue(option)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 18,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#333",
                      }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View
                  style={{
                    padding: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#777",
                      fontSize: 14,
                    }}
                  >
                    No options available.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
