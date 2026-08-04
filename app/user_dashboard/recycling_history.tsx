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
  conversation_id?: string;
  facility_id?: string | number;
  facility_name?: string;
  matched_with?: string;
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

  const [accountId, setAccountId] = useState("");
  const [accountRole, setAccountRole] = useState<"user" | "facility" | "">("");
  const [filter, setFilter] = useState<"Latest" | "Oldest">("Latest");

  useEffect(() => {
    loadAccount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [])
  );

  useEffect(() => {
    if (accountId && accountRole) {
      fetchHistory(accountId, accountRole);
    }
  }, [accountId, accountRole]);

  useEffect(() => {
    applyFilter();
  }, [history, filter]);

  const loadAccount = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        setHistory([]);
        setFilteredHistory([]);
        setLoading(false);
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
        actualUser?.role ||
          parsed?.role ||
          actualUser?.account_type ||
          parsed?.account_type ||
          ""
      ).toLowerCase();

      let finalRole: "user" | "facility" | "" = "";

      if (roleRaw.includes("facility")) {
        finalRole = "facility";
      } else if (roleRaw.includes("user")) {
        finalRole = "user";
      } else {
        const currentPath = String(pathname || "").toLowerCase();

        if (currentPath.includes("facility_dashboard")) {
          finalRole = "facility";
        } else {
          finalRole = "user";
        }
      }

      if (!id || !finalRole) {
        setHistory([]);
        setFilteredHistory([]);
        setLoading(false);
        return;
      }

      setAccountId(String(id));
      setAccountRole(finalRole);
    } catch (error) {
      console.log("LOAD RECYCLING HISTORY ACCOUNT ERROR:", error);
      setHistory([]);
      setFilteredHistory([]);
      setLoading(false);
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
    const updated = [...history];

    updated.sort((a, b) => {
      const dateA = new Date(a.finished_date || a.created_at || 0).getTime();
      const dateB = new Date(b.finished_date || b.created_at || 0).getTime();

      if (filter === "Oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

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
      uri: `${imageUrl}?v=${
        item.finished_date || item.created_at || Date.now()
      }`,
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

  const getMatchedLabel = () => {
    if (accountRole === "facility") {
      return "Matched user:";
    }

    return "Matched facility:";
  };

  const getMatchedName = (item: HistoryItem) => {
    if (accountRole === "facility") {
      return item.user_name || "User";
    }

    return item.matched_with || item.facility_name || "Facility";
  };

  const getSubtitle = () => {
    if (accountRole === "facility") {
      return "Completed matches from your facility";
    }

    return "Completed matches from your listed items";
  };

  const goBack = () => {
    router.back();
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return (
      <View style={styles.card}>
        <Image source={getHistoryImageSource(item)} style={styles.itemImage} />

        <View style={styles.cardContent}>
          <Text style={styles.itemName}>{item.item_name || "Unnamed Item"}</Text>

          <Text style={styles.matchText}>
            {getMatchedLabel()} {getMatchedName(item)}
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {item.transaction_status || "Finished"}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.dateText}>
            Matched: {formatDateTime(item.matched_date || item.created_at)}
          </Text>

          <Text style={styles.finishedText}>
            Finished: {formatDateTime(item.finished_date)}
          </Text>
        </View>
      </View>
    );
  };

  const renderFilters = () => {
    const filters: ("Latest" | "Oldest")[] = ["Latest", "Oldest"];

    return (
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
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
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
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

  dateText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },

  finishedText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "bold",
    color: "#2e7d32",
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
});