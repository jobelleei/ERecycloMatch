import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const ITEM_OPTIONS = [
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
  "Unknown",
];

const CONDITION_OPTIONS = [
  "Battery glued",
  "Screen cracked",
  "PCB corroded",
  "Mixed plastic case",
  "Mixed plastics",
  "Mixed plastics/metals",
  "Mixed metals",
  "Hazardous substances",
  "Rare earth magnets unrecoverable",
  "Rare earth magnets",
  "Magnet unrecoverable",
  "Toner residue",
  "Lens cracked",
  "Non-removable",
  "Damaged",
  "Hazardous chemicals",
  "Magnetron damaged",
  "Glass plate broken",
  "Hazardous capacitors",
  "Heating element damaged",
  "Heating element corroded",
  "Heating coil damaged",
  "Compressor damaged",
  "Insulation foam",
  "Hazardous refrigerants",
  "Plastic case",
  "Plastic case damaged",
  "Motor corroded",
  "Motor damaged",
  "Wires damaged",
  "Glass broken",
  "Glass cracked",
  "Hazardous mercury",
  "Keys damaged",
  "Hazardous coatings",
  "Hazardous substances (lead solder)",
  "Rare earth components",
  "Hazardous flame retardants",
  "Battery damaged",
  "Battery glued/damaged",
  "Lamp broken",
  "Battery glued/damaged (if present)",
  "Corroded",
  "Insulation damaged",
  "Battery glued (if present)",
  "Non-removable battery (if present)",
  "Unknown material composition",
  "Unknown classification",
  "Hazardous substances (potential)",
  "Blades damaged",
];

