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
} from "react-native";

import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { API_URL } from "../../config";

export default function FacilityDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const [searchText, setSearchText] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searchedItems, setSearchedItems] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  const searchFacilityData = async (keyword: string) => {
    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const encodedKeyword = encodeURIComponent(keyword);
      const url = `${API_URL}/facility_search.php?search=${encodedKeyword}`;
      console.log("FACILITY SEARCH URL:", url);

      const response = await fetch(url);
      const text = await response.text();

      console.log("FACILITY SEARCH RESPONSE:", text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.log("FACILITY SEARCH JSON PARSE ERROR:", parseError);
        console.log("RAW PHP RESPONSE:", text);

        setSearchedUsers([]);
        setSearchedItems([]);
        return;
      }

      if (result.success) {
        setSearchedUsers(Array.isArray(result.users) ? result.users : []);
        setSearchedItems(Array.isArray(result.items) ? result.items : []);
      } else {
        console.log("FACILITY SEARCH ERROR:", result.message || result);
        setSearchedUsers([]);
        setSearchedItems([]);
      }
    } catch (error) {
      console.log("FACILITY SEARCH FETCH ERROR:", error);
      setSearchedUsers([]);
      setSearchedItems([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchedUsers([]);
    setSearchedItems([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  const getUserProfileUrl = (user: any) => {
    if (
      user.profile_image_url &&
      String(user.profile_image_url).trim() !== ""
    ) {
      return user.profile_image_url;
    }

    if (user.profile_image && String(user.profile_image).trim() !== "") {
      return `${API_URL}/uploads/profile/user_profile/${encodeURIComponent(
        user.profile_image,
      )}`;
    }

    return `${API_URL}/assets/icons/avatar.png`;
  };

  const getItemImageUrl = (item: any) => {
    if (item.item_image_url && String(item.item_image_url).trim() !== "") {
      return item.item_image_url;
    }

    if (item.item_image && String(item.item_image).trim() !== "") {
      return `${API_URL}/uploads/items/approved/${encodeURIComponent(
        item.item_image,
      )}`;
    }

    return `${API_URL}/assets/icons/no-image.png`;
  };

  const getUserLocation = (user: any) => {
    const location =
      user.location ||
      user.address ||
      user.user_location ||
      user.user_address ||
      "";

    return String(location).trim() !== "" ? location : "No location provided";
  };

  const getItemLocation = (item: any) => {
    const location =
      item.location ||
      item.poster_location ||
      item.submitter_location ||
      item.address ||
      "";

    return String(location).trim() !== "" ? location : "No location provided";
  };

  const getUsername = (user: any) => {
    if (user.username && String(user.username).trim() !== "") {
      return `@${user.username}`;
    }

    return "@No username";
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

  const openListedItemDetails = (item: any) => {
    Keyboard.dismiss();
    setShowSearchResults(false);

    console.log("CLICKED ITEM:", item);

    router.push({
      pathname: "/facility_dashboard/listed_item_details" as any,
      params: {
        item_id: String(item.id || ""),
        listed_item_id: String(item.listed_item_id || item.id || ""),
        approved_item_id: String(item.approved_item_id || ""),
        item_name: String(item.item_name || ""),
        submitter_name: String(
          item.submitter_full_name || item.submitter_name || "User",
        ),
        submitter_user_id: String(item.submitter_user_id || ""),
        submitter_username: String(item.submitter_username || ""),
        submitter_email: String(item.submitter_email || ""),
      },
    });
  };

  const hasResults = searchedUsers.length > 0 || searchedItems.length > 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.welcome}>Welcome Back!</Text>

            <Image
              source={require("../../assets/icons/icon.png")}
              style={styles.avatar}
            />
          </View>

          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search users by name, username, or listed items"
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

                        {searchedUsers.map((user) => (
                          <TouchableOpacity
                            key={`user-${user.id}`}
                            style={styles.searchResultItem}
                            activeOpacity={0.8}
                            onPress={() => openUserProfile(user)}
                          >
                            <Image
                              source={{ uri: getUserProfileUrl(user) }}
                              style={styles.searchRoundImage}
                              onError={(e) => {
                                console.log("USER IMAGE ERROR:", e.nativeEvent);
                              }}
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
                        ))}
                      </View>
                    )}

                    {searchedItems.length > 0 && (
                      <View>
                        <Text style={styles.resultSectionTitle}>Items</Text>

                        {searchedItems.map((item, index) => (
                          <TouchableOpacity
                            key={`item-${
                              item.id
                            }-${item.approved_item_id || ""}-${index}`}
                            style={styles.searchResultItem}
                            activeOpacity={0.8}
                            onPress={() => openListedItemDetails(item)}
                          >
                            <Image
                              source={{ uri: getItemImageUrl(item) }}
                              style={styles.searchSquareImage}
                              onError={(e) => {
                                console.log("ITEM IMAGE ERROR:", e.nativeEvent);
                              }}
                            />

                            <View style={styles.searchInfo}>
                              <Text style={styles.searchTitle}>
                                {item.item_name || "No item name"}
                              </Text>

                              <Text style={styles.usernameText}>
                                {item.submitter_username
                                  ? `@${item.submitter_username}`
                                  : item.submitter_name || "No submitter"}
                              </Text>

                              <Text style={styles.searchSubtitle}>
                                {getItemLocation(item)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
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
              Find the right place for your e-waste with just a few clicks.
            </Text>
          </ImageBackground>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Viewed Items</Text>

            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemCard}>
            <Image
              source={require("../../assets/images/ip6s.jpg")}
              style={styles.itemImage}
            />

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.itemTitle}>iPhone 6s</Text>
              <Text style={styles.itemSub}>Smartphone</Text>
            </View>

            <Text style={styles.statusGreen}>Viewed</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/facility_dashboard" as any)}
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
            onPress={() =>
              router.push("/facility_dashboard/facility_map" as any)
            }
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
            onPress={() => router.push("/facility_dashboard/messages" as any)}
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
            onPress={() => router.push("/facility_dashboard/profile" as any)}
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
            onPress={() => router.push("/facility_dashboard/settings" as any)}
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
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  viewAll: {
    color: "#777",
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
  },

  itemTitle: {
    fontWeight: "bold",
  },

  itemSub: {
    color: "#777",
  },

  statusGreen: {
    color: "green",
    fontWeight: "600",
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
