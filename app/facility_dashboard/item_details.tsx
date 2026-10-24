import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import OnboardingTour, {
  hasCompletedTour,
  markTourCompleted,
  TourStep,
} from "../../components/OnboardingTour";
import { supabase } from "../../utils/supabase";

export default function ItemDetails() {
  const router = useRouter();
  const { item_id } = useLocalSearchParams();

  const [item, setItem] = useState<any>(null);
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Onboarding tour for new facilities
  const [showTour, setShowTour] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const titleRef = useRef<View>(null);
  const issuesRef = useRef<View>(null);
  const locationRef = useRef<View>(null);
  const interestedRef = useRef<any>(null);
  const ownerProfileRef = useRef<any>(null);
  const detailsHelpRef = useRef<any>(null);
  const facilityTourId = String(facility?.id || facility?.facility_id || "");

  useEffect(() => {
    if (!facilityTourId || loading || !item) return;

    hasCompletedTour("facility_item_details", facilityTourId).then(
      (completed) => {
        if (!completed) setShowTour(true);
      },
    );
  }, [facilityTourId, loading, item]);

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const scrollToBottom = () => scrollRef.current?.scrollToEnd({ animated: true });

  const tourSteps: TourStep[] = [
    {
      key: "welcome",
      icon: "cube-outline",
      title: "Item Details",
      description:
        "This is an e-waste item a user has listed for recycling. Check the details to decide if your facility wants it.",
    },
    {
      key: "title",
      icon: "pricetag-outline",
      title: "Item & Owner",
      description: "The item's name and the user who posted it.",
      targetRef: titleRef,
      prepare: scrollToTop,
    },
    {
      key: "issues",
      icon: "warning-outline",
      title: "Issues / Condition",
      description:
        "The problems the user reported, such as a cracked screen or a glued battery. Make sure your facility can handle them.",
      targetRef: issuesRef,
      prepare: scrollToBottom,
    },
    {
      key: "location",
      icon: "location-outline",
      title: "Location",
      description: "Where the item is, so you can plan the pickup or drop-off.",
      targetRef: locationRef,
      prepare: scrollToBottom,
    },
    {
      key: "interested",
      icon: "heart-outline",
      title: "Interested in this Item",
      description:
        "Sends a match request to the user and opens a chat with them. If the user accepts another facility's request instead, yours is rejected automatically.",
      targetRef: interestedRef,
      prepare: scrollToBottom,
    },
    {
      key: "owner-profile",
      icon: "person-outline",
      title: "View User Profile",
      description:
        "See the user's profile, their other listed items, their rating and the feedback other facilities left them.",
      targetRef: ownerProfileRef,
      prepare: scrollToBottom,
    },
    {
      key: "help",
      icon: "help-circle-outline",
      title: "Need Help?",
      description: "Tap this button anytime to replay this guide.",
      targetRef: detailsHelpRef,
      prepare: scrollToTop,
    },
  ];

  const finishTour = () => {
    setShowTour(false);
    scrollToTop();

    if (facilityTourId) {
      markTourCompleted("facility_item_details", facilityTourId);
    }
  };

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
    const userId = item?.user_id || item?.submitter_user_id || item?.owner_id;

    if (!userId) {
      Alert.alert("Error", "User profile could not be found.");
      return;
    }

    router.push({
      pathname: "/facility_dashboard/user_view_profile" as any,
      params: {
        user_id: String(userId),
      },
    });
  };

  const handleInterestedInItem = async () => {
    try {
      setSubmittingInterest(true);

      const facilityId = String(facility?.id || facility?.facility_id || "");
      if (!facilityId) {
        Alert.alert(
          "Error",
          "Facility account session not found. Please log in again.",
        );
        return;
      }

      const userId = String(
        item?.user_id || item?.submitter_user_id || item?.owner_id || "",
      );
      const itemId = String(item?.id || "");

      if (!userId || !itemId) {
        Alert.alert("Error", "Invalid user or item reference.");
        return;
      }

      if (userId === facilityId) {
        Alert.alert("Error", "You cannot send a request for your own item.");
        return;
      }

      const facilityName =
        facility?.name ||
        facility?.facility_name ||
        facility?.username ||
        "Recycling Facility";
      const facilityProfileImage =
        facility?.profile_image || facility?.profileImage || "";
      const userName = String(item?.submitter_name || "User");
      const itemName = String(item?.item_name || item?.item_type || "Item");
      const now = new Date().toISOString();

      // Same conversation id format used across the app: user_facility_item
      const conversationId = `${userId}_${facilityId}_${itemId}`;

      const { data: existingConversation, error: findError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (findError) {
        console.log("FIND INTEREST CONVERSATION ERROR:", findError);
      }

      // New conversations: DB triggers notify the user and mark the item
      // "Pending Match". Re-sent requests (update) don't trigger the notify.
      let requestSent = false;
      let needsNotification = false;

      if (!existingConversation) {
        const { error: insertError } = await supabase
          .from("conversations")
          .insert([
            {
              id: conversationId,
              user_id: userId,
              user_name: userName,
              user_profile_image: "",
              facility_id: facilityId,
              facility_name: facilityName,
              facility_profile_image: facilityProfileImage,
              item_id: itemId,
              item_name: itemName,
              last_message: "Match request sent",
              status: "match_pending",
              is_read: false,
              requested_by: "facility",
              request_sender_role: "facility",
              request_receiver_role: "user",
              user_finished: false,
              facility_finished: false,
              user_feedback_given: false,
              facility_feedback_given: false,
              created_at: now,
              updated_at: now,
            },
          ]);

        if (insertError) {
          console.log("CREATE INTEREST CONVERSATION ERROR:", insertError);
          Alert.alert(
            "Message Error (create conversation)",
            [insertError.message, insertError.details, insertError.hint]
              .filter(Boolean)
              .join("\n"),
          );
          return;
        }

        requestSent = true;
      } else {
        const reusableStatuses = ["cancelled", "rejected"];

        if (reusableStatuses.includes(String(existingConversation.status))) {
          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              status: "match_pending",
              last_message: "Match request sent",
              is_read: false,
              requested_by: "facility",
              request_sender_role: "facility",
              request_receiver_role: "user",
              user_finished: false,
              facility_finished: false,
              user_feedback_given: false,
              facility_feedback_given: false,
              updated_at: now,
            })
            .eq("id", conversationId);

          if (updateError) {
            console.log("UPDATE INTEREST CONVERSATION ERROR:", updateError);
            Alert.alert(
              "Message Error (update conversation)",
              [updateError.message, updateError.details, updateError.hint]
                .filter(Boolean)
                .join("\n"),
            );
            return;
          }

          requestSent = true;
          needsNotification = true;
        }
      }

      if (requestSent) {
        // Request card shown in both users' chat
        const { error: messageError } = await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            sender_id: null,
            sender_name: "System",
            sender_role: "system",
            sender_type: "system",
            receiver_id: null,
            type: "system",
            message_type: "match_request",
            message: "Match request sent",
            created_at: now,
          },
        ]);

        if (messageError) {
          console.log("ADD INTEREST REQUEST MESSAGE ERROR:", messageError);
        }

        if (needsNotification) {
          const { error: notifError } = await supabase
            .from("notifications")
            .insert([
              {
                profile_id: userId,
                type: "match_request",
                title: "New Match Request",
                message: `${facilityName} is interested in your "${itemName}".`,
                is_read: false,
                data: {
                  conversation_id: conversationId,
                  facility_id: facilityId,
                  item_id: itemId,
                },
                created_at: now,
              },
            ]);

          if (notifError) {
            console.log("INTEREST NOTIFICATION ERROR:", notifError);
          }
        }
      }

      router.push({
        pathname: "/facility_dashboard/chat" as any,
        params: {
          conversationId,
          user_id: userId,
          user_name: userName,
          item_id: itemId,
          item_name: itemName,
          request_sender_role: "facility",
          request_receiver_role: "user",
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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity
            ref={detailsHelpRef}
            onPress={() => setShowTour(true)}
          >
            <Ionicons name="help-circle-outline" size={26} color="#222" />
          </TouchableOpacity>
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
          <View ref={titleRef} collapsable={false}>
            <Text style={styles.title}>
              {item.item_name || item.item_type || "Unnamed Item"}
            </Text>

            <Text style={styles.postedBy}>
              Posted by {item.submitter_name || "User"}
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
          <View ref={issuesRef} collapsable={false} style={styles.section}>
            <Text style={styles.label}>Issues / Condition</Text>
            <Text style={styles.value}>
              {item.issues || item.selected_issues || "No issues specified."}
            </Text>
          </View>

          {/* Location */}
          <View ref={locationRef} collapsable={false} style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {item.location || item.address || "No location provided."}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              ref={interestedRef}
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
              ref={ownerProfileRef}
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={openOwnerProfile}
            >
              <Text style={styles.secondaryButtonText}>View User Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
