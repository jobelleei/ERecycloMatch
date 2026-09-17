import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function FacilityList() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, role, status, address, location, profile_image, updated_at",
        )
        .ilike("role", "facility")
        .ilike("status", "approved")
        .order("name", { ascending: true });

      if (error) throw error;
      setFacilities(data || []);
      setFilteredFacilities(data || []);
    } catch (err: any) {
      console.log("Fetch all facilities error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredFacilities(facilities);
      return;
    }
    const query = text.toLowerCase();
    const matches = facilities.filter(
      (f) =>
        f.name?.toLowerCase().includes(query) ||
        f.address?.toLowerCase().includes(query) ||
        f.location?.toLowerCase().includes(query),
    );
    setFilteredFacilities(matches);
  };

  const getProfileImage = (facility: any) => {
    const img = facility.profile_image;
    if (!img) return require("../../assets/icons/avatar.png");
    if (String(img).startsWith("http")) {
      return { uri: `${img}?v=${facility.updated_at || ""}` };
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(img);
    return data?.publicUrl
      ? { uri: data.publicUrl }
      : require("../../assets/icons/avatar.png");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partnered Facilities</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter / Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search facility or location..."
            placeholderTextColor="#777"
            value={search}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#777" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="search-outline" size={20} color="#555" />
          )}
        </View>
      </View>

      {/* Facilities Vertical Card List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      ) : (
        <FlatList
          data={filteredFacilities}
          keyExtractor={(item) => `facility-item-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchFacilities();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No facilities found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: "/user_dashboard/facility_view_profile" as any,
                  params: { facility_id: String(item.id) },
                })
              }
            >
              <Image source={getProfileImage(item)} style={styles.cardImage} />

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name || "Unnamed Facility"}
                </Text>

                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#666"
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.cardLocation} numberOfLines={2}>
                    {item.location || item.address || "No location provided"}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEEB",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF3E8",
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#222",
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardLocation: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
  },
});
