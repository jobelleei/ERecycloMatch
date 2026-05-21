import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

export default function ListedItemDetails() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const itemId = String(params.item_id || "");
  const listedItemId = String(params.listed_item_id || "");
  const approvedItemId = String(params.approved_item_id || "");
  const itemNameParam = String(params.item_name || "");

  const fallbackSubmitterId = String(params.submitter_user_id || "");
  const fallbackSubmitterName = String(params.submitter_name || "");
  const fallbackSubmitterUsername = String(params.submitter_username || "");
  const fallbackSubmitterEmail = String(params.submitter_email || "");

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId, listedItemId, approvedItemId, itemNameParam]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (itemId) query.append("item_id", itemId);
      if (listedItemId) query.append("listed_item_id", listedItemId);
      if (approvedItemId) query.append("approved_item_id", approvedItemId);
      if (itemNameParam) query.append("item_name", itemNameParam);

      if (fallbackSubmitterName) {
        query.append("submitter_name", fallbackSubmitterName);
      }

      if (fallbackSubmitterUsername) {
        query.append("submitter_username", fallbackSubmitterUsername);
      }

      if (fallbackSubmitterEmail) {
        query.append("submitter_email", fallbackSubmitterEmail);
      }

      const url = `${API_URL}/admin_UI/get_public_itemlisting.php?${query.toString()}`;

      console.log("ITEM LISTING DETAILS URL:", url);

      const response = await fetch(url);
      const text = await response.text();

      console.log("ITEM LISTING DETAILS RESPONSE:", text);

      let result;

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.log("ITEM LISTING DETAILS JSON ERROR:", parseError);
        console.log("RAW ITEM LISTING RESPONSE:", text);
        setItem(null);
        return;
      }

      if (result.success) {
        setItem(result.item || null);
      } else {
        console.log("ITEM LISTING DETAILS ERROR:", result.message, result.debug);
        setItem(null);
      }
    } catch (error) {
      console.log("FETCH ITEM LISTING DETAILS ERROR:", error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const getItemImageUrl = () => {
    if (item?.item_image_url && String(item.item_image_url).trim() !== "") {
      return item.item_image_url;
    }

    if (item?.item_image && String(item.item_image).trim() !== "") {
      return `${API_URL}/uploads/items/approved/${encodeURIComponent(
        item.item_image
      )}`;
    }

    return `${API_URL}/assets/icons/no-image.png`;
  };

  const formatDateTime = (value: string) => {
    if (!value) return "N/A";

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

  const cleanIssues = (issues: string) => {
    if (!issues || String(issues).trim() === "") return "None";

    return String(issues)
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/ recyclability/g, "")
      .replace(/ hazard/g, "")
      .split(",")
      .map((issue) => issue.trim())
      .filter(Boolean)
      .join("\n");
  };

  const getSubmitterId = () => {
    return String(
      item?.submitter_user_id || item?.user_id || fallbackSubmitterId || ""
    );
  };

  const getSubmitterName = () => {
    return String(
      item?.submitter_full_name ||
        item?.submitter_name ||
        fallbackSubmitterName ||
        "User"
    );
  };

  const getSubmitterUsername = () => {
    return String(item?.submitter_username || fallbackSubmitterUsername || "");
  };

  const getSubmitterEmail = () => {
    return String(item?.submitter_email || fallbackSubmitterEmail || "");
  };

  const openMessage = () => {
    router.push({
      pathname: "/facility_dashboard/messages" as any,
      params: {
        receiver_id: getSubmitterId(),
        receiver_name: getSubmitterName(),
        receiver_username: getSubmitterUsername(),
        receiver_email: getSubmitterEmail(),
        item_id: String(item?.id || itemId),
        item_name: String(item?.item_name || itemNameParam || ""),
      },
    });
  };

  const openSubmitterProfile = () => {
    router.push({
      pathname: "/facility_dashboard/user_view_profile" as any,
      params: {
        user_id: getSubmitterId(),
        username: getSubmitterUsername(),
        email: getSubmitterEmail(),
        name: getSubmitterName(),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#197900" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Item not found</Text>

        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backHomeText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Item Details</Text>
        </View>

        <Image source={{ uri: getItemImageUrl() }} style={styles.itemImage} />

        <View style={styles.detailsCard}>
          <Text style={styles.itemName}>
            {item.item_name || "No item name"}
          </Text>

          <Text style={styles.statusText}>
            {item.match_status || item.status || "Listed"}
          </Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Submitter</Text>
            <Text style={styles.value}>{getSubmitterName()}</Text>

            {getSubmitterUsername() ? (
              <Text style={styles.username}>@{getSubmitterUsername()}</Text>
            ) : null}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {item.location ||
                item.poster_location ||
                item.submitter_location ||
                "No location provided"}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>
              {item.description || "No description added."}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Issues</Text>
            <Text style={styles.value}>{cleanIssues(item.issues)}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Hazard</Text>
              <Text style={styles.scoreValue}>
                {item.hazard_status ?? "0"}%
              </Text>
            </View>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Recyclability</Text>
              <Text style={styles.scoreValue}>
                {item.recyclability ?? "0"}%
              </Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Submitted Date</Text>
            <Text style={styles.value}>
              {formatDateTime(
                item.submitted_at ||
                  item.created_at ||
                  item.approved_at ||
                  item.listed_at ||
                  ""
              )}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Listed Date</Text>
            <Text style={styles.value}>
              {formatDateTime(item.listed_at || "")}
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.messageButton}
            activeOpacity={0.85}
            onPress={openMessage}
          >
            <Text style={styles.messageButtonText}>
              Message {getSubmitterName()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.85}
            onPress={openSubmitterProfile}
          >
            <Text style={styles.profileButtonText}>
              View {getSubmitterName()} Profile
            </Text>
          </TouchableOpacity>
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
    backgroundColor: "#f5f5f5",
  },

  scrollContent: {
    paddingBottom: 110,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 14,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
  },

  backHomeButton: {
    backgroundColor: "#197900",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  backHomeText: {
    color: "#fff",
    fontWeight: "700",
  },

  header: {
    backgroundColor: "#197900",
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 10,
    zIndex: 5,
  },

  backText: {
    fontSize: 32,
    color: "#000",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  itemImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#eee",
  },

  detailsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  itemName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  statusText: {
    color: "#197900",
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 14,
  },

  infoBlock: {
    marginTop: 14,
  },

  label: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  username: {
    marginTop: 3,
    fontSize: 13,
    color: "#197900",
    fontWeight: "600",
  },

  scoreRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  scoreBox: {
    flex: 1,
    backgroundColor: "#eef8ec",
    padding: 12,
    borderRadius: 12,
  },

  scoreLabel: {
    color: "#555",
    fontSize: 12,
  },

  scoreValue: {
    color: "#197900",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 3,
  },

  buttonGroup: {
    marginHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },

  messageButton: {
    backgroundColor: "#197900",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },

  messageButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  profileButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#197900",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },

  profileButtonText: {
    color: "#197900",
    fontSize: 15,
    fontWeight: "700",
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