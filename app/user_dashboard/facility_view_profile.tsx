import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function FacilityViewProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const facilityId = String(
    params.facility_id ||
      params.facilityId ||
      params.selectedFacilityId ||
      params.profile_id ||
      params.user_id ||
      params.id ||
      params.facility ||
      ""
  );

  const [facility, setFacility] = useState({
    id: "",
    name: "",
    email: "",
    location: "",
    address: "",
    profileImage: "",
    operatingHoursFrom: "",
    operatingHoursTo: "",
    acceptedItemTypes: "",
    availableServices: "",
  });

  const [postings, setPostings] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [openingChatId, setOpeningChatId] = useState("");

  const [activeSection, setActiveSection] = useState<"postings" | "feedbacks">(
    "postings"
  );

  const [feedbackSort, setFeedbackSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");

  const [refreshing, setRefreshing] = useState(false);

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
    if (facilityId) {
      refreshFacilityProfile();
    } else {
      setFacility({
        id: "",
        name: "Facility not found",
        email: "",
        location: "No location provided",
        address: "No location provided",
        profileImage: "",
        operatingHoursFrom: "",
        operatingHoursTo: "",
        acceptedItemTypes: "",
        availableServices: "",
      });

      setPostings([]);
      setFeedbacks([]);
      setAverageRating(0);
    }
  }, [facilityId]);

  useFocusEffect(
    useCallback(() => {
      if (facilityId) {
        refreshFacilityProfile();
      }
    }, [facilityId])
  );

  useEffect(() => {
    if (!facilityId) return;

    const interval = setInterval(() => {
      refreshFacilityProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [facilityId]);

  const refreshFacilityProfile = async () => {
    await fetchFacilityProfile();
    await fetchPostings();
    await fetchFeedbacks();
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
      return cleanPath;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || "";
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

  const getPostingItemNeeded = (post: any) => {
    return String(
      getValueFromKeys(post, [
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
      ]) || ""
    ).trim();
  };

  const getPostingDescription = (post: any) => {
    return String(
      getValueFromKeys(post, [
        "description",
        "post_description",
        "details",
        "requirements",
        "accepted_items",
        "notes",
        "caption",
        "body",
        "content",
      ]) || ""
    ).trim();
  };

  const getPostingIssues = (post: any) => {
    return String(
      getValueFromKeys(post, [
        "issues",
        "issue",
        "issue_mentions",
        "accepted_issues",
        "condition_notes",
        "requirements",
        "problem",
        "problems",
        "condition",
      ]) || ""
    ).trim();
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
    const cleaned = String(value || "").trim();

    if (!cleaned) return "Not specified";

    return cleaned
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .join(", ");
  };

  const renderHeaderInfoRow = (label: string, value: string) => {
    return (
      <View style={styles.headerInfoRow}>
        <Text style={styles.headerInfoLabel}>{label}</Text>
        <Text style={styles.headerInfoValue}>{value}</Text>
      </View>
    );
  };

  const getStoredUser = async () => {
    const stored = await AsyncStorage.getItem("user");

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    const actualUser = parsed.user || parsed.data || parsed;

    const userId =
      actualUser?.id ||
      actualUser?.user_id ||
      parsed?.id ||
      parsed?.user_id ||
      "";

    const userName =
      actualUser?.name ||
      actualUser?.username ||
      actualUser?.fullname ||
      actualUser?.full_name ||
      parsed?.name ||
      parsed?.username ||
      "User";

    return {
      ...actualUser,
      id: String(userId),
      name: String(userName),
    };
  };

  const fetchFacilityProfile = async () => {
    try {
      if (!facilityId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", String(facilityId))
        .maybeSingle();

      if (error || !data) {
        setFacility({
          id: "",
          name: "Facility not found",
          email: "",
          location: "No location provided",
          address: "No location provided",
          profileImage: "",
          operatingHoursFrom: "",
          operatingHoursTo: "",
          acceptedItemTypes: "",
          availableServices: "",
        });

        setPostings([]);
        setFeedbacks([]);
        setAverageRating(0);
        return;
      }

      const profileImage = data.profile_image
        ? getPublicImageUrl("profile-images", data.profile_image)
        : "";

      setFacility({
        id: String(data.id || ""),
        name:
          data.name ||
          data.username ||
          data.fullname ||
          data.full_name ||
          data.facility_name ||
          "Facility",
        email: data.email || "",
        location: data.location || data.address || "No location provided",
        address: data.address || data.location || "No location provided",
        profileImage,
        operatingHoursFrom: String(data.operating_hours_from || "").trim(),
        operatingHoursTo: String(data.operating_hours_to || "").trim(),
        acceptedItemTypes: String(data.accepted_item_types || "").trim(),
        availableServices: String(data.available_services || "").trim(),
      });
    } catch (error) {
      console.log("FETCH FACILITY PROFILE ERROR:", error);

      setFacility({
        id: "",
        name: "Facility not found",
        email: "",
        location: "No location provided",
        address: "No location provided",
        profileImage: "",
        operatingHoursFrom: "",
        operatingHoursTo: "",
        acceptedItemTypes: "",
        availableServices: "",
      });

      setPostings([]);
      setFeedbacks([]);
      setAverageRating(0);
    }
  };

  const fetchPostings = async () => {
    try {
      if (!facilityId) {
        setPostings([]);
        return;
      }

      const { data, error } = await supabase
        .from("facility_postings")
        .select("*")
        .eq("facility_id", String(facilityId))
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH FACILITY POSTINGS ERROR:", error);
        setPostings([]);
        return;
      }

      setPostings(data || []);
    } catch (error) {
      console.log("FETCH FACILITY POSTINGS ERROR:", error);
      setPostings([]);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      if (!facilityId) {
        setFeedbacks([]);
        setAverageRating(0);
        return;
      }

      const { data, error } = await supabase
        .from("match_feedbacks")
        .select("*")
        .eq("rated_id", Number(facilityId))
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFacilityProfile();
    setRefreshing(false);
  }, [facilityId]);

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

  const goToPage = (path: string) => {
    router.push(path as any);
  };

  const createMatchRequestMessageIfNeeded = async (
    conversationId: string,
    now: string
  ) => {
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
        created_at: now,
      },
    ]);

    if (error) {
      console.log("CREATE MATCH REQUEST MESSAGE ERROR:", error);
    }
  };

  const handleMatchWithFacility = async (post: any) => {
    try {
      const user = await getStoredUser();

      if (!user?.id) {
        Alert.alert("User Error", "Please log in again.");
        router.replace("/signin" as any);
        return;
      }

      const currentFacilityId = String(facility.id || facilityId || "");
      const currentFacilityName = String(facility.name || "Facility");
      const currentFacilityImage = String(facility.profileImage || "");

      if (!currentFacilityId) {
        Alert.alert("Facility Error", "Facility information is missing.");
        return;
      }

      const postingId = String(post.id || "");
      const itemNeeded = getPostingItemNeeded(post);
      const postingDescription = getPostingDescription(post);
      const postingIssues = getPostingIssues(post);

      setOpeningChatId(postingId || currentFacilityId);

      const conversationId = `facility_posting_${String(user.id)}_${currentFacilityId}_${
        postingId || "request"
      }`;

      const now = new Date().toISOString();

      const { data: existingConversation, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (findError) {
        console.log("FIND CONVERSATION ERROR:", findError);
      }

      if (existingConversation) {
        const { error: updateError } = await supabase
          .from("conversations")
          .update({
            user_id: String(user.id),
            user_name: String(user.name || "User"),
            facility_id: currentFacilityId,
            facility_name: currentFacilityName,
            facility_profile_image: currentFacilityImage,
            item_id: postingId,
            item_name: itemNeeded || "",
            request_sender_role: "user",
            request_receiver_role: "facility",
            last_message:
              existingConversation.last_message || "Match request sent",
            updated_at: now,
          })
          .eq("id", conversationId);

        if (updateError) {
          console.log("UPDATE CONVERSATION ERROR:", updateError);
          Alert.alert("Message Error", updateError.message);
          return;
        }

        await createMatchRequestMessageIfNeeded(conversationId, now);
      } else {
        const { error: insertError } = await supabase
          .from("conversations")
          .insert([
            {
              id: conversationId,
              user_id: String(user.id),
              user_name: String(user.name || "User"),
              facility_id: currentFacilityId,
              facility_name: currentFacilityName,
              facility_profile_image: currentFacilityImage,
              item_id: postingId,
              item_name: itemNeeded || "",
              status: "match_pending",
              request_sender_role: "user",
              request_receiver_role: "facility",
              user_finished: false,
              facility_finished: false,
              user_feedback_given: false,
              facility_feedback_given: false,
              last_message: "Match request sent",
              created_at: now,
              updated_at: now,
            },
          ]);

        if (insertError) {
          console.log("CREATE CONVERSATION ERROR:", insertError);
          Alert.alert("Message Error", insertError.message);
          return;
        }

        await createMatchRequestMessageIfNeeded(conversationId, now);
      }

      router.push({
        pathname: "/user_dashboard/chat" as any,
        params: {
          conversationId,
          facility_id: currentFacilityId,
          facility_name: currentFacilityName,
          profile_image: currentFacilityImage,

          item_id: postingId,
          item_name: itemNeeded || "",

          posting_id: postingId,
          facility_posting_id: postingId,
          posting_description: postingDescription || "",
          posting_issues: postingIssues || "",
        },
      });
    } catch (error: any) {
      console.log("MATCH WITH FACILITY CHAT LOGIC ERROR:", error);
      Alert.alert(
        "Message Error",
        error?.message || "Unable to open conversation."
      );
    } finally {
      setOpeningChatId("");
    }
  };

  const renderPosting = ({ item }: any) => {
    const itemNeeded = getPostingItemNeeded(item);
    const description = getPostingDescription(item);
    const isOpening = openingChatId === String(item.id || "");
    const facilityName = facility.name || "Facility";

    return (
      <View style={styles.postCard}>
        <Text style={styles.postLabel}>Facility Name</Text>
        <Text style={styles.postTitle}>
          {item.submitter_name || facility.name}
        </Text>

        <Text style={styles.postLabel}>Item Needed</Text>
        <Text style={styles.itemNeeded}>{itemNeeded || "No item added"}</Text>

        <Text style={styles.postLabel}>Description</Text>
        <Text style={styles.description}>
          {description || "No description added."}
        </Text>

        <View style={styles.postMetaRow}>
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

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.matchButton, isOpening && styles.disabledButton]}
          activeOpacity={0.85}
          disabled={isOpening}
          onPress={() => handleMatchWithFacility(item)}
        >
          <Text style={styles.matchText}>
            {isOpening
              ? "Opening chat..."
              : `Send a request to ${facilityName}`}
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

  const listData = activeSection === "postings" ? postings : sortedFeedbacks;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          activeSection === "postings"
            ? `public-facility-posting-${item.id || index}`
            : `public-facility-feedback-${item.id || index}`
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
                  {facility.location || "No location provided"}
                </Text>
              </View>

              <View style={styles.headerInfoBox}>
                {renderHeaderInfoRow(
                  "Operating Hours",
                  formatOperatingHours(
                    facility.operatingHoursFrom,
                    facility.operatingHoursTo
                  )
                )}

                {renderHeaderInfoRow(
                  "Accepted Item Types",
                  formatCommaText(facility.acceptedItemTypes)
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

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard")}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard/user_scan")}
        >
          <Image
            source={require("../../assets/icons/scan.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_scan" && styles.navActive,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard/user_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_map" && styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard/messages")}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/profile" && styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToPage("/user_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/settings" && styles.navActive,
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
    marginTop: 5,
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

  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 13,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
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
    marginLeft: 10,
    maxWidth: 150,
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 12,
    marginBottom: 12,
  },

  matchButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#8aae8c",
  },

  matchText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
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