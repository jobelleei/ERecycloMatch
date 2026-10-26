import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { Image as ExpoImage } from "expo-image";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getScanPhotoDisplayUri,
  getScanPhotoUri,
} from "../../utils/scanPhoto";
import OnboardingTour, {
  hasCompletedTour,
  markTourCompleted,
  TourStep,
} from "../../components/OnboardingTour";
import { supabase } from "../../utils/supabase";
import {
  getItemData,
  type IssueOption,
} from "../../utils/itemConditions";

type LoggedInUser = {
  userId: number;
  submitterName: string;
};


type AutoDecision = {
  status: "Approved" | "Rejected" | "Pending";
  match_status: "Approved" | "Rejected" | "Pending";
  note: string;
  reject_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

const EWASTE_DROP_OFFS_ROUTE = "/user_dashboard/user_map";

type DropOffBin = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
};

const DROP_OFF_BINS: DropOffBin[] = [
  {
    id: "default-bin-1",
    name: "Globe Store E-waste Zero Bin - SM City Bacolod",
    address:
      "SM City Bacolod, Reclamation Area, Bacolod, Negros Occidental, Philippines",
    latitude: 10.6733468,
    longitude: 122.9420978,
  },
  {
    id: "default-bin-2",
    name: "Milabo Scrap and Resources Company",
    address: "Lopez Jaena St, Bacolod, Negros Occidental, Philippines",
    latitude: 10.6618621,
    longitude: 122.9550138,
  },
  {
    id: "default-bin-3",
    name: "Jalandon Junk Shop",
    address: "San Juan St, Bacolod, Negros Occidental, Philippines",
    latitude: 10.6810663,
    longitude: 122.948932,
  },
];

const normalizeText = (value: any) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  return "image/jpeg";
};


const formatSuggestionBlock = (title: string, suggestions: string[]) => {
  const suggestionText = suggestions
    .map((suggestion) => `• ${suggestion}`)
    .join("\n");

  return `${title}:\n${suggestionText}`;
};

