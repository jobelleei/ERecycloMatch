import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  usePathname,
  useRouter,
  useLocalSearchParams,
} from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../user_dashboard/firebaseConfig";

export default function Messages() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const { facility_id, facility_name, autoOpen } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("user");

    if (!stored) return;

    const parsed = JSON.parse(stored);

    const actualUser = parsed.user || parsed.data || parsed;

    setUser(actualUser);

    fetchConversations(actualUser.id);
  };

const fetchConversations = (
  facilityId: string
) => {
  const conversationQuery =
    query(
      collection(
        db,
        "conversations"
      ),

      where(
        "facility_id",
        "==",
        String(
          facilityId
        )
      )
    );

  const unsubscribe =
    onSnapshot(
      conversationQuery,
      (
        snapshot: any
      ) => {
        const data =
          snapshot.docs.map(
            (
              doc: any
            ) => ({
              id:
                doc.id,
              ...doc.data(),
            })
          );

        setConversations(
          data
        );
      }
    );

  return unsubscribe;
};

  const openChat = (conversation: any) => {
    router.push({
      pathname: "/user_dashboard/chat" as any,
      params: {
        conversationId: conversation.id,
        facility_name: conversation.facility_name || "Facility",
        facility_id: conversation.facility_id || "",
      },
    });
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.facility_name
            ? item.facility_name.charAt(0).toUpperCase()
            : "F"}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.facility_name || "Facility"}</Text>

        <Text style={styles.message} numberOfLines={1}>
          {item.last_message || "No messages yet"}
        </Text>
      </View>

      <Text style={styles.status}>{item.status || "pending"}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Messages</Text>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet.</Text>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard")}
        >
          <Image
            source={require("../../assets/icons/home.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard" && styles.navActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_scan")}
        >
          <Image
            source={require("../../assets/icons/scan.png")}
            style={styles.navImage}
          />

          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />

          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/messages" as any)}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />

          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />

          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 90,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1b5e20",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  message: {
    color: "gray",
    marginTop: 3,
  },

  status: {
    fontSize: 12,
    color: "green",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 50,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 10,
  },

  navItem: {
    alignItems: "center",
  },

  navImage: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },

  navLabel: {
    fontSize: 12,
    color: "#777",
  },

  navActive: {
    color: "green",
    fontWeight: "bold",
  },
});
