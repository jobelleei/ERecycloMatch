import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* ACCOUNT */}
      <Text style={styles.sectionTitle}>Account</Text>

      <TouchableOpacity style={styles.card}>
        <Image
          source={require("../../assets/icons/user_2.png")}
          style={styles.icon}
        />
        <Text style={styles.cardText}>Edit Profile</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* ABOUT */}
      <Text style={styles.sectionTitle}>About</Text>

      <View style={styles.card}>
        <Image
          source={require("../../assets/icons/smartphone.png")}
          style={styles.icon}
        />
        <Text style={styles.cardText}>App Version</Text>
        <Text style={styles.version}>1.0.0</Text>
      </View>

      {/* DELETE ACCOUNT */}
      <TouchableOpacity style={styles.deleteBox}>
        <Image
          source={require("../../assets/icons/bin.png")}
          style={styles.deleteIcon}
        />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2e7d32",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 20,
    color: "#fff",
    marginRight: 10,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  sectionTitle: {
    marginTop: 20,
    marginLeft: 20,
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 15,
  },

  cardText: {
    flex: 1,
    fontSize: 16,
  },

  arrow: {
    fontSize: 18,
    color: "#777",
  },

  version: {
    color: "#777",
  },

  deleteBox: {
    marginTop: 30,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "red",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "red",
  },

  deleteText: {
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
});
