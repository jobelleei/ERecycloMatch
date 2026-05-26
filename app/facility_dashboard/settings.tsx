import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const ACCEPTED_ITEM_OPTIONS = [
  "Laptop",
  "Smartphone",
  "Printer",
  "Camera",
  "Battery",
  "Speaker",
  "Microwave",
  "Oven",
  "Toaster",
  "Refrigerator",
  "Air Conditioner",
  "Boiler",
  "Calculator",
  "Bar Phone",
  "Blood Pressure Monitor",
  "Ceiling Fan",
  "Christmas Lights",
  "Clothes Iron",
  "Coffee Machine",
  "Compact Fluorescent Lamps",
  "Computer Keyboard",
  "Computer Mouse",
  "Drone",
  "DVD Player",
  "Earphones",
  "Flash Drive / USB",
  "Game Console",
  "Hair Dryer",
  "Hard Drive",
  "Headphones",
  "Keyboard",
  "Laptop Charger",
  "Monitor",
  "Motherboard",
  "Mouse",
  "Phone Charger",
  "Power Bank",
  "Projector",
  "Radio",
  "Remote Control",
  "Router",
  "Scanner",
  "Smartwatch",
  "Tablet",
  "Television",
  "Vacuum Cleaner",
  "Washing Machine",
  "Webcam",
  "WiFi Router",
  "CPU",
  "Circuit Board",
  "Modem",
  "PCB",
  "Fan",
  "Electric Kettle",
  "Rice Cooker",
  "Blender",
  "CCTV Camera",
  "Cable",
  "Extension Cord",
  "GPU",
  "RAM",
  "SSD",
  "HDD",
  "UPS",
  "Electric Drill",
  "Electric Shaver",
  "Torchlight",
  "Alarm Clock",
  "MP3 Player",
  "Landline Telephone",
  "Video Camera",
  "Walkie Talkie",
  "Electric Toothbrush",
  "Stylus Pen",
  "Digital Clock",
];

const SERVICE_OPTIONS = [
  "Buying recyclable items",
  "E-Waste collection",
  "Scrap disposal",
  "Item pickup",
  "Repair and refurbishing",
  "Battery disposal",
  "Bulk e-waste collection",
  "Corporate e-waste collection",
  "Data destruction",
  "Parts recovery",
];

const HOUR_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const MINUTE_OPTIONS = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

const PERIOD_OPTIONS = ["AM", "PM"];

type TimeTarget = "from" | "to";

