import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();

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
    "listed",
  );

  const [feedbackSort, setFeedbackSort] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");

  const [refreshing, setRefreshing] = useState(false);

  const [postIssuePhotos, setPostIssuePhotos] = useState<{
    [itemId: string]: any[];
  }>({});

  const [postImageIndexes, setPostImageIndexes] = useState<{
    [itemId: string]: number;
  }>({});

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

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path || String(path).trim() === "") return "";

    const cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

    return data?.publicUrl || "";
  };

  const getProfileImageUrl = (image: string) => {
    if (!image || String(image).trim() === "") return "";

    return getPublicImageUrl("profile-images", image);
  };

  const getCityOnlyFromAddress = (addressValue: any) => {
    const fullAddress = String(addressValue || "").trim();

    if (!fullAddress || fullAddress === "No location added") {
      return "No location added";
    }

    const parts = fullAddress
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return fullAddress;
    }

    const cityKeywords = ["city", "municipality", "bayan"];

    const cityPart = parts.find((part) => {
      const lowerPart = part.toLowerCase();

      return cityKeywords.some((keyword) => lowerPart.includes(keyword));
    });

    if (cityPart) {
      return cityPart;
    }

    if (parts.length >= 2) {
      return parts[1];
    }

    return parts[0];
  };

  const getPostStatus = (item: any) => {
    return item.match_status || item.matchStatus || item.status || "Listed";
  };

  const getItemName = (item: any) => {
    return String(
      item?.item_name || item?.item_type || item?.item || "Unnamed Item",
    );
  };

  const getItemImagePath = (item: any) => {
    return String(
      item?.item_image ||
        item?.image ||
        item?.image_path ||
        item?.item_image_url ||
        item?.image_url ||
        item?.photo ||
        item?.photo_url ||
        "",
    );
  };

  const getItemImageUrl = (item: any) => {
    const imagePath = getItemImagePath(item);

    if (!imagePath || String(imagePath).trim() === "") {
      return "https://via.placeholder.com/300";
    }

    return getPublicImageUrl("item-images", imagePath);
  };

  const getIssuePhotoUrl = (photo: any) => {
    const imagePath =
      photo?.image_url ||
      photo?.image_path ||
      photo?.photo_url ||
      photo?.photo ||
      "";

    if (!imagePath || String(imagePath).trim() === "") {
      return "";
    }

    if (String(imagePath).startsWith("http")) {
      return String(imagePath).trim();
    }

    return getPublicImageUrl("item-issue-photos", String(imagePath));
  };

  const getPostImages = (item: any) => {
    const itemId = String(item.id);
    const mainImage = getItemImageUrl(item);

    const issueImages = (postIssuePhotos[itemId] || [])
      .map((photo) => getIssuePhotoUrl(photo))
      .filter((url) => String(url || "").trim() !== "");

    const allImages = [mainImage, ...issueImages].filter(
      (url) => String(url || "").trim() !== "",
    );

    if (allImages.length === 0) {
      return ["https://via.placeholder.com/300"];
    }

    return allImages;
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

  const cleanIssues = (issues: string) => {
    if (!issues || String(issues).trim() === "") return [];

    return String(issues)
      .split(",")
      .map((issue) =>
        issue
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/\s*recyclability/gi, "")
          .replace(/\s*hazard/gi, "")
          .trim(),
      )
      .filter((issue) => issue.length > 0 && issue.toLowerCase() !== "none");
  };

  const renderStars = (rating: number) => {
    const cleanRating = Math.max(
      0,
      Math.min(5, Math.round(Number(rating || 0))),
    );

    return "★".repeat(cleanRating) + "☆".repeat(5 - cleanRating);
  };

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  useEffect(() => {
    if (user.id) {
      fetchListings();
      fetchFeedbacks();
    }
  }, [user.id]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const userId =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const profileImage =
        actualUser?.profileImage ||
        actualUser?.profile_image ||
        parsed?.profileImage ||
        parsed?.profile_image ||
        "";

      const fullAddress =
        actualUser?.address ||
        actualUser?.location ||
        parsed?.address ||
        parsed?.location ||
        "No location added";

      const finalProfileImage = getProfileImageUrl(String(profileImage || ""));
      const cityOnlyAddress = getCityOnlyFromAddress(fullAddress);

      setUser({
        id: String(userId),
        name: actualUser?.name || parsed?.name || "User",
        username:
          actualUser?.username ||
          parsed?.username ||
          actualUser?.name ||
          parsed?.name ||
          "username",
        address: cityOnlyAddress,
        email: actualUser?.email || parsed?.email || "",
        profileImage: finalProfileImage,
      });
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
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
        console.log("FETCH PROFILE ISSUE PHOTOS ERROR:", error);
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
      console.log("FETCH PROFILE ISSUE PHOTOS ERROR:", error);
      setPostIssuePhotos({});
    }
  };

  const fetchListings = async () => {
    try {
      if (!user.id) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", String(user.id))
        .order("listed_at", { ascending: false });

      if (error) {
        console.log("FETCH PROFILE POSTS ERROR:", error);

        const fallbackResult = await supabase
          .from("items")
          .select("*")
          .eq("user_id", String(user.id));

        if (fallbackResult.error) {
          console.log(
            "FETCH PROFILE POSTS FALLBACK ERROR:",
            fallbackResult.error,
          );
          setItems([]);
          return;
        }

        const fallbackListedPostsOnly = (fallbackResult.data || []).filter(
          (item: any) => {
            const status = getPostStatus(item);
            const normalizedStatus = String(status || "")
              .trim()
              .toLowerCase();

            return (
              normalizedStatus === "listed" ||
              normalizedStatus === "pending match" ||
              normalizedStatus === "matched"
            );
          },
        );

        const sortedFallbackPosts = sortByLatest(fallbackListedPostsOnly);
        setItems(sortedFallbackPosts);
        await fetchIssuePhotosForListings(sortedFallbackPosts);
        return;
      }

      const listedPostsOnly = (data || []).filter((item: any) => {
        const status = getPostStatus(item);
        const normalizedStatus = String(status || "")
          .trim()
          .toLowerCase();

        return (
          normalizedStatus === "listed" ||
          normalizedStatus === "pending match" ||
          normalizedStatus === "matched"
        );
      });

      const sortedPosts = sortByLatest(listedPostsOnly);
      setItems(sortedPosts);
      await fetchIssuePhotosForListings(sortedPosts);
    } catch (error) {
      console.log("FETCH PROFILE POSTS ERROR:", error);
      setItems([]);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      if (!user.id) {
        setFeedbacks([]);
        setAverageRating(0);
        return;
      }

      const { data, error } = await supabase
        .from("match_feedbacks")
        .select("*")
        .eq("rated_id", Number(user.id))
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
          0,
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await fetchListings();
    await fetchFeedbacks();
    setRefreshing(false);
  };

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

  const renderPost = ({ item }: any) => {
    const itemId = String(item.id);
    const images = getPostImages(item);
    const currentIndex = postImageIndexes[itemId] || 0;
    const safeIndex = currentIndex >= images.length ? 0 : currentIndex;
    const currentImage = images[safeIndex];

    const issuesList = cleanIssues(item.issues);

    return (
      <View style={styles.postCard}>
        <View style={styles.imageCarouselWrapper}>
          <Image source={{ uri: currentImage }} style={styles.postImage} />

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
          {item.description || "No description added."}
        </Text>

        {issuesList.length > 0 && (
          <View style={styles.issuesBox}>
            <Text style={styles.issuesTitle}>Issues:</Text>

            {issuesList.map((issue, index) => (
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
            <Text style={styles.metaText}>
              {item.location || item.address || user.address}
            </Text>

            <Text style={styles.dateText}>{formatListedDate(item)}</Text>
          </View>
        </View>
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
            ? `profile-listed-${item.id || index}`
            : `profile-feedback-${item.id || index}`
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

                <Text style={styles.headerAddress}>{user.address}</Text>
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
                style={styles.sectionTabButton}
                onPress={() => goToPage("/user_dashboard/user_myItems")}
              >
                <Text style={styles.sectionTabText}>
                  My Items
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sectionTabButton}
                onPress={() => goToPage("/user_dashboard/user_myListing")}
              >
                <Text style={styles.sectionTabText}>
                  My Listings
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
    paddingBottom: 100,
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
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    maxWidth: "90%",
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
    lineHeight: 18,
    flexShrink: 1,
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
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  metaIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
    marginTop: 2,
  },

  metaTextColumn: {
    flex: 1,
  },

  metaText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  dateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    lineHeight: 17,
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
    paddingBottom: 8,
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