import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { type ComponentRef, useEffect, useRef, useState } from "react";
import UserBottomNav from "../../components/UserBottomNav";
import FacilityBottomNav from "../../components/FacilityBottomNav";
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
import OnboardingTour, {
  hasCompletedTour,
  markTourCompleted,
  TourStep,
} from "../../components/OnboardingTour";
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

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [accountRole, setAccountRole] = useState<"user" | "facility" | "">("");
  const [accountName, setAccountName] = useState("");

  const [filter, setFilter] = useState<"All" | "Latest" | "Oldest">("All");

  // Onboarding tour for new accounts (same key as the shared history screen)
  const [showTour, setShowTour] = useState(false);
  const summaryRef = useRef<ComponentRef<typeof View>>(null);
  const filtersRef = useRef<ComponentRef<typeof View>>(null);
  const firstCardRef = useRef<ComponentRef<typeof View>>(null);
  const historyHelpRef = useRef<any>(null);
  const tourName = `recycling_history_${accountRole || "facility"}`;

  useEffect(() => {
    if (!accountId || loading) return;

    hasCompletedTour(tourName, accountId).then((completed) => {
      if (!completed) setShowTour(true);
    });
  }, [accountId, loading, tourName]);

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

    } catch (error) {
      console.log("LOAD RECYCLING HISTORY ACCOUNT ERROR:", error);
      setLoading(false);
      setHistory([]);
      setFilteredHistory([]);
    }
  };

useEffect(() => {
  loadAccount();
}, []);

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

useEffect(() => {
  if (accountId && accountRole) {
    fetchHistory(accountId, accountRole);
  }
}, [accountId, accountRole]);

const applyFilter = () => {
  let updated = [...history];

  if (filter === "Latest" || filter === "All") {
    updated.sort((a, b) => {
      const dateA = new Date(
        a.finished_date || a.created_at || 0
      ).getTime();

      const dateB = new Date(
        b.finished_date || b.created_at || 0
      ).getTime();

      return dateB - dateA;
    });
  }

  if (filter === "Oldest") {
    updated.sort((a, b) => {
      const dateA = new Date(
        a.finished_date || a.created_at || 0
      ).getTime();

      const dateB = new Date(
        b.finished_date || b.created_at || 0
      ).getTime();

      return dateA - dateB;
    });
  }

  setFilteredHistory(updated);
};

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

    useEffect(() => {
  if (accountId && accountRole) {
    fetchHistory(accountId, accountRole);
  }
}, [accountId, accountRole]);

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

  const renderHistoryItem = ({
    item,
    index,
  }: {
    item: HistoryItem;
    index: number;
  }) => {
    return (
      <View
        ref={index === 0 ? firstCardRef : undefined}
        collapsable={false}
        style={styles.card}
      >
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
      <View ref={filtersRef} collapsable={false} style={styles.filterWrapper}>
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

  const isFacility = accountRole !== "user";

  const tourSteps: TourStep[] = [
    {
      key: "welcome",
      icon: "time-outline",
      title: "Recycling History",
      description: isFacility
        ? "Every match your facility has finished is recorded here. A match is added once both you and the user mark it as finished."
        : "Every item you've successfully recycled is recorded here. A match is added once both you and the facility mark it as finished.",
    },
    {
      key: "summary",
      icon: "ribbon-outline",
      title: "Completed Matches",
      description: isFacility
        ? "The total number of matches your facility has completed."
        : "The total number of items you've recycled through ERecycloMatch.",
      targetRef: summaryRef,
    },
    {
      key: "filters",
      icon: "swap-vertical-outline",
      title: "Sort Your History",
      description:
        "Tap All, Latest or Oldest to change the order of your records.",
      targetRef: filtersRef,
    },
    {
      key: "record",
      icon: "document-text-outline",
      title: "History Record",
      description: isFacility
        ? "Each record shows the item, the user you matched with, and when the match was made and finished."
        : "Each record shows the item, the facility you matched with, and when the match was made and finished.",
      targetRef: firstCardRef,
    },
    {
      key: "help",
      icon: "help-circle-outline",
      title: "Need Help?",
      description: "Tap this button anytime to replay this guide.",
      targetRef: historyHelpRef,
    },
  ];

  const finishTour = () => {
    setShowTour(false);

    if (accountId) {
      markTourCompleted(tourName, accountId);
    }
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

        <TouchableOpacity
          ref={historyHelpRef}
          style={styles.helpButton}
          onPress={() => setShowTour(true)}
        >
          <Ionicons name="help-circle-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <View ref={summaryRef} collapsable={false} style={styles.summaryBox}>
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

      {accountRole === "facility" ? (
        <FacilityBottomNav
          facilityId={accountId}
          active="profile"
        />
      ) : (
        <UserBottomNav
          userId={accountId}
          active="profile"
        />
      )}

      <OnboardingTour
        visible={showTour}
        steps={tourSteps}
        onFinish={finishTour}
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

  helpButton: {
    marginLeft: 10,
    padding: 4,
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
    paddingBottom: 140,
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
});