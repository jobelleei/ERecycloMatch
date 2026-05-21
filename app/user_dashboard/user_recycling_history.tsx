import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { collection, query, where, onSnapshot } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { db } from "./firebaseConfig";

type HistoryItem = {
  id: string;
  facility_name: string;
  item_name?: string;
  transaction_status: string;
  posted_date?: any;
  listed_date?: any;
  finished_date?: any;
};

export default function RecyclingHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const parsed = JSON.parse(stored);

      const actualUser = parsed.user || parsed.data || parsed;

      const q = query(
        collection(db, "recycling_history"),

        where("user_id", "==", String(actualUser.id)),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoryItem[];

        setHistory(data);

        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.log("HISTORY ERROR:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recycling History</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.facility}>{item.facility_name}</Text>

            <Text style={styles.text}>Item: {item.item_name || "N/A"}</Text>

            <Text style={styles.text}>Status: {item.transaction_status}</Text>

            <Text style={styles.text}>
              Posted: {formatDate(item.posted_date)}
            </Text>

            <Text style={styles.text}>
              Listed: {formatDate(item.listed_date)}
            </Text>

            <Text style={styles.finished}>
              Finished: {formatDate(item.finished_date)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF6E3",
    padding: 20,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
  },

  facility: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 10,
  },

  text: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },

  finished: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },
});
