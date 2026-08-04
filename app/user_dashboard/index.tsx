import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
} from "react-native";
import UserBottomNav from "../../components/UserBottomNav";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function UserDashboard() {
  const [userName, setUserName] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [partneredFacilities, setPartneredFacilities] = useState<any[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchedFacilities, setSearchedFacilities] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadUser();
    fetchApprovedFacilities();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

          useEffect(() => {
      if (!userId) return;

      fetchRecentItems(userId);

      const interval = setInterval(() => {
        fetchRecentItems(userId);
      }, 5000);

      return () => clearInterval(interval);
    }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchRecentItems(userId);
      }
    }, [userId])
  );

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchText.trim().length > 0) {
        searchApprovedFacilities(searchText.trim());
      } else {
        setSearchedFacilities([]);
        setShowSearchResults(false);
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchText]);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        setUserId("");
        setUserEmail("");
        setUserName("User");
        setSubmitterName("");
        setRecentItems([]);
        return;
      }

      const parsed = JSON.parse(storedUser);
      const actualUser = parsed.user || parsed.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const email =
        actualUser?.email ||
        parsed?.email ||
        actualUser?.user_email ||
        parsed?.user_email ||
        "";

      const name =
        actualUser?.name ||
        parsed?.name ||
        actualUser?.fullname ||
        parsed?.fullname ||
        actualUser?.full_name ||
        parsed?.full_name ||
        actualUser?.username ||
        parsed?.username ||
        "User";

      setUserId(String(id || ""));
      setUserEmail(String(email || ""));
      setUserName(String(name || "User"));
      setSubmitterName(String(name || "").trim());

      if (id) {
        fetchRecentItems(String(id));
      }
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  };

  const getItemStatus = (item: any) => {
    const status = String(
      item?.status ||
        item?.item_status ||
        item?.approval_status ||
        item?.match_status ||
        ""
    )
      .trim()
      .toLowerCase();

    const matchStatus = String(item?.match_status || "")
      .trim()
      .toLowerCase();

    if (matchStatus === "pending match") return "Pending Match";
    if (matchStatus === "match pending") return "Pending Match";
    if (matchStatus === "matched") return "Matched";
    if (matchStatus === "finished") return "Finished";
    if (matchStatus === "recycled") return "Finished";
    if (matchStatus === "completed") return "Completed";

    if (status === "rejected") return "Rejected";
    if (status === "approved") return "Approved";
    if (status === "listed") return "Listed";
    if (status === "pending") return "Pending";
    if (status === "matched") return "Matched";
    if (status === "finished") return "Finished";
    if (status === "completed") return "Completed";
    if (status === "recycled") return "Finished";

    return "Pending";
  };

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.updated_at ||
      item.listed_at ||
      item.matched_at ||
      item.finished_at ||
      item.approved_at ||
      item.rejected_at ||
      item.submitted_at ||
      item.created_at ||
      item.date_created ||
      item.date_submitted ||
      item.id ||
      0;

    const date = new Date(dateValue);

    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    const numberValue = Number(dateValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const sortByLatestSubmitted = (list: any[]) => {
    return [...list].sort((a, b) => getItemTimeValue(b) - getItemTimeValue(a));
  };

  const fetchRecentItems = async (currentUserId = userId) => {
    try {
      if (!currentUserId) {
        setRecentItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", String(currentUserId))
        .order("updated_at", { ascending: false });

      if (error) {
        console.log("DASHBOARD RECENT ITEMS SUPABASE ERROR:", error);

        const fallback = await supabase
          .from("items")
          .select("*")
          .eq("user_id", String(currentUserId))
          .order("created_at", { ascending: false });

        if (fallback.error) {
          console.log("DASHBOARD RECENT ITEMS FALLBACK ERROR:", fallback.error);
          setRecentItems([]);
          return;
        }

        setRecentItems(sortByLatestSubmitted(fallback.data || []).slice(0, 3));
        return;
      }

      setRecentItems(sortByLatestSubmitted(data || []).slice(0, 3));
    } catch (error) {
      console.log("FETCH RECENT ITEMS ERROR:", error);
      setRecentItems([]);
    }
  };

  const fetchApprovedFacilities = async () => {
    try {
      setLoadingFacilities(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          role,
          status,
          address,
          location,
          profile_image,
          updated_at
        `
        )
        .ilike("role", "facility")
        .ilike("status", "approved")
        .order("id", { ascending: false });

      if (error) {
        console.log("DASHBOARD APPROVED FACILITIES ERROR:", error);
        setPartneredFacilities([]);
        return;
      }

      setPartneredFacilities(data || []);
    } catch (error) {
      console.log("FETCH APPROVED FACILITIES ERROR:", error);
      setPartneredFacilities([]);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadUser();

    if (userId) {
      await fetchRecentItems(userId);
    }

    await fetchApprovedFacilities();

    setRefreshing(false);
  };

  const searchApprovedFacilities = async (keyword: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const cleanKeyword = `%${keyword}%`;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          role,
          status,
          address,
          location,
          profile_image,
          updated_at
        `
        )
        .ilike("role", "facility")
        .ilike("status", "approved")
        .or(
          `name.ilike.${cleanKeyword},address.ilike.${cleanKeyword},location.ilike.${cleanKeyword}`
        )
        .order("id", { ascending: false });

      if (error) {
        console.log("SEARCH APPROVED FACILITIES ERROR:", error);
        setSearchedFacilities([]);
        return;
      }

      setSearchedFacilities(data || []);
    } catch (error) {
      console.log("SEARCH FACILITIES ERROR:", error);
      setSearchedFacilities([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchedFacilities([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
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

  const getFacilityProfileImageSource = (facility: any) => {
    const profileImage = facility.profile_image || "";

    if (!profileImage || String(profileImage).trim() === "") {
      return require("../../assets/icons/avatar.png");
    }

    if (String(profileImage).startsWith("http")) {
      return {
        uri: `${profileImage}?v=${facility.updated_at || Date.now()}`,
      };
    }

    const publicUrl = getPublicImageUrl("profile-images", profileImage);

    if (publicUrl) {
      return {
        uri: `${publicUrl}?v=${facility.updated_at || Date.now()}`,
      };
    }

    return require("../../assets/icons/avatar.png");
  };

  const getFacilityLocation = (facility: any) => {
    const location =
      facility.location ||
      facility.address ||
      facility.facility_location ||
      "";

    return String(location).trim() !== ""
      ? location
      : "No location provided";
  };

  const getStatusStyle = (status: string) => {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (normalizedStatus === "listed") return styles.statusGreen;
    if (normalizedStatus === "approved") return styles.statusBlue;
    if (normalizedStatus === "matched") return styles.statusBlue;
    if (normalizedStatus === "pending match") return styles.statusOrange;
    if (normalizedStatus === "pending") return styles.statusOrange;
    if (normalizedStatus === "rejected") return styles.statusRed;
    if (normalizedStatus === "finished") return styles.statusGreen;
    if (normalizedStatus === "completed") return styles.statusGreen;

    return styles.statusGray;
  };

  const openFacilityProfile = (facility: any) => {
    router.push({
      pathname: "/user_dashboard/facility_view_profile" as any,
      params: {
        facility_id: String(facility.id || ""),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.welcome}>
              Welcome Back{userName ? `, ${userName}` : ""}!
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push("/user_dashboard/notifications" as any)
                }
              >
                <Text style={styles.notificationBell}>🔔</Text>

                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>2</Text>
                </View>
              </TouchableOpacity>

              <Image
                source={require("../../assets/icons/icon.png")}
                style={styles.avatar}
              />
            </View>
          </View>

          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search approved facilities or location"
                placeholderTextColor="#777"
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setShowSearchResults(true);
                }}
                onFocus={() => {
                  if (searchText.trim().length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                style={styles.searchInput}
              />

              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {showSearchResults && searchText.trim().length > 0 && (
              <View style={styles.searchResultsBox}>
                {isSearching ? (
                  <View style={styles.searchLoading}>
                    <ActivityIndicator size="small" color="#2f7d1f" />
                    <Text style={styles.searchLoadingText}>Searching...</Text>
                  </View>
                ) : searchedFacilities.length > 0 ? (
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    style={styles.searchResultScroll}
                  >
                    {searchedFacilities.map((facility) => (
                      <TouchableOpacity
                        key={`facility-search-${facility.id}`}
                        style={styles.facilitySearchItem}
                        activeOpacity={0.8}
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowSearchResults(false);
                          openFacilityProfile(facility);
                        }}
                      >
                        <Image
                          source={getFacilityProfileImageSource(facility)}
                          style={styles.searchFacilityImage}
                        />

                        <View style={styles.searchFacilityInfo}>
                          <Text style={styles.searchFacilityName}>
                            {facility.name || "No facility name"}
                          </Text>

                          <Text
                            style={styles.searchFacilityLocation}
                            numberOfLines={1}
                          >
                            {getFacilityLocation(facility)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noSearchResult}>
                    <Text style={styles.noSearchResultText}>
                      No approved facility found.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <ImageBackground
            source={require("../../assets/images/banner.jpg")}
            style={styles.banner}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.overlay} />

            <Text style={styles.bannerTitle}>
              RECYCLE SMARTER{"\n"}MATCH FASTER
            </Text>

            <Text style={styles.bannerSub}>
              Find the right place for your e-waste with just a few clicks.
            </Text>
          </ImageBackground>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>

            <TouchableOpacity
              onPress={() => router.push("/user_dashboard/user_myItems" as any)}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentItems.length > 0 ? (
            recentItems.map((item) => {
              const currentStatus = getItemStatus(item);

              return (
                <View
                  key={`recent-item-${item.id}-${currentStatus}-${item.updated_at || item.created_at || ""}`}
                  style={styles.itemCard}
                >
                  <Image
                    source={getItemImageSource(item)}
                    style={styles.itemImage}
                  />

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemTitle}>
                      {item.item_name || item.item_type || "No item name"}
                    </Text>

                    <Text style={styles.itemSub} numberOfLines={1}>
                      {item.description || "No description"}
                    </Text>
                  </View>

                  <Text style={getStatusStyle(currentStatus)}>
                    {currentStatus}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent items yet.</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Partnered Recycling Facilities
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/user_dashboard/user_map" as any)}
            >
              <Text style={styles.viewAll}>View More</Text>
            </TouchableOpacity>
          </View>

          {loadingFacilities ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="small" color="#2f7d1f" />
              <Text style={styles.emptyText}>Loading facilities...</Text>
            </View>
          ) : partneredFacilities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {partneredFacilities.map((facility) => (
                <TouchableOpacity
                  key={`partnered-facility-${facility.id}`}
                  style={styles.facilityCard}
                  activeOpacity={0.85}
                  onPress={() => openFacilityProfile(facility)}
                >
                  <Image
                    source={getFacilityProfileImageSource(facility)}
                    style={styles.facilityImage}
                  />

                  <Text style={styles.facilityName} numberOfLines={2}>
                    {facility.name || "Unnamed Facility"}
                  </Text>

                  <Text style={styles.facilityLocation} numberOfLines={2}>
                    {getFacilityLocation(facility)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No approved partnered facilities yet.
              </Text>
            </View>
          )}
        </ScrollView>

       <UserBottomNav
          userId={userId}
          active="home"
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e4f2df",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    position: "relative",
  },

  notificationBell: {
    fontSize: 20,
  },

  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#d32f2f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },

  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  searchArea: {
    marginTop: 15,
    zIndex: 999,
  },

  searchBox: {
    backgroundColor: "#dff0d8",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: "#222",
  },

  clearSearch: {
    fontSize: 26,
    color: "#555",
    paddingHorizontal: 5,
    marginBottom: 2,
  },

  searchResultsBox: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 8,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },

  searchResultScroll: {
    maxHeight: 290,
  },

  searchLoading: {
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  searchLoadingText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 14,
  },

  facilitySearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  searchFacilityImage: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#eee",
  },

  searchFacilityInfo: {
    flex: 1,
    marginLeft: 12,
  },

  searchFacilityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  searchFacilityLocation: {
    marginTop: 3,
    fontSize: 13,
    color: "#666",
  },

  noSearchResult: {
    padding: 18,
    alignItems: "center",
  },

  noSearchResultText: {
    color: "#777",
    fontSize: 14,
  },

  banner: {
    marginTop: 20,
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  bannerSub: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  viewAll: {
    color: "#777",
    fontWeight: "600",
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  itemTitle: {
    fontWeight: "bold",
  },

  itemSub: {
    color: "#777",
    marginTop: 2,
  },

  statusGreen: {
    color: "green",
    fontWeight: "600",
  },

  statusBlue: {
    color: "#1976d2",
    fontWeight: "600",
  },

  statusOrange: {
    color: "orange",
    fontWeight: "600",
  },

  statusRed: {
    color: "red",
    fontWeight: "600",
  },

  statusGray: {
    color: "gray",
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },

  emptyText: {
    color: "gray",
    fontSize: 14,
    marginTop: 5,
  },

  facilityCard: {
    width: 165,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginRight: 15,
    marginTop: 10,
  },

  facilityImage: {
    width: "100%",
    height: 115,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },

  facilityName: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 14,
    color: "#222",
  },

  facilityLocation: {
    marginTop: 3,
    fontSize: 12,
    color: "#777",
    lineHeight: 15,
  },
});