export default function FacilitySettings() {
  const router = useRouter();

  const [facility, setFacility] = useState({
    id: "",
    name: "",
    email: "",
    address: "",
    location: "",
    profileImage: "",
    profileImagePath: "",
    operatingHoursFrom: "",
    operatingHoursTo: "",
    acceptedItemTypes: "",
    availableServices: "",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editName, setEditName] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [editProfileImagePath, setEditProfileImagePath] = useState("");

  const [editOperatingHoursFrom, setEditOperatingHoursFrom] = useState("");
  const [editOperatingHoursTo, setEditOperatingHoursTo] = useState("");
  const [editAcceptedItemTypes, setEditAcceptedItemTypes] = useState("");
  const [editAvailableServices, setEditAvailableServices] = useState("");

  const [acceptedDropdownVisible, setAcceptedDropdownVisible] = useState(false);
  const [servicesDropdownVisible, setServicesDropdownVisible] = useState(false);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timeTarget, setTimeTarget] = useState<TimeTarget>("from");
  const [selectedHour, setSelectedHour] = useState("8");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  useEffect(() => {
    loadFacility();
  }, []);

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path || String(path).trim() === "") return "";

    const cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const fixedPath = cleanPath.replace(/^\/+/, "");
    const { data } = supabase.storage.from(bucket).getPublicUrl(fixedPath);

    return data?.publicUrl || "";
  };

  const getProfileImageUrl = (image: string) => {
    if (!image || String(image).trim() === "") return "";
    return getPublicImageUrl("profile-images", image);
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

  const splitCommaValues = (value: string) => {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const normalizeCommaValues = (value: string) => {
    const uniqueValues: string[] = [];

    splitCommaValues(value).forEach((item) => {
      const alreadyExists = uniqueValues.some(
        (existing) => existing.toLowerCase() === item.toLowerCase()
      );

      if (!alreadyExists) {
        uniqueValues.push(item);
      }
    });

    return uniqueValues.join(", ");
  };

  const getCurrentTypingValue = (value: string) => {
    const parts = String(value || "").split(",");
    return parts[parts.length - 1]?.trim() || "";
  };

  const getFilteredOptions = (options: string[], value: string) => {
    const keyword = getCurrentTypingValue(value).toLowerCase();

    if (!keyword) {
      return options;
    }

    const keywordIsAlreadySelectedOption = splitCommaValues(value).some(
      (item) => item.toLowerCase() === keyword
    );

    const keywordMatchesFullOption = options.some(
      (option) => option.toLowerCase() === keyword
    );

    if (keywordIsAlreadySelectedOption && keywordMatchesFullOption) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(keyword));
  };

  const isOptionSelected = (currentValue: string, option: string) => {
    return splitCommaValues(currentValue).some(
      (item) => item.toLowerCase() === option.toLowerCase()
    );
  };

  const toggleDropdownOption = (
    currentValue: string,
    option: string,
    setter: (value: string) => void,
    options: string[]
  ) => {
    const values = splitCommaValues(currentValue);
    const optionLower = option.toLowerCase();
    const typedValue = getCurrentTypingValue(currentValue);
    const typedValueLower = typedValue.toLowerCase();

    const selected = values.some((item) => item.toLowerCase() === optionLower);

    if (selected) {
      const updatedValues = values.filter(
        (item) => item.toLowerCase() !== optionLower
      );

      setter(normalizeCommaValues(updatedValues.join(", ")));
      return;
    }

    const typedValueIsFullOption = options.some(
      (item) => item.toLowerCase() === typedValueLower
    );

    const baseValues = values.filter((item) => {
      const itemLower = item.toLowerCase();
      const sameAsOption = itemLower === optionLower;

      const sameAsUnfinishedTypedText =
        typedValue.length > 0 &&
        itemLower === typedValueLower &&
        !typedValueIsFullOption;

      return !sameAsOption && !sameAsUnfinishedTypedText;
    });

    setter(normalizeCommaValues([...baseValues, option].join(", ")));
  };

  const parseTimeValue = (value: string) => {
    const cleanValue = String(value || "").trim();
    const match = cleanValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

    if (!match) {
      return {
        hour: "8",
        minute: "00",
        period: "AM",
      };
    }

    return {
      hour: match[1],
      minute: match[2],
      period: match[3].toUpperCase(),
    };
  };

  const openTimePicker = (target: TimeTarget) => {
    Keyboard.dismiss();
    setAcceptedDropdownVisible(false);
    setServicesDropdownVisible(false);

    const currentValue =
      target === "from" ? editOperatingHoursFrom : editOperatingHoursTo;

    const parsedTime = parseTimeValue(currentValue);

    setTimeTarget(target);
    setSelectedHour(parsedTime.hour);
    setSelectedMinute(parsedTime.minute);
    setSelectedPeriod(parsedTime.period);
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    const finalTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

    if (timeTarget === "from") {
      setEditOperatingHoursFrom(finalTime);
    } else {
      setEditOperatingHoursTo(finalTime);
    }

    setTimePickerVisible(false);
  };

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        router.replace("/signin" as any);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const facilityId =
        actualUser?.id ||
        actualUser?.facility_id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user_id ||
        "";

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role && role !== "facility") {
        router.replace("/user_dashboard" as any);
        return;
      }

      const profileImage =
        actualUser?.profileImage ||
        actualUser?.profile_image ||
        parsed?.profileImage ||
        parsed?.profile_image ||
        "";

      const finalFacility = {
        id: String(facilityId),
        name:
          actualUser?.name ||
          actualUser?.facility_name ||
          parsed?.name ||
          parsed?.facility_name ||
          "Facility",
        email: actualUser?.email || parsed?.email || "",
        address:
          actualUser?.address ||
          actualUser?.location ||
          parsed?.address ||
          parsed?.location ||
          "No location added",
        location:
          actualUser?.location ||
          actualUser?.address ||
          parsed?.location ||
          parsed?.address ||
          "No location added",
        profileImage: getProfileImageUrl(String(profileImage || "")),
        profileImagePath: String(profileImage || ""),
        operatingHoursFrom:
          actualUser?.operating_hours_from ||
          parsed?.operating_hours_from ||
          "",
        operatingHoursTo:
          actualUser?.operating_hours_to || parsed?.operating_hours_to || "",
        acceptedItemTypes:
          actualUser?.accepted_item_types || parsed?.accepted_item_types || "",
        availableServices:
          actualUser?.available_services || parsed?.available_services || "",
      };

      setFacility(finalFacility);

      if (facilityId) {
        fetchFacilityFromSupabase(String(facilityId), finalFacility);
      }
    } catch (error) {
      console.log("LOAD FACILITY SETTINGS ERROR:", error);
    }
  };

  const fetchFacilityFromSupabase = async (
    facilityId: string,
    fallbackFacility: any
  ) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", facilityId)
        .eq("role", "facility")
        .maybeSingle();

      if (error) {
        console.log("FETCH FACILITY SETTINGS ERROR:", error);
        return;
      }

      if (!data) return;

      const profileImagePath = data.profile_image || "";

      const updatedFacility = {
        id: String(data.id || fallbackFacility.id),
        name: data.name || fallbackFacility.name,
        email: data.email || fallbackFacility.email,
        address: data.address || data.location || fallbackFacility.address,
        location: data.location || data.address || fallbackFacility.location,
        profileImage: profileImagePath
          ? getProfileImageUrl(profileImagePath)
          : fallbackFacility.profileImage,
        profileImagePath: profileImagePath || fallbackFacility.profileImagePath,
        operatingHoursFrom:
          data.operating_hours_from || fallbackFacility.operatingHoursFrom || "",
        operatingHoursTo:
          data.operating_hours_to || fallbackFacility.operatingHoursTo || "",
        acceptedItemTypes:
          data.accepted_item_types || fallbackFacility.acceptedItemTypes || "",
        availableServices:
          data.available_services || fallbackFacility.availableServices || "",
      };

      setFacility(updatedFacility);

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedStoredFacility = {
          ...parsed,
          id: updatedFacility.id,
          name: updatedFacility.name,
          email: updatedFacility.email,
          address: updatedFacility.address,
          location: updatedFacility.location,
          profileImage: updatedFacility.profileImage,
          profile_image: updatedFacility.profileImagePath,
          operating_hours_from: updatedFacility.operatingHoursFrom,
          operating_hours_to: updatedFacility.operatingHoursTo,
          accepted_item_types: updatedFacility.acceptedItemTypes,
          available_services: updatedFacility.availableServices,
          role: "facility",
        };

        if (parsed.user) {
          updatedStoredFacility.user = {
            ...parsed.user,
            id: updatedFacility.id,
            name: updatedFacility.name,
            email: updatedFacility.email,
            address: updatedFacility.address,
            location: updatedFacility.location,
            profileImage: updatedFacility.profileImage,
            profile_image: updatedFacility.profileImagePath,
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItemTypes,
            available_services: updatedFacility.availableServices,
            role: "facility",
          };
        }

        if (parsed.data) {
          updatedStoredFacility.data = {
            ...parsed.data,
            id: updatedFacility.id,
            name: updatedFacility.name,
            email: updatedFacility.email,
            address: updatedFacility.address,
            location: updatedFacility.location,
            profileImage: updatedFacility.profileImage,
            profile_image: updatedFacility.profileImagePath,
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItemTypes,
            available_services: updatedFacility.availableServices,
            role: "facility",
          };
        }

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedStoredFacility)
        );
      }
    } catch (error) {
      console.log("FETCH FACILITY SETTINGS ERROR:", error);
    }
  };

  const openEditProfileModal = () => {
    setEditName(facility.name || "");
    setEditProfileImage(facility.profileImage || "");
    setEditProfileImagePath(facility.profileImagePath || "");
    setEditOperatingHoursFrom(facility.operatingHoursFrom || "");
    setEditOperatingHoursTo(facility.operatingHoursTo || "");
    setEditAcceptedItemTypes(normalizeCommaValues(facility.acceptedItemTypes));
    setEditAvailableServices(normalizeCommaValues(facility.availableServices));
    setAcceptedDropdownVisible(false);
    setServicesDropdownVisible(false);
    setTimePickerVisible(false);
    setEditModalVisible(true);
  };

  const validateEditProfile = () => {
    if (!editName.trim()) {
      Alert.alert("Missing Name", "Please enter your facility name.");
      return false;
    }

    if (!editOperatingHoursFrom.trim()) {
      Alert.alert("Missing Operating Hours", "Please select opening time.");
      return false;
    }

    if (!editOperatingHoursTo.trim()) {
      Alert.alert("Missing Operating Hours", "Please select closing time.");
      return false;
    }

    if (!normalizeCommaValues(editAcceptedItemTypes).trim()) {
      Alert.alert(
        "Missing Accepted Items",
        "Please select or type at least one accepted item."
      );
      return false;
    }

    if (!normalizeCommaValues(editAvailableServices).trim()) {
      Alert.alert(
        "Missing Available Services",
        "Please select or type at least one available service."
      );
      return false;
    }

    return true;
  };

  const changeProfilePhotoInModal = async () => {
    try {
      if (!facility.id) {
        Alert.alert(
          "Facility Error",
          "Facility ID not found. Please log in again."
        );
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Denied", "Please allow access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;

      setUploadingPhoto(true);

      const extension = getImageExtension(imageUri);
      const contentType = getContentType(extension);
      const filePath = `facilities/${facility.id}-${Date.now()}.${extension}`;

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        Alert.alert("Upload Failed", uploadError.message);
        return;
      }

      const imageUrl = getProfileImageUrl(filePath);

      setEditProfileImage(imageUrl);
      setEditProfileImagePath(filePath);

      Alert.alert("Photo Selected", "Profile photo is ready to save.");
    } catch (error: any) {
      console.log("FACILITY PROFILE PHOTO UPLOAD ERROR:", error);
      Alert.alert(
        "Upload Failed",
        error?.message || "Failed to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfileChanges = async () => {
    try {
      const cleanedAcceptedItems = normalizeCommaValues(editAcceptedItemTypes);
      const cleanedAvailableServices = normalizeCommaValues(
        editAvailableServices
      );

      setEditAcceptedItemTypes(cleanedAcceptedItems);
      setEditAvailableServices(cleanedAvailableServices);

      if (!validateEditProfile()) return;

      if (!facility.id) {
        Alert.alert(
          "Facility Error",
          "Facility ID not found. Please log in again."
        );
        return;
      }

      setSavingProfile(true);

      const cleanName = editName.trim();
      const cleanOperatingHoursFrom = editOperatingHoursFrom.trim();
      const cleanOperatingHoursTo = editOperatingHoursTo.trim();

      const updateData: any = {
        name: cleanName,
        operating_hours_from: cleanOperatingHoursFrom,
        operating_hours_to: cleanOperatingHoursTo,
        accepted_item_types: cleanedAcceptedItems,
        available_services: cleanedAvailableServices,
      };

      if (editProfileImagePath) {
        updateData.profile_image = editProfileImagePath;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", facility.id)
        .eq("role", "facility")
        .select()
        .single();

      if (updateError) {
        Alert.alert("Update Failed", updateError.message);
        return;
      }

      const updatedFacility = {
        ...facility,
        name: updatedProfile?.name || cleanName,
        email: updatedProfile?.email || facility.email,
        address: facility.address,
        location: facility.location,
        profileImage: editProfileImage || facility.profileImage,
        profileImagePath: updatedProfile?.profile_image || editProfileImagePath,
        operatingHoursFrom:
          updatedProfile?.operating_hours_from || cleanOperatingHoursFrom,
        operatingHoursTo:
          updatedProfile?.operating_hours_to || cleanOperatingHoursTo,
        acceptedItemTypes:
          updatedProfile?.accepted_item_types || cleanedAcceptedItems,
        availableServices:
          updatedProfile?.available_services || cleanedAvailableServices,
      };

      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        const updatedStoredFacility = {
          ...parsed,
          name: updatedFacility.name,
          email: updatedFacility.email,
          address: updatedFacility.address,
          location: updatedFacility.location,
          profileImage: updatedFacility.profileImage,
          profile_image: updatedFacility.profileImagePath,
          operating_hours_from: updatedFacility.operatingHoursFrom,
          operating_hours_to: updatedFacility.operatingHoursTo,
          accepted_item_types: updatedFacility.acceptedItemTypes,
          available_services: updatedFacility.availableServices,
          role: "facility",
        };

        if (parsed.user) {
          updatedStoredFacility.user = {
            ...parsed.user,
            name: updatedFacility.name,
            email: updatedFacility.email,
            address: updatedFacility.address,
            location: updatedFacility.location,
            profileImage: updatedFacility.profileImage,
            profile_image: updatedFacility.profileImagePath,
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItemTypes,
            available_services: updatedFacility.availableServices,
            role: "facility",
          };
        }

        if (parsed.data) {
          updatedStoredFacility.data = {
            ...parsed.data,
            name: updatedFacility.name,
            email: updatedFacility.email,
            address: updatedFacility.address,
            location: updatedFacility.location,
            profileImage: updatedFacility.profileImage,
            profile_image: updatedFacility.profileImagePath,
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItemTypes,
            available_services: updatedFacility.availableServices,
            role: "facility",
          };
        }

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedStoredFacility)
        );
      }

      setFacility(updatedFacility);
      setAcceptedDropdownVisible(false);
      setServicesDropdownVisible(false);
      setTimePickerVisible(false);
      setEditModalVisible(false);

      Alert.alert("Success", "Your facility profile details were updated.");
    } catch (error: any) {
      console.log("SAVE FACILITY PROFILE ERROR:", error);
      Alert.alert(
        "Update Failed",
        error?.message || "Unable to update facility profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/signin" as any);
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your facility account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteFacilityAccount,
        },
      ]
    );
  };

  const deleteFacilityAccount = async () => {
    try {
      if (!facility.id) {
        Alert.alert(
          "Facility Error",
          "Facility ID not found. Please log in again."
        );
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          status: "deleted",
        })
        .eq("id", facility.id)
        .eq("role", "facility");

      if (error) {
        Alert.alert("Delete Failed", error.message);
        return;
      }

      await AsyncStorage.removeItem("user");

      Alert.alert("Account Deleted", "Your facility account has been deleted.", [
        {
          text: "OK",
          onPress: () => router.replace("/signin" as any),
        },
      ]);
    } catch (error: any) {
      console.log("DELETE FACILITY ACCOUNT ERROR:", error);
      Alert.alert(
        "Delete Failed",
        error?.message || "Unable to delete facility account."
      );
    }
  };

  const renderDropdownInput = (
    label: string,
    helper: string,
    value: string,
    setter: (value: string) => void,
    options: string[],
    visible: boolean,
    setVisible: (value: boolean) => void,
    placeholder: string
  ) => {
    const filteredOptions = getFilteredOptions(options, value);

    const closeAndClean = () => {
      setter(normalizeCommaValues(value));
      setVisible(false);
    };

    return (
      <View style={styles.dropdownField}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={styles.helperText}>{helper}</Text>

        <TextInput
          value={value}
          onChangeText={(text) => {
            setter(text);
            setVisible(true);
          }}
          onFocus={() => setVisible(true)}
          onEndEditing={() => {
            setter(normalizeCommaValues(value));
          }}
          placeholder={placeholder}
          style={[styles.input, styles.largeInput]}
          multiline
        />

        {visible && (
          <View style={styles.dropdownBox}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Suggestions</Text>

              <TouchableOpacity onPress={closeAndClean}>
                <Text style={styles.dropdownClose}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator
              style={styles.dropdownScroll}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const selected = isOptionSelected(value, option);

                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.75}
                      style={[
                        styles.dropdownOption,
                        selected && styles.selectedDropdownOption,
                      ]}
                      onPress={() => {
                        toggleDropdownOption(value, option, setter, options);
                        setVisible(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selected && styles.selectedDropdownOptionText,
                        ]}
                      >
                        {selected ? "✓ " : ""}
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noSuggestionText}>
                  No suggestion found. You can keep typing your own value.
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderTimeColumn = (
    title: string,
    options: string[],
    selectedValue: string,
    setter: (value: string) => void
  ) => {
    return (
      <View style={styles.timeColumn}>
        <Text style={styles.timeColumnTitle}>{title}</Text>

        <ScrollView
          style={styles.timeColumnScroll}
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => {
            const selected = selectedValue === option;

            return (
              <Pressable
                key={`${title}-${option}`}
                style={[
                  styles.timeOption,
                  selected && styles.selectedTimeOption,
                ]}
                onPress={() => setter(option)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    selected && styles.selectedTimeOptionText,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTimePickerPanel = () => {
    if (!timePickerVisible) return null;

    return (
      <View style={styles.centerTimeOverlay}>
        <Pressable
          style={styles.centerTimeBackdrop}
          onPress={() => setTimePickerVisible(false)}
        />

        <View style={styles.centerTimePanel}>
          <Text style={styles.centerTimeTitle}>
            Select {timeTarget === "from" ? "Opening" : "Closing"} Time
          </Text>

          <Text style={styles.centerTimePreview}>
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </Text>

          <View style={styles.centerTimePickerRow}>
            {renderTimeColumn(
              "Hour",
              HOUR_OPTIONS,
              selectedHour,
              setSelectedHour
            )}

            {renderTimeColumn(
              "Minute",
              MINUTE_OPTIONS,
              selectedMinute,
              setSelectedMinute
            )}

            {renderTimeColumn(
              "AM/PM",
              PERIOD_OPTIONS,
              selectedPeriod,
              setSelectedPeriod
            )}
          </View>

          <View style={styles.centerTimeButtons}>
            <TouchableOpacity
              style={styles.timeCancelButton}
              onPress={() => setTimePickerVisible(false)}
            >
              <Text style={styles.timeCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeConfirmButton}
              onPress={confirmTimePicker}
            >
              <Text style={styles.timeConfirmText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.profileHeader}>
          <Image
            source={
              facility.profileImage
                ? { uri: facility.profileImage }
                : require("../../assets/icons/avatar.png")
            }
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <Text style={styles.name}>{facility.name}</Text>
            <Text style={styles.username}>{facility.email}</Text>

            <View style={styles.locationRow}>
              <Image
                source={require("../../assets/icons/location.png")}
                style={styles.locationIcon}
              />

              <Text style={styles.address}>{facility.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileSectionSpacing}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push("/facility_dashboard/my_postings" as any)
              }
            >
              <Image
                source={require("../../assets/icons/price-tag.png")}
                style={styles.icon}
              />

              <Text style={styles.text}>My Postings</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                router.push("/user_dashboard/recycling_history" as any)
              }
            >
              <Image
                source={require("../../assets/icons/recycle.png")}
                style={styles.icon}
              />

              <Text style={styles.text}>Recycling History</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.item} onPress={openEditProfileModal}>
            <Image
              source={require("../../assets/icons/setting_user.png")}
              style={styles.icon}
            />

            <Text style={styles.text}>Edit Profile</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.menu}>
          <View style={styles.item}>
            <Image
              source={require("../../assets/icons/smartphone.png")}
              style={styles.icon}
            />

            <Text style={styles.text}>App Version</Text>
            <Text style={styles.version}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBox} onPress={confirmLogout}>
          <Image
            source={require("../../assets/icons/logout_copy.png")}
            style={styles.logoutIcon}
          />

          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBox} onPress={deleteAccount}>
          <Image
            source={require("../../assets/icons/bin.png")}
            style={styles.deleteIcon}
          />

          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrapper}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalBox}>
              <Text style={styles.modalTitle}>Edit Facility Details</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                contentContainerStyle={styles.editModalScrollContent}
              >
                <View style={styles.profilePhotoSection}>
                  <Image
                    source={
                      editProfileImage
                        ? { uri: editProfileImage }
                        : require("../../assets/icons/avatar.png")
                    }
                    style={styles.modalAvatar}
                  />

                  <TouchableOpacity
                    style={[
                      styles.changePhotoButton,
                      uploadingPhoto && styles.disabledButton,
                    ]}
                    onPress={changeProfilePhotoInModal}
                    disabled={uploadingPhoto}
                  >
                    <Text style={styles.changePhotoText}>
                      {uploadingPhoto ? "Uploading..." : "Change Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Facility Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter facility name"
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={facility.email || "No email saved"}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                />

                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  value={
                    facility.address || facility.location || "No location added"
                  }
                  editable={false}
                  placeholder="Facility location"
                  style={[
                    styles.input,
                    styles.addressInput,
                    styles.disabledInput,
                  ]}
                  multiline
                />

                <Text style={styles.inputLabel}>Operating Hours</Text>

                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputBox}>
                    <Text style={styles.subLabel}>From</Text>

                    <Pressable
                      style={styles.timeTouchableInput}
                      onPress={() => openTimePicker("from")}
                    >
                      <Text
                        style={[
                          styles.timeTouchableText,
                          !editOperatingHoursFrom && styles.placeholderText,
                        ]}
                      >
                        {editOperatingHoursFrom || "Select time"}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.timeInputBox}>
                    <Text style={styles.subLabel}>To</Text>

                    <Pressable
                      style={styles.timeTouchableInput}
                      onPress={() => openTimePicker("to")}
                    >
                      <Text
                        style={[
                          styles.timeTouchableText,
                          !editOperatingHoursTo && styles.placeholderText,
                        ]}
                      >
                        {editOperatingHoursTo || "Select time"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {renderDropdownInput(
                  "Accepted Items",
                  "Tap the field and type to search. Select from the guide or type your own items separated by comma.",
                  editAcceptedItemTypes,
                  setEditAcceptedItemTypes,
                  ACCEPTED_ITEM_OPTIONS,
                  acceptedDropdownVisible,
                  setAcceptedDropdownVisible,
                  "Example: Laptop, Smartphone, Battery"
                )}

                {renderDropdownInput(
                  "Available Services",
                  "Tap the field and type to search. Select from the guide or type your own services separated by comma.",
                  editAvailableServices,
                  setEditAvailableServices,
                  SERVICE_OPTIONS,
                  servicesDropdownVisible,
                  setServicesDropdownVisible,
                  "Example: Buying recyclable items, E-Waste collection"
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setTimePickerVisible(false);
                      setEditModalVisible(false);
                    }}
                    disabled={savingProfile || uploadingPhoto}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (savingProfile || uploadingPhoto) &&
                        styles.disabledButton,
                    ]}
                    onPress={saveProfileChanges}
                    disabled={savingProfile || uploadingPhoto}
                  >
                    <Text style={styles.saveText}>
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {renderTimePickerPanel()}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  topBar: {
    backgroundColor: "#1b5e20",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 22,
    color: "#fff",
    marginRight: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  profileHeader: {
    backgroundColor: "#1b5e20",
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ddd",
  },

  userInfo: {
    marginLeft: 15,
    flex: 1,
  },

  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  username: {
    color: "#dcedc8",
    fontSize: 14,
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
    tintColor: "#fff",
  },

  address: {
    color: "#fff",
    fontSize: 12,
    flex: 1,
  },

  profileSectionSpacing: {
    marginTop: 20,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: 20,
    color: "#777",
    fontWeight: "600",
    fontSize: 14,
  },

  menu: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 14,
    overflow: "hidden",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  icon: {
    width: 22,
    height: 22,
    marginRight: 15,
  },

  text: {
    flex: 1,
    fontSize: 15,
    color: "#222",
  },

  arrow: {
    fontSize: 24,
    color: "#999",
  },

  version: {
    color: "#777",
    fontSize: 14,
  },

  logoutBox: {
    marginTop: 25,
    marginHorizontal: 15,
    backgroundColor: "#1b7f00",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#d8f7d0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#fff",
  },

  logoutText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },

  deleteBox: {
    marginTop: 12,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#b90e18",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#c62828",
  },

  deleteText: {
    fontSize: 15,
    color: "#ff303d",
    fontWeight: "600",
  },

  modalKeyboardWrapper: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  editModalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    maxHeight: "92%",
    overflow: "hidden",
  },

  editModalScrollContent: {
    paddingBottom: 20,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 12,
    textAlign: "center",
  },

  profilePhotoSection: {
    alignItems: "center",
    marginBottom: 15,
  },

  modalAvatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#ddd",
    borderWidth: 3,
    borderColor: "#1b5e20",
  },

  changePhotoButton: {
    marginTop: 10,
    backgroundColor: "#1b5e20",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  changePhotoText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginTop: 12,
    marginBottom: 5,
  },

  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 5,
  },

  helperText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
    lineHeight: 17,
  },

  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: "#222",
  },

  largeInput: {
    minHeight: 68,
    textAlignVertical: "top",
  },

  disabledInput: {
    color: "#777",
    backgroundColor: "#e8e8e8",
  },

  addressInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },

  timeInputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },

  timeInputBox: {
    flex: 1,
  },

  timeTouchableInput: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    minHeight: 45,
    justifyContent: "center",
  },

  timeTouchableText: {
    color: "#222",
    fontSize: 14,
  },

  placeholderText: {
    color: "#999",
  },

  dropdownField: {
    marginTop: 5,
  },

  dropdownBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f4f4f4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },

  dropdownClose: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b5e20",
  },

  dropdownScroll: {
    maxHeight: 145,
  },

  dropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  selectedDropdownOption: {
    backgroundColor: "#e8f5e9",
  },

  dropdownOptionText: {
    fontSize: 13,
    color: "#222",
  },

  selectedDropdownOptionText: {
    color: "#1b5e20",
    fontWeight: "700",
  },

  noSuggestionText: {
    padding: 12,
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
  },

  centerTimeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
    justifyContent: "center",
  },

  centerTimeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  centerTimePanel: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
  },

  centerTimeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
  },

  centerTimePreview: {
    marginTop: 10,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
  },

  centerTimePickerRow: {
    flexDirection: "row",
    gap: 10,
  },

  timeColumn: {
    flex: 1,
  },

  timeColumnTitle: {
    fontSize: 12,
    color: "#555",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },

  timeColumnScroll: {
    height: 175,
    backgroundColor: "#f4f4f4",
    borderRadius: 14,
  },

  timeOption: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 4,
  },

  selectedTimeOption: {
    backgroundColor: "#1b5e20",
  },

  timeOptionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
  },

  selectedTimeOptionText: {
    color: "#fff",
  },

  centerTimeButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },

  timeCancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  timeCancelText: {
    color: "#333",
    fontWeight: "700",
  },

  timeConfirmButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  timeConfirmText: {
    color: "#fff",
    fontWeight: "700",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 10,
  },

  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  cancelText: {
    color: "#333",
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});