import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const goToPage = (path: string) => {
    router.push(path as any);
  };

  useEffect(() => {
    loadFacility();
    fetchRandomListedItems();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacility();
      fetchRandomListedItems();
    }, []),
  );

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
    const cleanValue = String(value ?? "")
      .trim()
      .toLowerCase();

    return (
      cleanValue === "" ||
      cleanValue === "null" ||
      cleanValue === "undefined" ||
      cleanValue === "not specified" ||
      cleanValue === "no data" ||
      cleanValue === "n/a" ||
      cleanValue === "none"
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

    if (!hasOperatingHours) {
      missingFields.push("Operating Hours");
    }

    if (!hasAcceptedItems) {
      missingFields.push("Accepted Items");
    }

    if (!hasAvailableServices) {
      missingFields.push("Available Services");
    }

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
          {
            text: "Later",
            style: "cancel",
          },
          {
            text: "Go to Settings",
            onPress: () => router.push("/facility_dashboard/settings" as any),
          },
        ],
      );
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

      if (error) {
        console.log("FETCH FACILITY PROFILE DETAILS ERROR:", error);
        hideFacilityProfileReminder();
        return;
      }

      if (!data) {
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

      checkMissingFacilityProfileDetails(latestFacility);

      const updatedStoredFacility = {
        ...parsed,
        ...latestFacility,
        role: "facility",
      };

      if (parsed.user) {
        updatedStoredFacility.user = {
          ...parsed.user,
          ...latestFacility,
          role: "facility",
        };
      }

      if (parsed.data) {
        updatedStoredFacility.data = {
          ...parsed.data,
          ...latestFacility,
          role: "facility",
        };
      }

      await AsyncStorage.setItem("user", JSON.stringify(updatedStoredFacility));

      fetchRandomListedItems(latestFacility);
    } catch (error) {
      console.log("LOAD FACILITY ERROR:", error);
      hideFacilityProfileReminder();
    }
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

  const getUserProfileUrl = (user: any) => {
    const imagePath =
      user.profile_image || user.profileImage || user.profile_image_url || "";

    if (!imagePath) {
      return "";
    }

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

    if (!imagePath) {
      return "";
    }

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

    if (!rawLocation) {
      return "No location provided";
    }

    const parts = rawLocation
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const cityPart = parts.find((part) => /city|municipality/i.test(part));

    if (cityPart) {
      return cityPart;
    }

    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }

    return parts[0];
  };

  const getUsername = (user: any) => {
    if (user.username && String(user.username).trim() !== "") {
      return `@${user.username}`;
    }

    return "@No username";
  };

  const getDisplayStatus = (item: any) => {
    const status = String(item.status || "")
      .trim()
      .toLowerCase();
    const matchStatus = String(item.match_status || "")
      .trim()
      .toLowerCase();

    if (matchStatus === "pending match") return "Pending Match";
    if (matchStatus === "matched") return "Matched";
    if (matchStatus === "listed") return "Listed";
    if (matchStatus === "finished") return "Finished";
    if (matchStatus === "rejected") return "Rejected";
    if (matchStatus === "pending") return "Pending";

    if (status === "listed") return "Listed";
    if (status === "pending match") return "Pending Match";
    if (status === "matched") return "Matched";
    if (status === "finished") return "Finished";
    if (status === "rejected") return "Rejected";
    if (status === "pending") return "Pending";
    if (status === "approved") return "Approved";

    return item.match_status || item.status || "Listed";
  };

  const getStatusStyle = (statusValue: string) => {
    const cleanStatus = String(statusValue || "")
      .trim()
      .toLowerCase();

    if (cleanStatus.includes("pending")) return styles.pending;
    if (cleanStatus.includes("approved")) return styles.approved;
    if (cleanStatus.includes("matched")) return styles.approved;
    if (cleanStatus.includes("finished")) return styles.approved;
    if (cleanStatus.includes("listed")) return styles.listed;
    if (cleanStatus.includes("rejected")) return styles.rejected;

    return styles.pending;
  };

  const normalizeMatchText = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, " ")
      .replace(/[^a-z0-9\s,/|-]/g, " ")
      .replace(/[\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const splitMatchValues = (value: any) => {
    const cleanValue = normalizeMatchText(value);

    if (!cleanValue) return [];

    return cleanValue
      .split(/[,/|;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const getFacilityAcceptedItems = (profile: any) => {
    const acceptedItems = getProfileValue(profile, [
      "accepted_items",
      "acceptedItems",
      "accepted_item_types",
      "acceptedItemTypes",
      "items_accepted",
      "itemsAccepted",
      "item_needed",
      "itemNeeded",
      "needed_items",
      "neededItems",
      "preferred_items",
      "preferredItems",
    ]);

    return splitMatchValues(acceptedItems);
  };

  const getFacilityAcceptedConditions = (profile: any) => {
    const conditions = getProfileValue(profile, [
      "conditions_accepted",
      "conditionsAccepted",
      "accepted_conditions",
      "acceptedConditions",
      "condition_accepted",
      "conditionAccepted",
      "acceptable_conditions",
      "acceptableConditions",
    ]);

    return splitMatchValues(conditions);
  };

  const getFacilityRejectedConditions = (profile: any) => {
    const conditions = getProfileValue(profile, [
      "conditions_rejected",
      "conditionsRejected",
      "rejected_conditions",
      "rejectedConditions",
      "condition_rejected",
      "conditionRejected",
      "unacceptable_conditions",
      "unacceptableConditions",
    ]);

    return splitMatchValues(conditions);
  };

  const getItemNameText = (item: any) => {
    return normalizeMatchText(
      [item.item_name, item.item_type, item.name, item.title]
        .filter(Boolean)
        .join(" "),
    );
  };

  const getItemConditionText = (item: any) => {
    return normalizeMatchText(
      [
        item.issues,
        item.issue,
        item.selected_issues,
        item.selectedIssues,
        item.conditions,
        item.condition,
        item.item_condition,
        item.itemCondition,
        item.damage_description,
        item.damageDescription,
        item.description,
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  const valueMatchesText = (value: string, text: string) => {
    const cleanValue = normalizeMatchText(value);
    const cleanText = normalizeMatchText(text);

    if (!cleanValue || !cleanText) return false;

    if (cleanText.includes(cleanValue) || cleanValue.includes(cleanText)) {
      return true;
    }

    const words = cleanValue
      .split(" ")
      .map((word) => word.trim())
      .filter((word) => word.length > 2);

    if (words.length === 0) return false;

    return words.every((word) => cleanText.includes(word));
  };

  const countMatches = (values: string[], text: string) => {
    return values.filter((value) => valueMatchesText(value, text)).length;
  };

  const getItemMatchScore = (item: any, profile: any) => {
    const acceptedItems = getFacilityAcceptedItems(profile);
    const acceptedConditions = getFacilityAcceptedConditions(profile);
    const rejectedConditions = getFacilityRejectedConditions(profile);

    const itemNameText = getItemNameText(item);
    const itemConditionText = getItemConditionText(item);

    const itemNameMatches = countMatches(acceptedItems, itemNameText);
    const acceptedConditionMatches = countMatches(
      acceptedConditions,
      itemConditionText,
    );
    const rejectedConditionMatches = countMatches(
      rejectedConditions,
      itemConditionText,
    );

    let score = 0;

    if (itemNameMatches > 0) {
      score += itemNameMatches * 100;
    }

    if (acceptedConditionMatches > 0) {
      score += acceptedConditionMatches * 80;
    }

    if (acceptedConditions.length > 0 && acceptedConditionMatches === 0) {
      score -= 20;
    }

    if (rejectedConditionMatches > 0) {
      score -= rejectedConditionMatches * 200;
    } else if (rejectedConditions.length > 0) {
      score += 20;
    }

    return score;
  };

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.date_listed ||
      item.submitted_at ||
      item.created_at ||
      item.updated_at ||
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

  const sortListedItemsForFacility = (itemsList: any[], profile: any) => {
    return [...itemsList].sort((a, b) => {
      const scoreA = getItemMatchScore(a, profile);
      const scoreB = getItemMatchScore(b, profile);

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return getItemTimeValue(b) - getItemTimeValue(a);
    });
  };

  const isVisibleListedItem = (item: any) => {
    const status = String(item.status || "")
      .trim()
      .toLowerCase();
    const matchStatus = String(item.match_status || "")
      .trim()
      .toLowerCase();

    const isFinishedOrRecycled =
      status === "finished" ||
      status === "recycled" ||
      status === "deleted" ||
      status === "approved" ||
      status === "rejected" ||
      matchStatus === "finished" ||
      matchStatus === "recycled" ||
      matchStatus === "deleted" ||
      matchStatus === "approved" ||
      matchStatus === "rejected";

    if (isFinishedOrRecycled) return false;

    return (
      status === "listed" ||
      status === "pending match" ||
      status === "matched" ||
      matchStatus === "listed" ||
      matchStatus === "pending match" ||
      matchStatus === "matched"
    );
  };

  const searchFacilityData = async (keyword: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const cleanKeyword = `%${keyword}%`;

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          name,
          username,
          email,
          address,
          location,
          profile_image,
          role,
          status
        `,
        )
        .eq("role", "user")
        .eq("status", "approved")
        .or(
          `name.ilike.${cleanKeyword},username.ilike.${cleanKeyword},email.ilike.${cleanKeyword},address.ilike.${cleanKeyword},location.ilike.${cleanKeyword}`,
        )
        .order("id", { ascending: false })
        .limit(8);

      if (usersError) {
        console.log("SEARCH USERS ERROR:", usersError);
        setSearchedUsers([]);
      } else {
        setSearchedUsers(usersData || []);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .or(
          `item_name.ilike.${cleanKeyword},description.ilike.${cleanKeyword},location.ilike.${cleanKeyword},address.ilike.${cleanKeyword},submitter_name.ilike.${cleanKeyword}`,
        )
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.log("SEARCH ITEMS ERROR:", itemsError);
        setSearchedItems([]);
      } else {
        const listedItems = (itemsData || []).filter((item: any) =>
          isVisibleListedItem(item),
        );

        setSearchedItems(sortListedItemsForFacility(listedItems, facility));
      }
    } catch (error) {
      console.log("FACILITY SEARCH ERROR:", error);
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
        console.log("FETCH LISTED ITEMS ERROR:", error);
        setRandomListedItems([]);
        return;
      }

      const listedItems = (data || []).filter((item: any) =>
        isVisibleListedItem(item),
      );

      const sortedItems = sortListedItemsForFacility(listedItems, profileData);

      setRandomListedItems(sortedItems);
    } catch (error) {
      console.log("FETCH LISTED ITEMS ERROR:", error);
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
    Keyboard.dismiss();
    setShowSearchResults(false);

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

  const openUserProfileFromItem = async (item: any) => {
    try {
      Keyboard.dismiss();
      setShowSearchResults(false);

      const itemUserId =
        item.user_id ||
        item.submitter_user_id ||
        item.owner_id ||
        item.profile_id ||
        "";

      const itemSubmitterName =
        item.submitter_name ||
        item.user_name ||
        item.name ||
        item.username ||
        "";

      const itemSubmitterEmail =
        item.submitter_email || item.user_email || item.email || "";

      if (itemUserId) {
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select("id, name, username, email, role")
          .eq("id", String(itemUserId))
          .maybeSingle();

        if (error) {
          console.log("FETCH ITEM OWNER PROFILE ERROR:", error);
        }

        router.push({
          pathname: "/facility_dashboard/user_view_profile" as any,
          params: {
            user_id: String(userProfile?.id || itemUserId),
            username: String(userProfile?.username || ""),
            email: String(userProfile?.email || itemSubmitterEmail || ""),
            name: String(userProfile?.name || itemSubmitterName || "User"),
          },
        });

        return;
      }

      if (itemSubmitterEmail) {
        router.push({
          pathname: "/facility_dashboard/user_view_profile" as any,
          params: {
            email: String(itemSubmitterEmail),
            name: String(itemSubmitterName || "User"),
          },
        });

        return;
      }

      router.push({
        pathname: "/facility_dashboard/user_view_profile" as any,
        params: {
          name: String(itemSubmitterName || "User"),
          submitter_name: String(itemSubmitterName || "User"),
        },
      });
    } catch (error) {
      console.log("OPEN USER PROFILE FROM ITEM ERROR:", error);

      router.push({
        pathname: "/facility_dashboard/user_view_profile" as any,
        params: {
          user_id: String(item.user_id || ""),
          name: String(item.submitter_name || "User"),
        },
      });
    }
  };

  const openEditProfileSettings = () => {
    router.push("/facility_dashboard/settings" as any);
  };

  const hasResults = searchedUsers.length > 0 || searchedItems.length > 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.welcome}>
              Welcome Back{facilityName ? `, ${facilityName}` : ""}!
            </Text>

            <Image
              source={require("../../assets/icons/icon.png")}
              style={styles.avatar}
            />
          </View>

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

          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search for users or their username"
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
                ) : hasResults ? (
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    style={styles.searchResultScroll}
                  >
                    {searchedUsers.length > 0 && (
                      <View>
                        <Text style={styles.resultSectionTitle}>Users</Text>

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

                    {searchedItems.length > 0 && (
                      <View>
                        <Text style={styles.resultSectionTitle}>Items</Text>

                        {searchedItems.map((item, index) => {
                          const itemImage = getItemImageUrl(item);

                          return (
                            <TouchableOpacity
                              key={`item-${item.id}-${index}`}
                              style={styles.searchResultItem}
                              activeOpacity={0.8}
                              onPress={() => openUserProfileFromItem(item)}
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
                                <Text style={styles.searchTitle}>
                                  {item.item_name ||
                                    item.item_type ||
                                    "No item name"}
                                </Text>

                                <Text style={styles.usernameText}>
                                  {item.submitter_name || "No submitter"}
                                </Text>

                                <Text style={styles.searchSubtitle}>
                                  Tap to view user profile
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
                      No results found.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

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
                  style={styles.itemCard}
                  activeOpacity={0.8}
                  onPress={() => openUserProfileFromItem(item)}
                >
                  <Image
                    source={
                      itemImage
                        ? { uri: itemImage }
                        : require("../../assets/icons/icon.png")
                    }
                    style={styles.itemImage}
                  />

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemTitle}>
                      {item.item_name || item.item_type || "No item name"}
                    </Text>

                    <Text style={styles.itemSub}>
                      Posted by: {item.submitter_name || "No submitter"}
                    </Text>

                    <Text style={styles.itemLocation} numberOfLines={1}>
                      Tap to view user profile
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itemStatus,
                      getStatusStyle(getDisplayStatus(item)),
                    ]}
                  >
                    {getDisplayStatus(item)}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No listed items yet.</Text>
            </View>
          )}
        </ScrollView>

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

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  profileReminderBox: {
    marginTop: 15,
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
    maxHeight: 370,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },

  searchResultScroll: {
    maxHeight: 360,
  },

  resultSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2f7d1f",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 5,
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

  searchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  usernameText: {
    marginTop: 2,
    fontSize: 13,
    color: "#2f7d1f",
    fontWeight: "600",
  },

  searchSubtitle: {
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
  },

  itemLocation: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },

  itemStatus: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 12,
    maxWidth: 95,
    textAlign: "right",
  },

  pending: {
    color: "#fbc02d",
  },

  approved: {
    color: "#1976d2",
  },

  listed: {
    color: "green",
  },

  rejected: {
    color: "red",
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
