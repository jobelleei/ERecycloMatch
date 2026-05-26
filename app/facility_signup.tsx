import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Keyboard,
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
import styles from "./styles/facility_signup";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import { supabase } from "../utils/supabase";

const PSGC_API = "https://psgc.gitlab.io/api";

export default function FacilitySignup() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

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
    onSelect: (value: string) => void
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

  const updateFullLocation = (
    newStreet = street,
    newBarangay = barangay,
    newCity = city,
    newProvince = province
  ) => {
    const parts = [newProvince, newCity, newBarangay, newStreet].filter(
      (part) => String(part).trim() !== ""
    );

    setLocation(parts.join(", "));
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
        (p: any) => p.name.toLowerCase() === selectedProvince.toLowerCase()
      );

      if (!provinceFound) {
        setCities([]);
        return;
      }

      const response = await axios.get(
        `${PSGC_API}/provinces/${provinceFound.code}/cities-municipalities`
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
        (c: any) => c.name.toLowerCase() === selectedCity.toLowerCase()
      );

      if (!cityFound) {
        setBarangays([]);
        return;
      }

      const barangayResponse = await axios.get(
        `${PSGC_API}/cities-municipalities/${cityFound.code}/barangays`
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
    selectedBarangay: string
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

      console.log("MOVING MAP TO:", searchAddress);

      const results = await Location.geocodeAsync(searchAddress);

      console.log("MOVE MAP GEOCODE RESULT:", results);

      if (results && results.length > 0) {
        const lat = results[0].latitude;
        const lng = results[0].longitude;

        setLatitude(lat);
        setLongitude(lng);
        setMapSearchText(searchAddress);

        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: selectedBarangay ? 0.01 : 0.03,
            longitudeDelta: selectedBarangay ? 0.01 : 0.03,
          },
          700
        );

        await updateAddressFromPin(
          lat,
          lng,
          selectedProvince,
          selectedCity,
          selectedBarangay
        );
      }
    } catch (error) {
      console.log("MOVE MAP TO SELECTED ADDRESS ERROR:", error);
    }
  };

  const updateAddressFromPin = async (
    lat: number,
    lng: number,
    selectedProvince = province,
    selectedCity = city,
    selectedBarangay = barangay
  ) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      console.log("REVERSE GEOCODE RESULT:", results);

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
        exactStreet = `Pinned location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      }

      setStreet(exactStreet);

      updateFullLocation(
        exactStreet,
        selectedBarangay,
        selectedCity,
        selectedProvince
      );
    } catch (error) {
      console.log("REVERSE GEOCODE ERROR:", error);

      const fallbackStreet = `Pinned location (${lat.toFixed(6)}, ${lng.toFixed(
        6
      )})`;

      setStreet(fallbackStreet);

      updateFullLocation(
        fallbackStreet,
        selectedBarangay,
        selectedCity,
        selectedProvince
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

      const searchParts = [
        cleanSearch,
        barangay,
        city,
        province,
        "Philippines",
      ]
        .filter((part) => String(part).trim() !== "")
        .join(", ");

      console.log("SEARCHING FACILITY MAP LOCATION:", searchParts);

      const results = await Location.geocodeAsync(searchParts);

      console.log("FACILITY MAP SEARCH RESULT:", results);

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

      setLatitude(lat);
      setLongitude(lng);

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );

      await updateAddressFromPin(lat, lng);

      Toast.show({
        type: "success",
        text1: "Location found",
        text2: "The facility pin was moved to the searched location.",
      });
    } catch (error) {
      console.log("SEARCH FACILITY MAP LOCATION ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: "Unable to search this location.",
      });
    } finally {
      setIsSearchingMap(false);
    }
  };

  const getCurrentFacilityLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Location permission required",
          text2: "Please allow location access to set your exact facility pin.",
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);
      setMapSearchText("");

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );

      await updateAddressFromPin(lat, lng);

      Toast.show({
        type: "success",
        text1: "Exact location set",
        text2: "You can drag the pin to adjust it.",
      });
    } catch (error) {
      console.log("GET CURRENT LOCATION ERROR:", error);

      Toast.show({
        type: "error",
        text1: "Location error",
        text2: "Failed to get current location.",
      });
    }
  };

  const emailRules = [
    {
      label: "Must be a valid email address",
      met: email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    },
    {
      label: "No spaces allowed",
      met: email.length > 0 && !/\s/.test(email),
    },
  ];

  const contactRules = [
    { label: "Must start with 09", met: contactNum.startsWith("09") },
    { label: "Must be exactly 11 digits", met: contactNum.length === 11 },
    {
      label: "Numbers only",
      met: contactNum.length > 0 && /^[0-9]+$/.test(contactNum),
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
      met: confirmPass.length > 0 && password === confirmPass,
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

  const uploadCertificationImage = async () => {
    if (!image?.uri) {
      throw new Error("No certification image selected");
    }

    const extension = getImageExtension(image.uri);
    const contentType = getContentType(extension);

    const safeName =
      name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "facility";

    const filePath = `facility-certifications/${safeName}-${Date.now()}.${extension}`;

    console.log("UPLOADING CERTIFICATION IMAGE TO:", filePath);

    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("facility-certifications")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    console.log("CERTIFICATION UPLOAD DATA:", uploadData);
    console.log("CERTIFICATION UPLOAD ERROR:", uploadError);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("facility-certifications")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const buildFinalLocation = () => {
    return (
      location ||
      [province, city, barangay, street]
        .filter((part) => String(part).trim() !== "")
        .join(", ")
    );
  };

  const handleSignUp = async () => {
    console.log("FACILITY SIGNUP CLICKED");

    const finalLocation = buildFinalLocation();

    if (
      !name.trim() ||
      !province ||
      !city ||
      !barangay ||
      !finalLocation ||
      !email.trim() ||
      !contactNum.trim() ||
      !password ||
      !confirmPass ||
      !image
    ) {
      Toast.show({
        type: "error",
        text1: "Please complete all fields",
      });
      return;
    }

    if (latitude === null || longitude === null) {
      Toast.show({
        type: "error",
        text1: "Exact facility location required",
        text2: "Please tap the map, search address, or use current location to set your pin.",
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

    if (!contactRules.every((r) => r.met)) {
      Toast.show({
        type: "error",
        text1: "Invalid contact number",
        text2: "Must start with 09 and be exactly 11 digits",
      });
      return;
    }

    if (password !== confirmPass) {
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

      const { data: existingFacility, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (checkError) {
        console.log("CHECK FACILITY ERROR:", checkError);

        Toast.show({
          type: "error",
          text1: "Unable to check account",
          text2: checkError.message,
        });

        return;
      }

      if (existingFacility) {
        Toast.show({
          type: "error",
          text1: "Account already exists",
          text2: "This email is already used.",
        });

        return;
      }

      const certificationUrl = await uploadCertificationImage();

      const { data: insertData, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            name: name.trim(),
            email: cleanEmail,
            username: null,
            password: password,
            role: "facility",
            address: finalLocation,
            location: finalLocation,
            latitude: latitude,
            longitude: longitude,
            contact_num: contactNum.trim(),
            certification: certificationUrl,
            profile_image: null,
            status: "pending",
            reject_reason: null,
          },
        ])
        .select();

      console.log("SUPABASE FACILITY INSERT DATA:", insertData);
      console.log("SUPABASE FACILITY INSERT ERROR:", insertError);

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
      console.log("SUPABASE FACILITY SIGNUP ERROR:", error);

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
    <View style={{ flex: 1, backgroundColor: "#DDEFD3" }}>
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: "transparent",
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/icons/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Sign up and join the platform today.</Text>

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

        <Text style={styles.label}>Facility Name</Text>
        <View style={styles.inputBox}>
          <Image
            source={require("../assets/icons/facility.png")}
            style={styles.icon}
          />

          <TextInput
            placeholder="Enter facility name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#7a7a7a"
          />
        </View>

        <Text style={styles.label}>Facility Address</Text>

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
            setLatitude(null);
            setLongitude(null);
            setCities([]);
            setBarangays([]);

            updateFullLocation("", "", "", value);

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

            updateFullLocation("", "", value, province);

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

            updateFullLocation("", value, city, province);

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
            placeholder="Auto-filled after pinning exact location"
            value={street}
            editable={false}
            style={styles.input}
            placeholderTextColor="#7a7a7a"
          />
        </View>

        <Text style={styles.label}>Exact Facility Location</Text>

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
            Type your facility address above the map, tap the map, or use your
            current location. Drag the pin to adjust the exact location.
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
              placeholder="Search facility address or place"
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
                latitude: latitude || 10.3157,
                longitude: longitude || 123.8854,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onPress={async (event) => {
                const lat = event.nativeEvent.coordinate.latitude;
                const lng = event.nativeEvent.coordinate.longitude;

                setLatitude(lat);
                setLongitude(lng);

                await updateAddressFromPin(lat, lng);
              }}
            >
              {latitude !== null && longitude !== null && (
                <Marker
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  draggable
                  title="Facility Location"
                  description="Drag to adjust exact location"
                  pinColor="green"
                  onDragEnd={async (event) => {
                    const lat = event.nativeEvent.coordinate.latitude;
                    const lng = event.nativeEvent.coordinate.longitude;

                    setLatitude(lat);
                    setLongitude(lng);

                    await updateAddressFromPin(lat, lng);
                  }}
                />
              )}
            </MapView>
          </View>

          <Pressable
            onPress={getCurrentFacilityLocation}
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

          {latitude !== null && longitude !== null && (
            <Text
              style={{
                fontSize: 11,
                color: "#2E7D32",
                marginTop: 8,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Pin set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
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
            autoCorrect={false}
            placeholderTextColor="#7a7a7a"
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
          Please use a working email address. Your facility approval or
          rejection message will be sent to this email.
        </Text>

        {email.length > 0 && emailRules.some((r) => !r.met) && (
          <RulesBox rules={emailRules.filter((r) => !r.met)} />
        )}

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
            placeholderTextColor="#7a7a7a"
          />
        </View>

        {contactNum.length > 0 && contactRules.some((r) => !r.met) && (
          <RulesBox rules={contactRules.filter((r) => !r.met)} />
        )}

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
            placeholder="Confirm your password"
            secureTextEntry={secure2}
            value={confirmPass}
            onChangeText={setConfirmPass}
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

        {confirmPass.length > 0 && confirmRules.some((r) => !r.met) && (
          <RulesBox rules={confirmRules.filter((r) => !r.met)} />
        )}

        <Text style={styles.label}>
          Facility Certification{" "}
          <Text style={{ color: "#2E7D32" }}>(Required)</Text>
        </Text>

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
            image && {
              height: (image.height / image.width) * 300,
            },
          ]}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
          ) : (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 13, color: "#555" }}>
                Tap to Open Camera
              </Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.helper}>
          This helps us verify your facility is legitimate and compliant
        </Text>

        <Pressable
          style={[
            styles.button,
            {
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

        <Pressable onPress={() => router.push("/signin")}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </Pressable>
      </ScrollView>

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
    </View>
  );
}