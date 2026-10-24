import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { rejectCompetingRequests } from "../../utils/rejectCompetingRequests";
import {
  detectSensitiveInfo,
  formatSensitiveInfoList,
} from "../../utils/sensitiveInfo";

export default function UserChat() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const flatListRef = useRef<FlatList<any>>(null);

  const conversationId = String(params.conversationId || "");
  const facilityIdParam = String(params.facility_id || "");
  const facilityNameParam = String(params.facility_name || "Facility");
  const facilityProfileImageParam = String(params.profile_image || "");
  const itemIdParam = String(params.item_id || params.itemId || "");
  const itemNameParam = String(params.item_name || params.itemName || "");
  const itemImageParam = String(
    params.item_photo || params.item_image || params.itemImage || "",
  );

  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [requestItem, setRequestItem] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // Track which message IDs currently have their date & time visible upon click
  const [visibleTimestamps, setVisibleTimestamps] = useState<{
    [key: string]: boolean;
  }>({});

  const [facilityProfile, setFacilityProfile] = useState({
    name: "Facility",
    profileImage: "",
  });

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [includeReport, setIncludeReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const reportReasons = [
    "Scam or fraud",
    "Harassment or inappropriate behavior",
    "No-show during transaction",
    "Misleading information",
    "Unsafe transaction",
    "Fake account",
    "Other",
  ];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    fetchConversation();
    fetchMessages();

    const interval = setInterval(() => {
      fetchConversation();
      fetchMessages();

      if (user?.id) {
        markMessagesAsRead();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!conversationId || !user?.id) {
      return;
    }

    markMessagesAsRead();
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (conversation?.id && isPendingMatch()) {
      addPendingMatchWarningIfNeeded();
    }
  }, [conversation?.id, conversation?.status, conversation?.request_status]);

  useEffect(() => {
    const currentFacilityId = String(
      conversation?.facility_id || facilityIdParam || "",
    );

    if (currentFacilityId) {
      fetchFacilityProfile(currentFacilityId);
    }
  }, [conversation?.facility_id, facilityIdParam]);

  useEffect(() => {
    const activeItemId = String(conversation?.item_id || itemIdParam || "");

    if (activeItemId) {
      fetchRequestItem(activeItemId);
    } else if (itemNameParam || itemImageParam) {
      setRequestItem({
        id: activeItemId,
        item_name: itemNameParam,
        item_image: itemImageParam,
      });
    }
  }, [conversation?.item_id, itemIdParam, itemNameParam, itemImageParam]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        Alert.alert("User Error", "Please log in again.");
        router.replace("/signin" as any);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const userId =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const userName =
        actualUser?.name ||
        actualUser?.username ||
        actualUser?.fullname ||
        actualUser?.full_name ||
        parsed?.name ||
        parsed?.username ||
        "User";

      setUser({
        ...actualUser,
        id: String(userId),
        name: String(userName),
      });
    } catch (error) {
      console.log("LOAD USER CHAT ERROR:", error);
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

  const fetchFacilityProfile = async (targetFacilityId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", String(targetFacilityId))
        .maybeSingle();

      if (error || !data) {
        setFacilityProfile({
          name: facilityNameParam || conversation?.facility_name || "Facility",
          profileImage:
            facilityProfileImageParam ||
            conversation?.facility_profile_image ||
            "",
        });
        return;
      }

      const finalName =
        data.name ||
        data.facility_name ||
        data.username ||
        facilityNameParam ||
        conversation?.facility_name ||
        "Facility";

      const finalProfileImage =
        data.profile_image ||
        facilityProfileImageParam ||
        conversation?.facility_profile_image ||
        "";

      setFacilityProfile({
        name: finalName,
        profileImage: finalProfileImage,
      });

      if (conversation?.id) {
        await supabase
          .from("conversations")
          .update({
            facility_name: finalName,
            facility_profile_image: finalProfileImage,
          })
          .eq("id", conversation.id);
      }
    } catch (error) {
      console.log("FETCH FACILITY PROFILE ERROR:", error);
    }
  };

  const getFacilityImage = () => {
    const imagePath =
      facilityProfile.profileImage ||
      conversation?.facility_profile_image ||
      facilityProfileImageParam ||
      "";

    if (!imagePath) {
      return require("../../assets/icons/avatar.png");
    }

    if (String(imagePath).startsWith("http")) {
      return {
        uri: `${String(imagePath)}?v=${
          conversation?.updated_at || conversation?.created_at || Date.now()
        }`,
      };
    }

    const imageUrl = getPublicImageUrl("profile-images", imagePath);

    if (!imageUrl) {
      return require("../../assets/icons/avatar.png");
    }

    return {
      uri: `${imageUrl}?v=${
        conversation?.updated_at || conversation?.created_at || Date.now()
      }`,
    };
  };

  const getRequestItemName = () => {
    return String(
      requestItem?.item_name ||
        requestItem?.item_type ||
        requestItem?.name ||
        conversation?.item_name ||
        itemNameParam ||
        "Unnamed Item",
    );
  };

  const getRequestItemImage = () => {
    const imagePath =
      requestItem?.item_image ||
      requestItem?.image ||
      requestItem?.image_path ||
      requestItem?.item_image_url ||
      requestItem?.image_url ||
      requestItem?.photo ||
      requestItem?.photo_url ||
      conversation?.item_image ||
      itemImageParam ||
      "";

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/icon.png");
    }

    if (String(imagePath).startsWith("http")) {
      return {
        uri: `${String(imagePath)}?v=${
          requestItem?.updated_at ||
          requestItem?.created_at ||
          conversation?.updated_at ||
          Date.now()
        }`,
      };
    }

    const imageUrl =
      getPublicImageUrl("item-images", String(imagePath)) ||
      getPublicImageUrl("items", String(imagePath)) ||
      getPublicImageUrl("issue-images", String(imagePath));

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${
        requestItem?.updated_at ||
        requestItem?.created_at ||
        conversation?.updated_at ||
        Date.now()
      }`,
    };
  };

  const fetchRequestItem = async (targetItemId: string) => {
    try {
      if (!targetItemId) return;

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", String(targetItemId))
        .maybeSingle();

      if (error) {
        console.log("FETCH REQUEST ITEM ERROR:", error);

        setRequestItem({
          id: targetItemId,
          item_name: conversation?.item_name || itemNameParam || "Unnamed Item",
          item_image: conversation?.item_image || itemImageParam || "",
        });

        return;
      }

      setRequestItem(
        data || {
          id: targetItemId,
          item_name: conversation?.item_name || itemNameParam || "Unnamed Item",
          item_image: conversation?.item_image || itemImageParam || "",
        },
      );
    } catch (error) {
      console.log("FETCH REQUEST ITEM ERROR:", error);

      setRequestItem({
        id: targetItemId,
        item_name: conversation?.item_name || itemNameParam || "Unnamed Item",
        item_image: conversation?.item_image || itemImageParam || "",
      });
    }
  };

  const formatMessageTime = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format full date and time for when a message bubble is clicked
  const formatMessageDateTime = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMatchCreationDate = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isMatchRequestMessage = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();
    const messageType = String(item?.message_type || "")
      .trim()
      .toLowerCase();

    return (
      messageType === "match_request" ||
      message === "match request sent" ||
      message === "request sent" ||
      message.startsWith("request sent for ")
    );
  };

  const isOldEmptyRequestBubble = (item: any) => {
    const message = String(item?.message || "").trim();
    const messageType = String(item?.message_type || "")
      .trim()
      .toLowerCase();
    const type = String(item?.type || "")
      .trim()
      .toLowerCase();
    const senderType = String(item?.sender_type || "")
      .trim()
      .toLowerCase();

    if (message) return false;

    return (
      messageType === "match_request" ||
      type === "match_request" ||
      senderType === "request_card" ||
      senderType === "user" ||
      senderType === "facility"
    );
  };

  const shouldHideNormalRequestText = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();
    const type = String(item?.type || "")
      .trim()
      .toLowerCase();
    const senderType = String(item?.sender_type || "")
      .trim()
      .toLowerCase();

    const isSystemLike = type === "system" || senderType === "system";

    if (isSystemLike) return false;

    return (
      message === "request sent" ||
      message === "match request sent" ||
      message.startsWith("request sent for ")
    );
  };

  const isMatchAcceptedMessage = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();

    return (
      message === "match accepted" ||
      message.includes("match accepted") ||
      message.includes("you can now chat")
    );
  };

  const isMatchRejectedMessage = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();

    return (
      message === "match rejected" ||
      message === "request rejected" ||
      message === "match request rejected" ||
      message.includes("match rejected") ||
      message.includes("request rejected") ||
      message.includes("rejected")
    );
  };

  const isMatchCancelledMessage = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();

    return (
      message === "match cancelled" ||
      message === "match canceled" ||
      message.includes("match cancelled") ||
      message.includes("match canceled") ||
      message.includes("cancelled") ||
      message.includes("canceled")
    );
  };

  const isFinishClickedMessage = (item: any) => {
    const message = String(item?.message || "")
      .trim()
      .toLowerCase();

    return (
      message.includes("clicked finish this match") ||
      message.includes("waiting for you to click the button too") ||
      message.includes("waiting for facility to finish") ||
      message.includes("waiting for user to finish") ||
      message.includes("marked this match as finished")
    );
  };

  const fetchConversation = async () => {
    try {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", String(conversationId))
        .maybeSingle();

      if (error) {
        console.log("FETCH USER CONVERSATION ERROR:", error);
        return;
      }

      if (data) {
        setConversation(data);
      }
    } catch (error) {
      console.log("FETCH USER CONVERSATION ERROR:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      if (!conversationId || !user?.id) {
        return;
      }

      const numericUserId = Number(user.id);

      if (!Number.isFinite(numericUserId)) {
        return;
      }

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", String(conversationId))
        .eq("receiver_id", numericUserId)
        .eq("is_read", false);

      await supabase
        .from("conversations")
        .update({ is_read: true })
        .eq("id", String(conversationId));
    } catch (error) {
      console.log("MARK USER MESSAGES READ ERROR:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", String(conversationId))
        .order("created_at", { ascending: true });

      if (error) {
        setMessages([]);
        return;
      }

      let requestCardAlreadyShown = false;

      const cleanedMessages = (data || []).filter((message: any) => {
        if (isOldEmptyRequestBubble(message)) return false;
        if (shouldHideNormalRequestText(message)) return false;

        if (isMatchRequestMessage(message)) {
          if (requestCardAlreadyShown) return false;
          requestCardAlreadyShown = true;
          return true;
        }

        return true;
      });

      setMessages(cleanedMessages);

      if (user?.id) {
        await markMessagesAsRead();
      }
    } catch (error) {
      setMessages([]);
    }
  };

  const updateConversation = async (updates: any) => {
    const { error } = await supabase
      .from("conversations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", String(conversationId));

    if (error) {
      throw error;
    }
  };

  const addSystemMessage = async (text: string) => {
    try {
      const now = new Date().toISOString();

      await supabase.from("messages").insert([
        {
          conversation_id: String(conversationId),
          sender_id: null,
          sender_name: "System",
          sender_role: "system",
          sender_type: "system",
          receiver_id: null,
          type: "system",
          message: text,
          created_at: now,
        },
      ]);

      await supabase
        .from("conversations")
        .update({
          last_message: text,
          updated_at: now,
        })
        .eq("id", String(conversationId));

      fetchMessages();
      fetchConversation();
    } catch (error) {
      console.log("ADD USER SYSTEM MESSAGE ERROR:", error);
    }
  };

  const addPendingMatchWarningIfNeeded = async () => {
    try {
      const warningMessage =
        "You still have a pending match here. Finish it first before requesting another one.";

      const currentUserId = String(conversation?.user_id || user?.id || "");
      const currentFacilityId = String(
        conversation?.facility_id || facilityIdParam || "",
      );

      if (!conversationId || !currentUserId || !currentFacilityId) return;

      const { data: otherPendingMatches } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("facility_id", currentFacilityId)
        .neq("id", String(conversationId))
        .or(
          "status.eq.match_pending,status.eq.pending,status.eq.request_pending,request_status.eq.pending",
        )
        .limit(1);

      if (!otherPendingMatches || otherPendingMatches.length === 0) return;

      const { data: existingWarnings } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", String(conversationId))
        .eq("message", warningMessage)
        .limit(1);

      if (existingWarnings && existingWarnings.length > 0) return;

      await addSystemMessage(warningMessage);
    } catch (error) {
      console.log("ADD PENDING MATCH WARNING ERROR:", error);
    }
  };

  const getCurrentRequestSender = () => {
    return String(
      conversation?.requested_by ||
        conversation?.request_sender_role ||
        conversation?.request_from ||
        "",
    ).toLowerCase();
  };

  const acceptMatch = async () => {
    Alert.alert(
      "Accept Request",
      "Are you sure you want to accept this match request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Accept",
          onPress: async () => {
            try {
              const now = new Date().toISOString();
              await updateConversation({
                status: "matched",
                request_status: "accepted",
                last_message: "Match accepted",
              });

              if (conversation?.item_id) {
                await supabase
                  .from("items")
                  .update({
                    status: "Listed",
                    match_status: "Matched",
                    updated_at: now,
                  })
                  .eq("id", String(conversation.item_id));
              }

              await addSystemMessage("Match accepted. You can now chat.");

              await rejectCompetingRequests({
                ...conversation,
                id: conversation?.id || conversationId,
              });
              fetchConversation();
            } catch (error: any) {
              Alert.alert(
                "Accept Failed",
                error?.message || "Failed to accept.",
              );
            }
          },
        },
      ],
    );
  };

  const rejectMatch = async () => {
    Alert.alert("Reject Match", "Are you sure you want to reject this match?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await updateConversation({
              status: "rejected",
              request_status: "rejected",
              last_message: "Match rejected",
            });

            if (conversation?.item_id) {
              await supabase
                .from("items")
                .update({
                  status: "Listed",
                  match_status: "Listed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", String(conversation.item_id));
            }

            await addSystemMessage("Match rejected");
            fetchConversation();
          } catch (error: any) {
            Alert.alert("Reject Failed", error?.message || "Failed to reject.");
          }
        },
      },
    ]);
  };

  const cancelMatch = async () => {
    const userAlreadyFinished = Boolean(conversation?.user_finished);
    const facilityAlreadyFinished = Boolean(conversation?.facility_finished);

    if (facilityAlreadyFinished || userAlreadyFinished) {
      Alert.alert(
        "Cancel Not Allowed",
        "You cannot cancel this match because it's already completed or finished.",
      );
      return;
    }

    Alert.alert("Cancel Match", "Are you sure you want to cancel this match?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await updateConversation({
              status: "cancelled",
              request_status: "cancelled",
              last_message: "Match cancelled",
            });

            if (conversation?.item_id) {
              await supabase
                .from("items")
                .update({
                  status: "Listed",
                  match_status: "Listed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", String(conversation.item_id));
            }

            await addSystemMessage("Match cancelled");
            fetchConversation();
          } catch (error: any) {
            Alert.alert("Cancel Failed", error?.message || "Failed to cancel.");
          }
        },
      },
    ]);
  };

  const createRecyclingHistoryRecord = async (finishedAt: string) => {
    try {
      let itemData: any = null;
      if (conversation?.item_id) {
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("id", String(conversation.item_id))
          .maybeSingle();
        itemData = data;
      }

      const { data: existingHistory } = await supabase
        .from("recycling_history")
        .select("id")
        .eq("conversation_id", String(conversationId))
        .maybeSingle();

      if (existingHistory) return;

      await supabase.from("recycling_history").insert([
        {
          conversation_id: String(conversationId),
          user_id: String(conversation?.user_id || user?.id || ""),
          user_name: String(conversation?.user_name || user?.name || "User"),
          facility_id: String(
            conversation?.facility_id || facilityIdParam || "",
          ),
          facility_name: String(
            conversation?.facility_name ||
              facilityProfile.name ||
              facilityNameParam ||
              "Facility",
          ),
          matched_with: String(
            conversation?.facility_name ||
              facilityProfile.name ||
              facilityNameParam ||
              "Facility",
          ),
          item_id: String(conversation?.item_id || ""),
          item_name: String(
            conversation?.item_name ||
              itemData?.item_name ||
              itemData?.item_type ||
              "Unnamed Item",
          ),
          item_image: String(itemData?.item_image || ""),
          transaction_status: "Finished",
          posted_date: itemData?.created_at || itemData?.submitted_at || null,
          listed_date: itemData?.listed_at || null,
          matched_date:
            conversation?.matched_at ||
            conversation?.created_at ||
            conversation?.updated_at ||
            null,
          finished_date: finishedAt,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.log("CREATE RECYCLING HISTORY ERROR:", error);
    }
  };

  const finishMatch = async () => {
    Alert.alert(
      "Finish Match",
      "Are you sure you want to mark this match as finished?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Finish",
          onPress: async () => {
            try {
              const now = new Date().toISOString();
              const facilityAlreadyFinished = Boolean(
                conversation?.facility_finished,
              );

              if (facilityAlreadyFinished) {
                await updateConversation({
                  user_finished: true,
                  status: "finished",
                  last_message: "Match finished. Please provide feedback.",
                  finished_at: now,
                });

                if (conversation?.item_id) {
                  await supabase
                    .from("items")
                    .update({
                      status: "Finished",
                      match_status: "Finished",
                      finished_at: now,
                      updated_at: now,
                    })
                    .eq("id", String(conversation.item_id));
                }

                await createRecyclingHistoryRecord(now);
                await addSystemMessage(
                  "Both sides finished this match. Please provide feedback.",
                );
              } else {
                const displayName =
                  user?.name || conversation?.user_name || "User";

                await updateConversation({
                  user_finished: true,
                  status: "finish_pending",
                  last_message: `${displayName} clicked Finish this match. Waiting for facility to finish.`,
                });

                await addSystemMessage(
                  `${displayName} clicked Finish this match. Waiting for facility to finish this match.`,
                );
              }

              fetchConversation();
            } catch (error: any) {
              Alert.alert(
                "Finish Failed",
                error?.message || "Failed to finish.",
              );
            }
          },
        },
      ],
    );
  };

  const submitFeedback = async () => {
    try {
      Keyboard.dismiss();

      if (!conversation || !user?.id) {
        Alert.alert("Feedback Failed", "Missing user or conversation data.");
        return;
      }

      if (includeReport && !reportReason) {
        Alert.alert(
          "Report reason required",
          "Please select why you are reporting this facility.",
        );
        return;
      }

      const cleanRating = Number(selectedRating);
      if (!cleanRating || cleanRating < 1 || cleanRating > 5) {
        Alert.alert("Rating Required", "Please select 1 to 5 stars.");
        return;
      }

      const ratedId = Number(conversation.facility_id || facilityIdParam);
      if (!ratedId || isNaN(ratedId)) {
        Alert.alert("Feedback Failed", "Facility ID is missing or invalid.");
        return;
      }

      setSubmittingFeedback(true);

      const ratedName =
        facilityProfile.name || conversation.facility_name || "Facility";

      const { error } = await supabase.from("match_feedbacks").insert([
        {
          conversation_id: String(conversationId),
          rater_id: Number(user.id),
          rater_name: user.name || "User",
          rater_role: "user",
          rated_id: ratedId,
          rated_name: ratedName,
          rated_role: "facility",
          rating: cleanRating,
          comment: feedbackComment.trim() || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert("Feedback Failed", error.message);
        return;
      }

      await updateConversation({
        user_feedback_given: true,
        last_message: "User submitted feedback.",
      });

      await addSystemMessage("User submitted feedback.");

      setFeedbackModalVisible(false);
      setSelectedRating(0);
      setFeedbackComment("");
      setIncludeReport(false);
      setReportReason("");
      setReportDetails("");
      fetchConversation();

      Alert.alert("Thank You", "Your feedback has been submitted.");
    } catch (error: any) {
      Alert.alert("Feedback Failed", error?.message || "Unable to submit.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getCurrentStatus = () => {
    return String(conversation?.status || "match_pending")
      .trim()
      .toLowerCase();
  };

  const isPendingMatch = () => {
    const status = getCurrentStatus();
    const requestStatus = String(conversation?.request_status || "")
      .trim()
      .toLowerCase();

    return (
      status === "match_pending" ||
      status === "request_pending" ||
      status === "pending" ||
      requestStatus === "pending"
    );
  };

  const isAcceptedMatch = () => {
    const status = getCurrentStatus();
    return status === "matched" || status === "accepted" || status === "active";
  };

  const isCurrentAccountRequester = () => {
    if (!isPendingMatch()) return false;
    const sender = getCurrentRequestSender();
    if (["user", "individual", "owner", "sender"].includes(sender)) return true;
    if (["facility", "recycling facility"].includes(sender)) return false;
    return String(conversation?.user_id || "") === String(user?.id || "");
  };

  const hasCurrentAccountSentOffer = () => {
    if (!user?.id) return false;
    return messages.some((message: any) => {
      const messageType = String(message?.message_type || message?.type || "")
        .trim()
        .toLowerCase();
      const senderRole = String(
        message?.sender_role || message?.sender_type || "",
      )
        .trim()
        .toLowerCase();
      const isOfferMessage =
        messageType === "offer" ||
        messageType === "offer_message" ||
        messageType === "request_offer";
      return (
        isOfferMessage &&
        (String(message?.sender_id || "") === String(user?.id) ||
          senderRole === "user")
      );
    });
  };

  const canSendOfferMessage = () => {
    return isCurrentAccountRequester() && !hasCurrentAccountSentOffer();
  };

  const canSendMessage = () => {
    return isAcceptedMatch() || canSendOfferMessage();
  };

  const getInputPlaceholder = () => {
    if (isAcceptedMatch()) return "Message";
    if (isCurrentAccountRequester()) {
      return hasCurrentAccountSentOffer()
        ? "Offer sent. Wait for response"
        : "Send your offer (1) message...";
    }
    if (isPendingMatch()) return "Waiting for the requester to send an offer";
    return "Chat is locked until the match is active";
  };

  const handlePickImage = async () => {
    if (!canSendMessage()) {
      Alert.alert(
        "Chat Locked",
        "You can only send attachments once the match is active.",
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Please grant photo gallery permission to select images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setSelectedImageUri(result.assets[0].uri);
  };

  // Warn before sending phone numbers, addresses, payment or ID details
  const sendMessage = () => {
    const sensitiveInfo = detectSensitiveInfo(messageText);

    if (sensitiveInfo.length === 0) {
      sendMessageNow();
      return;
    }

    Alert.alert(
      "Sensitive Information",
      `Your message seems to contain ${formatSensitiveInfoList(
        sensitiveInfo,
      )}. For your safety, avoid sharing personal or payment details in chat. Only send them if you trust the other person.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Anyway",
          style: "destructive",
          onPress: () => sendMessageNow(),
        },
      ],
      { cancelable: true },
    );
  };

  const sendMessageNow = async () => {
    if (!messageText.trim() && !selectedImageUri) return;

    if (!user?.id) {
      Alert.alert("User Error", "Please log in again.");
      return;
    }

    if (!conversationId) {
      Alert.alert("Chat Error", "Conversation ID is missing.");
      return;
    }

    const sendingOffer = canSendOfferMessage();

    if (!canSendMessage()) {
      Alert.alert(
        "Chat Locked",
        "You can only send one offer while the request is pending. After the match is accepted, you can continue chatting.",
      );
      return;
    }

    const text = messageText.trim();
    const imageToUpload = selectedImageUri;

    setMessageText("");
    setSelectedImageUri(null);

    try {
      setSending(true);
      const receiverId = String(
        conversation?.facility_id || facilityIdParam || "",
      );

      let finalMessageContent = text;
      let messageType = sendingOffer ? "offer" : "text";

      if (imageToUpload) {
        const fileExt = imageToUpload.split(".").pop() || "jpg";
        const fileName = `chat_${conversationId}_${Date.now()}.${fileExt}`;
        const filePath = `chat_uploads/${fileName}`;

        const formData = new FormData();
        formData.append("file", {
          uri: imageToUpload,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, formData, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);

        finalMessageContent = publicUrlData?.publicUrl || filePath;
        messageType = "image";
      }

      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: String(conversationId),
          sender_id: Number(user?.id),
          sender_name: user.name || "User",
          sender_role: "user",
          sender_type: "user",
          receiver_id: receiverId ? Number(receiverId) : null,
          type: messageType,
          message_type: messageType,
          message: finalMessageContent,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert("Send Failed", error.message);
        return;
      }

      await updateConversation({
        last_message:
          messageType === "image"
            ? "📷 Sent a photo"
            : sendingOffer
              ? `Offer: ${text}`
              : text,
      });

      fetchMessages();
      fetchConversation();
    } catch (error: any) {
      console.log("SEND USER MESSAGE ERROR:", error);
      Alert.alert("Send Failed", error?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const getSubtitle = () => {
    const status = conversation?.status || "match_pending";

    if (status === "match_pending") return "Match request pending";
    if (status === "cancelled") return "Match cancelled";
    if (status === "rejected") return "Match rejected";
    if (status === "accepted") return "Match accepted";
    if (status === "active") return "Match accepted";
    if (status === "matched") return "Match accepted";
    if (status === "finish_pending") return "Waiting for other side";
    if (status === "finished") return "Match finished";

    return "Chat";
  };

  const getSubtitleDotColor = () => {
    const status = conversation?.status || "match_pending";

    if (status === "match_pending") return "#f9a825";
    if (status === "cancelled" || status === "rejected") return "#c62828";
    if (status === "accepted" || status === "active" || status === "matched")
      return "#1976d2";
    if (status === "finish_pending") return "#1976d2";
    if (status === "finished") return "#2e7d32";

    return "#888";
  };

  const renderTopButtons = () => {
    const status = conversation?.status || "match_pending";
    const facilityFinished = Boolean(conversation?.facility_finished);
    const userFinished = Boolean(conversation?.user_finished);
    const userFeedbackGiven = Boolean(conversation?.user_feedback_given);
    const requestSender = getCurrentRequestSender();

    const isUserRequester =
      isCurrentAccountRequester() || requestSender === "user";
    const isFacilityRequester =
      !isUserRequester && (requestSender === "facility" || isPendingMatch());

    if (status === "match_pending") {
      if (isUserRequester) {
        return (
          <View style={styles.matchActionBox}>
            <TouchableOpacity
              style={styles.cancelMatchButton}
              onPress={cancelMatch}
            >
              <Text style={styles.cancelMatchText}>Cancel request</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (isFacilityRequester) {
        return (
          <View style={styles.matchActionBox}>
            <TouchableOpacity style={styles.finishButton} onPress={acceptMatch}>
              <Text style={styles.finishText}>Accept request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={rejectMatch}>
              <Text style={styles.cancelText}>Reject request</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (status === "matched" || status === "accepted" || status === "active") {
      return (
        <View style={styles.matchActionBox}>
          <TouchableOpacity style={styles.finishButton} onPress={finishMatch}>
            <Text style={styles.finishText}>Finish this match</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelMatch}>
            <Text style={styles.cancelText}>Cancel this match</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "finish_pending") {
      if (userFinished) {
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              Waiting for facility to finish this match.
            </Text>
          </View>
        );
      }
      if (facilityFinished) {
        return (
          <View style={styles.matchActionBox}>
            <TouchableOpacity style={styles.finishButton} onPress={finishMatch}>
              <Text style={styles.finishText}>Finish this match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelMatch}>
              <Text style={styles.cancelText}>Cancel this match</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (status === "finished") {
      return (
        <View style={styles.matchActionBox}>
          <TouchableOpacity
            style={[
              styles.feedbackButton,
              userFeedbackGiven && styles.disabledFeedbackButton,
            ]}
            disabled={userFeedbackGiven}
            onPress={() => setFeedbackModalVisible(true)}
          >
            <Text style={styles.feedbackText}>
              {userFeedbackGiven ? "Feedback submitted" : "Provide feedback"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "cancelled") {
      return (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>This match has been cancelled.</Text>
        </View>
      );
    }

    if (status === "rejected") {
      return (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>This match has been rejected.</Text>
        </View>
      );
    }

    return null;
  };

  const renderRequestItemCard = () => {
    return (
      <View style={styles.requestItemCard}>
        <Image source={getRequestItemImage()} style={styles.requestItemImage} />
        <View style={styles.requestItemInfo}>
          <Text style={styles.requestItemLabel}>Requested Item</Text>
          <Text style={styles.requestItemName} numberOfLines={2}>
            {getRequestItemName()}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: any) => {
    const messageTextValue = String(item?.message || "").trim();
    const messageLower = messageTextValue.toLowerCase();
    const requestMessage = isMatchRequestMessage(item);

    const isMine =
      item.sender_id !== null && String(item.sender_id) === String(user?.id);

    const isImage =
      item.type === "image" ||
      item.message_type === "image" ||
      (messageLower.startsWith("http") &&
        (messageLower.endsWith(".jpg") ||
          messageLower.endsWith(".jpeg") ||
          messageLower.endsWith(".png") ||
          messageLower.endsWith(".webp")));

    const isSystem =
      item.type === "system" ||
      item.sender_type === "system" ||
      requestMessage ||
      String(item?.message_type || "").toLowerCase() === "match_request";

    const shortTimeText = formatMessageTime(item.created_at);
    const fullDateTimeText = formatMessageDateTime(item.created_at);
    const rejectedMessage = isMatchRejectedMessage(item);
    const cancelledMessage = isMatchCancelledMessage(item);

    const messageKey = String(item.id || item.created_at);
    const showFullDate = visibleTimestamps[messageKey];

    const toggleTimestamp = () => {
      setVisibleTimestamps((prev) => ({
        ...prev,
        [messageKey]: !prev[messageKey],
      }));
    };

    if (!isSystem && !messageTextValue) {
      return null;
    }

    if (
      !isSystem &&
      (messageLower === "request sent" ||
        messageLower === "match request sent" ||
        messageLower.startsWith("request sent for "))
    ) {
      return null;
    }

    if (isSystem) {
      return (
        <View style={styles.plainSystemContainer}>
          <Text style={styles.plainSystemText}>
            {requestMessage
              ? "Match request sent"
              : rejectedMessage
                ? "Match rejected"
                : cancelledMessage
                  ? "Match cancelled"
                  : item.message}
          </Text>

          {requestMessage && renderRequestItemCard()}

          {requestMessage && isCurrentAccountRequester() && (
            <View style={styles.oneMessageNotice}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#8a6d1f"
              />
              <Text style={styles.oneMessageNoticeText}>
                {hasCurrentAccountSentOffer()
                  ? "Your message has been sent. You can chat freely once the facility accepts this request."
                  : "To avoid spam, you can only send one message while this request is pending. Include your offer and pickup or drop-off details."}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={toggleTimestamp}>
            <Text style={styles.plainSystemTime}>
              {showFullDate ? fullDateTimeText : shortTimeText}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleTimestamp}>
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {isImage ? (
              <Image
                source={{ uri: messageTextValue }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={isMine ? styles.myMessageText : styles.otherMessageText}
              >
                {item.message}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Static time shows by default; when clicked, full date and time is shown */}
        {shortTimeText ? (
          <Text
            style={[
              styles.messageTime,
              isMine ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {showFullDate ? fullDateTimeText : shortTimeText}
          </Text>
        ) : null}
      </View>
    );
  };

  const headerName =
    facilityProfile.name ||
    conversation?.facility_name ||
    facilityNameParam ||
    "Facility";

  const chatLocked = !canSendMessage();

  const matchCreationDateFormatted = formatMatchCreationDate(
    conversation?.created_at || conversation?.matched_at || "",
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/user_dashboard/messages" as any)}
            >
              <Text style={styles.back}>‹</Text>
            </TouchableOpacity>

            <Image source={getFacilityImage()} style={styles.avatarImage} />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {headerName}
              </Text>

              <View style={styles.subtitleRow}>
                <View
                  style={[
                    styles.subtitleDot,
                    { backgroundColor: getSubtitleDotColor() },
                  ]}
                />
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
              </View>
            </View>
          </View>

          {renderTopButtons()}

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListHeaderComponent={
              matchCreationDateFormatted ? (
                <View style={styles.todayPillContainer}>
                  <View style={styles.todayPill}>
                    <Text style={styles.todayPillText}>
                      {matchCreationDateFormatted}
                    </Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No messages yet.</Text>
            }
          />

          {/* Staged Image Preview Box */}
          {selectedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.previewThumbnail}
              />
              <TouchableOpacity
                style={styles.removePreviewButton}
                onPress={() => setSelectedImageUri(null)}
              >
                <Ionicons name="close-circle" size={22} color="#c62828" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickImage}
              disabled={chatLocked || sending}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={22}
                color={chatLocked ? "#bbb" : "#1b5e20"}
              />
            </TouchableOpacity>

            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder={getInputPlaceholder()}
              placeholderTextColor="#999"
              style={[styles.input, chatLocked && styles.disabledInput]}
              editable={canSendMessage()}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (sending ||
                  !canSendMessage() ||
                  (!messageText.trim() && !selectedImageUri)) &&
                  styles.disabledButton,
              ]}
              onPress={sendMessage}
              disabled={
                sending ||
                !canSendMessage() ||
                (!messageText.trim() && !selectedImageUri)
              }
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Feedback Modal */}
          <Modal
            visible={feedbackModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => {
              Keyboard.dismiss();
              setFeedbackModalVisible(false);
            }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={styles.modalKeyboardView}
                >
                  <TouchableWithoutFeedback>
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackTitle}>Rate Facility</Text>

                      <Text style={styles.feedbackSubtitle}>
                        How was your match with {headerName}?
                      </Text>

                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => {
                              Keyboard.dismiss();
                              setSelectedRating(star);
                            }}
                          >
                            <Text
                              style={[
                                styles.star,
                                selectedRating >= star && styles.selectedStar,
                              ]}
                            >
                              ★
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TextInput
                        value={feedbackComment}
                        onChangeText={setFeedbackComment}
                        placeholder="Optional comment..."
                        placeholderTextColor="#777"
                        style={styles.feedbackInput}
                        multiline
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={Keyboard.dismiss}
                      />
                      <View style={styles.reportSection}>
                        <TouchableOpacity
                          style={styles.reportToggle}
                          onPress={() => {
                            const nextValue = !includeReport;
                            setIncludeReport(nextValue);

                            if (!nextValue) {
                              setReportReason("");
                              setReportDetails("");
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.reportCheckbox,
                              includeReport && styles.reportCheckboxSelected,
                            ]}
                          >
                            {includeReport && (
                              <Text style={styles.reportCheckmark}>✓</Text>
                            )}
                          </View>

                          <View style={styles.reportToggleContent}>
                            <Text style={styles.reportToggleTitle}>
                              Report this facility
                            </Text>

                            <Text style={styles.reportToggleDescription}>
                              Select this only if a serious issue occurred
                              during the transaction.
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {includeReport && (
                          <View style={styles.reportForm}>
                            <Text style={styles.reportQuestion}>
                              Why are you reporting this facility?
                            </Text>

                            {reportReasons.map((reason) => {
                              const selected = reportReason === reason;

                              return (
                                <TouchableOpacity
                                  key={reason}
                                  style={[
                                    styles.reportReason,
                                    selected && styles.reportReasonSelected,
                                  ]}
                                  onPress={() => setReportReason(reason)}
                                >
                                  <View
                                    style={[
                                      styles.reportRadio,
                                      selected && styles.reportRadioSelected,
                                    ]}
                                  >
                                    {selected && (
                                      <View style={styles.reportRadioInner} />
                                    )}
                                  </View>

                                  <Text
                                    style={[
                                      styles.reportReasonText,
                                      selected &&
                                        styles.reportReasonTextSelected,
                                    ]}
                                  >
                                    {reason}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}

                            <TextInput
                              value={reportDetails}
                              onChangeText={setReportDetails}
                              placeholder="Describe what happened (optional)"
                              placeholderTextColor="#888"
                              multiline
                              maxLength={500}
                              style={styles.reportDetailsInput}
                              textAlignVertical="top"
                            />

                            <Text style={styles.reportCharacterCount}>
                              {reportDetails.length}/500
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={styles.modalCancelButton}
                          onPress={() => {
                            Keyboard.dismiss();
                            setFeedbackModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.modalSubmitButton,
                            submittingFeedback && styles.disabledModalButton,
                          ]}
                          onPress={submitFeedback}
                          disabled={submittingFeedback}
                        >
                          <Text style={styles.modalSubmitText}>
                            {submittingFeedback ? "Submitting..." : "Submit"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  back: {
    fontSize: 36,
    marginRight: 15,
  },

  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },

  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  subtitle: {
    color: "gray",
  },

  matchActionBox: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  cancelMatchButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0a0a0",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelMatchText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 15,
  },

  finishButton: {
    flex: 1,
    backgroundColor: "#1b5e20",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  finishText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0a0a0",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 15,
  },

  feedbackButton: {
    flex: 1,
    backgroundColor: "#1b5e20",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  disabledFeedbackButton: {
    backgroundColor: "#999",
  },

  feedbackText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  statusBox: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  statusText: {
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
  },

  messagesList: {
    padding: 15,
    flexGrow: 1,
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },

  messageContainer: {
    maxWidth: "80%",
    marginBottom: 10,
  },

  myMessageContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },

  otherMessageContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },

  messageBubble: {
    padding: 10,
    borderRadius: 12,
  },

  myMessage: {
    backgroundColor: "#1b5e20",
  },

  otherMessage: {
    backgroundColor: "#eee",
  },

  myMessageText: {
    color: "#fff",
  },

  otherMessageText: {
    color: "#000",
  },

  messageTime: {
    fontSize: 10,
    color: "#777",
    marginTop: 3,
  },

  myMessageTime: {
    textAlign: "right",
  },

  otherMessageTime: {
    textAlign: "left",
  },

  plainSystemContainer: {
    alignSelf: "center",
    marginVertical: 8,
    alignItems: "center",
    maxWidth: "90%",
    paddingHorizontal: 10,
  },

  plainSystemText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  plainSystemTime: {
    marginTop: 2,
    fontSize: 10,
    textAlign: "center",
    color: "#888888",
  },

  requestItemCard: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 230,
  },

  requestItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#eee",
  },

  requestItemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  requestItemLabel: {
    fontSize: 10,
    color: "#777",
    fontWeight: "700",
    marginBottom: 2,
  },

  requestItemName: {
    fontSize: 13,
    color: "#1b5e20",
    fontWeight: "bold",
  },

  oneMessageNotice: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3e0a6",
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 280,
  },

  oneMessageNoticeText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "#8a6d1f",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#000",
    maxHeight: 100,
  },

  disabledInput: {
    backgroundColor: "#ececec",
    color: "#999",
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: "#1b5e20",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#d1d5db",
  },

  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalKeyboardView: {
    width: "100%",
    justifyContent: "center",
  },

  feedbackBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },

  feedbackTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1b5e20",
  },

  feedbackSubtitle: {
    textAlign: "center",
    color: "#555",
    marginTop: 8,
    marginBottom: 15,
  },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },

  star: {
    fontSize: 34,
    color: "#ccc",
    marginHorizontal: 4,
  },

  selectedStar: {
    color: "#fbc02d",
  },

  feedbackInput: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    color: "#222",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 10,
  },

  modalCancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  modalCancelText: {
    color: "#333",
    fontWeight: "bold",
  },

  modalSubmitButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  modalSubmitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  reportSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 14,
  },

  reportToggle: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reportCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#777",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  reportCheckboxSelected: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },

  reportCheckmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },

  reportToggleContent: {
    flex: 1,
    marginLeft: 10,
  },

  reportToggleTitle: {
    color: "#b3261e",
    fontSize: 15,
    fontWeight: "700",
  },

  reportToggleDescription: {
    marginTop: 3,
    color: "#666",
    fontSize: 12,
    lineHeight: 17,
  },

  reportForm: {
    marginTop: 14,
  },

  reportQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },

  reportReason: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#ffffff",
  },

  reportReasonSelected: {
    borderColor: "#1b5e20",
    backgroundColor: "#f1f8f2",
  },

  reportRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#888",
    alignItems: "center",
    justifyContent: "center",
  },

  reportRadioSelected: {
    borderColor: "#1b5e20",
  },

  reportRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1b5e20",
  },

  reportReasonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#444",
  },

  reportReasonTextSelected: {
    color: "#1b5e20",
    fontWeight: "600",
  },

  reportDetailsInput: {
    minHeight: 90,
    marginTop: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "#fafafa",
    color: "#222",
    fontSize: 14,
  },

  reportCharacterCount: {
    marginTop: 4,
    textAlign: "right",
    fontSize: 11,
    color: "#888",
  },

  disabledModalButton: {
    backgroundColor: "#81a784",
  },

  chatImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },

  todayPillContainer: {
    alignItems: "center",
    marginBottom: 10,
  },

  todayPill: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  todayPillText: {
    fontSize: 11,
    color: "#777",
  },

  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f2f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  imagePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  previewThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  removePreviewButton: {
    marginLeft: 10,
  },
});
