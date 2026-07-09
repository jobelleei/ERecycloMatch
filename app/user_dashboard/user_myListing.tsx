import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import UserBottomNav from "../../components/UserBottomNav";
import {
  Alert,
  Dimensions,
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

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const DROP_OFF_BINS = [
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

export default function MyListing() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [matchModalVisible, setMatchModalVisible] = useState(false);

  const [selectedMatchedItem, setSelectedMatchedItem] = useState<any>(null);
  const [matchedFacilities, setMatchedFacilities] = useState<any[]>([]);
  const [matchFound, setMatchFound] = useState(false);
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedDescription, setEditedDescription] = useState("");

  const [modalIssuePhotos, setModalIssuePhotos] = useState<any[]>([]);
  const [loadingIssuePhotos, setLoadingIssuePhotos] = useState(false);

  const [matchedDetail, setMatchedDetail] = useState<any>(null);
  const [loadingMatchedDetail, setLoadingMatchedDetail] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageSource, setPreviewImageSource] = useState<any>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.date_listed ||
      item.created_at ||
      item.updated_at ||
      item.date_created ||
      item.id ||
      0;

    const date = new Date(dateValue);

    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    const numberValue = Number(dateValue);

    return isNaN(numberValue) ? 0 : numberValue;
  };

  const sortByLatest = (list: any[]) => {
    return [...list].sort((a, b) => getItemTimeValue(b) - getItemTimeValue(a));
  };

  const getMatchStatus = (item: any) => {
    const status =
      item.match_status || item.matchStatus || item.status || "Listed";

    const cleanStatus = String(status || "")
      .trim()
      .toLowerCase();

    if (cleanStatus === "matched") return "Matched";
    if (cleanStatus === "pending match") return "Pending Match";
    if (cleanStatus === "listed") return "Listed";
    if (cleanStatus === "finished") return "Finished";
    if (cleanStatus === "recycled") return "Finished";

    return "Listed";
  };

  const getStatusTextStyle = (item: any) => {
    const matchStatus = getMatchStatus(item);

    if (matchStatus === "Matched") return styles.statusMatchedText;
    if (matchStatus === "Pending Match") return styles.statusPendingText;

    return styles.statusListedText;
  };

  const canFindMatchForItem = (item: any) => {
    return getMatchStatus(item) === "Listed";
  };

  const filteredItems =
    filter === "All"
      ? items
      : items.filter((item) => getMatchStatus(item) === filter);

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  useEffect(() => {
    if (userId) {
      fetchListings();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        console.log("No stored user found");
        setUserId("");
        setUserName("");
        setItems([]);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const name =
        actualUser?.name ||
        actualUser?.username ||
        actualUser?.fullname ||
        actualUser?.full_name ||
        parsed?.name ||
        parsed?.username ||
        "";

      setUserId(String(id));
      setUserName(String(name));
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
      setUserId("");
      setUserName("");
      setItems([]);
    }
  };

  const fetchListings = async () => {
    try {
      if (!userId) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", String(userId))
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH LISTINGS ERROR:", error);
        setItems([]);
        return;
      }

      const listedOnly = (data || []).filter((item: any) => {
        const status = String(item.status || "")
          .trim()
          .toLowerCase();
        const matchStatus = String(item.match_status || "")
          .trim()
          .toLowerCase();

        const isFinishedOrRecycled =
          status === "finished" ||
          status === "recycled" ||
          matchStatus === "finished" ||
          matchStatus === "recycled";

        if (isFinishedOrRecycled) {
          return false;
        }

        return (
          status === "listed" ||
          matchStatus === "listed" ||
          matchStatus === "pending match" ||
          matchStatus === "matched"
        );
      });

      setItems(sortByLatest(listedOnly));
    } catch (error) {
      console.log("FETCH LISTINGS ERROR:", error);
      setItems([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const normalizeText = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const cleanIssues = (issues: string) => {
    if (!issues) return "None";

    return issues
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*recyclability/gi, "")
      .replace(/\s*hazard/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isUnknownLabel = (value: any) => {
    const cleanValue = normalizeText(value);

    if (!cleanValue) return true;

    const unknownValues = [
      "unknown",
      "unidentified",
      "not identified",
      "not detected",
      "undetected",
      "object",
      "item",
      "none",
      "null",
      "n a",
      "na",
    ];

    return unknownValues.includes(cleanValue);
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

  const getExpandedItemWords = (value: any) => {
    const baseTokens = getUsefulTokens(value);
    const expanded = new Set(baseTokens);

    const groups = [
      ["watch", "smartwatch", "smart", "wearable"],
      ["laptop", "macbook", "notebook", "computer", "pc"],
      ["phone", "smartphone", "cellphone", "mobile", "iphone", "android"],
      ["tablet", "ipad"],
      ["battery", "batteries"],
      ["charger", "adapter", "power"],
      ["monitor", "screen", "display"],
      ["keyboard", "keypad"],
      ["mouse", "mice"],
      ["printer", "scanner"],
      ["speaker", "audio", "sound"],
      ["camera", "webcam"],
      ["pcb", "board", "motherboard", "circuit"],
      ["plastic", "case", "casing"],
      ["metal", "aluminum", "steel"],
      ["wire", "cable", "cord"],
      ["television", "tv"],
      ["router", "modem"],
      ["headphone", "headphones", "earphone", "earphones", "earbuds"],
    ];

    baseTokens.forEach((token) => {
      groups.forEach((group) => {
        if (group.includes(token)) {
          group.forEach((word) => expanded.add(word));
        }
      });
    });

    return Array.from(expanded);
  };

  const hasSubstringMatch = (textA: any, textB: any) => {
    const cleanA = normalizeText(textA).replace(/\s+/g, "");
    const cleanB = normalizeText(textB).replace(/\s+/g, "");

    if (!cleanA || !cleanB) return false;

    return cleanA.includes(cleanB) || cleanB.includes(cleanA);
  };

  const hasNameOrNeededMatch = (itemName: any, postItemNeeded: any) => {
    if (isUnknownLabel(itemName) || isUnknownLabel(postItemNeeded)) {
      return false;
    }

    const cleanItemName = normalizeText(itemName);
    const cleanPostNeeded = normalizeText(postItemNeeded);

    if (!cleanItemName || !cleanPostNeeded) return false;

    if (cleanItemName === cleanPostNeeded) return true;

    if (hasSubstringMatch(cleanItemName, cleanPostNeeded)) return true;

    const itemTokens = getExpandedItemWords(cleanItemName);
    const postTokens = getExpandedItemWords(cleanPostNeeded);

    const postTokenSet = new Set(postTokens);

    return itemTokens.some((token) => postTokenSet.has(token));
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
    const tokensA = getExpandedItemWords(textA);
    const tokensB = getExpandedItemWords(textB);

    const setB = new Set(tokensB);

    return tokensA.filter((token) => setB.has(token));
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

  const getItemNameText = (item: any) => {
    return getValueFromKeys(item, [
      "item_name",
      "name",
      "label",
      "detected_item",
      "category",
      "object_name",
    ]);
  };

  const getItemDescriptionText = (item: any) => {
    return getValueFromKeys(item, [
      "description",
      "details",
      "remarks",
      "notes",
    ]);
  };

  const getItemIssuesText = (item: any) => {
    return cleanIssues(
      String(
        getValueFromKeys(item, [
          "issues",
          "issue",
          "issue_mentions",
          "problem",
          "problems",
          "condition",
        ]),
      ),
    );
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

  //filtering keywords to help determine condition type and potential matches
  const BROKEN_KEYWORDS = [
    "broken",
    "damaged",
    "defective",
    "repair",
    "for repair",
    "scrap",
    "parts",
    "not working",
    "destroyed",
    "cracked",
    "basag",
    "guba",
    "defect",
  ];

  const WORKING_KEYWORDS = [
    "working",
    "reusable",
    "functional",
    "good condition",
    "usable",
    "slightly used",
    "still works",
    "okay",
    "good",
  ];

  const detectConditionType = (text: string) => {
    const cleanText = String(text || "").toLowerCase();

    const isBroken = BROKEN_KEYWORDS.some((word) => cleanText.includes(word));

    const isWorking = WORKING_KEYWORDS.some((word) => cleanText.includes(word));

    if (isBroken) return "broken";
    if (isWorking) return "working";

    return "unknown";
  };

  const calculateMatchScore = (item: any, post: any) => {
    const itemName = getItemNameText(item);
    const itemDescription = getItemDescriptionText(item);
    const itemIssues = getItemIssuesText(item);

    const postItemNeeded = getPostItemNeededText(post);
    const postDescription = getPostDescriptionText(post);
    const postIssues = getPostIssuesText(post);

    //detect condition type for item and facility based on description and issues to prevent matching working items with broken facilities and vice versa
    const itemCondition = detectConditionType(
      `${itemDescription} ${itemIssues}`,
    );

    const facilityCondition = detectConditionType(
      `${postDescription} ${postIssues}`,
    );

    // Get accepted/rejected conditions
    const acceptedConditions = String(
      post.conditions_accepted || "",
    ).toLowerCase();

    const rejectedConditions = String(
      post.conditions_rejected || "",
    ).toLowerCase();

    // Detect if user item looks broken
    const itemLooksBroken = itemCondition === "broken";

    // Detect if user item looks working
    const itemLooksWorking = itemCondition === "working";

    // Facility accepts BROKEN only, Hide working items
    if (acceptedConditions.includes("broken") && itemLooksWorking) {
      console.log("MATCH FILTERED: facility accepts broken only");

      return {
        isMatched: false,
        score: 0,
        nameScore: 0,
        descriptionScore: 0,
        issueScore: 0,
        matchedIssues: [],
      };
    }

    // Facility rejects broken items
    if (rejectedConditions.includes("broken") && itemLooksBroken) {
      console.log("MATCH FILTERED: broken item rejected by facility");

      return {
        isMatched: false,
        score: 0,
        nameScore: 0,
        descriptionScore: 0,
        issueScore: 0,
        matchedIssues: [],
      };
    }

    //  filtering
    if (itemCondition === "working" && facilityCondition === "broken") {
      console.log("MATCH FILTERED: working item cannot match broken facility");

      return {
        isMatched: false,
        score: 0,
        nameScore: 0,
        descriptionScore: 0,
        issueScore: 0,
        matchedIssues: [],
      };
    }

    const itemNameIsUnknown = isUnknownLabel(itemName);
    const postNeededIsUnknown = isUnknownLabel(postItemNeeded);

    let isMatched = false;
    let matchedNameTokens: string[] = [];
    let matchedDescriptionTokens: string[] = [];
    let descriptionScore = 0;
    let score = 0;
    let matchReason = "";

    if (!itemNameIsUnknown && !postNeededIsUnknown) {
      const nameMatches = hasNameOrNeededMatch(itemName, postItemNeeded);

      if (!nameMatches) {
        console.log("MATCH FAILED - ITEM NAME AND ITEM NEEDED DO NOT MATCH:", {
          item_id: item.id,
          item_name: itemName,
          post_id: post.id,
          post_item_needed: postItemNeeded,
          source_table: post.source_table,
        });

        return {
          isMatched: false,
          score: 0,
          nameScore: 0,
          descriptionScore: 0,
          issueScore: 0,
          matchedIssues: [],
        };
      }

      matchedNameTokens = getMatchedTokens(itemName, postItemNeeded);

      matchedDescriptionTokens = getMatchedTokens(
        `${itemDescription} ${itemIssues}`,
        `${postDescription} ${postIssues}`,
      );

      descriptionScore = getTokenScore(
        `${itemDescription} ${itemIssues}`,
        `${postDescription} ${postIssues}`,
      );

      isMatched = true;
      matchReason = "item_name_matches_item_needed";

      score =
        100 +
        matchedNameTokens.length * 35 +
        matchedDescriptionTokens.length * 10 +
        descriptionScore * 20;
    } else {
      const itemFallbackText = `${itemDescription} ${itemIssues}`;
      const postFallbackText = `${postItemNeeded} ${postDescription} ${postIssues}`;

      matchedDescriptionTokens = getMatchedTokens(
        itemFallbackText,
        postFallbackText,
      );

      descriptionScore = getTokenScore(itemFallbackText, postFallbackText);

      const fallbackSubstringMatch = hasSubstringMatch(
        itemFallbackText,
        postFallbackText,
      );

      isMatched =
        matchedDescriptionTokens.length > 0 ||
        descriptionScore >= 0.15 ||
        fallbackSubstringMatch;

      matchReason = "unknown_label_description_fallback";

      score =
        50 +
        matchedDescriptionTokens.length * 20 +
        descriptionScore * 30 +
        (fallbackSubstringMatch ? 25 : 0);
    }

    console.log("MATCH CHECK RESULT:", {
      item_id: item.id,
      item_name: itemName,
      item_description: itemDescription,
      item_issues: itemIssues,
      post_id: post.id,
      post_item_needed: postItemNeeded,
      post_description: postDescription,
      post_issues: postIssues,
      itemNameIsUnknown,
      postNeededIsUnknown,
      matchedNameTokens,
      matchedDescriptionTokens,
      descriptionScore,
      score,
      isMatched,
      matchReason,
      source_table: post.source_table,
    });

    return {
      isMatched,
      score,
      nameScore: matchedNameTokens.length > 0 ? 1 : 0,
      descriptionScore,
      issueScore: matchedDescriptionTokens.length,
      matchedIssues: [
        ...new Set([...matchedNameTokens, ...matchedDescriptionTokens]),
      ],
    };
  };

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path) return "";

    const cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

    return data?.publicUrl || "";
  };

  const getItemImageSource = (item: any) => {
    const imagePath =
      item?.item_image ||
      item?.image ||
      item?.image_path ||
      item?.item_image_url ||
      item?.image_url ||
      item?.photo ||
      item?.photo_url ||
      "";

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/icon.png");
    }

    const imageUrl = getPublicImageUrl("item-images", String(imagePath));

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${item?.updated_at || item?.created_at || Date.now()}`,
    };
  };

  const getIssuePhotoImageSource = (photo: any) => {
    const imagePath =
      photo?.image_url ||
      photo?.image_path ||
      photo?.photo_url ||
      photo?.photo ||
      "";

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/icon.png");
    }

    if (String(imagePath).startsWith("http")) {
      return {
        uri: `${String(imagePath).trim()}?v=${
          photo?.updated_at || photo?.created_at || Date.now()
        }`,
      };
    }

    const imageUrl = getPublicImageUrl("item-issue-photos", String(imagePath));

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${
        photo?.updated_at || photo?.created_at || Date.now()
      }`,
    };
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
      const publicUrl = getPublicImageUrl(bucket, cleanImage);

      if (publicUrl) {
        return {
          uri: `${publicUrl}?v=${Date.now()}`,
        };
      }
    }

    return require("../../assets/icons/avatar.png");
  };

  const formatDateTime = (value: any) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  };

  const fetchMatchedDetailForItem = async (item: any) => {
    try {
      setMatchedDetail(null);

      if (!item?.id || !userId) {
        return;
      }

      const matchStatus = getMatchStatus(item);

      if (matchStatus !== "Matched" && matchStatus !== "Pending Match") {
        return;
      }

      setLoadingMatchedDetail(true);

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("item_id", String(item.id))
        .eq("user_id", String(userId))
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) {
        console.log("FETCH MATCHED DETAIL ERROR:", error);
        setMatchedDetail(null);
        return;
      }

      const latestConversation = data && data.length > 0 ? data[0] : null;

      setMatchedDetail(latestConversation);
    } catch (error) {
      console.log("FETCH MATCHED DETAIL ERROR:", error);
      setMatchedDetail(null);
    } finally {
      setLoadingMatchedDetail(false);
    }
  };

  const fetchIssuePhotosForItem = async (item: any) => {
    try {
      if (!item?.id) {
        setModalIssuePhotos([]);
        return;
      }

      setLoadingIssuePhotos(true);

      const { data, error } = await supabase
        .from("item_issue_photos")
        .select("*")
        .eq("item_id", item.id)
        .order("created_at", { ascending: true });

      if (error) {
        setModalIssuePhotos([]);
        return;
      }

      setModalIssuePhotos(data || []);
    } catch (error) {
      console.log("FETCH LISTING ISSUE PHOTOS ERROR:", error);
      setModalIssuePhotos([]);
    } finally {
      setLoadingIssuePhotos(false);
    }
  };

  const openImagePreview = (source: any, title: string) => {
    setPreviewImageSource(source);
    setPreviewTitle(title);
    setEditVisible(false);

    setTimeout(() => {
      setPreviewVisible(true);
    }, 250);
  };

  const closeImagePreview = () => {
    setPreviewVisible(false);
    setPreviewImageSource(null);
    setPreviewTitle("");

    if (editingItem) {
      setTimeout(() => {
        setEditVisible(true);
      }, 250);
    }
  };

  const openUpdateModal = async (item: any) => {
    setEditingItem(item);
    setEditedDescription(item.description || "");
    setModalIssuePhotos([]);
    setMatchedDetail(null);
    setEditVisible(true);

    await Promise.all([
      fetchIssuePhotosForItem(item),
      fetchMatchedDetailForItem(item),
    ]);
  };

  const updateDescription = async () => {
    if (!editingItem) return;

    Keyboard.dismiss();

    try {
      const { error } = await supabase
        .from("items")
        .update({
          description: editedDescription,
        })
        .eq("id", editingItem.id)
        .eq("user_id", String(userId));

      if (error) {
        Alert.alert("Update Listing", error.message);
        return;
      }

      Alert.alert("Update Listing", "Listing updated successfully.");

      setEditVisible(false);
      setEditingItem(null);
      setModalIssuePhotos([]);
      setMatchedDetail(null);
      fetchListings();
    } catch (error) {
      console.log("UPDATE LISTING ERROR:", error);
      Alert.alert("Error", "Failed to update listing.");
    }
  };

  const deleteItem = async (item: any) => {
    Alert.alert(
      "Remove Listing",
      "Are you sure you want to remove this item from your listings? It will go back to My Items.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove Listing",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("items")
                .update({
                  status: "Approved",
                  match_status: "Approved",
                  listed_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", item.id)
                .eq("user_id", String(userId));

              if (error) {
                Alert.alert("Remove Listing", error.message);
                return;
              }

              Alert.alert(
                "Listing Removed",
                "This item was removed from your listings and returned to My Items.",
              );

              setItems((prevItems) =>
                prevItems.filter(
                  (currentItem) => String(currentItem.id) !== String(item.id),
                ),
              );

              setSelectedItem(null);
              fetchListings();
            } catch (error) {
              console.log("REMOVE LISTING ERROR:", error);
              Alert.alert("Error", "Failed to remove listing.");
            }
          },
        },
      ],
    );
  };

  const markItemAsPendingMatch = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({
          status: "Listed",
          match_status: "Pending Match",
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .eq("user_id", String(userId));

      if (error) {
        console.log("MARK PENDING MATCH ERROR:", error);
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          String(item.id) === String(itemId)
            ? {
                ...item,
                status: "Listed",
                match_status: "Pending Match",
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.log("MARK PENDING MATCH ERROR:", error);
    }
  };

  const createOrOpenConversation = async (facility: any) => {
    try {
      if (!userId || !selectedMatchedItem?.id || !facility?.id) {
        Alert.alert("Request Error", "Missing request details.");
        return;
      }

      const cleanUserId = String(userId);
      const cleanFacilityId = String(facility.id);
      const cleanItemId = String(selectedMatchedItem.id);

      const conversationId = `${cleanUserId}_${cleanFacilityId}_${cleanItemId}`;

      const { data: existingConversation, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (findError) {
        console.log("FIND CONVERSATION ERROR:", findError);
      }

      if (!existingConversation) {
        const { error: insertError } = await supabase
          .from("conversations")
          .insert([
            {
              id: conversationId,
              user_id: cleanUserId,
              user_name: userName || "User",
              facility_id: cleanFacilityId,
              facility_name: facility.name || "Facility",
              facility_profile_image:
                typeof facility.image === "object" && facility.image?.uri
                  ? facility.image.uri
                  : "",
              item_id: cleanItemId,
              item_name:
                selectedMatchedItem.item_name ||
                selectedMatchedItem.item_type ||
                "",
              last_message: "Match request sent",
              status: "match_pending",
              request_sender_role: "user",
              request_receiver_role: "facility",
              user_finished: false,
              facility_finished: false,
              user_feedback_given: false,
              facility_feedback_given: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.log("CREATE CONVERSATION ERROR:", insertError);
          Alert.alert("Request Error", insertError.message);
          return;
        }
      } else {
        const reusableStatuses = ["cancelled", "rejected", "match_pending"];

        if (reusableStatuses.includes(String(existingConversation.status))) {
          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              status: "match_pending",
              last_message: "Match request sent",
              request_sender_role: "user",
              request_receiver_role: "facility",
              user_finished: false,
              facility_finished: false,
              user_feedback_given: false,
              facility_feedback_given: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);

          if (updateError) {
            console.log("UPDATE CONVERSATION ERROR:", updateError);
            Alert.alert("Request Error", updateError.message);
            return;
          }
        }
      }

      await markItemAsPendingMatch(cleanItemId);

      setMatchModalVisible(false);

      Alert.alert(
        "Request Sent",
        "Your request has been sent to this facility.",
      );

      router.push({
        pathname: "/user_dashboard/chat" as any,
        params: {
          conversationId,
          facility_id: cleanFacilityId,
          facility_name: facility.name || "Facility",
          profile_image:
            typeof facility.image === "object" && facility.image?.uri
              ? facility.image.uri
              : "",
          item_id: cleanItemId,
          item_name:
            selectedMatchedItem.item_name ||
            selectedMatchedItem.item_type ||
            "",
        },
      });
    } catch (error) {
      console.log("OPEN CONVERSATION ERROR:", error);
      Alert.alert("Request Error", "Failed to send request.");
    }
  };

  const fetchFacilityPosts = async () => {
    try {
      const possibleTables = [
        "facility_posts",
        "facility_postings",
        "facility_item_posts",
        "facility_requests",
        "facility_needed_items",
        "needed_items",
        "posts",
      ];

      let allPosts: any[] = [];

      for (const tableName of possibleTables) {
        try {
          const { data, error } = await supabase.from(tableName).select("*");

          if (!error && data && data.length > 0) {
            console.log(`FETCHED POSTS FROM ${tableName}:`, data.length);

            const postsWithSource = data.map((post: any) => ({
              ...post,
              source_table: tableName,
            }));

            allPosts = [...allPosts, ...postsWithSource];
          }
        } catch (error) {
          console.log(`FACILITY POST TABLE ERROR: ${tableName}`, error);
        }
      }

      console.log("TOTAL FACILITY POSTS FETCHED:", allPosts.length);

      return allPosts;
    } catch (error) {
      console.log("FETCH FACILITY POSTS ERROR:", error);
      return [];
    }
  };

  const fetchAllFacilityProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*");

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

  const matchItem = async (item: any) => {
    try {
      if (!canFindMatchForItem(item)) {
        Alert.alert(
          "Match Unavailable",
          "This item already has a match request or has already been matched.",
        );
        return;
      }

      setMatchingItemId(String(item.id));
      setSelectedMatchedItem(item);
      setMatchedFacilities([]);
      setMatchFound(false);

      console.log("ITEM TO MATCH:", {
        id: item.id,
        item_name: item.item_name,
        description: item.description,
        issues: item.issues,
      });

      const facilityPosts = await fetchFacilityPosts();
      const facilityProfiles = await fetchAllFacilityProfiles();

      const activePosts = (facilityPosts || []).filter((post: any) =>
        isPostActive(post),
      );

      console.log("ACTIVE FACILITY POSTS:", activePosts.length);

      const scoredMatches = activePosts
        .map((post: any) => {
          const matchResult = calculateMatchScore(item, post);

          return {
            post,
            ...matchResult,
          };
        })
        .filter((match: any) => match.isMatched && match.score > 0)
        .sort((a: any, b: any) => b.score - a.score);

      console.log("SCORED MATCHES FOUND:", scoredMatches.length);

      if (scoredMatches.length === 0) {
        setMatchFound(false);
        setMatchedFacilities([]);
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
      }

      setMatchModalVisible(true);
    } catch (error) {
      console.log("MATCH ERROR:", error);
      Alert.alert("Error", "Failed to match item.");
    } finally {
      setMatchingItemId(null);
    }
  };

  const renderItem = ({ item }: any) => {
    const uniqueKey = `listed-${item.id}`;
    const matchStatus = getMatchStatus(item);
    const isMatchingThisItem = String(matchingItemId) === String(item.id);
    const showFindMatchButton = canFindMatchForItem(item);

    return (
      <View>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            setSelectedItem(selectedItem === uniqueKey ? null : uniqueKey)
          }
        >
          <Image source={getItemImageSource(item)} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.item_name}</Text>

            <Text style={styles.itemDescription}>
              {item.description || "No description"}
            </Text>

            <Text style={[styles.statusText, getStatusTextStyle(item)]}>
              {matchStatus}
            </Text>
          </View>

          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>

        {selectedItem === uniqueKey && (
          <View style={styles.actionContainer}>
            {showFindMatchButton && (
              <TouchableOpacity
                style={[
                  styles.matchButton,
                  isMatchingThisItem && styles.disabledActionButton,
                ]}
                disabled={isMatchingThisItem}
                onPress={() => matchItem(item)}
              >
                <Text style={styles.matchText}>
                  {isMatchingThisItem ? "Finding..." : "Find a Match"}
                </Text>
              </TouchableOpacity>
            )}

            {matchStatus !== "Matched" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openUpdateModal(item)}
              >
                <Text style={styles.actionText}>Update</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Listing</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{items.length}</Text>
          <Text style={styles.statsLabel}>Listed Items</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => getMatchStatus(item) === "Matched").length}
          </Text>
          <Text style={styles.statsLabel}>Matched</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {
              items.filter((item) => getMatchStatus(item) === "Pending Match")
                .length
            }
          </Text>
          <Text style={styles.statsLabel}>Pending Match</Text>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {["All", "Listed", "Matched", "Pending Match"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filter === status && styles.activeFilterButton,
              ]}
              onPress={() => {
                setFilter(status);
                setSelectedItem(null);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status && styles.activeFilterText,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `listed-${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {filter.toLowerCase()} items yet.
          </Text>
        }
      />

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalBox}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalTitle}>Update Listing</Text>

                {editingItem && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        openImagePreview(
                          getItemImageSource(editingItem),
                          "Item Photo",
                        )
                      }
                    >
                      <Image
                        source={getItemImageSource(editingItem)}
                        style={styles.modalImage}
                      />
                    </TouchableOpacity>

                    <Text style={styles.imageHint}>
                      Tap the image to view the whole photo.
                    </Text>

                    <Text style={styles.modalLabel}>
                      Submitted Issue Photos
                    </Text>

                    {loadingIssuePhotos ? (
                      <View style={styles.issuePhotosEmptyBox}>
                        <Text style={styles.issuePhotosEmptyText}>
                          Loading issue photos...
                        </Text>
                      </View>
                    ) : modalIssuePhotos.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.issuePhotosScroll}
                      >
                        {modalIssuePhotos.map((photo, index) => {
                          const source = getIssuePhotoImageSource(photo);

                          return (
                            <TouchableOpacity
                              key={`issue-photo-${photo.id || index}`}
                              style={styles.issuePhotoPreviewCard}
                              activeOpacity={0.85}
                              onPress={() =>
                                openImagePreview(
                                  source,
                                  photo.issue_name ||
                                    `Issue Photo ${index + 1}`,
                                )
                              }
                            >
                              <Image
                                source={source}
                                style={styles.issuePhotoPreviewImage}
                              />

                              <Text
                                style={styles.issuePhotoPreviewTitle}
                                numberOfLines={2}
                              >
                                {photo.issue_name || `Issue Photo ${index + 1}`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <View style={styles.issuePhotosEmptyBox}>
                        <Text style={styles.issuePhotosEmptyText}>
                          No issue photos submitted for this item.
                        </Text>
                      </View>
                    )}

                    <Text style={styles.modalLabel}>Item Name</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.item_name}
                    </Text>

                    <Text style={styles.modalLabel}>Issues</Text>
                    <Text style={styles.readOnlyText}>
                      {cleanIssues(editingItem.issues)}
                    </Text>

                    <Text style={styles.modalLabel}>Hazard Status</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.hazard_status}%
                    </Text>

                    <Text style={styles.modalLabel}>Recyclability</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.recyclability}%
                    </Text>

                    <Text style={styles.modalLabel}>Status</Text>
                    <Text
                      style={[
                        styles.readOnlyText,
                        styles.statusModalText,
                        getStatusTextStyle(editingItem),
                      ]}
                    >
                      {getMatchStatus(editingItem)}
                    </Text>

                    {(getMatchStatus(editingItem) === "Matched" ||
                      getMatchStatus(editingItem) === "Pending Match") && (
                      <View style={styles.matchedDetailBox}>
                        <Text style={styles.matchedDetailTitle}>
                          {getMatchStatus(editingItem) === "Matched"
                            ? "Matched Facility Details"
                            : "Pending Request Details"}
                        </Text>

                        {loadingMatchedDetail ? (
                          <Text style={styles.matchedDetailText}>
                            Loading matched facility details...
                          </Text>
                        ) : matchedDetail ? (
                          <>
                            <Text style={styles.matchedDetailLabel}>
                              Facility Name
                            </Text>
                            <Text style={styles.matchedDetailText}>
                              {matchedDetail.facility_name || "Facility"}
                            </Text>

                            <Text style={styles.matchedDetailLabel}>
                              Request Status
                            </Text>
                            <Text style={styles.matchedDetailText}>
                              {matchedDetail.status || "Not specified"}
                            </Text>

                            <Text style={styles.matchedDetailLabel}>
                              Last Update
                            </Text>
                            <Text style={styles.matchedDetailText}>
                              {formatDateTime(
                                matchedDetail.updated_at ||
                                  matchedDetail.created_at,
                              )}
                            </Text>

                            <Text style={styles.matchedDetailLabel}>
                              Last Message
                            </Text>
                            <Text style={styles.matchedDetailText}>
                              {matchedDetail.last_message || "No message yet"}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.matchedDetailText}>
                            No matched facility details found yet.
                          </Text>
                        )}
                      </View>
                    )}

                    <Text style={styles.modalLabel}>Description</Text>
                    <TextInput
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      style={styles.input}
                      multiline
                      textAlignVertical="top"
                    />
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditVisible(false);
                      setModalIssuePhotos([]);
                      setMatchedDetail(null);
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updateDescription}
                  >
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeImagePreview}
      >
        <View style={styles.fullImageScreen}>
          <View style={styles.fullImageHeader}>
            <Text style={styles.fullImageTitle} numberOfLines={1}>
              {previewTitle || "Image Preview"}
            </Text>

            <TouchableOpacity
              onPress={closeImagePreview}
              style={styles.fullImageCloseIcon}
            >
              <Text style={styles.fullImageCloseIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fullImageBody}>
            {previewImageSource && (
              <Image
                source={previewImageSource}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.fullImageCloseButton}
            onPress={closeImagePreview}
          >
            <Text style={styles.fullImageCloseButtonText}>Close</Text>
          </TouchableOpacity>
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
                style={{
                  maxHeight: 350,
                  width: "100%",
                }}
                showsVerticalScrollIndicator={false}
              >
                {matchedFacilities.map((facility, index) => (
                  <View key={index} style={styles.facilityMatchCard}>
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
                            Item Description:
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
                        Send Request to This Facility
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
                {DROP_OFF_BINS.map((bin) => (
                  <View key={bin.id} style={styles.dropOffCard}>
                    <Text style={styles.dropOffName}>{bin.name}</Text>

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
              onPress={() => setMatchModalVisible(false)}
            >
              <Text style={styles.cancelMatchText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <UserBottomNav
        userId={userId}
        active="profile"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },

  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statsCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    elevation: 3,
  },

  statsNumber: { fontSize: 20, fontWeight: "bold" },

  statsLabel: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
    textAlign: "center",
  },

  filterWrapper: { height: 45, marginBottom: 15 },

  filterContent: { alignItems: "center" },

  filterButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilterButton: { backgroundColor: "#1b5e20", borderColor: "#1b5e20" },

  filterText: { color: "#555", fontWeight: "bold", fontSize: 12 },

  activeFilterText: { color: "#fff" },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },

  itemInfo: { flex: 1, marginLeft: 10 },

  itemTitle: { fontSize: 16, fontWeight: "bold" },

  itemDescription: { color: "gray", marginTop: 2 },

  statusText: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 12,
  },

  statusListedText: {
    color: "green",
    fontWeight: "bold",
  },

  statusMatchedText: {
    color: "#1976d2",
    fontWeight: "bold",
  },

  statusPendingText: {
    color: "#f9a825",
    fontWeight: "bold",
  },

  statusModalText: {
    fontWeight: "bold",
  },

  dots: { fontSize: 20, color: "gray" },

  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    marginTop: -5,
    gap: 8,
  },

  actionButton: {
    borderWidth: 1,
    borderColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  actionText: { color: "#1976d2", fontWeight: "bold" },

  deleteButton: {
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  matchButton: {
    borderWidth: 1,
    borderColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  disabledActionButton: {
    opacity: 0.5,
  },

  matchText: { color: "green", fontWeight: "bold" },

  deleteText: { color: "red", fontWeight: "bold" },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 40,
    fontSize: 15,
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
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  modalScrollContent: { paddingBottom: 10 },

  modalImage: {
    width: "100%",
    height: 230,
    borderRadius: 12,
    marginBottom: 5,
    resizeMode: "cover",
    backgroundColor: "#e0e0e0",
  },

  imageHint: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 8,
  },

  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

  modalLabel: { fontWeight: "bold", marginTop: 10 },

  readOnlyText: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },

  matchedDetailBox: {
    backgroundColor: "#f5f9ff",
    borderWidth: 1,
    borderColor: "#d5e6ff",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },

  matchedDetailTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 8,
  },

  matchedDetailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1b5e20",
    marginTop: 8,
  },

  matchedDetailText: {
    fontSize: 13,
    color: "#333",
    marginTop: 3,
    lineHeight: 18,
  },

  issuePhotosScroll: {
    marginTop: 8,
    marginBottom: 8,
  },

  issuePhotoPreviewCard: {
    width: 120,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  issuePhotoPreviewImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#ddd",
    resizeMode: "cover",
  },

  issuePhotoPreviewTitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },

  issuePhotosEmptyBox: {
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  issuePhotosEmptyText: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    minHeight: 80,
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
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelText: { color: "gray", fontWeight: "bold" },

  saveText: { color: "#fff", fontWeight: "bold" },

  fullImageScreen: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 25,
  },

  fullImageHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fullImageTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  fullImageCloseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  fullImageCloseIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  fullImageBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.75,
  },

  fullImageCloseButton: {
    backgroundColor: "#1b5e20",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
  },

  fullImageCloseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 10,
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
    marginBottom: 0,
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  facilityAddress: {
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
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
    height: 50,
    borderRadius: 12,
    backgroundColor: "#53D120",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  matchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
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

  dropOffAddress: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 17,
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

  cancelMatchButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  cancelMatchText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
});
