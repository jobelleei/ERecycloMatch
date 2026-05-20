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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "./firebaseConfig";

export default function Chat() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const conversationId = String(params.conversationId || "");

  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");

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

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    if (!user) return;

    const text = messageText.trim();
    setMessageText("");

    await addDoc(collection(db, "conversations", conversationId, "messages"), {
      sender_id: String(user.id),
      sender_name: user.name || "User",
      sender_type: "user",
      type: "text",
      message: text,
      created_at: serverTimestamp(),
    });

    await updateDoc(doc(db, "conversations", conversationId), {
      last_message: text,
      updated_at: serverTimestamp(),
    });
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
    await updateDoc(doc(db, "conversations", conversationId), {
      status: "accepted",
      updated_at: serverTimestamp(),
    });

    await addSystemMessage("Transaction Accepted");
  };

  const finishTransaction = async () => {
    await updateDoc(doc(db, "conversations", conversationId), {
      status: "finished",
      updated_at: serverTimestamp(),
    });

    await addSystemMessage("Transaction Finished");
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

    if (status === "pending") {
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

    if (status === "accepted") {
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

        <View>
          <Text style={styles.title}>
            {params.facility_name || conversation?.facility_name || "Facility"}
          </Text>

          <Text style={styles.subtitle}>
            {conversation?.item_name || "Matched Item"}
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
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  finishButton: {
    flex: 1,
    backgroundColor: "#1976d2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: "#1b5e20",
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 20,
  },

  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
