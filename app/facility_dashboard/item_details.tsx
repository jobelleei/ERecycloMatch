import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function ItemDetails() {
  const router = useRouter();
  const { item_id } = useLocalSearchParams();

  const [item, setItem] = useState<any>(null);
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  useEffect(() => {
    loadFacilityAndItem();
  }, [item_id]);

  const loadFacilityAndItem = async () => {
    try {
      setLoading(true);

      // 1. Resolve logged-in facility profile
      const stored = await AsyncStorage.getItem("user");
      let currentFacility = null;
      if (stored) {
        const parsed = JSON.parse(stored);
        currentFacility = parsed.user || parsed.data || parsed;
        setFacility(currentFacility);
      }

      // 2. Safely parse numeric item_id to avoid bigint = text mismatch
      const numericItemId = Number(item_id);
      if (isNaN(numericItemId) || numericItemId <= 0) {
        setItem(null);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", numericItemId)
        .maybeSingle();

      if (error) {
        console.log("FETCH ITEM ERROR:", error);
        setItem(null);
        return;
      }

      setItem(data);
    } catch (error) {
      console.log("ITEM DETAILS ERROR:", error);
    } finally {
      setLoading(false);
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

  const openOwnerProfile = () => {
    const rawUserId =
      item?.user_id || item?.submitter_user_id || item?.owner_id || "";

    router.push({
      pathname: "/facility_dashboard/user_view_profile" as any,
      params: {
        user_id: String(rawUserId),
        name: String(item?.submitter_name || "User"),
      },
    });
  };

  const handleInterestedInItem = async () => {
    try {
      setSubmittingInterest(true);

      // Validate numeric facility ID
      const facilityIdNum = Number(facility?.id || facility?.facility_id);
      if (isNaN(facilityIdNum) || facilityIdNum <= 0) {
        Alert.alert(
          "Error",
          "Facility account session not found. Please log in again.",
        );
        return;
      }

      // Validate numeric user & item ID
      const itemUserIdNum = Number(item?.user_id || item?.submitter_user_id);
      const itemIdNum = Number(item?.id);

      if (isNaN(itemUserIdNum) || isNaN(itemIdNum)) {
        Alert.alert("Error", "Invalid user or item reference.");
        return;
      }

      const facilityName =
        facility?.name ||
        facility?.facility_name ||
        facility?.username ||
        "Recycling Facility";

      const itemName = item?.item_name || item?.item_type || "Item";

      // 1. Check for existing conversation with NUMERIC IDs
      const { data: existingConv, error: checkError } = await supabase
        .from("conversations")
        .select("*")
        .eq("facility_id", facilityIdNum)
        .eq("user_id", itemUserIdNum)
        .eq("item_id", itemIdNum)
        .maybeSingle();

      if (checkError) {
        console.log("CHECK CONVERSATION ERROR:", checkError);
      }

      let conversationId = existingConv?.id;

      // 2. Create conversation if it doesn't already exist
      if (!conversationId) {
        const { data: newConv, error: insertConvError } = await supabase
          .from("conversations")
          .insert({
            facility_id: facilityIdNum,
            user_id: itemUserIdNum,
            item_id: itemIdNum,
            facility_name: facilityName,
            item_name: itemName,
            status: "active",
            is_read: false,
          })
          .select()
          .single();

        if (insertConvError) {
          Alert.alert("Message Error", insertConvError.message);
          return;
        }

        conversationId = newConv?.id;
      }

      // 3. Send initial interest message
      const initialMessage = `Hello! We are interested in accepting your "${itemName}". Can we arrange a drop-off or pickup?`;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: Number(conversationId),
        sender_id: facilityIdNum,
        message_text: initialMessage,
        is_read: false,
      });

      if (messageError) {
        Alert.alert("Message Error", messageError.message);
        return;
      }

      // 4. Update conversation updated_at and last_message
      await supabase
        .from("conversations")
        .update({
          last_message: initialMessage,
          updated_at: new Date().toISOString(),
          is_read: false,
        })
        .eq("id", Number(conversationId));

      // 5. Navigate straight into chat
      router.push({
        pathname: "/facility_dashboard/chat" as any,
        params: {
          conversationId: String(conversationId),
          user_id: String(itemUserIdNum),
          user_name: String(item?.submitter_name || "User"),
          item_id: String(itemIdNum),
          item_name: itemName,
        },
      });
    } catch (err: any) {
      console.log("INTERESTED ACTION ERROR:", err);
      Alert.alert("Error", err?.message || "Failed to start conversation.");
    } finally {
      setSubmittingInterest(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f7d1f" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Item not found.</Text>
        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const itemImage = getPublicImageUrl(
    "item-images",
    item.item_image || item.image || item.image_path || "",
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Item Image */}
        <Image
          source={
            itemImage
              ? { uri: itemImage }
              : require("../../assets/icons/icon.png")
          }
          style={styles.image}
        />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            {item.item_name || item.item_type || "Unnamed Item"}
          </Text>

          <Text style={styles.postedBy}>
            Posted by {item.submitter_name || "User"}
          </Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {item.match_status || item.status || "Listed"}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>
              {item.description || "No description provided."}
            </Text>
          </View>

          {/* Issues / Condition */}
          <View style={styles.section}>
            <Text style={styles.label}>Issues / Condition</Text>
            <Text style={styles.value}>
              {item.issues || item.selected_issues || "No issues specified."}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {item.location || item.address || "No location provided."}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.interestedButton}
              activeOpacity={0.85}
              disabled={submittingInterest}
              onPress={handleInterestedInItem}
            >
              {submittingInterest ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.interestedButtonText}>
                  Interested in this Item
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={openOwnerProfile}
            >
              <Text style={styles.secondaryButtonText}>View User Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  notFoundText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: "#2f7d1f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backHomeBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: "#eee",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  postedBy: {
    marginTop: 6,
    fontSize: 14,
    color: "#2f7d1f",
    fontWeight: "600",
  },
  statusBox: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#2f7d1f",
    fontWeight: "700",
    fontSize: 12,
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    lineHeight: 22,
    color: "#555",
  },
  actionButtonsContainer: {
    marginTop: 30,
    marginBottom: 35,
    gap: 12,
  },
  interestedButton: {
    backgroundColor: "#2f7d1f",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  interestedButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#2f7d1f",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2f7d1f",
    fontSize: 15,
    fontWeight: "700",
  },
});