export default function ScanResult() {
  const { image: imageParam, label } = useLocalSearchParams();
  const router = useRouter();

  const image =
    getScanPhotoUri() || (typeof imageParam === "string" ? imageParam : "");
  const displayImage = getScanPhotoDisplayUri() || image;

  const itemName = typeof label === "string" ? label : "Unknown";
  const isUnknownItem = normalizeText(itemName) === "unknown";
  const itemData = getItemData(itemName);

  const [description, setDescription] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<IssueOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Onboarding tour for new users
  const [showTour, setShowTour] = useState(false);
  const [tourUserId, setTourUserId] = useState("");
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const cardY = useRef(0);
  const scoresRef = useRef<ComponentRef<typeof View>>(null);
  const descriptionRef = useRef<any>(null);
  const issuesRef = useRef<any>(null);
  const uploadRef = useRef<any>(null);
  const scanAgainRef = useRef<any>(null);
  const closeRef = useRef<any>(null);
  const resultHelpRef = useRef<any>(null);

  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [matchedFacilities, setMatchedFacilities] = useState<any[]>([]);
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchItemName, setMatchItemName] = useState("");
  const [uploadedItemForMatch, setUploadedItemForMatch] = useState<any>(null);
  const [nearestDropOffBins, setNearestDropOffBins] =
    useState<DropOffBin[]>(DROP_OFF_BINS);
  const [dropOffLocationLoading, setDropOffLocationLoading] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultModalTitle, setResultModalTitle] = useState("");
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalDecision, setResultModalDecision] =
    useState<AutoDecision | null>(null);
  const [resultModalItemName, setResultModalItemName] = useState("");
  const [resultModalUploadedItem, setResultModalUploadedItem] =
    useState<any>(null);

  const totalDeduction = selectedIssues.reduce(
    (sum, issue) => sum + issue.deduction,
    0,
  );

  const totalHazard = selectedIssues.reduce(
    (sum, issue) => sum + issue.hazard,
    0,
  );

  const recyclability = Math.max(100 - totalDeduction, 0);
  const hazardStatus = Math.min(totalHazard, 100);

  const actualIssues = selectedIssues.filter((issue) => issue.name !== "None");

  const calculateDistanceKm = (
    userLatitude: number,
    userLongitude: number,
    targetLatitude: number,
    targetLongitude: number,
  ) => {
    const earthRadiusKm = 6371;
    const toRadians = (value: number) => (value * Math.PI) / 180;

    const latitudeDistance = toRadians(targetLatitude - userLatitude);
    const longitudeDistance = toRadians(targetLongitude - userLongitude);

    const a =
      Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
      Math.cos(toRadians(userLatitude)) *
        Math.cos(toRadians(targetLatitude)) *
        Math.sin(longitudeDistance / 2) *
        Math.sin(longitudeDistance / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  };

  const prepareNearestDropOffBins = async () => {
    try {
      setDropOffLocationLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setNearestDropOffBins(DROP_OFF_BINS);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLatitude = currentLocation.coords.latitude;
      const userLongitude = currentLocation.coords.longitude;

      const sortedBins = DROP_OFF_BINS.map((bin) => ({
        ...bin,
        distanceKm: calculateDistanceKm(
          userLatitude,
          userLongitude,
          bin.latitude,
          bin.longitude,
        ),
      })).sort((a, b) => Number(a.distanceKm || 0) - Number(b.distanceKm || 0));

      setNearestDropOffBins(sortedBins);
    } catch (error) {
      console.log("GET NEAREST DROP OFF BINS ERROR:", error);
      setNearestDropOffBins(DROP_OFF_BINS);
    } finally {
      setDropOffLocationLoading(false);
    }
  };

  const formatDistance = (distanceKm?: number | null) => {
    if (distanceKm === undefined || distanceKm === null) {
      return "Distance unavailable";
    }

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m away`;
    }

    return `${distanceKm.toFixed(2)} km away`;
  };

  const getAutoDecision = (
    recyclabilityValue: number,
    hazardValue: number,
    disposalSuggestions: string[],
  ): AutoDecision => {
    const now = new Date().toISOString();

    // AUTOMATIC APPROVAL
    if (recyclabilityValue >= 60 && hazardValue <= 30) {
      return {
        status: "Approved",
        match_status: "Approved",
        note: `Safe to process in a recycling facility.\n\n${formatSuggestionBlock(
          "Suggestions",
          disposalSuggestions,
        )}`,
        reject_reason: null,
        approved_at: now,
        rejected_at: null,
      };
    }

    // AUTOMATIC APPROVAL
    if (
      recyclabilityValue >= 40 &&
      recyclabilityValue <= 59 &&
      hazardValue >= 20 &&
      hazardValue <= 40
    ) {
      return {
        status: "Approved",
        match_status: "Approved",
        note: `Item has moderate recyclability but rising hazard; refurbish if possible.\n\n${formatSuggestionBlock(
          "Suggestions",
          disposalSuggestions,
        )}`,
        reject_reason: null,
        approved_at: now,
        rejected_at: null,
      };
    }

    // ITEMS THAT DO NOT MEET THE AUTOMATIC APPROVAL RULES
    // ARE SENT TO THE ADMIN FOR MANUAL REVIEW.
    const note = `Item requires admin review.\n\n${formatSuggestionBlock(
      "Disposal Instructions",
      disposalSuggestions,
    )}`;

    return {
      status: "Pending",
      match_status: "Pending",
      note,
      reject_reason: null,
      approved_at: null,
      rejected_at: null,
    };
  };

  const getLoggedInUser = async (): Promise<LoggedInUser> => {
    const storedUser = await AsyncStorage.getItem("user");

    console.log("UPLOAD STORED USER:", storedUser);

    if (!storedUser) {
      return {
        userId: 0,
        submitterName: "",
      };
    }

    const parsedUser = JSON.parse(storedUser);

    const userId =
      parsedUser?.id ||
      parsedUser?.user_id ||
      parsedUser?.user?.id ||
      parsedUser?.user?.user_id ||
      parsedUser?.data?.id ||
      parsedUser?.data?.user_id ||
      0;

    const submitterName =
      parsedUser?.name ||
      parsedUser?.fullname ||
      parsedUser?.full_name ||
      parsedUser?.username ||
      parsedUser?.user?.name ||
      parsedUser?.user?.fullname ||
      parsedUser?.user?.full_name ||
      parsedUser?.user?.username ||
      parsedUser?.data?.name ||
      parsedUser?.data?.fullname ||
      parsedUser?.data?.full_name ||
      parsedUser?.data?.username ||
      "";

    console.log("UPLOAD USER ID:", userId);
    console.log("UPLOAD SUBMITTER NAME:", submitterName);

    return {
      userId: Number(userId) || 0,
      submitterName: String(submitterName).trim(),
    };
  };

  const toggleIssue = (issue: IssueOption) => {
    const alreadySelected = selectedIssues.some(
      (selected) => selected.name === issue.name,
    );

    if (alreadySelected) {
      const updatedIssues = selectedIssues.filter(
        (selected) => selected.name !== issue.name,
      );

      setSelectedIssues(updatedIssues);
      return;
    }

    if (issue.name === "None") {
      setSelectedIssues([issue]);
      return;
    }

    const filteredIssues = selectedIssues.filter(
      (selected) => selected.name !== "None",
    );

    setSelectedIssues([...filteredIssues, issue]);
  };

  const validateForm = () => {
    if (!image) {
      Alert.alert("Missing Image", "Please scan an item first.");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Missing Description", "Please enter a description.");
      return false;
    }

    if (isUnknownItem && description.trim().length < 5) {
      Alert.alert(
        "Item Name Reminder",
        "Since the item was detected as Unknown, please state the possible item name in the description.",
      );
      return false;
    }

    if (selectedIssues.length === 0) {
      Alert.alert("Missing Issues", "Please select at least one issue.");
      return false;
    }


    return true;
  };

  const uploadImageToBucket = async (
    bucket: string,
    filePath: string,
    imageUri: string,
  ) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);

      if (!fileInfo.exists) {
        throw new Error("Image file does not exist on this device.");
      }

      const localFileSize = (fileInfo as any)?.size || 0;

      if (localFileSize <= 0) {
        throw new Error("Image file is empty. Please retake the photo.");
      }

      const extension = getImageExtension(imageUri);
      const contentType = getContentType(extension);

      console.log("STORAGE UPLOAD START:", {
        bucket,
        filePath,
        imageUri,
        contentType,
        localFileSize,
      });

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64 || base64.length === 0) {
        throw new Error("Failed to convert image to base64 before upload.");
      }

      const arrayBuffer = decode(base64);

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Converted image data is empty.");
      }

      console.log("STORAGE ARRAY BUFFER SIZE:", arrayBuffer.byteLength);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: false,
          cacheControl: "3600",
        });

      if (error) {
        console.log("SUPABASE STORAGE ERROR:", error);
        throw error;
      }

      const publicUrlData = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log("STORAGE UPLOAD SUCCESS:", {
        path: data?.path,
        publicUrl: publicUrlData.data.publicUrl,
      });

      return {
        path: filePath,
        url: publicUrlData.data.publicUrl,
      };
    } catch (error: any) {
      console.log("UPLOAD IMAGE TO BUCKET ERROR:", error);

      throw new Error(
        error?.message ||
          "Network request failed while uploading image to Supabase Storage.",
      );
    }
  };


  const getValueFromKeys = (object: any, keys: string[]) => {
    if (!object) return "";

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null &&
        String(object[key]).trim() !== ""
      ) {
        return object[key];
      }
    }

    return "";
  };

  const cleanIssuesText = (issues: string) => {
    if (!issues) return "";

    return String(issues || "")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*recyclability/gi, "")
      .replace(/\s*hazard/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getUsefulTokens = (value: any) => {
    const stopWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "to",
      "for",
      "of",
      "in",
      "on",
      "with",
      "this",
      "that",
      "item",
      "items",
      "need",
      "needed",
      "accept",
      "accepting",
      "available",
      "facility",
      "facilities",
      "recycling",
      "recycle",
      "ewaste",
      "e",
      "waste",
      "electronic",
      "electronics",
      "has",
      "have",
      "can",
      "will",
      "is",
      "are",
      "was",
      "were",
      "there",
      "also",
      "some",
      "any",
    ];

    return normalizeText(value)
      .split(" ")
      .filter((word) => word.length >= 3 && !stopWords.includes(word));
  };

  const hasCommonToken = (textA: any, textB: any) => {
    const tokensA = getUsefulTokens(textA);
    const tokensB = getUsefulTokens(textB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return false;
    }

    const setB = new Set(tokensB);

    return tokensA.some((token) => setB.has(token));
  };

  const getTokenScore = (textA: any, textB: any) => {
    const tokensA = getUsefulTokens(textA);
    const tokensB = getUsefulTokens(textB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return 0;
    }

    const setB = new Set(tokensB);
    const matchedTokens = tokensA.filter((token) => setB.has(token));

    return matchedTokens.length / Math.max(tokensA.length, tokensB.length);
  };

  const getMatchedTokens = (textA: any, textB: any) => {
    const tokensA = getUsefulTokens(textA);
    const tokensB = getUsefulTokens(textB);

    const setB = new Set(tokensB);

    return tokensA.filter((token) => setB.has(token));
  };

  const getPostItemNeededText = (post: any) => {
    return getValueFromKeys(post, [
      "item_needed",
      "needed_item",
      "item_need",
      "item_name",
      "name",
      "title",
      "post_title",
      "needed",
      "request_item",
      "requested_item",
      "accepted_item",
    ]);
  };

  const getPostDescriptionText = (post: any) => {
    return getValueFromKeys(post, [
      "description",
      "post_description",
      "details",
      "requirements",
      "accepted_items",
      "notes",
      "caption",
      "body",
      "content",
    ]);
  };

  const getPostIssuesText = (post: any) => {
    return getValueFromKeys(post, [
      "issues",
      "issue",
      "issue_mentions",
      "accepted_issues",
      "condition_notes",
      "requirements",
      "problem",
      "problems",
      "condition",
    ]);
  };

  const getFacilityIdFromPost = (post: any) => {
    return String(
      getValueFromKeys(post, [
        "facility_id",
        "facilityId",
        "facility_user_id",
        "profile_id",
        "user_id",
        "owner_id",
        "posted_by_id",
        "poster_id",
        "created_by",
        "created_by_id",
        "account_id",
      ]),
    ).trim();
  };

  const getFacilityNameFromPost = (post: any) => {
    return getValueFromKeys(post, [
      "facility_name",
      "facilityName",
      "profile_name",
      "business_name",
      "company_name",
      "shop_name",
      "organization_name",
      "posted_by",
      "poster_name",
      "owner_name",
    ]);
  };

  const getFacilityAddressFromPost = (post: any) => {
    return getValueFromKeys(post, [
      "facility_location",
      "facility_address",
      "address",
      "location",
      "complete_address",
    ]);
  };

  const getProfileName = (profile: any) => {
    return (
      getValueFromKeys(profile, [
        "business_name",
        "company_name",
        "shop_name",
        "organization_name",
        "facility_name",
        "name",
        "full_name",
        "fullname",
        "username",
      ]) || "Facility"
    );
  };

  const getProfileAddress = (profile: any) => {
    return (
      getValueFromKeys(profile, [
        "location",
        "address",
        "complete_address",
        "facility_location",
        "facility_address",
      ]) || "No location provided"
    );
  };

  const getProfileImageValue = (profile: any, post: any) => {
    return (
      getValueFromKeys(profile, [
        "profile_image",
        "profile_pic",
        "profile_picture",
        "profile_photo",
        "image",
        "image_url",
        "photo",
        "photo_url",
        "avatar",
        "avatar_url",
      ]) ||
      getValueFromKeys(post, [
        "profile_image",
        "profile_pic",
        "profile_picture",
        "profile_photo",
        "image",
        "image_url",
        "photo",
        "photo_url",
        "avatar",
        "avatar_url",
      ])
    );
  };

  const getFacilityImageSource = (profileImage: string) => {
    if (!profileImage || String(profileImage).trim() === "") {
      return require("../../assets/icons/avatar.png");
    }

    const cleanImage = String(profileImage).trim();

    if (cleanImage.startsWith("http")) {
      return {
        uri: `${cleanImage}${cleanImage.includes("?") ? "&" : "?"}v=${Date.now()}`,
      };
    }

    const possibleBuckets = [
      "profile-images",
      "profile_image",
      "profiles",
      "avatars",
      "facility-images",
    ];

    for (const bucket of possibleBuckets) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanImage);

      if (data?.publicUrl) {
        return {
          uri: `${data.publicUrl}?v=${Date.now()}`,
        };
      }
    }

    return require("../../assets/icons/avatar.png");
  };

  const isPostActive = (post: any) => {
    const status = normalizeText(
      getValueFromKeys(post, ["status", "post_status", "state"]) || "active",
    );

    if (!status) return true;

    return (
      status === "active" ||
      status === "approved" ||
      status === "posted" ||
      status === "listed" ||
      status === "open" ||
      status === "available"
    );
  };

  const isFacilityProfile = (profile: any) => {
    const role = normalizeText(profile?.role || profile?.account_type || "");

    if (!role) return true;

    return role.includes("facility");
  };

  const checkNameMatch = (itemText: any, neededText: any) => {
    const item = normalizeText(itemText);
    const needed = normalizeText(neededText);

    if (!item || !needed) {
      return false;
    }

    if (item === needed) {
      return true;
    }

    if (item.includes(needed) || needed.includes(item)) {
      return true;
    }

    return hasCommonToken(item, needed);
  };

  const calculateMatchScore = (
    scannedItemName: string,
    scannedDescription: string,
    scannedIssues: string,
    post: any,
  ) => {
    const postItemNeeded = getPostItemNeededText(post);
    const postDescription = getPostDescriptionText(post);
    const postIssues = getPostIssuesText(post);

    const scannedCombinedText = `${scannedDescription} ${scannedIssues}`;
    const facilityCombinedText = `${postDescription} ${postIssues}`;

    const nameMatches = checkNameMatch(scannedItemName, postItemNeeded);

    const issueTokensMatched = getMatchedTokens(
      scannedCombinedText,
      facilityCombinedText,
    );

    const descriptionTokensMatched = getMatchedTokens(
      scannedDescription,
      facilityCombinedText,
    );

    const itemNameMentionedInFacilityDescription = hasCommonToken(
      scannedItemName,
      facilityCombinedText,
    );

    const issueDescriptionScore = getTokenScore(
      scannedCombinedText,
      facilityCombinedText,
    );

    const isMatched =
      nameMatches &&
      (issueTokensMatched.length > 0 ||
        descriptionTokensMatched.length > 0 ||
        itemNameMentionedInFacilityDescription ||
        issueDescriptionScore > 0 ||
        normalizeText(facilityCombinedText).length === 0);

    const score =
      (nameMatches ? 80 : 0) +
      issueTokensMatched.length * 12 +
      descriptionTokensMatched.length * 8 +
      issueDescriptionScore * 20 +
      (itemNameMentionedInFacilityDescription ? 5 : 0);

    return {
      isMatched,
      score,
      matchedIssues: issueTokensMatched,
    };
  };

  const createOrOpenConversation = async (facility: any) => {
    try {
      const loggedInUser = await getLoggedInUser();
      const itemToMatch = uploadedItemForMatch;

      if (!loggedInUser.userId || !itemToMatch?.id || !facility?.id) {
        Alert.alert(
          "Message Error",
          "The item was saved, but the conversation details are incomplete. Please open this item from My Items and try again.",
        );
        return;
      }

      const cleanUserId = String(loggedInUser.userId);
      const cleanFacilityId = String(facility.id);
      const cleanItemId = String(itemToMatch.id);
      const cleanItemName = String(itemToMatch.item_name || itemName || "Item");
      const cleanFacilityName = String(facility.name || "Facility");
      const now = new Date().toISOString();
      const conversationId = `${cleanUserId}_${cleanFacilityId}_${cleanItemId}`;

      const itemPhoto = String(
        itemToMatch.image_url ||
          itemToMatch.image ||
          itemToMatch.item_image ||
          itemToMatch.photo_url ||
          itemToMatch.scanned_image_url ||
          image ||
          "",
      );

      const profileImage =
        typeof facility.image === "object" && facility.image?.uri
          ? facility.image.uri
          : String(
              facility.profile_image || facility.facility_profile_image || "",
            );

      const unfinishedStatuses = [
        "match_pending",
        "request_pending",
        "pending",
        "matched",
        "accepted",
        "active",
        "finish_pending",
      ];

      const { data: unfinishedConversations, error: unfinishedError } =
        await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", cleanUserId)
          .eq("facility_id", cleanFacilityId)
          .in("status", unfinishedStatuses)
          .order("updated_at", { ascending: false });

      if (unfinishedError) {
        console.log("CHECK UNFINISHED MATCH ERROR:", unfinishedError);
      }

      const unfinishedConversation = (unfinishedConversations || []).find(
        (conversation: any) => {
          const status = String(conversation?.status || "").toLowerCase();
          const requestStatus = String(
            conversation?.request_status || "",
          ).toLowerCase();

          const isCancelledOrDone =
            status === "cancelled" ||
            status === "canceled" ||
            status === "rejected" ||
            status === "finished" ||
            requestStatus === "cancelled" ||
            requestStatus === "canceled" ||
            requestStatus === "rejected";

          return !isCancelledOrDone;
        },
      );

      if (unfinishedConversation) {
        setMatchModalVisible(false);

        Alert.alert(
          "Unfinished Match",
          "There is still an unfinished match/request with this facility. Please finish or cancel the existing match first before sending another request.",
          [
            {
              text: "View Messages",
              onPress: () => router.replace("/user_dashboard/messages" as any),
            },
          ],
        );

        return;
      }

      const requestConversationData: any = {
        user_id: cleanUserId,
        facility_id: cleanFacilityId,
        facility_name: cleanFacilityName,
        facility_profile_image: profileImage,
        item_id: cleanItemId,
        item_name: cleanItemName,
        last_message: "Match request sent",
        status: "match_pending",
        requested_by: "user",
        request_status: "pending",
        request_sent_at: now,
        updated_at: now,
      };

      const { error: insertError } = await supabase
        .from("conversations")
        .insert([
          {
            id: conversationId,
            ...requestConversationData,
            created_at: now,
          },
        ]);

      if (insertError) {
        console.log("CREATE REQUEST CONVERSATION ERROR:", insertError);
        Alert.alert("Request Error", insertError.message);
        return;
      }

      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)
        .in("message", ["Request sent", "Match request sent"]);

      const richRequestMessage: any = {
        conversation_id: conversationId,
        sender_id: cleanUserId,
        sender_type: "request_card",
        message_type: "match_request",
        message: "",
        item_id: cleanItemId,
        item_name: cleanItemName,
        item_photo: itemPhoto,
        created_at: now,
      };

      const { error: richMessageError } = await supabase
        .from("messages")
        .insert([richRequestMessage]);

      if (richMessageError) {
        console.log("INSERT RICH REQUEST MESSAGE ERROR:", richMessageError);
        Alert.alert("Request Error", richMessageError.message);
        return;
      }

      setMatchModalVisible(false);
      setResultModalVisible(false);

      // Go directly to the conversation after sending the request.
      // No success popup/modal is shown.
      router.replace({
        pathname: "/user_dashboard/chat" as any,
        params: {
          conversationId,
          facility_id: cleanFacilityId,
          facility_name: cleanFacilityName,
          profile_image: profileImage,
          item_id: cleanItemId,
          item_name: cleanItemName,
          item_photo: itemPhoto,
          status: "match_pending",
          requested_by: "user",
          request_status: "pending",
          return_to: "/user_dashboard/messages",
        },
      });
    } catch (error: any) {
      console.log("SEND REQUEST ERROR:", error);
      Alert.alert("Request Error", error?.message || "Failed to send request.");
    }
  };

  const addToMyItemsFromMatchModal = () => {
    setMatchModalVisible(false);
    router.replace("/user_dashboard/user_myItems" as any);
  };

  const fetchFacilityPosts = async () => {
    const possibleTables = [
      "facility_item_requests",
      "facility_posts",
      "facility_postings",
      "facility_item_posts",
      "facility_requests",
      "facility_needed_items",
      "needed_items",
      "posts",
    ];

    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase.from(tableName).select("*");

        console.log(`TRYING FACILITY POST TABLE: ${tableName}`);
        console.log(`FACILITY POST DATA FROM ${tableName}:`, data);
        console.log(`FACILITY POST ERROR FROM ${tableName}:`, error);

        if (!error && data && data.length > 0) {
          console.log(`USING FACILITY POST TABLE: ${tableName}`);
          return data || [];
        }
      } catch (error) {
        console.log(`FACILITY POST TABLE ERROR: ${tableName}`, error);
      }
    }

    return [];
  };

  const fetchAllFacilityProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*");

      console.log("ALL FACILITY PROFILES DATA:", data);
      console.log("ALL FACILITY PROFILES ERROR:", error);

      if (error) {
        return [];
      }

      return (data || []).filter((profile: any) => isFacilityProfile(profile));
    } catch (error) {
      console.log("FETCH ALL FACILITY PROFILES ERROR:", error);
      return [];
    }
  };

  const findBestProfileForPost = (post: any, profiles: any[]) => {
    const postFacilityId = getFacilityIdFromPost(post);
    const postFacilityName = getFacilityNameFromPost(post);

    if (postFacilityId) {
      const exactIdProfile = profiles.find(
        (profile: any) => String(profile.id) === String(postFacilityId),
      );

      if (exactIdProfile) {
        return exactIdProfile;
      }
    }

    const cleanPostFacilityName = normalizeText(postFacilityName);

    if (cleanPostFacilityName) {
      const exactNameProfile = profiles.find((profile: any) => {
        const profileNames = [
          profile.business_name,
          profile.company_name,
          profile.shop_name,
          profile.organization_name,
          profile.facility_name,
          profile.name,
          profile.full_name,
          profile.fullname,
          profile.username,
        ]
          .map((value) => normalizeText(value))
          .filter((value) => value.length > 0);

        return profileNames.some((name) => name === cleanPostFacilityName);
      });

      if (exactNameProfile) {
        return exactNameProfile;
      }

      const partialNameProfile = profiles.find((profile: any) => {
        const profileNames = [
          profile.business_name,
          profile.company_name,
          profile.shop_name,
          profile.organization_name,
          profile.facility_name,
          profile.name,
          profile.full_name,
          profile.fullname,
          profile.username,
        ]
          .map((value) => normalizeText(value))
          .filter((value) => value.length > 0);

        return profileNames.some(
          (name) =>
            name.includes(cleanPostFacilityName) ||
            cleanPostFacilityName.includes(name),
        );
      });

      if (partialNameProfile) {
        return partialNameProfile;
      }
    }

    const postAddress = normalizeText(getFacilityAddressFromPost(post));

    if (postAddress) {
      const addressProfile = profiles.find((profile: any) => {
        const profileAddress = normalizeText(getProfileAddress(profile));

        return (
          profileAddress &&
          (profileAddress.includes(postAddress) ||
            postAddress.includes(profileAddress))
        );
      });

      if (addressProfile) {
        return addressProfile;
      }
    }

    return null;
  };

  const openDropOffBinInAppMap = (bin: any) => {
    setMatchModalVisible(false);

    router.push({
      pathname: "/user_dashboard/user_map" as any,
      params: {
        mapMode: "bins",
        mode: "bins",
        showDropOffBins: "true",

        focusBin: "true",
        focusType: "drop_off_bin",
        autoFocusPin: "true",
        openPinDetails: "true",

        selectedPinType: "bins",
        selectedPinId: String(bin.id),
        selectedPinName: String(bin.name),
        selectedPinAddress: String(bin.address),
        selectedPinLatitude: String(bin.latitude),
        selectedPinLongitude: String(bin.longitude),

        selectedBinId: String(bin.id),
        selectedBinName: String(bin.name),
        selectedBinAddress: String(bin.address),
        selectedBinLatitude: String(bin.latitude),
        selectedBinLongitude: String(bin.longitude),

        bin_id: String(bin.id),
        bin_name: String(bin.name),
        bin_address: String(bin.address),

        latitude: String(bin.latitude),
        longitude: String(bin.longitude),
        targetLatitude: String(bin.latitude),
        targetLongitude: String(bin.longitude),
        targetName: String(bin.name),
        targetAddress: String(bin.address),
      },
    });
  };

  const openGeneralDropOffBinsMap = () => {
    setResultModalVisible(false);
    setMatchModalVisible(false);

    router.replace({
      pathname: EWASTE_DROP_OFFS_ROUTE as any,
      params: {
        mapMode: "bins",
        mode: "bins",
        viewMode: "bins",
        selectedInterface: "drop_off_bins",
        activeInterface: "drop_off_bins",
        activeTab: "drop_off_bins",
        showDropOffBins: "true",
        openDropOffBins: "true",
        showBinsPanel: "true",
        hideFacilityPins: "true",
        focusType: "drop_off_bin",
        fromRejectedItem: "true",
      },
    });
  };

  const findMatchingFacilities = async (
    scannedItemName: string,
    scannedDescription = description,
    scannedIssues = actualIssues.map((issue) => issue.name).join(", "),
  ) => {
    try {
      setFindingMatch(true);
      setMatchItemName(scannedItemName);
      setMatchedFacilities([]);
      setMatchFound(false);

      const facilityPosts = await fetchFacilityPosts();
      const facilityProfiles = await fetchAllFacilityProfiles();

      const activePosts = (facilityPosts || []).filter((post: any) =>
        isPostActive(post),
      );

      const scoredMatches = activePosts
        .map((post: any) => {
          const matchResult = calculateMatchScore(
            scannedItemName,
            scannedDescription,
            cleanIssuesText(scannedIssues),
            post,
          );

          return {
            post,
            ...matchResult,
          };
        })
        .filter((match: any) => match.isMatched)
        .sort((a: any, b: any) => b.score - a.score);

      console.log("SCAN RESULT SCORED MATCHES:", scoredMatches);

      if (scoredMatches.length === 0) {
        setMatchFound(false);
        setMatchedFacilities([]);
        await prepareNearestDropOffBins();
        setMatchModalVisible(true);
        return;
      }

      const bestMatchByFacility: any = {};

      scoredMatches.forEach((match: any) => {
        const post = match.post;
        const profile = findBestProfileForPost(post, facilityProfiles);

        const facilityKey = String(
          profile?.id ||
            getFacilityIdFromPost(post) ||
            normalizeText(getFacilityNameFromPost(post)) ||
            post.id ||
            "",
        );

        if (!facilityKey) return;

        if (
          !bestMatchByFacility[facilityKey] ||
          match.score > bestMatchByFacility[facilityKey].score
        ) {
          bestMatchByFacility[facilityKey] = {
            ...match,
            profile,
          };
        }
      });

      const facilities = Object.keys(bestMatchByFacility).map((facilityKey) => {
        const match = bestMatchByFacility[facilityKey];
        const post = match.post;
        const profile = match.profile || null;

        const finalFacilityId =
          profile?.id || getFacilityIdFromPost(post) || post?.id || facilityKey;

        const finalFacilityName =
          (profile ? getProfileName(profile) : "") ||
          getFacilityNameFromPost(post) ||
          "Facility";

        const finalFacilityAddress =
          (profile ? getProfileAddress(profile) : "") ||
          getFacilityAddressFromPost(post) ||
          "No location provided";

        const profileImage = getProfileImageValue(profile, post);

        return {
          id: String(finalFacilityId),
          name: finalFacilityName,
          address: finalFacilityAddress,
          image: getFacilityImageSource(profileImage || ""),
          item_needed: getPostItemNeededText(post),
          description: getPostDescriptionText(post),
          matched_issues: match.matchedIssues || [],
          match_score: match.score,
        };
      });

      if (facilities.length > 0) {
        setMatchFound(true);
        setMatchedFacilities(facilities);
      } else {
        setMatchFound(false);
        setMatchedFacilities([]);
        await prepareNearestDropOffBins();
      }

      setMatchModalVisible(true);
    } catch (error: any) {
      console.log("MATCH SEARCH ERROR:", error);

      setMatchFound(false);
      setMatchedFacilities([]);
      await prepareNearestDropOffBins();
      setMatchModalVisible(true);
    } finally {
      setFindingMatch(false);
    }
  };

  const showUploadResultAlert = (
    finalDecision: AutoDecision,
    scannedItemName: string,
    uploadedItem?: any,
  ) => {
    const title =
      finalDecision.status === "Approved"
        ? "Item Approved by System"
        : "Item Submitted for Admin Review";

    setResultModalTitle(title);
    setResultModalMessage(finalDecision.note);
    setResultModalDecision(finalDecision);
    setResultModalItemName(scannedItemName);
    setResultModalUploadedItem(uploadedItem || null);
    setResultModalVisible(true);
  };

  const closeResultModalToMyItems = () => {
    setResultModalVisible(false);
    router.replace("/user_dashboard/user_myItems" as any);
  };

  const handleFindMatchFromResultModal = () => {
    setResultModalVisible(false);

    if (resultModalUploadedItem) {
      setUploadedItemForMatch(resultModalUploadedItem);
    }

    findMatchingFacilities(resultModalItemName || itemName);
  };

  const handleCheckDropOffsFromResultModal = () => {
    openGeneralDropOffBinsMap();
  };

  const handleUploadForVerification = async () => {
    try {
      if (!validateForm()) return;

      setUploading(true);

      const loggedInUser = await getLoggedInUser();

      if (!loggedInUser.submitterName || !loggedInUser.userId) {
        Alert.alert(
          "User Error",
          "Cannot find logged-in user details. Please log in again.",
        );
        return;
      }

      let listingLatitude: number | null = null;
      let listingLongitude: number | null = null;

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.granted) {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          listingLatitude = currentLocation.coords.latitude;

          listingLongitude = currentLocation.coords.longitude;

          console.log("LISTING LOCATION:", {
            latitude: listingLatitude,
            longitude: listingLongitude,
          });
        } else {
          console.log(
            "Location permission was not granted. Listing will be saved without coordinates.",
          );
        }
      } catch (locationError) {
        console.log("GET LISTING LOCATION ERROR:", locationError);
      }

      const finalDecision = getAutoDecision(
        recyclability,
        hazardStatus,
        itemData.disposalSuggestions,
      );

      const imageUri = image as string;
      const extension = getImageExtension(imageUri);
      const filePath = `items/${loggedInUser.userId}-${Date.now()}.${extension}`;

      const uploadedMainImage = await uploadImageToBucket(
        "item-images",
        filePath,
        imageUri,
      );

      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            user_id: loggedInUser.userId,
            submitter_name: loggedInUser.submitterName,
            item_name: itemName,
            description: description.trim(),
            issues: selectedIssues.map((issue) => issue.name).join(", "),
            hazard_status: hazardStatus,
            recyclability: recyclability,
            item_image: uploadedMainImage.path,
            status: finalDecision.status,
            latitude: listingLatitude,
            longitude: listingLongitude,

            approval_source:
              finalDecision.status === "Approved" ? "System" : null,
            match_status: finalDecision.match_status,
            auto_decision_note: finalDecision.note,
            reject_reason: finalDecision.reject_reason,
            approved_at: finalDecision.approved_at,
            rejected_at: finalDecision.rejected_at,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.log("INSERT ITEM ERROR:", insertError);
        Alert.alert("Upload Failed", insertError.message);
        return;
      }

      if (!insertedItem?.id) {
        Alert.alert(
          "Upload Failed",
          "Item was saved but the item ID was not returned.",
        );
        return;
      }


      setUploadedItemForMatch(insertedItem);
      showUploadResultAlert(finalDecision, itemName, insertedItem);
    } catch (error: any) {
      console.log("UPLOAD ERROR:", error);

      Alert.alert(
        "Upload Failed",
        error?.message ||
          "Unable to upload item. Please check your internet connection and Supabase Storage buckets.",
      );
    } finally {
      setUploading(false);
    }
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const scrollToCard = () =>
    scrollRef.current?.scrollTo({
      y: Math.max(0, cardY.current - 80),
      animated: true,
    });
  const scrollToBottom = () => scrollRef.current?.scrollToEnd({ animated: true });

  const tourSteps: TourStep[] = [
    {
      key: "welcome",
      icon: "scan-outline",
      title: "Your Scan Result",
      description: isUnknownItem
        ? "The app couldn't recognize this item, but you can still submit it. Here's how to fill in the details."
        : `The app identified this item as "${itemName}". Add a few details, then upload it for review.`,
    },
    {
      key: "scores",
      icon: "speedometer-outline",
      title: "Hazard & Recyclability",
      description:
        "These scores update based on the issues you select below. They help facilities know how to handle the item safely.",
      targetRef: scoresRef,
      prepare: scrollToCard,
    },
    {
      key: "description",
      icon: "create-outline",
      title: "Description",
      description: isUnknownItem
        ? "Required. Write what the item might be, for example \"laptop charger\", plus its condition."
        : "Required. Describe the item's condition, for example whether it still turns on, its brand or any missing parts.",
      targetRef: descriptionRef,
      prepare: scrollToCard,
    },
    {
      key: "issues",
      icon: "warning-outline",
      title: "Issues",
      description:
        "Tap to pick the problems the item has, such as a cracked screen or a glued battery. Select at least one (or None if it has no issues), then tap Done.",
      targetRef: issuesRef,
      prepare: scrollToCard,
    },
    {
      key: "upload",
      icon: "cloud-upload-outline",
      title: "Upload Item",
      description:
        "Submit the item. You'll see whether it's approved, rejected or waiting for admin review. Approved items can be matched with a facility right away, and rejected ones can go to a drop off bin.",
      targetRef: uploadRef,
      prepare: scrollToBottom,
    },
    {
      key: "scan-again",
      icon: "refresh-outline",
      title: "Scan Another Item",
      description: "Discard this result and go back to the camera.",
      targetRef: scanAgainRef,
      prepare: scrollToBottom,
    },
    {
      key: "close",
      icon: "close-outline",
      title: "Close",
      description: "Leave this result without uploading and return to the scanner.",
      targetRef: closeRef,
      prepare: scrollToTop,
    },
    {
      key: "help",
      icon: "help-circle-outline",
      title: "Need Help?",
      description: "Tap this button anytime to replay this guide.",
      targetRef: resultHelpRef,
      prepare: scrollToTop,
    },
  ];

  const finishTour = () => {
    setShowTour(false);
    scrollToTop();

    if (tourUserId) {
      markTourCompleted("user_scan_result", tourUserId);
    }
  };

  useEffect(() => {
    getLoggedInUser().then(async (loggedInUser) => {
      const id = String(loggedInUser?.userId || "");
      if (!id || id === "0") return;

      setTourUserId(id);

      if (!(await hasCompletedTour("user_scan_result", id))) {
        setShowTour(true);
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scanning E-Waste</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              ref={resultHelpRef}
              onPress={() => setShowTour(true)}
              disabled={uploading}
            >
              <Ionicons name="help-circle-outline" size={28} color="#333" />
            </TouchableOpacity>

            <Text
              ref={closeRef}
              style={styles.close}
              onPress={() => router.replace("/user_dashboard/user_scan" as any)}
            >
              ✕
            </Text>
          </View>
        </View>

        {image ? (
          <ExpoImage
            source={{ uri: displayImage }}
            style={styles.image}
            contentFit="cover"
            onLoad={() => console.log("[scan] result image loaded")}
            onError={(e) =>
              console.warn("Scan image failed to load:", image, e.error)
            }
          />
        ) : (
          <View style={styles.noImageBox}>
            <Text>No Image</Text>
          </View>
        )}

        {!isUnknownItem && (
          <Text style={styles.identified}>Item identified</Text>
        )}

        <View
          style={styles.card}
          onLayout={(event) => {
            cardY.current = event.nativeEvent.layout.y;
          }}
        >
          {!isUnknownItem && <Text style={styles.item}>{itemName}</Text>}

          {isUnknownItem && (
            <View style={styles.reminderBox}>
              <Text style={styles.reminderTitle}>Unknown Item</Text>

              <Text style={styles.reminderText}>
                This item was not recognized. Please state the possible item
                name in the description before submitting.
              </Text>
            </View>
          )}

          <View ref={scoresRef} collapsable={false}>
            <Text style={styles.statusText}>
              Hazard Status: <Text style={styles.bold}>{hazardStatus}%</Text>
            </Text>

            <Text style={styles.statusText}>
              Recyclability: <Text style={styles.bold}>{recyclability}%</Text>
            </Text>
          </View>

          <Text style={styles.label}>Description:</Text>

          <TextInput
            ref={descriptionRef}
            placeholder={
              isUnknownItem
                ? "Example: This item is a laptop charger..."
                : "Enter description..."
            }
            placeholderTextColor="#777"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            editable={!uploading}
          />

          <Text style={styles.label}>Issues:</Text>

          <TouchableOpacity
            ref={issuesRef}
            style={styles.dropdown}
            onPress={() => {
              if (!uploading) {
                setModalVisible(true);
              }
            }}
            disabled={uploading}
          >
            <Text
              style={
                selectedIssues.length > 0
                  ? styles.dropdownText
                  : styles.placeholder
              }
            >
              {selectedIssues.length > 0
                ? selectedIssues.map((issue) => issue.name).join(", ")
                : "Select issues"}
            </Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Select Issues</Text>

                <ScrollView>
                  {itemData.issues.map((issue, index) => {
                    const isSelected = selectedIssues.some(
                      (selected) => selected.name === issue.name,
                    );

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.option,
                          isSelected && styles.selectedOption,
                        ]}
                        onPress={() => toggleIssue(issue)}
                      >
                        <Text style={styles.optionText}>
                          {isSelected ? "✓ " : ""}
                          {issue.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </View>

        <Modal visible={resultModalVisible} transparent animationType="fade">
          <View style={styles.resultOverlay}>
            <View style={styles.resultCard}>
              <Text
                style={[
                  styles.resultTitle,
                  resultModalDecision?.status === "Rejected" &&
                    styles.resultRejectedTitle,
                ]}
              >
                {resultModalTitle}
              </Text>

              <ScrollView
                style={styles.resultMessageScroll}
                contentContainerStyle={styles.resultMessageContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.resultMessageWrapper}>
                  {resultModalMessage.split("\n").map((line, index) => {
                    const cleanLine = String(line || "");
                    const trimmedLine = cleanLine.trim();
                    const isBlankLine = trimmedLine === "";
                    const isSectionTitle = trimmedLine.endsWith(":");
                    const isBulletLine = trimmedLine.startsWith("•");

                    if (isBlankLine) {
                      return (
                        <View
                          key={`result-message-space-${index}`}
                          style={styles.resultMessageSpace}
                        />
                      );
                    }

                    return (
                      <View
                        key={`result-message-row-${index}`}
                        style={styles.resultMessageRow}
                      >
                        <Text
                          style={[
                            styles.resultMessageLine,
                            isSectionTitle && styles.resultMessageSectionTitle,
                            isBulletLine && styles.resultBulletLine,
                          ]}
                        >
                          {trimmedLine}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {resultModalDecision?.status === "Approved" ? (
                <>
                  <TouchableOpacity
                    style={styles.resultPrimaryButton}
                    onPress={handleFindMatchFromResultModal}
                    disabled={findingMatch}
                  >
                    <Text style={styles.resultPrimaryButtonText}>
                      {findingMatch ? "Finding..." : "Find a Match"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resultSecondaryButton}
                    onPress={closeResultModalToMyItems}
                  >
                    <Text style={styles.resultSecondaryButtonText}>
                      Add to My Items
                    </Text>
                  </TouchableOpacity>
                </>
              ) : resultModalDecision?.status === "Rejected" ? (
                <>
                  <TouchableOpacity
                    style={styles.resultPrimaryButton}
                    onPress={closeResultModalToMyItems}
                  >
                    <Text style={styles.resultPrimaryButtonText}>
                      Add to My Items
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resultSecondaryButton}
                    onPress={handleCheckDropOffsFromResultModal}
                  >
                    <Text style={styles.resultSecondaryButtonText}>
                      Check E-Waste Drop Offs
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.resultPrimaryButton}
                  onPress={closeResultModalToMyItems}
                >
                  <Text style={styles.resultPrimaryButtonText}>
                    Add to My Items
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={matchModalVisible} transparent animationType="fade">
          <View style={styles.matchOverlay}>
            <View style={styles.matchCard}>
              <Text style={styles.matchHeader}>
                {matchFound ? "Found a Match!" : "No match found"}
              </Text>

              {!matchFound && (
                <>
                  <Text style={styles.noMatchMainText}>
                    No available facilities accepting this item.
                  </Text>

                  <View style={styles.noMatchMessageSpace} />

                  <Text style={styles.matchSubtext}>
                    Dispose it to drop off bins instead?
                  </Text>
                </>
              )}

              {matchFound && matchedFacilities.length > 0 ? (
                <ScrollView
                  style={styles.matchScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {matchedFacilities.map((facility, index) => (
                    <View
                      key={`${facility.id}-${index}`}
                      style={styles.facilityMatchCard}
                    >
                      <Image
                        source={facility.image}
                        style={styles.facilityImage}
                      />

                      <Text style={styles.facilityName}>{facility.name}</Text>

                      <Text style={styles.facilityAddress}>
                        {facility.address}
                      </Text>

                      <View style={styles.matchInfoBox}>
                        <Text style={styles.matchInfoLabel}>Item Needed:</Text>
                        <Text style={styles.matchInfoText}>
                          {facility.item_needed || "Not specified"}
                        </Text>

                        {facility.description ? (
                          <>
                            <Text style={styles.matchInfoLabel}>
                              Facility Description:
                            </Text>
                            <Text style={styles.matchInfoText}>
                              {facility.description}
                            </Text>
                          </>
                        ) : null}

                        {facility.matched_issues?.length > 0 ? (
                          <>
                            <Text style={styles.matchInfoLabel}>
                              Matched Words:
                            </Text>
                            <Text style={styles.matchInfoText}>
                              {facility.matched_issues.join(", ")}
                            </Text>
                          </>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.matchGreenButton}
                        onPress={() => createOrOpenConversation(facility)}
                      >
                        <Text style={styles.matchButtonText}>
                          Send a Request to this Facility
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.matchOrText}>or</Text>

                      <TouchableOpacity
                        style={styles.addToMyItemsMatchButton}
                        onPress={addToMyItemsFromMatchModal}
                      >
                        <Text style={styles.addToMyItemsMatchText}>
                          Add to My Items
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <ScrollView
                  style={styles.dropOffScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {dropOffLocationLoading && (
                    <Text style={styles.dropOffLoadingText}>
                      Finding nearest drop off bins...
                    </Text>
                  )}

                  {nearestDropOffBins.map((bin) => (
                    <View key={bin.id} style={styles.dropOffCard}>
                      <Text style={styles.dropOffName}>{bin.name}</Text>

                      <Text style={styles.dropOffDistance}>
                        {formatDistance(bin.distanceKm)}
                      </Text>

                      <Text style={styles.dropOffAddress}>{bin.address}</Text>

                      <TouchableOpacity
                        style={styles.openMapButton}
                        onPress={() => openDropOffBinInAppMap(bin)}
                      >
                        <Text style={styles.openMapButtonText}>
                          View Pinned Location
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.cancelMatchButton}
                onPress={addToMyItemsFromMatchModal}
              >
                <Text style={styles.cancelMatchText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          ref={uploadRef}
          style={[styles.button, uploading && styles.disabledButton]}
          onPress={handleUploadForVerification}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "Uploading..." : "Upload Item"}
          </Text>
        </TouchableOpacity>

        <Text
          ref={scanAgainRef}
          style={styles.scanAgain}
          onPress={() => router.replace("/user_dashboard/user_scan" as any)}
        >
          ⟳ Scan Another Item
        </Text>
      </ScrollView>

      <OnboardingTour
        visible={showTour}
        steps={tourSteps}
        onFinish={finishTour}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    padding: 20,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  close: {
    fontSize: 28,
    fontWeight: "bold",
  },

  image: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginTop: 20,
  },

  noImageBox: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ddd",
  },

  identified: {
    textAlign: "center",
    marginTop: 12,
    color: "#222",
    fontSize: 16,
  },

  card: {
    marginTop: 20,
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 12,
  },

  item: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },

  reminderBox: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffecb5",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  reminderTitle: {
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 4,
    fontSize: 16,
  },

  reminderText: {
    color: "#856404",
    fontSize: 14,
    lineHeight: 20,
  },

  statusText: {
    fontSize: 16,
    marginTop: 2,
  },

  bold: {
    fontWeight: "bold",
  },

  label: {
    marginTop: 12,
    fontWeight: "bold",
    fontSize: 15,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    minHeight: 45,
    textAlignVertical: "top",
    color: "#000",
  },

  dropdown: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },

  dropdownText: {
    fontSize: 14,
    color: "#000",
  },

  placeholder: {
    color: "#888",
    fontSize: 14,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  selectedOption: {
    backgroundColor: "#e8f5e9",
  },

  optionText: {
    fontSize: 15,
    color: "#222",
  },

  doneButton: {
    marginTop: 15,
    backgroundColor: "#1b5e20",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },








  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  resultCard: {
    width: "100%",
    maxHeight: "82%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "stretch",
  },

  resultTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 12,
    width: "100%",
    alignSelf: "center",
  },

  resultRejectedTitle: {
    color: "#c62828",
  },

  resultMessageScroll: {
    width: "100%",
    maxHeight: 260,
    marginBottom: 15,
    alignSelf: "stretch",
  },

  resultMessageContent: {
    width: "100%",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },

  resultMessageWrapper: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  resultMessageRow: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  resultMessageLine: {
    width: "100%",
    alignSelf: "stretch",
    fontSize: 14,
    color: "#333",
    lineHeight: 21,
    textAlign: "left",
  },

  resultBulletLine: {
    textAlign: "left",
    paddingLeft: 0,
  },

  resultMessageSectionTitle: {
    width: "100%",
    alignSelf: "stretch",
    textAlign: "left",
    fontWeight: "600",
    marginTop: 2,
  },

  resultMessageSpace: {
    height: 10,
    width: "100%",
    alignSelf: "stretch",
  },

  resultPrimaryButton: {
    width: "100%",
    backgroundColor: "#1b5e20",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },

  resultPrimaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  resultSecondaryButton: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1b5e20",
  },

  resultSecondaryButtonText: {
    color: "#1b5e20",
    fontWeight: "bold",
    fontSize: 14,
  },

  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  matchCard: {
    width: "92%",
    maxHeight: "86%",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 16,
    alignItems: "center",
  },

  matchHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },

  noMatchMainText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },

  noMatchMessageSpace: {
    height: 24,
  },

  matchSubtext: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginBottom: 14,
  },

  matchScroll: {
    width: "100%",
    maxHeight: 350,
  },

  facilityMatchCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  facilityImage: {
    width: 75,
    height: 75,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#e0e0e0",
  },

  facilityName: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1b5e20",
  },

  facilityAddress: {
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },

  matchInfoBox: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },

  matchInfoLabel: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "bold",
    marginTop: 4,
  },

  matchInfoText: {
    fontSize: 12,
    color: "#444",
    marginTop: 2,
  },

  matchGreenButton: {
    width: "90%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#53D120",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  matchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  dropOffScroll: {
    width: "100%",
    maxHeight: 360,
  },

  dropOffCard: {
    width: "100%",
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  dropOffName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1b5e20",
    textAlign: "center",
  },

  dropOffDistance: {
    fontSize: 12,
    color: "#1b5e20",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
  },

  dropOffAddress: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 17,
  },

  dropOffLoadingText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },

  openMapButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  openMapButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  matchOrText: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 14,
    color: "#777",
    fontWeight: "700",
    textAlign: "center",
  },

  addToMyItemsMatchButton: {
    width: "90%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#6699CC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  addToMyItemsMatchText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },

  cancelMatchButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  cancelMatchText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#1b5e20",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  scanAgain: {
    textAlign: "center",
    marginTop: 16,
    color: "#1b5e20",
    fontWeight: "600",
    fontSize: 15,
  },
});
