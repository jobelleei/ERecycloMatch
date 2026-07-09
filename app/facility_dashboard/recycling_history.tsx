import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type HistoryItem = {
  id: string | number;
  user_id?: string | number;
  user_name?: string;
  facility_id?: string | number;
  facility_name?: string;
  matched_with?: string;
  conversation_id?: string;
  posting_id?: string;
  item_id?: string | number;
  item_name?: string;
  item_image?: string;
  transaction_status?: string;
  posted_date?: string | null;
  listed_date?: string | null;
  matched_date?: string | null;
  finished_date?: string | null;
  created_at?: string | null;
};

export default function RecyclingHistory() {
  const router = useRouter();
  const pathname = usePathname();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [accountId, setAccountId] = useState("");
  const [accountRole, setAccountRole] = useState<"user" | "facility" | "">("");
  const [accountName, setAccountName] = useState("");

  const [filter, setFilter] = useState<"All" | "Latest" | "Oldest">("All");

  useEffect(() => {
    loadAccount();
  }, []);

  useFocusEffect(
  useCallback(() => {
    loadAccount();

    if (accountId && accountRole) {
      fetchUnreadMessages(accountId, accountRole);
    }
  }, [accountId, accountRole])
);

  const fetchUnreadMessages = async (
  currentAccountId = accountId,
  currentRole = accountRole
) => {
  if (!currentAccountId || !currentRole) {
    setUnreadCount(0);
    return;
  }

  let unreadMessagesQuery = supabase
    .from("messages")
    .select("conversation_id")
    .eq("is_read", false);

  let unreadRequestsQuery = supabase
    .from("conversations")
    .select("id")
    .eq("is_read", false);

  if (currentRole === "facility") {
    unreadMessagesQuery = unreadMessagesQuery.eq(
      "receiver_id",
      Number(currentAccountId)
    );

    unreadRequestsQuery = unreadRequestsQuery.eq(
      "facility_id",
      String(currentAccountId)
    );
  } else {
    unreadMessagesQuery = unreadMessagesQuery.eq(
      "receiver_id",
      Number(currentAccountId)
    );

    unreadRequestsQuery = unreadRequestsQuery.eq(
      "user_id",
      String(currentAccountId)
    );
  }

  const { data: unreadMessages } = await unreadMessagesQuery;
  const { data: unreadRequests } = await unreadRequestsQuery;

  const unreadSet = new Set<string>();

  (unreadMessages || []).forEach((m: any) =>
    unreadSet.add(String(m.conversation_id))
  );

  (unreadRequests || []).forEach((c: any) =>
    unreadSet.add(String(c.id))
  );

  setUnreadCount(unreadSet.size);
};

  useEffect(() => {
    if (accountId && accountRole) {
      fetchHistory(accountId, accountRole);
    }
  }, [accountId, accountRole]);

  useEffect(() => {
  if (!accountId || !accountRole) return;

  const channel = supabase
    .channel("history-unread")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${accountId}`,
      },
      () => fetchUnreadMessages(accountId, accountRole)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${accountId}`,
      },
      () => fetchUnreadMessages(accountId, accountRole)
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter:
          accountRole === "facility"
            ? `facility_id=eq.${accountId}`
            : `user_id=eq.${accountId}`,
      },
      () => fetchUnreadMessages(accountId, accountRole)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [accountId, accountRole]);

  useEffect(() => {
    applyFilter();
  }, [history, filter]);

  const loadAccount = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setLoading(false);
        setHistory([]);
        setFilteredHistory([]);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const id =
        actualUser?.id ||
        actualUser?.user_id ||
        actualUser?.facility_id ||
        parsed?.id ||
        parsed?.user_id ||
        parsed?.facility_id ||
        "";

      const roleRaw = String(
        actualUser?.role || parsed?.role || actualUser?.account_type || ""
      ).toLowerCase();

      const name =
        actualUser?.name ||
        actualUser?.username ||
        actualUser?.facility_name ||
        parsed?.name ||
        parsed?.username ||
        parsed?.facility_name ||
        "";

      let finalRole: "user" | "facility" | "" = "";

      if (roleRaw.includes("facility")) {
        finalRole = "facility";
      } else if (roleRaw.includes("user")) {
        finalRole = "user";
      } else {
        const currentPath = String(pathname || "").toLowerCase();

        if (currentPath.includes("facility")) {
          finalRole = "facility";
        } else {
          finalRole = "user";
        }
      }

      if (!id) {
        setLoading(false);
        setHistory([]);
        setFilteredHistory([]);
        return;
      }

      setAccountId(String(id));
      setAccountRole(finalRole);
      setAccountName(String(name));
      fetchUnreadMessages(String(id), finalRole);

    } catch (error) {
      console.log("LOAD RECYCLING HISTORY ACCOUNT ERROR:", error);
      setLoading(false);
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  const fetchHistory = async (
    currentAccountId: string,
    currentRole: "user" | "facility"
  ) => {
    try {
      setLoading(true);

      let query = supabase
        .from("recycling_history")
        .select("*")
        .order("finished_date", { ascending: false });

      if (currentRole === "facility") {
        query = query.eq("facility_id", String(currentAccountId));
      } else {
        query = query.eq("user_id", String(currentAccountId));
      }

      const { data, error } = await query;

      if (error) {
        console.log("FETCH RECYCLING HISTORY ERROR:", error);
        setHistory([]);
        setFilteredHistory([]);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.log("FETCH RECYCLING HISTORY ERROR:", error);
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let updated = [...history];

    if (filter === "Latest" || filter === "All") {
      updated.sort((a, b) => {
        const dateA = new Date(a.finished_date || a.created_at || 0).getTime();
        const dateB = new Date(b.finished_date || b.created_at || 0).getTime();

        return dateB - dateA;
      });
    }

    if (filter === "Oldest") {
      updated.sort((a, b) => {
        const dateA = new Date(a.finished_date || a.created_at || 0).getTime();
        const dateB = new Date(b.finished_date || b.created_at || 0).getTime();

        return dateA - dateB;
      });
    }

    setFilteredHistory(updated);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      if (accountId && accountRole) {
        await fetchHistory(accountId, accountRole);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const goBack = () => {
    router.back();
  };

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

  const getHistoryImageSource = (item: HistoryItem) => {
    const imagePath = String(item.item_image || "").trim();

    if (!imagePath) {
      return require("../../assets/icons/icon.png");
    }

    const imageUrl = getPublicImageUrl("item-images", imagePath);

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${item.finished_date || item.created_at || Date.now()}`,
    };
  };

  const formatDateTime = (dateValue: any) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "N/A";
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

  const getMatchedWithText = (item: HistoryItem) => {
    if (accountRole === "facility") {
      return item.user_name || "User";
    }

    return item.matched_with || item.facility_name || "Facility";
  };

  const getMatchedLabel = () => {
    if (accountRole === "facility") {
      return "Matched user:";
    }

    return "Matched facility:";
  };

  const getHeaderSubtitle = () => {
    if (accountRole === "facility") {
      return "Completed matches from your facility postings";
    }

    return "Completed matches from your listed items";
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return (
      <View style={styles.card}>
        <Image source={getHistoryImageSource(item)} style={styles.itemImage} />

        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.item_name || "Unnamed Item"}</Text>

          <Text style={styles.matchText}>
            {getMatchedLabel()} {getMatchedWithText(item)}
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {item.transaction_status || "Finished"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Matched Date</Text>
            <Text style={styles.dateValue}>
              {formatDateTime(item.matched_date || item.created_at)}
            </Text>
          </View>

          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Finished Date</Text>
            <Text style={styles.finishedValue}>
              {formatDateTime(item.finished_date)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const filters: ("All" | "Latest" | "Oldest")[] = [
      "All",
      "Latest",
      "Oldest",
    ];

    return (
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filterItem) => (
            <TouchableOpacity
              key={filterItem}
              style={[
                styles.filterButton,
                filter === filterItem && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(filterItem)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterItem && styles.activeFilterText,
                ]}
              >
                {filterItem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderBottomNav = () => {
    if (accountRole === "facility") {
      return (
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
            <View style={{ position: "relative" }}>
            <Image
              source={require("../../assets/icons/chatting.png")}
              style={styles.navImage}
            />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>

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
                pathname === "/facility_dashboard/settings" &&
                  styles.navActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={styles.loadingText}>Loading recycling history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.header}>Recycling History</Text>
          <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryNumber}>{history.length}</Text>
        <Text style={styles.summaryLabel}>Completed Match Records</Text>
      </View>

      {renderFilters()}

      <FlatList
        data={filteredHistory}
        keyExtractor={(item, index) => `history-${item.id || index}`}
        showsVerticalScrollIndicator={false}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Recycling History Yet</Text>

            <Text style={styles.emptyText}>
              Finished matches will appear here once both sides complete the
              match.
            </Text>
          </View>
        }
      />

      {renderBottomNav()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  loaderContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#1b5e20",
    fontSize: 14,
    fontWeight: "600",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },

  backButton: {
    fontSize: 28,
    color: "#222",
    marginRight: 12,
  },

  headerTextBox: {
    flex: 1,
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#666",
  },

  summaryBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d2ead4",
  },

  summaryNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1b5e20",
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: 13,
    color: "#1b5e20",
    fontWeight: "600",
  },

  filterWrapper: {
    height: 45,
    marginBottom: 12,
  },

  filterContent: {
    alignItems: "center",
    paddingRight: 20,
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1b5e20",
    marginRight: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  activeFilterButton: {
    backgroundColor: "#1b5e20",
  },

  filterText: {
    color: "#1b5e20",
    fontWeight: "bold",
    fontSize: 12,
  },

  activeFilterText: {
    color: "#fff",
  },

  listContent: {
    paddingBottom: 110,
  },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  itemImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: "#ddd",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  itemName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },

  matchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
    marginBottom: 8,
  },

  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: "#dff3df",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
  },

  statusPillText: {
    color: "#1b5e20",
    fontSize: 12,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },

  dateBlock: {
    marginBottom: 6,
  },

  dateLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "bold",
  },

  dateValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#444",
  },

  finishedValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "bold",
  },

  emptyBox: {
    backgroundColor: "#f5f5f5",
    padding: 22,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 40,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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

  badge: {
  position: "absolute",
  top: -6,
  right: -8,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: "red",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},

badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "bold",
},
});