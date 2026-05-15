import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyItems() {
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [submitterName, setSubmitterName] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!submitterName) return;

    fetchItems();

    const interval = setInterval(() => {
      fetchItems();
    }, 5000);

    return () => clearInterval(interval);
  }, [submitterName]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      console.log("STORED USER:", stored);

      if (stored) {
        const parsed = JSON.parse(stored);

        console.log("PARSED USER:", parsed);

        const userName = parsed.name?.trim();

        console.log("USERNAME:", userName);

        setSubmitterName(userName || "");
      }
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  };

  const fetchItems = async () => {
    try {
      console.log("FETCHING FOR:", submitterName);
      const response = await fetch(
        `http://192.168.1.10:8000/pending-items/${submitterName}`,
      );

      const text = await response.text();

      console.log("RAW RESPONSE:", text);

      const data = text ? JSON.parse(text) : [];
      const pendingItems = data.map((item: any) => ({
        ...item,
        status: "Pending",
      }));

      const approvedResponse = await fetch(
        `http://192.168.1.10:8000/approved-items/${submitterName}`,
      );

      const approvedText = await approvedResponse.text();

      console.log("APPROVED:", approvedText);

      const approvedData = approvedText ? JSON.parse(approvedText) : [];
      const approvedItems = approvedData.map((item: any) => ({
        ...item,
        status: "Listed",
      }));

      const rejectedResponse = await fetch(
        `http://192.168.1.10:8000/rejected-items/${submitterName}`,
      );

      const rejectedData = await rejectedResponse.json();

      const rejectedItems = rejectedData.map((item: any) => ({
        ...item,
        status: "Rejected",
      }));

      const combined = [...pendingItems, ...approvedItems, ...rejectedItems];

      setItems(combined);
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }: any) => {
    return (
      <View>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            setSelectedItem(selectedItem === item.id ? null : item.id)
          }
        >
          <Image
            source={{
              uri: item.item_image
                ? `http://192.168.1.10:8000/uploads/${item.item_image}`
                : "https://via.placeholder.com/100",
            }}
            style={styles.itemImage}
          />

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.item_name}</Text>

            <Text style={styles.itemCategory}>{item.description}</Text>

            <Text
              style={[
                styles.itemStatus,
                item.status === "Pending" ? styles.pending : styles.listed,
              ]}
            >
              {item.status}
            </Text>
          </View>

          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>

        {selectedItem === item.id && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
  style={styles.deleteButton}
  onPress={() => {

    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {

            try {

              await fetch(
                `http://192.168.1.10:8000/delete-item/${item.id}`,
                {
                  method: "DELETE",
                }
              );

              setItems(items.filter((i) => i.id !== item.id));

            } catch (error) {
              console.log(error);
            }

          },
        },
      ]
    );

  }}
>
  <Text style={styles.deleteText}>Delete</Text>
</TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Items</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{items.length}</Text>
          <Text style={styles.statsLabel}>Total Items</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => item.status === "Listed").length}
          </Text>
          <Text style={styles.statsLabel}>Listed</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>0</Text>
          <Text style={styles.statsLabel}>Matched</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      {/* NAVBAR */}
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
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_scan" && styles.navActive,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map")}
        >
          <Image
            source={require("../../assets/icons/map.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/user_map" && styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/profile")}
        >
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/profile" && styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        {/* SETTINGS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings")}
        >
          <Image
            source={require("../../assets/icons/setting_1.png")}
            style={styles.navImage}
          />
          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/settings" && styles.navActive,
            ]}
          >
            Settings
          </Text>
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
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statsCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    elevation: 3,
  },

  statsNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },

  statsLabel: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  itemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  itemCategory: {
    color: "gray",
    marginTop: 2,
  },

  itemStatus: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 12,
  },

  pending: {
    color: "orange",
  },

  listed: {
    color: "green",
  },

  dots: {
    fontSize: 20,
    color: "gray",
  },

  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    marginTop: -5,
  },

  actionButton: {
    borderWidth: 1,
    borderColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  actionText: {
    color: "green",
    fontWeight: "bold",
  },

  deleteText: {
    color: "red",
    fontWeight: "bold",
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
