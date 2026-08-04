import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

export default function FacilityChat() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const flatListRef = useRef<FlatList<any>>(null);

  const conversationId = String(params.conversationId || "");
  const userIdParam = String(params.user_id || "");
  const userNameParam = String(params.user_name || "User");
  const userProfileImageParam = String(params.user_profile_image || "");
  const itemIdParam = String(params.item_id || params.itemId || "");
  const itemNameParam = String(params.item_name || params.itemName || "");
  const itemImageParam = String(params.item_image || params.itemImage || "");

  const [facility, setFacility] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [requestItem, setRequestItem] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "User",
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
    loadFacility();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    fetchConversation();
    fetchMessages();

    const interval = setInterval(() => {
      fetchConversation();
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (conversation?.id && isPendingMatch()) {
      addPendingMatchWarningIfNeeded();
    }
  }, [conversation?.id, conversation?.status, conversation?.request_status]);

  useEffect(() => {
    const currentUserId = String(conversation?.user_id || userIdParam || "");

    if (currentUserId) {
      fetchUserProfile(currentUserId);
    }
  }, [conversation?.user_id, userIdParam]);

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
    if (conversation?.status === "match_pending" && conversation?.id) {
      ensureMatchRequestMessage(String(conversation.id));
    }
  }, [conversation?.id, conversation?.status, conversation?.item_id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages]);

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        Alert.alert("Facility Error", "Please log in again.");
        router.replace("/signin" as any);
        return;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const facilityId =
        actualUser?.id ||
        actualUser?.facility_id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user_id ||
        "";

      const facilityName =
        actualUser?.name ||
        actualUser?.facility_name ||
        actualUser?.username ||
        parsed?.name ||
        parsed?.facility_name ||
        parsed?.username ||
        "Facility";

      setFacility({
        ...actualUser,
        id: String(facilityId),
        name: String(facilityName),
      });
    } catch (error) {
      console.log("LOAD FACILITY ERROR:", error);
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

  const fetchUserProfile = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", String(targetUserId))
        .maybeSingle();

      if (error || !data) {
        setUserProfile({
          name: userNameParam || conversation?.user_name || "User",
          profileImage:
            userProfileImageParam || conversation?.user_profile_image || "",
        });
        return;
      }

      const finalName =
        data.name ||
        data.username ||
        data.fullname ||
        data.full_name ||
        userNameParam ||
        conversation?.user_name ||
        "User";

      const finalProfileImage =
        data.profile_image ||
        userProfileImageParam ||
        conversation?.user_profile_image ||
        "";

      setUserProfile({
        name: finalName,
        profileImage: finalProfileImage,
      });

      if (conversation?.id) {
        await supabase
          .from("conversations")
          .update({
            user_name: finalName,
            user_profile_image: finalProfileImage,
          })
          .eq("id", conversation.id);
      }
    } catch (error) {
      console.log("FETCH USER PROFILE ERROR:", error);
    }
  };

  const getUserImage = () => {
    const imagePath =
      userProfile.profileImage ||
      conversation?.user_profile_image ||
      userProfileImageParam ||
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

    const imageUrl = getPublicImageUrl("item-images", String(imagePath));

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
      month: "short",
      day: "numeric",
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
    const type = String(item?.type || "")
      .trim()
      .toLowerCase();

    return (
      messageType === "match_request" ||
      type === "match_request" ||
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
      senderType === "user"
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
        console.log("FETCH FACILITY CONVERSATION ERROR:", error);
        return;
      }

      if (data) {
        setConversation(data);
      }
    } catch (error) {
      console.log("FETCH FACILITY CONVERSATION ERROR:", error);
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
        console.log("FETCH FACILITY MESSAGES ERROR:", error);
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
    } catch (error) {
      console.log("FETCH FACILITY MESSAGES ERROR:", error);
      setMessages([]);
    }
  };

  const ensureMatchRequestMessage = async (targetConversationId: string) => {
    try {
      const { data: existingRequestMessages, error: findError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", String(targetConversationId))
        .or(
          "message.eq.Match request sent,message_type.eq.match_request,type.eq.match_request",
        )
        .limit(1);

      if (findError) {
        console.log("FIND MATCH REQUEST MESSAGE ERROR:", findError);
      }

      if (existingRequestMessages && existingRequestMessages.length > 0) {
        return;
      }

      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: String(targetConversationId),
          sender_id: null,
          sender_name: "System",
          sender_role: "system",
          sender_type: "system",
          receiver_id: null,
          type: "system",
          message_type: "match_request",
          message: "Match request sent",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.log("ADD MATCH REQUEST MESSAGE ERROR:", error);
      }

      fetchMessages();
    } catch (error) {
      console.log("ENSURE MATCH REQUEST MESSAGE ERROR:", error);
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
        console.log("FACILITY SYSTEM MESSAGE ERROR:", messageError);
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message: text,
          updated_at: now,
        })
        .eq("id", String(conversationId));

      if (updateError) {
        console.log("UPDATE FACILITY SYSTEM CONVERSATION ERROR:", updateError);
      }

      fetchMessages();
      fetchConversation();
    } catch (error) {
      console.log("ADD FACILITY SYSTEM MESSAGE ERROR:", error);
    }
  };

  const addPendingMatchWarningIfNeeded = async () => {
    try {
      const warningMessage =
        "You still have a pending match here. Finish it first before requesting another one.";

      const currentUserId = String(conversation?.user_id || userIdParam || "");
      const currentFacilityId = String(
        conversation?.facility_id || facility?.id || "",
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

  const acceptMatch = async () => {
    Alert.alert(
      "Accept Match",
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
                    updated_at: new Date().toISOString(),
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

    if (userAlreadyFinished) {
      Alert.alert(
        "Cancel Not Allowed",
        "You cannot cancel this match because the user already clicked the Finish this match button.",
      );
      return;
    }

    if (facilityAlreadyFinished) {
      Alert.alert(
        "Cancel Not Allowed",
        "You cannot cancel this match because your facility already clicked the Finish this match button.",
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
          user_id: String(conversation?.user_id || userIdParam || ""),
          user_name: String(
            conversation?.user_name || userProfile.name || "User",
          ),
          facility_id: String(conversation?.facility_id || facility?.id || ""),
          facility_name: String(
            conversation?.facility_name || facility?.name || "Facility",
          ),
          matched_with: String(
            conversation?.facility_name || facility?.name || "Facility",
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
              const userAlreadyFinished = Boolean(conversation?.user_finished);

              if (userAlreadyFinished) {
                await updateConversation({
                  facility_finished: true,
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
                  facility?.name || conversation?.facility_name || "Facility";

                await updateConversation({
                  facility_finished: true,
                  status: "finish_pending",
                  last_message: `${displayName} clicked Finish this match. Waiting for you to click the button too.`,
                });

                await addSystemMessage(
                  `${displayName} clicked Finish this match. Waiting for you to click the button too.`,
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

      if (!conversation || !facility?.id) {
        Alert.alert(
          "Feedback Failed",
          "Missing facility or conversation data.",
        );
        return;
      }

      const cleanRating = Number(selectedRating);

      if (!cleanRating || cleanRating < 1 || cleanRating > 5) {
        Alert.alert("Rating Required", "Please select 1 to 5 stars.");
        return;
      }

      if (includeReport && !reportReason) {
        Alert.alert(
          "Report reason required",
          "Please select why you are reporting this user.",
        );
        return;
      }

      const ratedId = Number(conversation.user_id || userIdParam);

      if (!ratedId || isNaN(ratedId)) {
        Alert.alert("Feedback Failed", "User ID is missing or invalid.");
        return;
      }

      setSubmittingFeedback(true);

      const ratedName = userProfile.name || conversation.user_name || "User";

      const { error } = await supabase.from("match_feedbacks").insert([
        {
          conversation_id: String(conversationId),
          rater_id: Number(facility.id),
          rater_name: facility.name || "Facility",
          rater_role: "facility",
          rated_id: ratedId,
          rated_name: ratedName,
          rated_role: "user",
          rating: cleanRating,
          comment: feedbackComment.trim() || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.log("FACILITY FEEDBACK INSERT ERROR:", error);
        Alert.alert("Feedback Failed", error.message);
        return;
      }

      await updateConversation({
        facility_feedback_given: true,
        last_message: "Facility submitted feedback.",
      });

      await addSystemMessage("Facility submitted feedback.");

      setFeedbackModalVisible(false);
      setSelectedRating(0);
      setFeedbackComment("");
      setIncludeReport(false);
      setReportReason("");
      setReportDetails("");

      fetchConversation();

      Alert.alert("Thank You", "Your feedback has been submitted.");
    } catch (error: any) {
      console.log("SUBMIT FACILITY FEEDBACK ERROR:", error);
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

    if (["facility", "recycling facility", "sender"].includes(sender)) {
      return true;
    }

    if (["user", "individual", "owner"].includes(sender)) {
      return false;
    }

    if (["facility", "recycling facility"].includes(receiver)) {
      return false;
    }

    if (["user", "individual", "owner"].includes(receiver)) {
      return true;
    }

    return (
      String(conversation?.facility_id || "") === String(facility?.id || "")
    );
  };

  const hasCurrentAccountSentOffer = () => {
    if (!facility?.id) return false;

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
        (String(message?.sender_id || "") === String(facility?.id) ||
          senderRole === "facility")
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
    if (isAcceptedMatch()) return "Type a message...";

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

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    if (!facility?.id) {
      Alert.alert("Facility Error", "Please log in again.");
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

      const receiverId = String(conversation?.user_id || userIdParam || "");

      const { error } = await supabase.from("messages").insert([
        {
          conversation_id: String(conversationId),
          sender_id: Number(facility?.id),
          sender_name: facility.name || "Facility",
          sender_role: "facility",
          sender_type: "facility",
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
      console.log("SEND FACILITY MESSAGE ERROR:", error);
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
    if (status === "accepted") return "Match accepted";
    if (status === "active") return "Match accepted";
    if (status === "matched") return "Match accepted";
    if (status === "finish_pending") return "Waiting for other side";
    if (status === "finished") return "Match finished";

    return "Chat";
  };

  const renderTopButtons = () => {
    const status = conversation?.status || "match_pending";
    const facilityFinished = Boolean(conversation?.facility_finished);
    const userFinished = Boolean(conversation?.user_finished);
    const facilityFeedbackGiven = Boolean(
      conversation?.facility_feedback_given,
    );

    const requestSenderRole = getCurrentRequestSender();

    const isFacilityRequester =
      isCurrentAccountRequester() || requestSenderRole === "facility";

    const isFacilityReceiver =
      !isFacilityRequester &&
      (requestSenderRole === "user" || isPendingMatch());

    if (status === "match_pending") {
      if (isFacilityRequester) {
        return (
          <View style={styles.matchActionBox}>
            <TouchableOpacity
              style={styles.cancelMatchButton}
              onPress={cancelMatch}
            >
              <Text style={styles.cancelMatchText}>Cancel match</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (isFacilityReceiver) {
        return (
          <View style={styles.matchActionBox}>
            <TouchableOpacity style={styles.finishButton} onPress={acceptMatch}>
              <Text style={styles.finishText}>Accept match</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={rejectMatch}>
              <Text style={styles.cancelText}>Reject match</Text>
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
      if (facilityFinished) {
        return (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              Waiting for user to finish this match.
            </Text>
          </View>
        );
      }

      if (userFinished) {
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
              facilityFeedbackGiven && styles.disabledFeedbackButton,
            ]}
            disabled={facilityFeedbackGiven}
            onPress={() => setFeedbackModalVisible(true)}
          >
            <Text style={styles.feedbackText}>
              {facilityFeedbackGiven
                ? "Feedback submitted"
                : "Provide feedback"}
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
    if (isOldEmptyRequestBubble(item)) {
      return null;
    }

    if (shouldHideNormalRequestText(item)) {
      return null;
    }

    const cleanMessage = String(item?.message || "").trim();

    if (!cleanMessage && !isMatchRequestMessage(item)) {
      return null;
    }

    const isMine =
      item.sender_id !== null &&
      String(item.sender_id) === String(facility?.id);

    const isSystem =
      item.type === "system" ||
      item.sender_type === "system" ||
      isMatchRequestMessage(item);

    const timeText = formatMessageTime(item.created_at);
    const requestMessage = isMatchRequestMessage(item);
    const acceptedMessage = isMatchAcceptedMessage(item);
    const rejectedMessage = isMatchRejectedMessage(item);
    const cancelledMessage = isMatchCancelledMessage(item);
    const finishClickedMessage = isFinishClickedMessage(item);

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
          styles.messageBubble,
          isMine ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={[styles.senderName, isMine && styles.mySenderName]}>
          {isMine ? "You" : item.sender_name || "User"}
        </Text>

        <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>
          {item.message}
        </Text>

        {timeText ? (
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {timeText}
          </Text>
        ) : null}
      </View>
    );
  };

  const headerName =
    userProfile.name || conversation?.user_name || userNameParam || "User";

  const chatLocked = !canSendMessage();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>‹</Text>
            </TouchableOpacity>

            <Image source={getUserImage()} style={styles.avatarImage} />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.title}>{headerName}</Text>

              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>
          </View>

          {renderTopButtons()}

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No messages yet.</Text>
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.inputRow}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={getInputPlaceholder()}
                placeholderTextColor="#777"
                style={[styles.input, chatLocked && styles.disabledInput]}
                editable={canSendMessage()}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (sending || !canSendMessage()) && styles.disabledButton,
                ]}
                onPress={sendMessage}
                disabled={sending || !canSendMessage()}
              >
                <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

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
                      <Text style={styles.feedbackTitle}>Rate User</Text>

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
                              Report this user
                            </Text>

                            <Text style={styles.reportToggleDescription}>
                              Select this only if a serious issue occurred during
                              the transaction.
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {includeReport && (
                          <View style={styles.reportForm}>
                            <Text style={styles.reportQuestion}>
                              Why are you reporting this user?
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
                            submittingFeedback && styles.disabledButton,
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

  subtitle: {
    color: "gray",
    marginTop: 2,
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
    borderWidth: 1.5,
    borderColor: "#ff3b30",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelMatchText: {
    color: "#ff3b30",
    fontWeight: "bold",
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
    borderWidth: 1.5,
    borderColor: "#ff3b30",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  cancelText: {
    color: "#ff3b30",
    fontWeight: "bold",
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

  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#1b5e20",
  },

  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#eee",
  },

  senderName: {
    fontSize: 11,
    color: "gray",
    marginBottom: 3,
  },

  mySenderName: {
    color: "#d8f3dc",
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
    marginTop: 5,
    alignSelf: "flex-end",
  },

  myMessageTime: {
    color: "#d8f3dc",
  },

  systemMessage: {
    alignSelf: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "90%",
  },

  acceptedSystemMessage: {
    backgroundColor: "#e8f5e9",
  },

  rejectedSystemMessage: {
    backgroundColor: "#ffebee",
  },

  cancelledSystemMessage: {
    backgroundColor: "#ffebee",
  },

  finishSystemMessage: {
    backgroundColor: "#e3f2fd",
  },

  systemText: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },

  acceptedSystemText: {
    color: "green",
  },

  rejectedSystemText: {
    color: "#d32f2f",
  },

  cancelledSystemText: {
    color: "#d32f2f",
  },

  finishSystemText: {
    color: "#1976d2",
  },

  systemTime: {
    marginTop: 5,
    fontSize: 10,
    textAlign: "center",
    color: "#777",
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

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 18,
    minHeight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#000",
  },

  disabledInput: {
    backgroundColor: "#eee",
    color: "#777",
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: "#1b5e20",
    height: 50,
    minWidth: 90,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },

  disabledButton: {
    backgroundColor: "#8aa887",
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

});
