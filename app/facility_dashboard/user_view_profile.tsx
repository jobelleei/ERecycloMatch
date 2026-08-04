  import AsyncStorage from "@react-native-async-storage/async-storage";
  import FacilityBottomNav from "../../components/FacilityBottomNav";
 import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
  import { useCallback, useEffect, useMemo, useState } from "react";
  import {
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { supabase } from "../../utils/supabase";

  export default function UserViewProfile() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const userId = String(
      params.user_id ||
        params.receiver_id ||
        params.selected_user_id ||
        params.profile_id ||
        params.id ||
        ""
    );

    const usernameParam = String(
      params.username ||
        params.receiver_username ||
        params.user_username ||
        params.submitter_username ||
        ""
    );

    const emailParam = String(
      params.email ||
        params.receiver_email ||
        params.user_email ||
        params.submitter_email ||
        ""
    );

    const nameParam = String(
      params.name ||
        params.receiver_name ||
        params.user_name ||
        params.submitter_name ||
        ""
    );

    const [facility, setFacility] = useState({
      id: "",
      name: "",
      email: "",
      location: "",
      profileImage: "",
    });

    const [user, setUser] = useState({
      id: "",
      name: "",
      username: "",
      address: "",
      email: "",
      profileImage: "",
    });

    const [items, setItems] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState(0);

    const [activeSection, setActiveSection] = useState<"listed" | "feedbacks">(
      "listed"
    );

    const [feedbackSort, setFeedbackSort] = useState<
      "newest" | "oldest" | "highest" | "lowest"
    >("newest");

    const [refreshing, setRefreshing] = useState(false);
    const [openingChatItemId, setOpeningChatItemId] = useState("");

    const [postIssuePhotos, setPostIssuePhotos] = useState<{
      [itemId: string]: any[];
    }>({});

    const [postImageIndexes, setPostImageIndexes] = useState<{
      [itemId: string]: number;
    }>({});

    const [brokenImageUrls, setBrokenImageUrls] = useState<{
      [url: string]: boolean;
    }>({});

    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

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

    useEffect(() => {
      loadFacility();

      if (userId || usernameParam || emailParam || nameParam) {
        refreshUserProfile();
      } else {
        setUser({
          id: "",
          name: "User not found",
          username: "",
          address: "No location provided",
          email: "",
          profileImage: "",
        });

        setItems([]);
        setFeedbacks([]);
        setAverageRating(0);
        setPostIssuePhotos({});
      }
    }, [userId, usernameParam, emailParam, nameParam]);

    useFocusEffect(
  useCallback(() => {
    loadFacility();

    if (
      userId ||
      usernameParam ||
      emailParam ||
      nameParam
    ) {
      refreshUserProfile();
    }
  }, [
    userId,
    usernameParam,
    emailParam,
    nameParam,
  ])
);

    useEffect(() => {
      if (!userId && !usernameParam && !emailParam && !nameParam) return;

      const interval = setInterval(() => {
        refreshUserProfile();
      }, 5000);

      return () => clearInterval(interval);
    }, [userId, usernameParam, emailParam, nameParam]);

    const loadFacility = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");

        if (!stored) {
          setFacility({
            id: "",
            name: "",
            email: "",
            location: "",
            profileImage: "",
          });
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

        const facilityName =
          actualUser?.name ||
          actualUser?.facility_name ||
          actualUser?.username ||
          parsed?.name ||
          parsed?.facility_name ||
          parsed?.username ||
          "Facility";

        const facilityEmail = actualUser?.email || parsed?.email || "";

        const facilityLocation =
          actualUser?.location ||
          actualUser?.address ||
          parsed?.location ||
          parsed?.address ||
          "";

        const profileImage =
          actualUser?.profile_image ||
          actualUser?.profileImage ||
          parsed?.profile_image ||
          parsed?.profileImage ||
          "";

        setFacility({
          id: String(facilityId),
          name: String(facilityName),
          email: String(facilityEmail),
          location: String(facilityLocation),
          profileImage: String(profileImage),
        });

      } catch (error) {
        console.log("LOAD FACILITY ERROR:", error);
      }
    };

    const refreshUserProfile = async () => {
      await fetchUserProfile();
    };

    const openImagePreview = (imageUrl: string) => {
      if (!imageUrl || imageUrl.includes("via.placeholder.com")) return;

      setPreviewImageUrl(imageUrl);
      setImagePreviewVisible(true);
    };

    const closeImagePreview = () => {
      setImagePreviewVisible(false);
      setPreviewImageUrl("");
    };

    const markImageAsBroken = (imageUrl: string) => {
      if (!imageUrl || imageUrl.includes("via.placeholder.com")) return;

      setBrokenImageUrls((prev) => ({
        ...prev,
        [imageUrl]: true,
      }));
    };

    const normalizeStoragePath = (path: string, bucket: string) => {
      if (!path || String(path).trim() === "") return "";

      let cleanPath = String(path).trim();

      if (cleanPath.startsWith("http")) {
        return cleanPath;
      }

      cleanPath = cleanPath.replace(/^\/+/, "");
      cleanPath = cleanPath.replace(`${bucket}/`, "");
      cleanPath = cleanPath.replace(`public/${bucket}/`, "");
      cleanPath = cleanPath.replace(`storage/v1/object/public/${bucket}/`, "");

      return cleanPath;
    };

    const getPublicImageUrl = (bucket: string, path: string) => {
      if (!path || String(path).trim() === "") return "";

      const cleanPath = normalizeStoragePath(path, bucket);

      if (cleanPath.startsWith("http")) {
        return encodeURI(cleanPath);
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

      return data?.publicUrl ? encodeURI(data.publicUrl) : "";
    };

    const getProfileImageUrl = (image: string) => {
      if (!image || String(image).trim() === "") return "";

      return getPublicImageUrl("profile-images", image);
    };

    const getPostStatus = (item: any) => {
      return item.match_status || item.matchStatus || item.status || "Listed";
    };

    const getItemName = (item: any) => {
      return String(item?.item_name || item?.item_type || "Unnamed Item");
    };

    const extractCityFromAddress = (address: any) => {
      const rawAddress = String(address || "").trim();

      if (!rawAddress || rawAddress.toLowerCase() === "no location provided") {
        return "No location provided";
      }

      const cleanAddress = rawAddress
        .replace(/\s+/g, " ")
        .replace(/\bphilippines\b/gi, "")
        .replace(/\b6100\b/g, "")
        .replace(/\s+,/g, ",")
        .replace(/,\s*$/g, "")
        .trim();

      const parts = cleanAddress
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      const cityKeywords = [
        "city",
        "municipality",
        "bacolod",
        "talisay",
        "silay",
        "bago",
        "la carlota",
        "sagay",
        "cadiz",
        "victorias",
        "san carlos",
        "kabankalan",
        "himamaylan",
        "sipalay",
        "escante",
        "manapla",
        "murcia",
        "eb magalona",
        "e.b. magalona",
        "pulupandan",
        "valladolid",
        "san enrique",
        "pontevedra",
        "hinigaran",
        "binalbagan",
        "isabela",
        "moises padilla",
        "la castellana",
        "candoni",
        "cauayan",
        "hinoba-an",
        "ilog",
      ];

      const cityPart = parts.find((part) => {
        const lowerPart = part.toLowerCase();

        return cityKeywords.some((keyword) => lowerPart.includes(keyword));
      });

      if (cityPart) {
        return cityPart;
      }

      if (parts.length >= 3) {
        return parts[parts.length - 2];
      }

      if (parts.length >= 2) {
        return parts[1];
      }

      return parts[0] || rawAddress;
    };

    const getPostCity = (item: any) => {
      const address =
        item.city ||
        item.municipality ||
        item.location ||
        item.address ||
        item.user_location ||
        item.user_address ||
        user.address ||
        "";

      return extractCityFromAddress(address);
    };

    const getUserCity = () => {
      return extractCityFromAddress(user.address);
    };

    const getMainScannedImageUrl = (item: any) => {
      const imagePath = String(item?.item_image || "").trim();

      if (!imagePath) return "";

      if (imagePath.startsWith("http")) {
        return encodeURI(imagePath);
      }

      return getPublicImageUrl("item-images", imagePath);
    };

    const getIssuePhotoUrl = (photo: any) => {
      const imagePath = String(
        photo?.photo_url ||
          photo?.photo_path ||
          photo?.image_url ||
          photo?.image_path ||
          photo?.storage_path ||
          photo?.file_path ||
          photo?.path ||
          photo?.url ||
          ""
      ).trim();

      if (!imagePath) return "";

      if (imagePath.startsWith("http")) {
        return encodeURI(imagePath);
      }

      return getPublicImageUrl("item-issue-photos", imagePath);
    };

    const getPostImages = (item: any) => {
      const itemId = String(item.id);

      const images: string[] = [];

      const scannedImage = getMainScannedImageUrl(item);

      if (scannedImage && !brokenImageUrls[scannedImage]) {
        images.push(scannedImage);
      }

      const issuePhotosForThisItem = postIssuePhotos[itemId] || [];

      issuePhotosForThisItem.forEach((photo) => {
        const issueImageUrl = getIssuePhotoUrl(photo);

        if (issueImageUrl && !brokenImageUrls[issueImageUrl]) {
          images.push(issueImageUrl);
        }
      });

      const finalImages = [...new Set(images)];

      if (finalImages.length === 0) {
        return ["https://via.placeholder.com/300"];
      }

      return finalImages;
    };

    const nextPostImage = (itemId: string, totalImages: number) => {
      setPostImageIndexes((prev) => {
        const currentIndex = prev[itemId] || 0;
        const nextIndex = currentIndex + 1 >= totalImages ? 0 : currentIndex + 1;

        return {
          ...prev,
          [itemId]: nextIndex,
        };
      });
    };

    const previousPostImage = (itemId: string, totalImages: number) => {
      setPostImageIndexes((prev) => {
        const currentIndex = prev[itemId] || 0;
        const previousIndex =
          currentIndex - 1 < 0 ? totalImages - 1 : currentIndex - 1;

        return {
          ...prev,
          [itemId]: previousIndex,
        };
      });
    };

    const cleanIssues = (issues: any) => {
      if (!issues || String(issues).trim() === "") return [];

      if (Array.isArray(issues)) {
        return issues
          .map((issue) => String(issue).trim())
          .filter((issue) => issue.length > 0 && issue.toLowerCase() !== "none");
      }

      try {
        const parsed = JSON.parse(String(issues));

        if (Array.isArray(parsed)) {
          return parsed
            .map((issue) => String(issue).trim())
            .filter(
              (issue) => issue.length > 0 && issue.toLowerCase() !== "none"
            );
        }
      } catch {}

      return String(issues)
        .split(",")
        .map((issue) =>
          issue
            .replace(/\s*\([^)]*\)/g, "")
            .replace(/\s*recyclability/gi, "")
            .replace(/\s*hazard/gi, "")
            .trim()
        )
        .filter((issue) => issue.length > 0 && issue.toLowerCase() !== "none");
    };

    const renderStars = (rating: number) => {
      const cleanRating = Math.max(
        0,
        Math.min(5, Math.round(Number(rating || 0)))
      );

      return "★".repeat(cleanRating) + "☆".repeat(5 - cleanRating);
    };

    const fetchUserProfile = async () => {
      try {
        let selectedUser: any = null;

        if (userId) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .ilike("role", "user")
            .maybeSingle();

          if (error) {
            console.log("FETCH USER BY ID ERROR:", error);
          }

          selectedUser = data || null;
        }

        if (!selectedUser && emailParam) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .ilike("email", emailParam)
            .ilike("role", "user")
            .maybeSingle();

          if (error) {
            console.log("FETCH USER BY EMAIL ERROR:", error);
          }

          selectedUser = data || null;
        }

        if (!selectedUser && usernameParam) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .ilike("role", "user");

          if (error) {
            console.log("FETCH USERS FOR USERNAME ERROR:", error);
          }

          const users = data || [];

          selectedUser =
            users.find((profile: any) => {
              const username = String(profile?.username || "").toLowerCase();
              const name = String(profile?.name || "").toLowerCase();
              const email = String(profile?.email || "").toLowerCase();

              return (
                username === usernameParam.toLowerCase() ||
                name === usernameParam.toLowerCase() ||
                email === usernameParam.toLowerCase()
              );
            }) || null;
        }

        if (!selectedUser && nameParam) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .ilike("role", "user");

          if (error) {
            console.log("FETCH USERS FOR NAME ERROR:", error);
          }

          const users = data || [];

          selectedUser =
            users.find((profile: any) => {
              const username = String(profile?.username || "").toLowerCase();
              const name = String(profile?.name || "").toLowerCase();
              const email = String(profile?.email || "").toLowerCase();

              return (
                name === nameParam.toLowerCase() ||
                username === nameParam.toLowerCase() ||
                email === nameParam.toLowerCase()
              );
            }) || null;
        }

        if (!selectedUser) {
          setUser({
            id: "",
            name: "User not found",
            username: "",
            address: "No location provided",
            email: "",
            profileImage: "",
          });

          setItems([]);
          setFeedbacks([]);
          setAverageRating(0);
          setPostIssuePhotos({});
          return;
        }

        const mappedUser = {
          id: String(selectedUser.id || ""),
          name: selectedUser.name || "User",
          username: selectedUser.username || selectedUser.name || "username",
          address:
            selectedUser.address ||
            selectedUser.location ||
            "No location provided",
          email: selectedUser.email || "",
          profileImage: getProfileImageUrl(selectedUser.profile_image || ""),
        };

        setUser(mappedUser);

        await fetchListings(mappedUser);
        await fetchFeedbacks(mappedUser);
      } catch (error) {
        console.log("FETCH PUBLIC USER PROFILE ERROR:", error);

        setUser({
          id: "",
          name: "User not found",
          username: "",
          address: "No location provided",
          email: "",
          profileImage: "",
        });

        setItems([]);
        setFeedbacks([]);
        setAverageRating(0);
        setPostIssuePhotos({});
      }
    };

    const fetchIssuePhotosForListings = async (listedItems: any[]) => {
      try {
        if (!listedItems || listedItems.length === 0) {
          setPostIssuePhotos({});
          return;
        }

        const itemIds = listedItems
          .map((item) => item.id)
          .filter((id) => id !== null && id !== undefined);

        if (itemIds.length === 0) {
          setPostIssuePhotos({});
          return;
        }

        const { data, error } = await supabase
          .from("item_issue_photos")
          .select("*")
          .in("item_id", itemIds)
          .order("created_at", { ascending: true });

        if (error) {
          console.log("FETCH ISSUE PHOTOS ERROR:", error);
          setPostIssuePhotos({});
          return;
        }

        const groupedPhotos: { [itemId: string]: any[] } = {};

        (data || []).forEach((photo: any) => {
          const itemId = String(photo.item_id);

          if (!groupedPhotos[itemId]) {
            groupedPhotos[itemId] = [];
          }

          groupedPhotos[itemId].push(photo);
        });

        setPostIssuePhotos(groupedPhotos);
      } catch (error) {
        console.log("FETCH ISSUE PHOTOS ERROR:", error);
        setPostIssuePhotos({});
      }
    };

    const getItemTimeValue = (item: any) => {
      const dateValue =
        item.listed_at ||
        item.date_listed ||
        item.created_at ||
        item.updated_at ||
        item.submitted_at ||
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

    const fetchListings = async (mappedUser: any) => {
      try {
        if (!mappedUser.name && !mappedUser.id) {
          setItems([]);
          setPostIssuePhotos({});
          return;
        }

        let data: any[] | null = null;
        let error: any = null;

        if (mappedUser.id) {
          const result = await supabase
            .from("items")
            .select("*")
            .eq("user_id", String(mappedUser.id))
            .order("created_at", { ascending: false });

          data = result.data;
          error = result.error;
        }

        if (error || !data || data.length === 0) {
          const name = String(mappedUser.name || "").trim();

          if (name) {
            const fallback = await supabase
              .from("items")
              .select("*")
              .ilike("submitter_name", name)
              .order("created_at", { ascending: false });

            data = fallback.data;
            error = fallback.error;
          }
        }

        if (error) {
          console.log("FETCH USER LISTED POSTS ERROR:", error);
          setItems([]);
          setPostIssuePhotos({});
          return;
        }

        const listedPostsOnly = (data || []).filter((item: any) => {
          const status = String(item.status || "").trim().toLowerCase();
          const matchStatus = String(item.match_status || "")
            .trim()
            .toLowerCase();

          return (
            status === "listed" &&
            (matchStatus === "listed" || matchStatus === "pending match")
          );
        });

        const sortedPosts = sortByLatest(listedPostsOnly);

        setItems(sortedPosts);
        await fetchIssuePhotosForListings(sortedPosts);
      } catch (error) {
        console.log("FETCH USER LISTED POSTS ERROR:", error);
        setItems([]);
        setPostIssuePhotos({});
      }
    };

    const fetchFeedbacks = async (mappedUser: any) => {
      try {
        if (!mappedUser.id) {
          setFeedbacks([]);
          setAverageRating(0);
          return;
        }

        const { data, error } = await supabase
          .from("match_feedbacks")
          .select("*")
          .eq("rated_id", Number(mappedUser.id))
          .eq("rated_role", "user")
          .order("created_at", { ascending: false });

        if (error) {
          console.log("FETCH USER FEEDBACKS ERROR:", error);
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
        console.log("FETCH USER FEEDBACKS ERROR:", error);
        setFeedbacks([]);
        setAverageRating(0);
      }
    };

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await refreshUserProfile();
      setRefreshing(false);
    }, [userId, usernameParam, emailParam, nameParam]);

    const formatListedDate = (item: any) => {
      const dateValue =
        item.listed_at ||
        item.created_at ||
        item.date_listed ||
        item.updated_at ||
        "";

      if (!dateValue) return "No date available";

      const date = new Date(dateValue);

      if (isNaN(date.getTime())) {
        return String(dateValue);
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

    const markItemAsPendingMatch = async (item: any) => {
      try {
        if (!item?.id) return;

        const { error } = await supabase
          .from("items")
          .update({
            status: "Listed",
            match_status: "Pending Match",
            updated_at: new Date().toISOString(),
          })
          .eq("id", String(item.id));

        if (error) {
          console.log("MARK ITEM PENDING MATCH ERROR:", error);
        }
      } catch (error) {
        console.log("MARK ITEM PENDING MATCH ERROR:", error);
      }
    };

    const ensureMatchRequestMessage = async (conversationId: string) => {
      try {
        const { data: existingMessage, error: findError } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", String(conversationId))
          .eq("type", "system")
          .eq("message", "Match request sent")
          .maybeSingle();

        if (findError) {
          console.log("FIND MATCH REQUEST MESSAGE ERROR:", findError);
        }

        if (existingMessage) return;

        const { error } = await supabase.from("messages").insert([
          {
            conversation_id: String(conversationId),
            sender_id: null,
            sender_name: "System",
            sender_role: "system",
            sender_type: "system",
            receiver_id: null,
            type: "system",
            message: "Match request sent",
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.log("ADD MATCH REQUEST MESSAGE ERROR:", error);
        }
      } catch (error) {
        console.log("ENSURE MATCH REQUEST MESSAGE ERROR:", error);
      }
    };

    const openMessage = async (item: any) => {
      try {
        if (!facility.id) {
          Alert.alert("Facility Error", "Please log in again.");
          return;
        }

        if (!user.id) {
          Alert.alert("User Error", "User profile not found.");
          return;
        }

        if (!item?.id) {
          Alert.alert("Item Error", "Item not found.");
          return;
        }

        setOpeningChatItemId(String(item.id));

        const cleanUserId = String(user.id);
        const cleanFacilityId = String(facility.id);
        const cleanItemId = String(item.id);
        const conversationId = `${cleanUserId}_${cleanFacilityId}_${cleanItemId}`;

        const { data: existingConversation, error: findError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .maybeSingle();

        if (findError) {
          console.log("FIND FACILITY TO USER CONVERSATION ERROR:", findError);
        }

        if (!existingConversation) {
          const { error: insertError } = await supabase
            .from("conversations")
            .insert([
              {
                id: conversationId,
                user_id: cleanUserId,
                user_name: user.name || "User",
                user_profile_image: user.profileImage || "",
                facility_id: cleanFacilityId,
                facility_name: facility.name || "Facility",
                facility_profile_image: facility.profileImage || "",
                item_id: cleanItemId,
                item_name: getItemName(item),
                last_message: "Match request sent",
                status: "match_pending",
                is_read: false,
                request_sender_role: "facility",
                request_receiver_role: "user",
                user_finished: false,
                facility_finished: false,
                user_feedback_given: false,
                facility_feedback_given: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            console.log(
              "CREATE FACILITY TO USER CONVERSATION ERROR:",
              insertError
            );
            Alert.alert("Message Error", insertError.message);
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
                is_read: false,
                request_sender_role: "facility",
                request_receiver_role: "user",
                user_finished: false,
                facility_finished: false,
                user_feedback_given: false,
                facility_feedback_given: false,
                updated_at: new Date().toISOString(),
              })
              .eq("id", conversationId);

            if (updateError) {
              console.log(
                "UPDATE FACILITY TO USER CONVERSATION ERROR:",
                updateError
              );
              Alert.alert("Message Error", updateError.message);
              return;
            }
          }
        }

        await ensureMatchRequestMessage(conversationId);
        await markItemAsPendingMatch(item);

        router.push({
          pathname: "/facility_dashboard/chat" as any,
          params: {
            conversationId,
            user_id: cleanUserId,
            user_name: user.name || "User",
            user_profile_image: user.profileImage || "",
            item_id: cleanItemId,
            item_name: getItemName(item),
            request_sender_role: "facility",
            request_receiver_role: "user",
          },
        });
      } catch (error: any) {
        console.log("OPEN FACILITY TO USER CHAT ERROR:", error);
        Alert.alert("Message Error", error?.message || "Failed to open chat.");
      } finally {
        setOpeningChatItemId("");
      }
    };

    const renderPost = ({ item }: any) => {
      const itemId = String(item.id);
      const images = getPostImages(item);
      const currentIndex = postImageIndexes[itemId] || 0;
      const safeIndex = currentIndex >= images.length ? 0 : currentIndex;
      const currentImage = images[safeIndex];
      const isOpeningThisChat = String(openingChatItemId) === itemId;

      const issuesList = cleanIssues(item.issues || item.selected_issues);
      const postCity = getPostCity(item);

      return (
        <View style={styles.postCard}>
          <View style={styles.imageCarouselWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openImagePreview(currentImage)}
              style={styles.imageTouchable}
            >
              <Image
                source={{ uri: currentImage }}
                style={styles.postImage}
                onError={() => markImageAsBroken(currentImage)}
              />
            </TouchableOpacity>

            {images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.carouselButton, styles.carouselLeftButton]}
                  onPress={() => previousPostImage(itemId, images.length)}
                >
                  <Text style={styles.carouselButtonText}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.carouselButton, styles.carouselRightButton]}
                  onPress={() => nextPostImage(itemId, images.length)}
                >
                  <Text style={styles.carouselButtonText}>›</Text>
                </TouchableOpacity>

                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {safeIndex + 1}/{images.length}
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.postTitle}>{getItemName(item)}</Text>

          <Text style={styles.description}>
            {item.description || item.item_type || "No description added."}
          </Text>

          {issuesList.length > 0 && (
            <View style={styles.issuesBox}>
              <Text style={styles.issuesTitle}>Issues:</Text>

              {issuesList.map((issue: string, index: number) => (
                <Text key={`${itemId}-issue-${index}`} style={styles.issueText}>
                  • {issue}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.postMetaRow}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.metaIcon}
            />

            <View style={styles.metaTextColumn}>
              <Text style={styles.metaText}>{postCity}</Text>

              <Text style={styles.dateText}>{formatListedDate(item)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.interestedButton,
              isOpeningThisChat && styles.disabledInterestedButton,
            ]}
            disabled={isOpeningThisChat}
            onPress={() => openMessage(item)}
          >
            <Text style={styles.interestedText}>
              {isOpeningThisChat ? "Opening chat..." : "Interested to this item"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    const renderFeedback = ({ item }: any) => {
      return (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackName}>
              {item.rater_name || "Anonymous Facility"}
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
                    feedbackSort === option.value && styles.activeFilterChipText,
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

    const listData = activeSection === "listed" ? items : sortedFeedbacks;

    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={listData}
          keyExtractor={(item, index) =>
            activeSection === "listed"
              ? `facility-view-user-listed-${item.id || index}`
              : `facility-view-user-feedback-${item.id || index}`
          }
          renderItem={activeSection === "listed" ? renderPost : renderFeedback}
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
                      user.profileImage
                        ? { uri: user.profileImage }
                        : require("../../assets/icons/avatar.png")
                    }
                    style={styles.avatar}
                  />
                </View>

                <Text style={styles.name}>{user.name || "User"}</Text>

                <Text style={styles.username}>
                  @{user.username || "username"}
                </Text>

                <View style={styles.headerLocationRow}>
                  <Image
                    source={require("../../assets/icons/location.png")}
                    style={styles.headerLocationIcon}
                  />

                  <Text style={styles.headerAddress}>{getUserCity()}</Text>
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
              </View>

              <View style={styles.sectionTabs}>
                <TouchableOpacity
                  style={[
                    styles.sectionTabButton,
                    activeSection === "listed" && styles.activeSectionTab,
                  ]}
                  onPress={() => setActiveSection("listed")}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      activeSection === "listed" && styles.activeSectionTabText,
                    ]}
                  >
                    Listed Items
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
              {activeSection === "listed"
                ? "No listed posts yet."
                : "No feedbacks yet."}
            </Text>
          }
        />

        <Modal visible={imagePreviewVisible} transparent animationType="fade">
          <View style={styles.previewOverlay}>
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={closeImagePreview}
            >
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>

            <Image
              source={{ uri: previewImageUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </Modal>

        <FacilityBottomNav
          facilityId={facility.id}
          active="profile"
        />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f2f2f2",
    },

    listContent: {
      paddingBottom: 140,
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
    },

    username: {
      color: "#e8f5e9",
      fontSize: 15,
      marginTop: 4,
    },

    headerLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      paddingHorizontal: 20,
    },

    headerLocationIcon: {
      width: 14,
      height: 14,
      marginRight: 5,
      tintColor: "#fff",
    },

    headerAddress: {
      color: "#fff",
      fontSize: 13,
      textAlign: "center",
    },

    ratingSummaryBox: {
      marginTop: 8,
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
      padding: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },

    imageCarouselWrapper: {
      width: "100%",
      height: 220,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#ddd",
      position: "relative",
    },

    imageTouchable: {
      width: "100%",
      height: "100%",
    },

    postImage: {
      width: "100%",
      height: "100%",
      backgroundColor: "#ddd",
    },

    carouselButton: {
      position: "absolute",
      top: "40%",
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },

    carouselLeftButton: {
      left: 10,
    },

    carouselRightButton: {
      right: 10,
    },

    carouselButtonText: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "bold",
      marginTop: -2,
    },

    imageCounter: {
      position: "absolute",
      right: 10,
      bottom: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },

    imageCounterText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },

    postTitle: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: "bold",
      color: "#222",
    },

    description: {
      marginTop: 5,
      color: "#555",
      fontSize: 14,
      lineHeight: 20,
    },

    issuesBox: {
      marginTop: 10,
      backgroundColor: "#f6f6f6",
      padding: 10,
      borderRadius: 10,
    },

    issuesTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#222",
      marginBottom: 4,
    },

    issueText: {
      fontSize: 13,
      color: "#555",
      lineHeight: 20,
    },

    postMetaRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "flex-start",
    },

    metaIcon: {
      width: 14,
      height: 14,
      marginRight: 6,
      marginTop: 1,
    },

    metaTextColumn: {
      flex: 1,
    },

    metaText: {
      fontSize: 13,
      color: "#555",
    },

    dateText: {
      fontSize: 12,
      color: "#888",
      marginTop: 5,
    },

    divider: {
      height: 1,
      backgroundColor: "#eee",
      marginVertical: 12,
    },

    interestedButton: {
      backgroundColor: "#1b5e20",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 20,
      alignSelf: "center",
    },

    disabledInterestedButton: {
      backgroundColor: "#8aa887",
    },

    interestedText: {
      color: "#fff",
      fontWeight: "600",
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
      color: "#777",
      marginTop: 40,
    },

    previewOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
      padding: 12,
    },

    previewImage: {
      width: "100%",
      height: "85%",
    },

    previewCloseButton: {
      position: "absolute",
      top: 50,
      right: 20,
      backgroundColor: "#fff",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      zIndex: 10,
    },

    previewCloseText: {
      color: "#1b5e20",
      fontWeight: "bold",
      fontSize: 14,
    },
  });