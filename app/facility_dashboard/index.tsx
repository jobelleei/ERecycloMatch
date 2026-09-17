import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import FacilityBottomNav from "../../components/FacilityBottomNav";

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function FacilityDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const reminderShownRef = useRef(false);

  const [facility, setFacility] = useState<any>(null);
  const [facilityName, setFacilityName] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [missingProfileFields, setMissingProfileFields] = useState<string[]>(
    [],
  );
  const [showProfileReminder, setShowProfileReminder] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searchedItems, setSearchedItems] = useState<any[]>([]);
  const [randomListedItems, setRandomListedItems] = useState<any[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadFacility();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
    }, []),
  );

  useEffect(() => {
    const facilityId = facility?.id;

    if (!facilityId) {
      setUnreadNotificationCount(0);
      return;
    }

    fetchUnreadNotificationCount(String(facilityId));

    const channelId = `facility-dash-notifs-${facilityId}-${Date.now()}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${facilityId}`,
        },
        () => {
          fetchUnreadNotificationCount(String(facilityId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facility?.id]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchText.trim().length > 0) {
        searchFacilityData(searchText.trim());
      } else {
        setSearchedUsers([]);
        setSearchedItems([]);
        setShowSearchResults(false);
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchText]);

  const isEmptyValue = (value: any) => {
    if (value === null || value === undefined) return true;

    const text = String(value).trim().toLowerCase();

    return (
      text === "" ||
      text === "null" ||
      text === "undefined" ||
      text === "n/a" ||
      text === "none"
    );
  };

  const getProfileValue = (profile: any, keys: string[]) => {
    if (!profile) return "";

    for (const key of keys) {
      const value = profile[key];

      if (!isEmptyValue(value)) {
        return String(value).trim();
      }
    }

    return "";
  };

  const hideFacilityProfileReminder = () => {
    setMissingProfileFields([]);
    setShowProfileReminder(false);
    reminderShownRef.current = false;
  };

  const checkMissingFacilityProfileDetails = (profile: any) => {
    if (!profile) {
      hideFacilityProfileReminder();
      return;
    }

    const operatingHoursFrom = getProfileValue(profile, [
      "operating_hours_from",
      "operatingHoursFrom",
      "opening_time",
      "openingTime",
      "open_time",
      "openTime",
      "hours_from",
      "hoursFrom",
    ]);

    const operatingHoursTo = getProfileValue(profile, [
      "operating_hours_to",
      "operatingHoursTo",
      "closing_time",
      "closingTime",
      "close_time",
      "closeTime",
      "hours_to",
      "hoursTo",
    ]);

    const operatingHoursCombined = getProfileValue(profile, [
      "operating_hours",
      "operatingHours",
      "business_hours",
      "businessHours",
      "hours",
    ]);

    const acceptedItems = getProfileValue(profile, [
      "accepted_item_types",
      "acceptedItemTypes",
      "accepted_items",
      "acceptedItems",
      "items_accepted",
      "itemsAccepted",
      "accepted_item",
      "acceptedItem",
    ]);

    const availableServices = getProfileValue(profile, [
      "available_services",
      "availableServices",
      "services",
      "facility_services",
      "facilityServices",
      "services_offered",
      "servicesOffered",
    ]);

    const hasOperatingHours =
      !isEmptyValue(operatingHoursCombined) ||
      (!isEmptyValue(operatingHoursFrom) && !isEmptyValue(operatingHoursTo));

    const hasAcceptedItems = !isEmptyValue(acceptedItems);
    const hasAvailableServices = !isEmptyValue(availableServices);

    if (hasOperatingHours && hasAcceptedItems && hasAvailableServices) {
      hideFacilityProfileReminder();
      return;
    }

    const missingFields: string[] = [];

    if (!hasOperatingHours) missingFields.push("Operating Hours");
    if (!hasAcceptedItems) missingFields.push("Accepted Items");
    if (!hasAvailableServices) missingFields.push("Available Services");

    setMissingProfileFields(missingFields);
    setShowProfileReminder(missingFields.length > 0);

    if (missingFields.length > 0 && !reminderShownRef.current) {
      reminderShownRef.current = true;

      Alert.alert(
        "Complete Facility Details",
        `Please specify your ${missingFields.join(
          ", ",
        )} in Edit Profile at Settings.`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => router.push("/facility_dashboard/settings" as any),
          },
        ],
      );
    }
  };

  const fetchUnreadNotificationCount = async (facilityId: string) => {
    try {
      if (!facilityId) {
        setUnreadNotificationCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", Number(facilityId))
        .eq("is_read", false);

      if (error) {
        setUnreadNotificationCount(0);
        return;
      }

      setUnreadNotificationCount(count || 0);
    } catch {
      setUnreadNotificationCount(0);
    }
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

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role !== "facility") {
        router.replace("/user_dashboard" as any);
        return;
      }

      const facilityId =
        actualUser?.id ||
        actualUser?.facility_id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user_id ||
        "";

      const name =
        actualUser?.name ||
        actualUser?.facility_name ||
        actualUser?.username ||
        parsed?.name ||
        "Facility";

      setFacility(actualUser);
      setFacilityName(String(name));

      if (!facilityId) {
        hideFacilityProfileReminder();
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", String(facilityId))
        .maybeSingle();

      if (error || !data) {
        hideFacilityProfileReminder();
        return;
      }

      const latestFacility = {
        ...actualUser,
        ...data,
        role: "facility",
      };

      const latestName =
        latestFacility?.name ||
        latestFacility?.facility_name ||
        latestFacility?.username ||
        name ||
        "Facility";

      setFacility(latestFacility);
      setFacilityName(String(latestName));

      await fetchUnreadNotificationCount(
        String(latestFacility.id || facilityId),
      );

      checkMissingFacilityProfileDetails(latestFacility);

      const updatedStoredFacility = {
        ...parsed,
        ...latestFacility,
        role: "facility",
      };

      if (parsed.user)
        updatedStoredFacility.user = {
          ...parsed.user,
          ...latestFacility,
          role: "facility",
        };
      if (parsed.data)
        updatedStoredFacility.data = {
          ...parsed.data,
          ...latestFacility,
          role: "facility",
        };

      await AsyncStorage.setItem("user", JSON.stringify(updatedStoredFacility));
      fetchRandomListedItems(latestFacility);
    } catch {
      hideFacilityProfileReminder();
    }
  };

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path || String(path).trim() === "") return "";

    let cleanPath = String(path).trim();
    if (cleanPath.startsWith("http")) return cleanPath;

    cleanPath = cleanPath.replace(/^\/+/, "");
    cleanPath = cleanPath.replace(`${bucket}/`, "");
    cleanPath = cleanPath.replace(`public/${bucket}/`, "");
    cleanPath = cleanPath.replace(`storage/v1/object/public/${bucket}/`, "");

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || "";
  };

  const getUserProfileUrl = (user: any) => {
    const imagePath =
      user.profile_image || user.profileImage || user.profile_image_url || "";
    if (!imagePath) return "";
    return getPublicImageUrl("profile-images", imagePath);
  };

  const getItemImageUrl = (item: any) => {
    const imagePath =
      item.item_image ||
      item.image ||
      item.image_path ||
      item.item_image_url ||
      item.image_url ||
      item.photo ||
      item.photo_url ||
      "";
    if (!imagePath) return "";
    return getPublicImageUrl("item-images", imagePath);
  };

  const getUserLocation = (user: any) => {
    const location =
      user.location ||
      user.address ||
      user.user_location ||
      user.user_address ||
      "";
    const rawLocation = String(location).trim();
    if (!rawLocation) return "No location provided";

    const parts = rawLocation
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const cityPart = parts.find((part) => /city|municipality/i.test(part));
    if (cityPart) return cityPart;
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0];
  };

  const getUsername = (user: any) => {
    if (user.username && String(user.username).trim() !== "") {
      return `@${user.username}`;
    }
    return "@No username";
  };

  const isVisibleListedItem = (item: any) => {
    const status = String(item?.status || "")
      .trim()
      .toLowerCase();
    const matchStatus = String(item?.match_status || "")
      .trim()
      .toLowerCase();

    if (
      status === "finished" ||
      status === "recycled" ||
      status === "rejected" ||
      matchStatus === "finished" ||
      matchStatus === "recycled" ||
      matchStatus === "rejected"
    ) {
      return false;
    }
    return true;
  };

  const getApprovalLabel = (item: any) => {
    const approvalSource = String(item?.approval_source || "")
      .trim()
      .toLowerCase();
    if (approvalSource === "system") return "Approved by System";
    if (approvalSource === "admin") return "Approved by Admin";
    return "";
  };

  const searchFacilityData = async (keyword: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const cleanKeyword = `%${keyword}%`;

      // 1. Search Users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(
          `id, name, username, email, address, location, profile_image, role, status`,
        )
        .eq("role", "user")
        .eq("status", "approved")
        .or(
          `name.ilike.${cleanKeyword},username.ilike.${cleanKeyword},email.ilike.${cleanKeyword},address.ilike.${cleanKeyword},location.ilike.${cleanKeyword}`,
        )
        .order("id", { ascending: false })
        .limit(8);

      if (usersError) setSearchedUsers([]);
      else setSearchedUsers(usersData || []);

      // 2. Search Items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .or(
          `item_name.ilike.${cleanKeyword},item_type.ilike.${cleanKeyword},description.ilike.${cleanKeyword}`,
        )
        .order("created_at", { ascending: false });

      if (itemsError) {
        setSearchedItems([]);
      } else {
        const availableItems = (itemsData || []).filter((item: any) =>
          isVisibleListedItem(item),
        );
        setSearchedItems(availableItems);
      }
    } catch {
      setSearchedUsers([]);
      setSearchedItems([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchRandomListedItems = async (profileData: any = facility) => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setRandomListedItems([]);
        return;
      }

      const listedItems = (data || []).filter((item: any) =>
        isVisibleListedItem(item),
      );
      setRandomListedItems(listedItems);
    } catch {
      setRandomListedItems([]);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchedUsers([]);
    setSearchedItems([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  const openUserProfile = (user: any) => {
    clearSearch();
    router.push({
      pathname: "/facility_dashboard/user_view_profile" as any,
      params: {
        user_id: String(user.id || ""),
        username: String(user.username || ""),
        email: String(user.email || ""),
        name: String(user.name || ""),
      },
    });
  };

  const openItemDetails = (item: any) => {
    clearSearch();
    router.push({
      pathname: "/facility_dashboard/item_details" as any,
      params: { item_id: String(item.id) },
    });
  };

  const openEditProfileSettings = () => {
    router.push("/facility_dashboard/settings" as any);
  };

  const hasResults = searchedUsers.length > 0 || searchedItems.length > 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      edges={["top"]}
    >
      <View style={{ flex: 1 }}>
        {/* Top Header & Search Bar */}
        <View style={styles.topFixedSection}>
          <View style={styles.header}>
            <Text style={styles.welcome} numberOfLines={1}>
              Welcome Back{facilityName ? `, ${facilityName}` : ""}!
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    "/facility_dashboard/facility_notifications" as any,
                  )
                }
              >
                <Feather name="bell" size={24} color="#000000" />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99
                        ? "99+"
                        : unreadNotificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search for users, usernames, or listed items"
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

            {searchText.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
                <Text style={styles.clearSearch}>×</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.searchIconBox}>
                <Ionicons name="search-outline" size={19} color="#666" />
              </View>
            )}
          </View>
        </View>

        {/* Backdrop overlay */}
        {showSearchResults && searchText.trim().length > 0 && (
          <TouchableWithoutFeedback onPress={() => setShowSearchResults(false)}>
            <View style={styles.searchBackdrop} />
          </TouchableWithoutFeedback>
        )}

        {/* Floating Dropdown Results */}
        {showSearchResults && searchText.trim().length > 0 && (
          <View style={styles.floatingSearchResultsBox}>
            {isSearching ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color="#2f7d1f" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : hasResults ? (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.searchResultScroll}
              >
                {/* Users List */}
                {searchedUsers.length > 0 && (
                  <View>
                    <Text style={styles.resultSectionTitle}>
                      Users ({searchedUsers.length})
                    </Text>

                    {searchedUsers.map((user) => {
                      const profileImage = getUserProfileUrl(user);

                      return (
                        <TouchableOpacity
                          key={`user-${user.id}`}
                          style={styles.searchResultItem}
                          activeOpacity={0.8}
                          onPress={() => openUserProfile(user)}
                        >
                          <Image
                            source={
                              profileImage
                                ? { uri: profileImage }
                                : require("../../assets/icons/avatar.png")
                            }
                            style={styles.searchRoundImage}
                          />

                          <View style={styles.searchInfo}>
                            <Text style={styles.searchTitle}>
                              {user.name || "No name"}
                            </Text>

                            <Text style={styles.usernameText}>
                              {getUsername(user)}
                            </Text>

                            <Text style={styles.searchSubtitle}>
                              {getUserLocation(user)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Items List */}
                {searchedItems.length > 0 && (
                  <View
                    style={{
                      marginTop: searchedUsers.length > 0 ? 8 : 0,
                    }}
                  >
                    <Text style={styles.resultSectionTitle}>
                      Available Items ({searchedItems.length})
                    </Text>

                    {searchedItems.map((item, index) => {
                      const itemImage = getItemImageUrl(item);

                      return (
                        <TouchableOpacity
                          key={`search-item-${item.id}-${index}`}
                          style={styles.searchResultItem}
                          activeOpacity={0.8}
                          onPress={() => openItemDetails(item)}
                        >
                          <Image
                            source={
                              itemImage
                                ? { uri: itemImage }
                                : require("../../assets/icons/icon.png")
                            }
                            style={styles.searchSquareImage}
                          />

                          <View style={styles.searchInfo}>
                            <View style={styles.itemTitleStatusRow}>
                              <Text
                                style={styles.searchTitle}
                                numberOfLines={1}
                              >
                                {item.item_name ||
                                  item.item_type ||
                                  "No item name"}
                              </Text>
                            </View>

                            <Text style={styles.usernameText}>
                              By: {item.submitter_name || "Community User"}
                            </Text>

                            <Text
                              style={styles.searchSubtitle}
                              numberOfLines={1}
                            >
                              {item.description ||
                                item.location ||
                                "Tap to review details"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.noSearchResult}>
                <Text style={styles.noSearchResultText}>
                  No users or items found for "{searchText}".
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Main Content Area */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showProfileReminder && missingProfileFields.length > 0 && (
            <View style={styles.profileReminderBox}>
              <View style={styles.profileReminderHeader}>
                <Text style={styles.profileReminderTitle}>
                  Complete your facility profile
                </Text>

                <TouchableOpacity onPress={() => setShowProfileReminder(false)}>
                  <Text style={styles.profileReminderClose}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.profileReminderText}>
                Please specify your {missingProfileFields.join(", ")} in Edit
                Profile at Settings. These details help users know what your
                facility accepts and what services you offer.
              </Text>

              <TouchableOpacity
                style={styles.profileReminderButton}
                onPress={openEditProfileSettings}
              >
                <Text style={styles.profileReminderButtonText}>
                  Edit Profile in Settings
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ImageBackground
            source={require("../../assets/images/ewaste-banner.jpg")}
            style={styles.banner}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.overlay} />

            <Text style={styles.bannerTitle}>
              RECYCLE SMARTER{"\n"}MATCH FASTER
            </Text>

            <Text style={styles.bannerSub}>
              Find users and listed e-waste items faster through your facility
              dashboard.
            </Text>
          </ImageBackground>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Listed Items by Users</Text>
            </View>

            <TouchableOpacity onPress={() => fetchRandomListedItems(facility)}>
              <Text style={styles.viewAll}>Reload</Text>
            </TouchableOpacity>
          </View>

          {randomListedItems.length > 0 ? (
            randomListedItems.map((item, index) => {
              const itemImage = getItemImageUrl(item);

              return (
                <TouchableOpacity
                  key={`random-listed-${item.id}-${index}`}
                  style={styles.postCard}
                  activeOpacity={0.8}
                  onPress={() => openItemDetails(item)}
                >
                  <Image
                    source={
                      itemImage
                        ? { uri: itemImage }
                        : require("../../assets/icons/icon.png")
                    }
                    style={styles.postImage}
                  />

                  <View style={styles.postContent}>
                    {/* Item Card Header without status */}
                    <View style={styles.postHeader}>
                      <Text style={styles.postTitle}>
                        {item.item_name || item.item_type || "Unnamed Item"}
                      </Text>
                    </View>

                    {!!getApprovalLabel(item) && (
                      <View style={styles.approvalBadge}>
                        <Text style={styles.approvalBadgeIcon}>✓</Text>
                        <Text style={styles.approvalBadgeText}>
                          {getApprovalLabel(item)}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.postUser}>
                      Posted by {item.submitter_name || "Unknown User"}
                    </Text>

                    {!!item.description && (
                      <Text style={styles.postDescription} numberOfLines={3}>
                        {item.description}
                      </Text>
                    )}

                    <View style={styles.postFooter}>
                      <Image
                        source={require("../../assets/icons/location.png")}
                        style={styles.locationIcon}
                      />
                      <Text style={styles.postLocation} numberOfLines={1}>
                        {item.location || item.address || "No location"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No listed items yet.</Text>
            </View>
          )}
        </ScrollView>

        <FacilityBottomNav facilityId={facility?.id || ""} active="home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  topFixedSection: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
  searchIconBox: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  clearSearch: {
    fontSize: 26,
    color: "#555",
    paddingHorizontal: 5,
    marginBottom: 2,
  },
  searchBackdrop: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  floatingSearchResultsBox: {
    position: "absolute",
    top: 112,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 8,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 12,
    zIndex: 999,
  },
  searchResultScroll: {
    maxHeight: 390,
  },
  resultSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2f7d1f",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 5,
    backgroundColor: "#fafafa",
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
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchRoundImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
  },
  searchSquareImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  searchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitleStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    flex: 1,
  },
  usernameText: {
    marginTop: 2,
    fontSize: 12,
    color: "#2f7d1f",
    fontWeight: "600",
  },
  searchSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#666",
  },
  noSearchResult: {
    padding: 18,
    alignItems: "center",
  },
  noSearchResultText: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
  },
  profileReminderBox: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#fff8e1",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f0c36d",
  },
  profileReminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileReminderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7a5200",
    flex: 1,
    marginRight: 10,
  },
  profileReminderClose: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7a5200",
    paddingHorizontal: 4,
  },
  profileReminderText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#6b520f",
  },
  profileReminderButton: {
    marginTop: 10,
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  profileReminderButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  banner: {
    marginTop: 10,
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
    alignItems: "center",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAll: {
    color: "#2f7d1f",
    fontWeight: "700",
  },
  postCard: {
    backgroundColor: "#fff",
    marginTop: 15,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  postImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#eee",
  },
  postContent: {
    padding: 14,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  postTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  approvalBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
  },
  approvalBadgeIcon: {
    color: "#1b5e20",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 4,
  },
  approvalBadgeText: {
    color: "#1b5e20",
    fontSize: 11,
    fontWeight: "700",
  },
  postUser: {
    marginTop: 6,
    fontSize: 13,
    color: "#2f7d1f",
    fontWeight: "600",
  },
  postDescription: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  locationIcon: {
    width: 14,
    height: 14,
    tintColor: "#666",
    marginRight: 5,
  },
  postLocation: {
    flex: 1,
    fontSize: 12,
    color: "#777",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
  },
});
