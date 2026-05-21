import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "./firebaseConfig";
import { Image } from "react-native";

const API_URL = "http://192.168.1.8/Admin_Side/admin_UI";

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = String(params.conversationId || "");
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [ratingVisible, setRatingVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingReason, setRatingReason] = useState("");
  const [acceptedByUser, setAcceptedByUser] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      listenConversation();
      listenMessages();
    }
  }, [conversationId]);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("user");

    if (!stored) return;

    setUser(JSON.parse(stored));
  };

  const listenConversation = () => {
    const ref = doc(db, "conversations", conversationId);

    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setConversation({
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    });
  };

  const listenMessages = () => {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages",
    );

    const q = query(messagesRef, orderBy("created_at", "asc"));

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(data);
    });
  };

  const submitRating =
  async () => {
    try {

      if (
        selectedRating === 0
      ) {
        Alert.alert(
          "Rating Required",
          "Please select a rating."
        );
        return;
      }

      if (
        selectedRating <= 2 &&
        !ratingReason.trim()
      ) {
        Alert.alert(
          "Reason Required",
          "Please explain why you gave a low rating."
        );
        return;
      }

      await addDoc(
        collection(
          db,
          "ratings"
        ),
        {
          conversation_id:
            conversationId,

          transaction_id:
            conversationId,

          rater_id:
            String(
              user?.id
            ),

          rated_id:
            String(
              params.facility_id
            ),

          rated_type:
            "facility",

          rating:
            selectedRating,

          reason:
            ratingReason,

          created_at:
            serverTimestamp(),
        }
      );

      Alert.alert(
        "Thank You",
        "Your rating has been submitted."
      );

      setRatingVisible(
        false
      );

      router.back();

    } catch (
      error
    ) {
      console.log(
        "RATING ERROR:",
        error
      );
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    if (!user) return;

    const text = messageText.trim();

    setMessageText("");

    try {
      // CREATE OR UPDATE CONVERSATION
      // DO NOT RESET STATUS
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          user_id: String(user.id),

          facility_id: String(params.facility_id),

          facility_name: params.facility_name || "Facility",

          last_message: text,

          updated_at: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      // SEND MESSAGE
      await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          sender_id: String(user.id),

          sender_name: user.name || "User",

          sender_type: "user",

          type: "text",

          message: text,

          created_at: serverTimestamp(),
        },
      );
    } catch (error) {
      console.log("SEND MESSAGE ERROR:", error);
    }
  };

  const addSystemMessage = async (text: string) => {
    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      sender_id: "system",
      sender_name: "System",
      sender_type: "system",
      type: "system",
      message: text,
      created_at: serverTimestamp(),
    });

    await updateDoc(doc(db, "conversations", conversationId), {
      last_message: text,
      updated_at: serverTimestamp(),
    });
  };

  const acceptTransaction = async () => {
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        status: "accepted",
        updated_at: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    setAcceptedByUser(true);

    await addSystemMessage("Transaction Accepted");
  };

  const finishTransaction = async () => {
    try {
      // update conversation
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          status: "finished",

          updated_at: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      /*
      REMOVE FROM
      MY LISTINGS
      */

      await fetch(`${API_URL}/finish_listing.php`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          user_id: user?.id,

          conversation_id: conversationId,
        }),
      });

      /*
      SAVE TO
      RECYCLING HISTORY
      */

      await addDoc(collection(db, "recycling_history"), {
        user_id: String(user?.id),

        conversation_id: conversationId,

        facility_id: String(params.facility_id),

        facility_name: params.facility_name,

        transaction_status: "Finished",

        posted_date: conversation?.created_at || null,

        listed_date: conversation?.updated_at || null,

        finished_date: serverTimestamp(),
      });

      await addSystemMessage("Transaction Finished");

      Alert.alert("Success", "Transaction finished.");

      setRatingVisible(true);
    } catch (error) {
      console.log("FINISH ERROR:", error);
    }
  };

  const cancelTransaction = async () => {
    Alert.alert(
      "Cancel Transaction",
      "Are you sure you want to cancel this transaction?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            await updateDoc(doc(db, "conversations", conversationId), {
              status: "cancelled",
              updated_at: serverTimestamp(),
            });

            await addSystemMessage("Transaction Cancelled");
          },
        },
      ],
    );
  };

  const renderTransactionButtons = () => {
    const status = conversation?.status || "pending";

    // BEFORE ACCEPT
    if (status === "pending" && !acceptedByUser) {
      return (
        <View style={styles.transactionButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={acceptTransaction}
          >
            <Text style={styles.buttonText}>Accept Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelTransaction}
          >
            <Text style={styles.buttonText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // AFTER ACCEPT
    if (status === "accepted" || acceptedByUser) {
      return (
        <View style={styles.transactionButtons}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={finishTransaction}
          >
            <Text style={styles.buttonText}>Finish Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelTransaction}
          >
            <Text style={styles.buttonText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // FINISHED/CANCELLED
    return (
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          Transaction Status: {status.toUpperCase()}
        </Text>
      </View>
    );
  };
  const renderMessage = ({ item }: any) => {
    const isMine = String(item.sender_id) === String(user?.id);
    const isSystem = item.type === "system";

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.message}</Text>
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
        <Text style={styles.senderName}>
          {isMine ? "You" : item.sender_name || "Facility"}
        </Text>

        <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Image
          source={{
            uri: params.profile_image
              ? String(params.profile_image)
              : "http://192.168.129.144/Admin_Side/assets/icons/avatar.png",
          }}
          style={styles.avatar}
        />

        <View
          style={{
            marginLeft: 12,
          }}
        >
          <Text style={styles.title}>
            {params.facility_name || conversation?.facility_name || "Facility"}
          </Text>

          <Text style={styles.subtitle}>
            {conversation?.status === "accepted"
              ? "Transaction Active"
              : "Pending Transaction"}
          </Text>
        </View>
      </View>

      {renderTransactionButtons()}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            style={styles.input}
          />

          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1b5e20",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },

  back: {
    fontSize: 36,
    marginRight: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  subtitle: {
    color: "gray",
    marginTop: 2,
  },

  transactionButtons: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },

  acceptButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#1b5e20",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  finishButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#1976d2",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#ff3b30",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#222",
  },

  statusBox: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  statusText: {
    fontWeight: "bold",
    color: "#555",
  },

  messagesList: {
    padding: 15,
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

  myMessageText: {
    color: "#fff",
  },

  otherMessageText: {
    color: "#000",
  },

  systemMessage: {
    alignSelf: "center",
    backgroundColor: "#e8f5e9",
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },

  systemText: {
    color: "green",
    fontWeight: "bold",
    fontSize: 12,
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

  sendButton: {
    marginLeft: 10,
    backgroundColor: "#1b5e20",
    height: 50,
    minWidth: 90,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },

  sendText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
});
