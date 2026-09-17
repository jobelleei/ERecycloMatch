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
  const [uploadingImage, setUploadingImage] = useState(false);

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

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages]);

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
        console.log("MARK USER MESSAGES READ ERROR: Invalid user ID", user.id);
        return;
      }

      const { error } = await supabase
        .from("messages")
        .update({
          is_read: true,
        })
        .eq("conversation_id", String(conversationId))
        .eq("receiver_id", numericUserId)
        .eq("is_read", false);

      if (error) {
        console.log("MARK USER MESSAGES READ ERROR:", error);
        return;
      }

      const { error: conversationReadError } = await supabase
        .from("conversations")
        .update({
          is_read: true,
        })
        .eq("id", String(conversationId));

      if (conversationReadError) {
        console.log(
          "MARK USER CONVERSATION READ ERROR:",
          conversationReadError,
        );
      }
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
        console.log("FETCH USER MESSAGES ERROR:", error);
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
      console.log("FETCH USER MESSAGES ERROR:", error);
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

      const { error: messageError } = await supabase.from("messages").insert([
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

      if (messageError) {
        console.log("USER SYSTEM MESSAGE ERROR:", messageError);
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message: text,
          updated_at: now,
        })
        .eq("id", String(conversationId));

      if (updateError) {
        console.log("UPDATE USER SYSTEM CONVERSATION ERROR:", updateError);
      }

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

      const { data: otherPendingMatches, error: pendingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("facility_id", currentFacilityId)
        .neq("id", String(conversationId))
        .or(
          "status.eq.match_pending,status.eq.pending,status.eq.request_pending,request_status.eq.pending",
        )
        .limit(1);

      if (pendingError) {
        console.log("CHECK EXISTING PENDING MATCH ERROR:", pendingError);
        return;
      }

      if (!otherPendingMatches || otherPendingMatches.length === 0) return;

      const { data: existingWarnings, error: warningError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", String(conversationId))
        .eq("message", warningMessage)
        .limit(1);

      if (warningError) {
        console.log("CHECK PENDING MATCH WARNING ERROR:", warningError);
        return;
      }

      if (existingWarnings && existingWarnings.length > 0) return;

      await addSystemMessage(warningMessage);
    } catch (error) {
      console.log("ADD PENDING MATCH WARNING ERROR:", error);
    }
  };

  const getRequestSender = () => {
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
        {
          text: "No",
          style: "cancel",
        },
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

              fetchConversation();
            } catch (error: any) {
              console.log("ACCEPT MATCH ERROR:", error);
              Alert.alert(
                "Accept Failed",
                error?.message || "Failed to accept match.",
              );
            }
          },
        },
      ],
    );
  };

  const rejectMatch = async () => {
    Alert.alert("Reject Match", "Are you sure you want to reject this match?", [
      {
        text: "No",
        style: "cancel",
      },
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
            console.log("REJECT MATCH ERROR:", error);
            Alert.alert(
              "Reject Failed",
              error?.message || "Failed to reject match.",
            );
          }
        },
      },
    ]);
  };

  const cancelMatch = async () => {
    const userAlreadyFinished = Boolean(conversation?.user_finished);
    const facilityAlreadyFinished = Boolean(conversation?.facility_finished);

    if (facilityAlreadyFinished) {
      Alert.alert(
        "Cancel Not Allowed",
        "You cannot cancel this match because the facility already clicked the Finish this match button.",
      );
      return;
    }

    if (userAlreadyFinished) {
      Alert.alert(
        "Cancel Not Allowed",
        "You cannot cancel this match because you already clicked the Finish this match button.",
      );
      return;
    }

    Alert.alert("Cancel Match", "Are you sure you want to cancel this match?", [
      {
        text: "No",
        style: "cancel",
      },
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
            console.log("CANCEL MATCH ERROR:", error);
            Alert.alert(
              "Cancel Failed",
              error?.message || "Failed to cancel match.",
            );
          }
        },
      },
    ]);
  };

  const createRecyclingHistoryRecord = async (finishedAt: string) => {
    try {
      let itemData: any = null;

      if (conversation?.item_id) {
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", String(conversation.item_id))
          .maybeSingle();

        if (error) {
          console.log("FETCH ITEM FOR HISTORY ERROR:", error);
        }

        itemData = data;
      }

      const { data: existingHistory, error: findHistoryError } = await supabase
        .from("recycling_history")
        .select("id")
        .eq("conversation_id", String(conversationId))
        .maybeSingle();

      if (findHistoryError) {
        console.log("FIND RECYCLING HISTORY ERROR:", findHistoryError);
      }

      if (existingHistory) return;

      const { error } = await supabase.from("recycling_history").insert([
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

      if (error) {
        console.log("INSERT RECYCLING HISTORY ERROR:", error);
        throw error;
      }
    } catch (error) {
      console.log("CREATE RECYCLING HISTORY ERROR:", error);
      throw error;
    }
  };

  const finishMatch = async () => {
    Alert.alert(
      "Finish Match",
      "Are you sure you want to mark this match as finished?",
      [
        {
          text: "No",
          style: "cancel",
        },
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
                  last_message: `${displayName} clicked Finish this match. Waiting for you to click the button too.`,
                });

                await addSystemMessage(
                  `${displayName} clicked Finish this match. Waiting for facility to finish this match.`,
                );
              }

              fetchConversation();
            } catch (error: any) {
              console.log("FINISH MATCH ERROR:", error);
              Alert.alert(
                "Finish Failed",
                error?.message || "Failed to finish match.",
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
        console.log("USER FEEDBACK INSERT ERROR:", error);
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
      console.log("SUBMIT USER FEEDBACK ERROR:", error);
      Alert.alert(
        "Feedback Failed",
        error?.message || "Unable to submit feedback.",
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getCurrentStatus = () => {
    return String(conversation?.status || "match_pending")
      .trim()
      .toLowerCase();
  };

  const getCurrentRequestSender = () => {
    return String(
      conversation?.requested_by ||
        conversation?.request_sender_role ||
        conversation?.request_from ||
        conversation?.sender_role ||
        conversation?.sender_type ||
        "",
    )
      .trim()
      .toLowerCase();
  };

  const getCurrentRequestReceiver = () => {
    return String(
      conversation?.request_receiver_role ||
        conversation?.receiver_role ||
        conversation?.receiver_type ||
        "",
    )
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
    const receiver = getCurrentRequestReceiver();

    if (["user", "individual", "owner", "sender"].includes(sender)) {
      return true;
    }

    if (["facility", "recycling facility"].includes(sender)) {
      return false;
    }

    if (["user", "individual", "owner"].includes(receiver)) {
      return false;
    }

    if (["facility", "recycling facility"].includes(receiver)) {
      return true;
    }

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

    if (isPendingMatch()) {
      return "Waiting for the requester to send an offer";
    }

    return "Chat is locked until the match is active";
  };

  const handlePickAndUploadImage = async () => {
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
        "Please grant photo gallery permission to upload files.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setUploadingImage(true);

    try {
      const fileExt = asset.uri.split(".").pop() || "jpg";
      const fileName = `chat_${conversationId}_${Date.now()}.${fileExt}`;
      const filePath = `chat_uploads/${fileName}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(filePath);

      const uploadedUrl = publicUrlData?.publicUrl || filePath;
      const receiverId = String(
        conversation?.facility_id || facilityIdParam || "",
      );

      const { error: messageError } = await supabase.from("messages").insert([
        {
          conversation_id: String(conversationId),
          sender_id: Number(user?.id),
          sender_name: user?.name || "User",
          sender_role: "user",
          sender_type: "user",
          receiver_id: receiverId ? Number(receiverId) : null,
          type: "image",
          message_type: "image",
          message: uploadedUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (messageError) throw messageError;

      await updateConversation({
        last_message: "📷 Sent a photo",
      });

      fetchMessages();
      fetchConversation();
    } catch (err: any) {
      console.log("IMAGE UPLOAD ERROR:", err);
      Alert.alert("Upload Failed", err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

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
    setMessageText("");

    try {
      setSending(true);

      const receiverId = String(
        conversation?.facility_id || facilityIdParam || "",
      );

      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: String(conversationId),
          sender_id: Number(user?.id),
          sender_name: user.name || "User",
          sender_role: "user",
          sender_type: "user",
          receiver_id: receiverId ? Number(receiverId) : null,
          type: sendingOffer ? "offer" : "text",
          message_type: sendingOffer ? "offer" : "text",
          message: text,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert("Send Failed", error.message);
        return;
      }

      await updateConversation({
        last_message: sendingOffer ? `Offer: ${text}` : text,
      });

      fetchMessages();
      fetchConversation();
    } catch (error) {
      console.log("SEND USER MESSAGE ERROR:", error);
      Alert.alert("Send Failed", "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const getSubtitle = () => {
    const status = conversation?.status || "match_pending";

    if (status === "match_pending") return "Match request pending";
    if (status === "cancelled") return "Match cancelled";
    if (status === "rejected") return "Match rejected";
    if (status === "accepted") return "Online";
    if (status === "active") return "Online";
    if (status === "matched") return "Online";
    if (status === "finish_pending") return "Waiting for other side";
    if (status === "finished") return "Match finished";

    return "Online";
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

    const timeText = formatMessageTime(item.created_at);
    const acceptedMessage = isMatchAcceptedMessage(item);
    const rejectedMessage = isMatchRejectedMessage(item);
    const cancelledMessage = isMatchCancelledMessage(item);
    const finishClickedMessage = isFinishClickedMessage(item);

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
        <View
          style={[
            styles.systemMessage,
            acceptedMessage && styles.acceptedSystemMessage,
            rejectedMessage && styles.rejectedSystemMessage,
            cancelledMessage && styles.cancelledSystemMessage,
            finishClickedMessage && styles.finishSystemMessage,
          ]}
        >
          <Text
            style={[
              styles.systemText,
              acceptedMessage && styles.acceptedSystemText,
              rejectedMessage && styles.rejectedSystemText,
              cancelledMessage && styles.cancelledSystemText,
              finishClickedMessage && styles.finishSystemText,
            ]}
          >
            {requestMessage
              ? "Match request sent"
              : rejectedMessage
                ? "Match rejected"
                : cancelledMessage
                  ? "Match cancelled"
                  : item.message}
          </Text>

          {requestMessage && renderRequestItemCard()}

          {timeText ? <Text style={styles.systemTime}>{timeText}</Text> : null}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.otherMessage,
          ]}
        >
          {/* Only render other sender name; removed "You" */}
          {!isMine && (
            <Text style={styles.senderName}>
              {item.sender_name || facilityProfile.name || "Facility"}
            </Text>
          )}

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

        {timeText ? (
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {timeText}
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          {/* iOS Style Clean Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/user_dashboard/messages" as any)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color="#222" />
            </TouchableOpacity>

            <Image source={getFacilityImage()} style={styles.avatarImage} />

            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {headerName}
              </Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>
          </View>

          {renderTopButtons()}

          {/* Messages list with "Today" Pill */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={
              <View style={styles.todayPillContainer}>
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Today</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No messages yet.</Text>
            }
          />

          {uploadingImage && (
            <View style={styles.uploadingBar}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.uploadingText}>Uploading photo...</Text>
            </View>
          )}

          {/* Modern Bottom Input with Gallery Attachment Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickAndUploadImage}
              disabled={chatLocked || uploadingImage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={22}
                color={chatLocked ? "#B0B0B0" : "#555"}
              />
            </TouchableOpacity>

            <View style={styles.inputPill}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={getInputPlaceholder()}
                placeholderTextColor="#999"
                style={styles.input}
                editable={canSendMessage()}
                multiline={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (sending || !canSendMessage() || !messageText.trim()) &&
                  styles.disabledButton,
              ]}
              onPress={sendMessage}
              disabled={sending || !canSendMessage() || !messageText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={20} color="#ffffff" />
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
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "#ffffff",
  },

  backButton: {
    padding: 4,
    marginRight: 4,
  },

  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
  },

  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 1,
  },

  matchActionBox: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#ffffff",
  },

  cancelMatchButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E53E3E",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelMatchText: {
    color: "#E53E3E",
    fontWeight: "700",
    fontSize: 14,
  },

  finishButton: {
    flex: 1,
    backgroundColor: "#15803D",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  finishText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E53E3E",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelText: {
    color: "#E53E3E",
    fontWeight: "700",
    fontSize: 14,
  },

  feedbackButton: {
    flex: 1,
    backgroundColor: "#15803D",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledFeedbackButton: {
    backgroundColor: "#9CA3AF",
  },

  feedbackText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  statusBox: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  statusText: {
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    fontSize: 13,
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  todayPillContainer: {
    alignItems: "center",
    marginVertical: 14,
  },

  todayPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },

  todayPillText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
    fontSize: 14,
  },

  messageRow: {
    marginBottom: 14,
  },

  myMessageRow: {
    alignItems: "flex-end",
  },

  otherMessageRow: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },

  myMessage: {
    backgroundColor: "#15803D",
    borderBottomRightRadius: 4,
  },

  otherMessage: {
    backgroundColor: "#F2F3F5",
    borderBottomLeftRadius: 4,
  },

  senderName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },

  myMessageText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
  },

  otherMessageText: {
    color: "#1F2937",
    fontSize: 15,
    lineHeight: 20,
  },

  chatImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },

  messageTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 4,
  },

  myMessageTime: {
    textAlign: "right",
  },

  systemMessage: {
    alignSelf: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 10,
    maxWidth: "88%",
  },

  acceptedSystemMessage: {
    backgroundColor: "#DCFCE7",
  },

  rejectedSystemMessage: {
    backgroundColor: "#FEE2E2",
  },

  cancelledSystemMessage: {
    backgroundColor: "#FEE2E2",
  },

  finishSystemMessage: {
    backgroundColor: "#DBEAFE",
  },

  systemText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },

  acceptedSystemText: {
    color: "#15803D",
  },

  rejectedSystemText: {
    color: "#B91C1C",
  },

  cancelledSystemText: {
    color: "#B91C1C",
  },

  finishSystemText: {
    color: "#1D4ED8",
  },

  systemTime: {
    marginTop: 4,
    fontSize: 10,
    textAlign: "center",
    color: "#9CA3AF",
  },

  requestItemCard: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 230,
  },

  requestItemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#eee",
  },

  requestItemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  requestItemLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
    marginBottom: 2,
  },

  requestItemName: {
    fontSize: 13,
    color: "#15803D",
    fontWeight: "bold",
  },

  uploadingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#F0FDF4",
  },

  uploadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#15803D",
    fontWeight: "500",
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#ffffff",
  },

  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 42,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    paddingVertical: 8,
  },

  sendButton: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#15803D",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#D1D5DB",
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
    borderRadius: 20,
    padding: 22,
  },

  feedbackTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#15803D",
  },

  feedbackSubtitle: {
    textAlign: "center",
    color: "#555",
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
  },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },

  star: {
    fontSize: 34,
    color: "#E5E7EB",
    marginHorizontal: 4,
  },

  selectedStar: {
    color: "#FBBF24",
  },

  feedbackInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    color: "#222",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 10,
  },

  modalCancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  modalCancelText: {
    color: "#4B5563",
    fontWeight: "bold",
  },

  modalSubmitButton: {
    backgroundColor: "#15803D",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  disabledModalButton: {
    backgroundColor: "#86EFAC",
  },

  modalSubmitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  reportSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 14,
  },

  reportToggle: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reportCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  reportCheckboxSelected: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },

  reportCheckmark: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },

  reportToggleContent: {
    flex: 1,
    marginLeft: 10,
  },

  reportToggleTitle: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },

  reportToggleDescription: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 16,
  },

  reportForm: {
    marginTop: 14,
  },

  reportQuestion: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },

  reportReason: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },

  reportReasonSelected: {
    borderColor: "#15803D",
    backgroundColor: "#F0FDF4",
  },

  reportRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },

  reportRadioSelected: {
    borderColor: "#15803D",
  },

  reportRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#15803D",
  },

  reportReasonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#4B5563",
  },

  reportReasonTextSelected: {
    color: "#15803D",
    fontWeight: "600",
  },

  reportDetailsInput: {
    minHeight: 80,
    marginTop: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    color: "#222",
    fontSize: 13,
  },

  reportCharacterCount: {
    marginTop: 4,
    textAlign: "right",
    fontSize: 11,
    color: "#9CA3AF",
  },
});
