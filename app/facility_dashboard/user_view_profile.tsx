  import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
  import { useCallback, useEffect, useState } from "react";
  import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { API_URL } from "../../config";

  export default function UserViewProfile() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useLocalSearchParams();

    const userId = String(params.user_id || "");
    const usernameParam = String(params.username || "");
    const emailParam = String(params.email || "");
    const nameParam = String(params.name || "");

    const [user, setUser] = useState({
      id: "",
      name: "",
      username: "",
      location: "",
      email: "",
      profileImage: "",
    });

    const [items, setItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItemKey, setSelectedItemKey] = useState("");

    useEffect(() => {
      if (userId || usernameParam || emailParam || nameParam) {
        fetchUserProfile();
      }
    }, [userId, usernameParam, emailParam, nameParam]);

    const getUserProfileUrl = (profileImage: string) => {
      if (!profileImage) {
        return "";
      }

      if (profileImage.startsWith("http")) {
        return profileImage;
      }

      if (profileImage.includes("uploads/")) {
        return `${API_URL}/${profileImage}`;
      }

      return `${API_URL}/uploads/profile/user_profile/${encodeURIComponent(
        profileImage
      )}`;
    };

    const buildProfileUrl = () => {
      const query = new URLSearchParams();

      if (userId) query.append("user_id", userId);
      if (usernameParam) query.append("username", usernameParam);
      if (emailParam) query.append("email", emailParam);
      if (nameParam) query.append("name", nameParam);

      return `${API_URL}/get_public_user_profile.php?${query.toString()}`;
    };

    const fetchUserProfile = async () => {
      try {
        const url = buildProfileUrl();

        console.log("PUBLIC USER PROFILE URL:", url);

        const response = await fetch(url);

        const text = await response.text();
        console.log("PUBLIC USER PROFILE RESPONSE:", text);

        let result;

        try {
          result = JSON.parse(text);
        } catch (parseError) {
          console.log("PUBLIC USER PROFILE JSON ERROR:", parseError);

          setUser({
            id: "",
            name: "User not found",
            username: "",
            location: "No location provided",
            email: "",
            profileImage: "",
          });

          setItems([]);
          return;
        }

        if (result.success) {
          const userData = result.user || {};

          setUser({
            id: String(userData.id || ""),
            name: userData.name || "User",
            username: userData.username || "",
            location:
              userData.location ||
              userData.address ||
              "No location provided",
            email: userData.email || "",
            profileImage:
              userData.profile_image_url ||
              getUserProfileUrl(userData.profile_image || ""),
          });

          setItems(Array.isArray(result.items) ? result.items : []);
        } else {
          console.log("PUBLIC USER PROFILE ERROR:", result.message, result.debug);

          setUser({
            id: "",
            name: "User not found",
            username: "",
            location: "No location provided",
            email: "",
            profileImage: "",
          });

          setItems([]);
        }
      } catch (error) {
        console.log("FETCH PUBLIC USER PROFILE ERROR:", error);

        setUser({
          id: "",
          name: "User not found",
          username: "",
          location: "No location provided",
          email: "",
          profileImage: "",
        });

        setItems([]);
      }
    };

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await fetchUserProfile();
      setRefreshing(false);
    }, [userId, usernameParam, emailParam, nameParam]);

    const getItemImageUrl = (item: any) => {
      if (item.item_image_url && String(item.item_image_url).trim() !== "") {
        return item.item_image_url;
      }

      if (!item.item_image) {
        return `${API_URL}/assets/icons/no-image.png`;
      }

      const folder = item.folder || "approved";

      return `${API_URL}/uploads/items/${folder}/${encodeURIComponent(
        item.item_image
      )}`;
    };

    const formatDateTime = (value: string) => {
      if (!value) return "No date and time available";

      const fixedValue =
        typeof value === "string" && value.includes(" ") && !value.includes("T")
          ? value.replace(" ", "T")
          : value;

      const date = new Date(fixedValue);

      if (isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    const getSubmittedDateTime = (item: any) => {
      return (
        item.display_date ||
        item.submitted_at ||
        item.created_at ||
        item.approved_at ||
        item.listed_at ||
        ""
      );
    };

    const getMessageName = () => {
      if (user.name && user.name.trim() !== "") {
        return user.name;
      }

      if (user.username && user.username.trim() !== "") {
        return user.username;
      }

      return "User";
    };

    const openMessage = (item: any) => {
      router.push({
        pathname: "/facility_dashboard/messages" as any,
        params: {
          receiver_id: user.id,
          receiver_name: user.name,
          receiver_username: user.username,
          receiver_email: user.email,
          item_id: item.id,
          item_name: item.item_name || "",
        },
      });
    };

    const renderItem = ({ item, index }: any) => {
      const itemKey = `${item.folder}-${item.id}-${index}`;
      const isSelected = selectedItemKey === itemKey;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setSelectedItemKey(isSelected ? "" : itemKey);
          }}
          style={[
            styles.itemCard,
            isSelected && styles.selectedItemCard,
          ]}
        >
          <Image
            source={{ uri: getItemImageUrl(item) }}
            style={styles.itemImage}
          />

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>
              {item.item_name || "No item name"}
            </Text>

            <Text style={styles.description}>
              {item.description || "No description added."}
            </Text>

            <Text style={styles.statusText}>
              {item.status || "Item"}
            </Text>

            <Text style={styles.dateText}>
              {formatDateTime(getSubmittedDateTime(item))}
            </Text>

            {isSelected && (
              <TouchableOpacity
                style={styles.messageButton}
                activeOpacity={0.85}
                onPress={() => openMessage(item)}
              >
                <Text style={styles.messageButtonText}>
                  Message {getMessageName()}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `public-user-item-${item.folder}-${item.id}-${index}`
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
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
                {user.username ? `@${user.username}` : "@No username"}
              </Text>

              <View style={styles.headerLocationRow}>
                <Image
                  source={require("../../assets/icons/location.png")}
                  style={styles.headerLocationIcon}
                />

                <Text style={styles.headerAddress}>
                  {user.location || "No location provided"}
                </Text>
              </View>

              {user.email ? (
                <Text style={styles.emailText}>{user.email}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No submitted or listed items from this user yet.
            </Text>
          }
        />

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
                pathname === "/facility_dashboard/messages" &&
                  styles.navActive,
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
                pathname === "/facility_dashboard/profile" &&
                  styles.navActive,
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
                pathname === "/facility_dashboard/settings" &&
                  styles.navActive,
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
      backgroundColor: "#fff",
    },

    listContent: {
      paddingBottom: 110,
    },

    profileHeader: {
      backgroundColor: "#197900",
      alignItems: "center",
      paddingTop: 15,
      paddingBottom: 22,
      paddingHorizontal: 20,
    },

    backButton: {
      position: "absolute",
      left: 20,
      top: 20,
      zIndex: 5,
    },

    backText: {
      fontSize: 32,
      color: "#000",
    },

    avatarWrapper: {
      marginTop: 5,
    },

    avatar: {
      width: 135,
      height: 135,
      borderRadius: 70,
      backgroundColor: "#ddd",
    },

    name: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 10,
      textAlign: "center",
    },

    username: {
      color: "#e8f5e9",
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },

    headerLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 20,
    },

    headerLocationIcon: {
      width: 15,
      height: 15,
      marginRight: 5,
      tintColor: "#fff",
    },

    headerAddress: {
      color: "#e8f5e9",
      fontSize: 13,
      textAlign: "center",
    },

    emailText: {
      color: "#e8f5e9",
      fontSize: 13,
      marginTop: 5,
      textAlign: "center",
    },

    readOnlyNote: {
      backgroundColor: "#fff",
      color: "#197900",
      marginTop: 15,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 20,
      fontWeight: "bold",
      fontSize: 13,
      textAlign: "center",
    },

    itemCard: {
      flexDirection: "row",
      backgroundColor: "#fff",
      marginHorizontal: 26,
      marginTop: 15,
      padding: 14,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      borderRadius: 8,
    },

    selectedItemCard: {
      borderWidth: 1.5,
      borderColor: "#197900",
    },

    itemImage: {
      width: 78,
      height: 78,
      borderRadius: 12,
      backgroundColor: "#eee",
    },

    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },

    itemName: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#000",
    },

    description: {
      color: "#555",
      fontSize: 13,
      marginTop: 5,
      lineHeight: 18,
    },

    statusText: {
      color: "#197900",
      fontWeight: "bold",
      fontSize: 13,
      marginTop: 7,
    },

    dateText: {
      color: "#777",
      fontSize: 11,
      marginTop: 4,
    },

    messageButton: {
      backgroundColor: "#197900",
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 20,
      marginTop: 10,
      alignSelf: "flex-start",
    },

    messageButtonText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
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