export default function FacilityProfile() {
  const router = useRouter();
  const pathname = usePathname();

  const [facility, setFacility] = useState({
    id: "",
    name: "",
    email: "",
    location: "",
    address: "",
    profileImage: "",
    openingDaysFrom: "",
    openingDaysTo: "",
    operatingHoursFrom: "",
    operatingHoursTo: "",
    acceptedItems: "",
    availableServices: "",
  });

  const [postings, setPostings] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [activeSection, setActiveSection] = useState<"postings" | "feedbacks">(
    "postings"
  );

  const [feedbackSort, setFeedbackSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");

  const [refreshing, setRefreshing] = useState(false);

  const [postModalVisible, setPostModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [conditionsAccepted, setConditionsAccepted] = useState("");
  const [conditionsRejected, setConditionsRejected] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [showAcceptedConditionsDropdown, setShowAcceptedConditionsDropdown] =
    useState(false);
  const [showRejectedConditionsDropdown, setShowRejectedConditionsDropdown] =
    useState(false);

  const [savingPost, setSavingPost] = useState(false);

  const filteredItems = useMemo(() => {
    if (!showDropdown || !itemName.trim()) return [];

    return ITEM_OPTIONS.filter((item) =>
      item.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 20);
  }, [itemName, showDropdown]);

  const sortedFeedbacks = useMemo(() => {
    return [...feedbacks].sort((a, b) => {
      if (feedbackSort === "newest") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      if (feedbackSort === "oldest") {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      }

      if (feedbackSort === "highest") {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }

      if (feedbackSort === "lowest") {
        return Number(a.rating || 0) - Number(b.rating || 0);
      }

      return 0;
    });
  }, [feedbacks, feedbackSort]);

  const goToPage = (path: string) => {
    router.push(path as any);
  };

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, [])
  );

  useEffect(() => {
    if (facility.id) {
      fetchPostings();
      fetchFeedbacks();
    }
  }, [facility.id]);

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path) return "";

    if (String(path).startsWith("http")) {
      return path;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
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

  const getFilteredConditions = (value: string) => {
    const keyword = getCurrentTypingValue(value).toLowerCase();

    if (!keyword) {
      return [];
    }

    return CONDITION_OPTIONS.filter((option) =>
      option.toLowerCase().includes(keyword)
    ).slice(0, 25);
  };

  const isConditionSelected = (currentValue: string, option: string) => {
    return splitCommaValues(currentValue).some(
      (item) => item.toLowerCase() === option.toLowerCase()
    );
  };

  const toggleConditionOption = (
    currentValue: string,
    option: string,
    setter: (value: string) => void
  ) => {
    const values = splitCommaValues(currentValue);
    const currentTypingValue = getCurrentTypingValue(currentValue);

    const alreadySelected = values.some(
      (item) => item.toLowerCase() === option.toLowerCase()
    );

    if (alreadySelected) {
      const updatedValues = values.filter(
        (item) => item.toLowerCase() !== option.toLowerCase()
      );

      setter(updatedValues.join(", "));
      return;
    }

    const cleanedValues = values.filter((item) => {
      const sameAsTyped =
        currentTypingValue &&
        item.toLowerCase() === currentTypingValue.toLowerCase();

      const sameAsOption = item.toLowerCase() === option.toLowerCase();

      return !sameAsTyped && !sameAsOption;
    });

    setter([...cleanedValues, option].join(", "));
  };

  const renderStars = (rating: number) => {
    const cleanRating = Math.max(
      0,
      Math.min(5, Math.round(Number(rating || 0)))
    );

    return "★".repeat(cleanRating) + "☆".repeat(5 - cleanRating);
  };

  const formatOperatingHours = (from?: string, to?: string) => {
    const cleanFrom = String(from || "").trim();
    const cleanTo = String(to || "").trim();

    if (!cleanFrom && !cleanTo) return "Not specified";
    if (cleanFrom && !cleanTo) return cleanFrom;
    if (!cleanFrom && cleanTo) return cleanTo;

    return `${cleanFrom} - ${cleanTo}`;
  };

  const formatCommaText = (value?: string) => {
    const cleaned = normalizeCommaValues(String(value || ""));

    if (!cleaned) return "Not specified";

    return cleaned;
  };

  const renderHeaderInfoRow = (label: string, value: string) => {
    return (
      <View style={styles.headerInfoRow}>
        <Text style={styles.headerInfoLabel}>{label}</Text>
        <Text style={styles.headerInfoValue}>{value}</Text>
      </View>
    );
  };

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

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

      const storedProfileImage =
        actualUser?.profileImage ||
        actualUser?.profile_image ||
        parsed?.profileImage ||
        parsed?.profile_image ||
        "";

      const finalProfileImage = storedProfileImage
        ? getPublicImageUrl("profile-images", String(storedProfileImage))
        : "";

      const facilityData = {
        id: String(facilityId),
        name:
          actualUser?.name ||
          actualUser?.facility_name ||
          parsed?.name ||
          parsed?.facility_name ||
          "Facility",
        email: actualUser?.email || parsed?.email || "",
        location:
          actualUser?.location ||
          actualUser?.address ||
          parsed?.location ||
          parsed?.address ||
          "No location added",
        address:
          actualUser?.address ||
          actualUser?.location ||
          parsed?.address ||
          parsed?.location ||
          "No location added",
        profileImage: finalProfileImage,

        openingDaysFrom:
          actualUser?.opening_days_from ||
          parsed?.opening_days_from ||
          "",

        openingDaysTo:
          actualUser?.opening_days_to ||
          parsed?.opening_days_to ||
          "",

        operatingHoursFrom:
          actualUser?.operating_hours_from ||
          parsed?.operating_hours_from ||
          "",
        operatingHoursTo:
          actualUser?.operating_hours_to ||
          parsed?.operating_hours_to ||
          "",
        acceptedItems:
          actualUser?.accepted_item_types ||
          parsed?.accepted_item_types ||
          "",
        availableServices:
          actualUser?.available_services ||
          parsed?.available_services ||
          "",
      };

      setFacility(facilityData);

      if (facilityId) {
        fetchFacilityFromSupabase(String(facilityId), facilityData);
      }
    } catch (error) {
      console.log("LOAD FACILITY ERROR:", error);
    }
  };

  const fetchFacilityFromSupabase = async (
    facilityId: string,
    fallbackData: any
  ) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", facilityId)
        .eq("role", "facility")
        .maybeSingle();

      if (error || !data) {
        return;
      }

      const profileImage = data.profile_image
        ? getPublicImageUrl("profile-images", data.profile_image)
        : fallbackData.profileImage;

      const updatedFacility = {
      id: String(data.id || fallbackData.id),
      name: data.name || fallbackData.name,
      email: data.email || fallbackData.email,
      location: data.location || data.address || fallbackData.location,
      address: data.address || data.location || fallbackData.address,
      profileImage,

      openingDaysFrom:
        data.opening_days_from || fallbackData.openingDaysFrom || "",

      openingDaysTo:
        data.opening_days_to || fallbackData.openingDaysTo || "",

      operatingHoursFrom:
        data.operating_hours_from || fallbackData.operatingHoursFrom || "",

      operatingHoursTo:
        data.operating_hours_to || fallbackData.operatingHoursTo || "",

      acceptedItems:
        data.accepted_item_types || fallbackData.acceptedItems || "",

      availableServices:
        data.available_services || fallbackData.availableServices || "",
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
          location: updatedFacility.location,
          address: updatedFacility.address,
          profile_image: data.profile_image || "",
          profileImage: data.profile_image || "",
          operating_hours_from: updatedFacility.operatingHoursFrom,
          operating_hours_to: updatedFacility.operatingHoursTo,
          accepted_item_types: updatedFacility.acceptedItems,
          available_services: updatedFacility.availableServices,
          role: "facility",
        };

        if (parsed.user) {
          updatedStoredFacility.user = {
            ...parsed.user,
            id: updatedFacility.id,
            name: updatedFacility.name,
            email: updatedFacility.email,
            location: updatedFacility.location,
            address: updatedFacility.address,
            profile_image: data.profile_image || "",
            profileImage: data.profile_image || "",
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItems,
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
            location: updatedFacility.location,
            address: updatedFacility.address,
            profile_image: data.profile_image || "",
            profileImage: data.profile_image || "",
            operating_hours_from: updatedFacility.operatingHoursFrom,
            operating_hours_to: updatedFacility.operatingHoursTo,
            accepted_item_types: updatedFacility.acceptedItems,
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
      console.log("FETCH FACILITY PROFILE ERROR:", error);
    }
  };

  const normalizeMatchText = (value: any) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isActiveMatchedConversation = (conversation: any) => {
    const status = String(conversation?.status || "")
      .trim()
      .toLowerCase();

    const requestStatus = String(conversation?.request_status || "")
      .trim()
      .toLowerCase();

    return (
      status === "matched" ||
      status === "accepted" ||
      status === "active" ||
      status === "finish_pending" ||
      status === "finished" ||
      requestStatus === "accepted"
    );
  };

  const isPostingUsedByActiveMatch = (posting: any, activeConversation: any) => {
    const postingId = String(posting?.id || "").trim();

    const conversationPostingId = String(
      activeConversation?.facility_posting_id ||
        activeConversation?.posting_id ||
        activeConversation?.facility_post_id ||
        activeConversation?.post_id ||
        ""
    ).trim();

    if (postingId && conversationPostingId && postingId === conversationPostingId) {
      return true;
    }

    const postingItem = normalizeMatchText(
      posting?.item_needed ||
        posting?.item_name ||
        posting?.item_type ||
        posting?.name ||
        ""
    );

    const conversationItem = normalizeMatchText(
      activeConversation?.facility_item_needed ||
        activeConversation?.item_needed ||
        activeConversation?.requested_item ||
        activeConversation?.item_name ||
        activeConversation?.item_type ||
        activeConversation?.name ||
        ""
    );

    if (!postingItem || !conversationItem) return false;
    if (postingItem === "unknown" || conversationItem === "unknown") return false;

    return (
      postingItem === conversationItem ||
      postingItem.includes(conversationItem) ||
      conversationItem.includes(postingItem)
    );
  };

  const fetchPostings = async () => {
    try {
      if (!facility.id) {
        setPostings([]);
        return;
      }

      const { data: postingData, error: postingError } = await supabase
        .from("facility_postings")
        .select("*")
        .eq("facility_id", String(facility.id))
        .order("created_at", { ascending: false });

      if (postingError) {
        console.log("FETCH FACILITY POSTINGS ERROR:", postingError);
        setPostings([]);
        return;
      }

      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .eq("facility_id", String(facility.id));

      if (conversationError) {
        console.log("FETCH FACILITY MATCHED CONVERSATIONS ERROR:", conversationError);
        setPostings(postingData || []);
        return;
      }

      const activeMatchedConversations = (conversationData || []).filter(
        isActiveMatchedConversation
      );

      const visiblePostings = (postingData || []).filter((posting: any) => {
        const alreadyMatched = activeMatchedConversations.some(
          (conversation: any) => isPostingUsedByActiveMatch(posting, conversation)
        );

        return !alreadyMatched;
      });

      setPostings(visiblePostings);
    } catch (error) {
      console.log("FETCH FACILITY POSTINGS ERROR:", error);
      setPostings([]);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      if (!facility.id) {
        setFeedbacks([]);
        setAverageRating(0);
        return;
      }

      const { data, error } = await supabase
        .from("match_feedbacks")
        .select("*")
        .eq("rated_id", Number(facility.id))
        .eq("rated_role", "facility")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH FACILITY FEEDBACKS ERROR:", error);
        setFeedbacks([]);
        setAverageRating(0);
        return;
      }

      const finalData = data || [];
      setFeedbacks(finalData);

      if (finalData.length > 0) {
        const total = finalData.reduce(
          (sum: number, item: any) => sum + Number(item.rating || 0),
          0
        );

        setAverageRating(total / finalData.length);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.log("FETCH FACILITY FEEDBACKS ERROR:", error);
      setFeedbacks([]);
      setAverageRating(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFacility();
    await fetchPostings();
    await fetchFeedbacks();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setItemName("");
    setDescription("");
    setConditionsAccepted("");
    setConditionsRejected("");
    setShowDropdown(false);
    setShowAcceptedConditionsDropdown(false);
    setShowRejectedConditionsDropdown(false);
    setPostModalVisible(true);
  };

  const savePosting = async () => {
    if (!facility.id) {
      Alert.alert("Facility Error", "Facility ID not found.");
      return;
    }

    if (!itemName.trim()) {
      Alert.alert("Item Required", "Please enter or select an item.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Description Required", "Please add details.");
      return;
    }

    try {
      setSavingPost(true);
      Keyboard.dismiss();

      const cleanConditionsAccepted = normalizeCommaValues(conditionsAccepted);
      const cleanConditionsRejected = normalizeCommaValues(conditionsRejected);

      const { error } = await supabase.from("facility_postings").insert([
        {
          facility_id: String(facility.id),
          submitter_name: facility.name,
          facility_location: facility.location,
          item_needed: itemName.trim(),
          description: description.trim(),
          conditions_accepted: cleanConditionsAccepted,
          conditions_rejected: cleanConditionsRejected,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert("Create Failed", error.message);
        return;
      }

      Alert.alert("Success", "Post created.");

      setPostModalVisible(false);
      setEditingPost(null);
      setItemName("");
      setDescription("");
      setConditionsAccepted("");
      setConditionsRejected("");
      setShowDropdown(false);
      setShowAcceptedConditionsDropdown(false);
      setShowRejectedConditionsDropdown(false);

      fetchPostings();
    } catch (error: any) {
      console.log("SAVE POST ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to save post.");
    } finally {
      setSavingPost(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "No date available";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatShortDate = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const closePostModal = () => {
    setPostModalVisible(false);
    setEditingPost(null);
    setItemName("");
    setDescription("");
    setConditionsAccepted("");
    setConditionsRejected("");
    setShowDropdown(false);
    setShowAcceptedConditionsDropdown(false);
    setShowRejectedConditionsDropdown(false);
  };

  const renderConditionInput = (
    label: string,
    value: string,
    setter: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    placeholder: string
  ) => {
    const filteredConditions = getFilteredConditions(value);

    return (
      <View>
        <Text style={styles.modalLabel}>{label}</Text>

        <TextInput
          placeholder={placeholder}
          value={value}
          onFocus={() => {
            if (getCurrentTypingValue(value).length > 0) {
              setVisible(true);
            }
          }}
          onChangeText={(text) => {
            setter(text);

            if (getCurrentTypingValue(text).length > 0) {
              setVisible(true);
            } else {
              setVisible(false);
            }
          }}
          style={styles.input}
          multiline
        />

        {visible && filteredConditions.length > 0 && (
          <View style={styles.dropdownBox}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Suggestions</Text>

              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.dropdownCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {filteredConditions.map((option) => {
                const selected = isConditionSelected(value, option);

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      selected && styles.selectedDropdownItem,
                    ]}
                    onPress={() => {
                      toggleConditionOption(value, option, setter);
                      setVisible(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        selected && styles.selectedDropdownText,
                      ]}
                    >
                      {selected ? "✓ " : ""}
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderPosting = ({ item }: any) => {
    return (
      <View style={styles.postCard}>
        <Text style={styles.postLabel}>Facility Name</Text>
        <Text style={styles.postTitle}>
          {item.submitter_name || facility.name}
        </Text>

        <Text style={styles.postLabel}>Item Needed/Accepted</Text>
        <Text style={styles.itemNeeded}>
          {item.item_needed || "No item added"}
        </Text>

        <Text style={styles.postLabel}>Description</Text>
        <Text style={styles.description}>
          {item.description || "No description added."}
        </Text>

        <Text style={styles.postLabel}>Conditions Accepted</Text>
        <Text style={styles.conditionText}>
          {formatCommaText(item.conditions_accepted)}
        </Text>

        <Text style={styles.postLabel}>Conditions Rejected</Text>
        <Text style={styles.conditionText}>
          {formatCommaText(item.conditions_rejected)}
        </Text>

        <View style={styles.postMetaContainer}>
          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.metaIcon}
            />

            <Text style={styles.metaText}>
              {item.facility_location || facility.location}
            </Text>
          </View>

          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderFeedback = ({ item }: any) => {
    return (
      <View style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackName}>
            {item.rater_name || "Anonymous User"}
          </Text>

          <Text style={styles.feedbackDate}>
            {formatShortDate(item.created_at)}
          </Text>
        </View>

        <Text style={styles.feedbackStars}>
          {renderStars(Number(item.rating || 0))}
        </Text>

        {item.comment ? (
          <Text style={styles.feedbackMessage}>{item.comment}</Text>
        ) : (
          <Text style={styles.feedbackMuted}>No comment provided.</Text>
        )}
      </View>
    );
  };

  const renderFeedbackSort = () => {
    if (activeSection !== "feedbacks") return null;

    const options: {
      label: string;
      value: "newest" | "oldest" | "highest" | "lowest";
    }[] = [
      { label: "Newest", value: "newest" },
      { label: "Oldest", value: "oldest" },
      { label: "Highest", value: "highest" },
      { label: "Lowest", value: "lowest" },
    ];

    return (
      <View style={styles.filterWrapper}>
        <Text style={styles.filterTitle}>Sort Feedbacks</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                feedbackSort === option.value && styles.activeFilterChip,
              ]}
              onPress={() => setFeedbackSort(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  feedbackSort === option.value &&
                    styles.activeFilterChipText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const listData = activeSection === "postings" ? postings : sortedFeedbacks;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          activeSection === "postings"
            ? `facility-posting-${item.id || index}`
            : `facility-feedback-${item.id || index}`
        }
        renderItem={
          activeSection === "postings" ? renderPosting : renderFeedback
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>

              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    facility.profileImage
                      ? { uri: facility.profileImage }
                      : require("../../assets/icons/avatar.png")
                  }
                  style={styles.avatar}
                />
              </View>

              <Text style={styles.name}>{facility.name || "Facility"}</Text>

              <View style={styles.headerLocationRow}>
                <Image
                  source={require("../../assets/icons/location.png")}
                  style={styles.headerLocationIcon}
                />

                <Text style={styles.headerAddress}>
                  {facility.location || "No location added"}
                </Text>
              </View>

              <View style={styles.headerInfoBox}>
              {renderHeaderInfoRow(
                "Opening Days",
                `${facility.openingDaysFrom || "Not specified"} - ${
                  facility.openingDaysTo || ""
                }`
              )}

              {renderHeaderInfoRow(
                "Operating Hours",
                formatOperatingHours(
                  facility.operatingHoursFrom,
                  facility.operatingHoursTo
                )
              )}

              {renderHeaderInfoRow(
                "Accepted Items",
                formatCommaText(facility.acceptedItems)
              )}

              {renderHeaderInfoRow(
                "Available Services",
                formatCommaText(facility.availableServices)
              )}
            </View>

              <View style={styles.ratingSummaryBox}>
                <Text style={styles.ratingSummaryStars}>
                  {renderStars(Math.round(averageRating))}
                </Text>

                <Text style={styles.ratingSummaryText}>
                  {feedbacks.length > 0
                    ? `${averageRating.toFixed(1)} out of 5 • ${
                        feedbacks.length
                      } feedback${feedbacks.length === 1 ? "" : "s"}`
                    : "No feedback yet"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addPostButton}
                onPress={openCreateModal}
              >
                <Text style={styles.addPostText}>＋ Create Item Request</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTabs}>
              <TouchableOpacity
                style={[
                  styles.sectionTabButton,
                  activeSection === "postings" && styles.activeSectionTab,
                ]}
                onPress={() => setActiveSection("postings")}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    activeSection === "postings" &&
                      styles.activeSectionTabText,
                  ]}
                >
                  Item Requests
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sectionTabButton,
                  activeSection === "feedbacks" && styles.activeSectionTab,
                ]}
                onPress={() => setActiveSection("feedbacks")}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    activeSection === "feedbacks" &&
                      styles.activeSectionTabText,
                  ]}
                >
                  Feedbacks
                </Text>
              </TouchableOpacity>
            </View>

            {renderFeedbackSort()}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeSection === "postings"
              ? "No item requests yet."
              : "No feedbacks yet."}
          </Text>
        }
      />

      <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
        <Text style={styles.floatingPlus}>＋</Text>
      </TouchableOpacity>

      <Modal visible={postModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalBox}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>Create Item Request</Text>

                <Text style={styles.helperText}>
                  Add details about what your facility is looking for so users
                  can match their listed items with your request.
                </Text>

                <Text style={styles.modalLabel}>Item Needed</Text>

                <TextInput
                  placeholder="Type or select item"
                  value={itemName}
                  onFocus={() => setShowDropdown(true)}
                  onChangeText={(text) => {
                    setItemName(text);
                    setShowDropdown(true);
                  }}
                  style={styles.input}
                />

                {filteredItems.length > 0 && (
                  <View style={styles.dropdownBox}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={true}
                    >
                      {filteredItems.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setItemName(option);
                            setShowDropdown(false);
                            Keyboard.dismiss();
                          }}
                        >
                          <Text style={styles.dropdownText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text style={styles.modalLabel}>Description</Text>

                <TextInput
                  placeholder="Example: Looking for working or slightly damaged smartphones for recycling or parts recovery."
                  value={description}
                  onChangeText={setDescription}
                  style={styles.descriptionInput}
                  multiline
                  textAlignVertical="top"
                />

                {renderConditionInput(
                  "Conditions Accepted",
                  conditionsAccepted,
                  setConditionsAccepted,
                  showAcceptedConditionsDropdown,
                  setShowAcceptedConditionsDropdown,
                  "Type condition to search, example: screen cracked"
                )}

                {renderConditionInput(
                  "Conditions Rejected",
                  conditionsRejected,
                  setConditionsRejected,
                  showRejectedConditionsDropdown,
                  setShowRejectedConditionsDropdown,
                  "Type condition to search, example: hazardous substances"
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closePostModal}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      savingPost && styles.disabledButton,
                    ]}
                    onPress={savePosting}
                    disabled={savingPost}
                  >
                    <Text style={styles.saveText}>
                      {savingPost ? "Saving..." : "Post"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard")}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/facility_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/facility_map" &&
                styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/messages")}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/profile" && styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/facility_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/facility_dashboard/settings" && styles.navActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  listContent: {
    paddingBottom: 110,
  },

  profileHeader: {
    backgroundColor: "#1b5e20",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 18,
    zIndex: 10,
  },

  backText: {
    color: "#fff",
    fontSize: 26,
  },

  avatarWrapper: {
    marginTop: 25,
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#ddd",
  },

  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },

  headerLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 35,
    maxWidth: "100%",
  },

  headerLocationIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
    marginTop: 2,
    tintColor: "#fff",
  },

  headerAddress: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "left",
    flexShrink: 1,
  },

  headerInfoBox: {
    width: "90%",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  headerInfoRow: {
    marginBottom: 9,
  },

  headerInfoLabel: {
    color: "#dcedc8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },

  headerInfoValue: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 17,
  },

  ratingSummaryBox: {
    marginTop: 12,
    alignItems: "center",
  },

  ratingSummaryStars: {
    fontSize: 18,
    color: "#fbc02d",
    fontWeight: "bold",
  },

  ratingSummaryText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },

  addPostButton: {
    backgroundColor: "#fff",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
  },

  addPostText: {
    color: "#1b5e20",
    fontWeight: "bold",
    fontSize: 13,
  },

  sectionTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 14,
    padding: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },

  sectionTabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  activeSectionTab: {
    backgroundColor: "#1b5e20",
  },

  sectionTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
  },

  activeSectionTabText: {
    color: "#fff",
  },

  filterWrapper: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },

  filterTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  filterScrollContent: {
    gap: 8,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: "#1b5e20",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
  },

  activeFilterChip: {
    backgroundColor: "#1b5e20",
  },

  filterChipText: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "700",
  },

  activeFilterChipText: {
    color: "#fff",
  },

  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  postLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
  },

  postTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 4,
    color: "#000",
  },

  itemNeeded: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b5e20",
    marginTop: 4,
    marginBottom: 8,
  },

  description: {
    color: "#000",
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
  },

  conditionText: {
    color: "#222",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },

  postMetaContainer: {
    marginTop: 13,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  metaIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
    marginTop: 2,
  },

  metaText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: "#222",
    flex: 1,
  },

  dateText: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
    marginLeft: 17,
    textAlign: "left",
  },

  feedbackCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  feedbackName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },

  feedbackDate: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },

  feedbackStars: {
    marginTop: 8,
    fontSize: 18,
    color: "#fbc02d",
  },

  feedbackMessage: {
    marginTop: 8,
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  feedbackMuted: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 35,
    fontSize: 15,
  },

  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1b5e20",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 20,
  },

  floatingPlus: {
    color: "#fff",
    fontSize: 32,
    marginTop: -2,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  keyboardView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },

  helperText: {
    color: "#555",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },

  modalLabel: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    fontSize: 14,
    color: "#000",
  },

  dropdownBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    height: 160,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  dropdownHeader: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f3f3f3",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },

  dropdownCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b5e20",
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  selectedDropdownItem: {
    backgroundColor: "#e8f5e9",
  },

  dropdownText: {
    fontSize: 14,
    color: "#000",
  },

  selectedDropdownText: {
    color: "#1b5e20",
    fontWeight: "700",
  },

  descriptionInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    minHeight: 100,
    fontSize: 14,
    color: "#000",
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#1b5e20",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  cancelText: {
    color: "gray",
    fontWeight: "bold",
    fontSize: 16,
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 10,
  },

  navItem: {
    alignItems: "center",
  },

  navImage: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },

  navLabel: {
    fontSize: 12,
    color: "#777",
  },

  navActive: {
    color: "green",
    fontWeight: "bold",
  },
});