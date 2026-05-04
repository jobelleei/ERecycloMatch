import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";

export default function FacilityDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome Back!</Text>
          <Image
            source={require("../../assets/icons/icon.png")} // ✅ FIXED
            style={styles.avatar}
          />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search Items, Users"
            placeholderTextColor="#777"
          />
        </View>

        {/* BANNER */}
        <ImageBackground
          source={require("../../assets/images/ewaste-banner.jpg")}
          style={styles.banner}
          imageStyle={{ borderRadius: 15 }}
        >
          <View style={styles.overlay} />
          <Text style={styles.bannerTitle}>
            RECYCLE SMARTER{"\n"}MATCH FASTER
          </Text>
          <Text style={styles.bannerSub}>
            Find the right place for your e-waste with just a few clicks.
          </Text>
        </ImageBackground>

        {/* RECENT VIEWED ITEMS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Viewed Items</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        <View style={styles.itemCard}>
          <Image
            source={require("../../assets/images/ip6s.jpg")}
            style={styles.itemImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.itemTitle}>iPhone 6s</Text>
            <Text style={styles.itemSub}>Smartphone</Text>
          </View>
          <Text style={styles.statusGreen}>Viewed</Text>
        </View>

      </ScrollView>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>

        {/* HOME */}
        <TouchableOpacity style={styles.navItem}>
          <Image source={require("../../assets/icons/home.png")} style={styles.navImage} />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>

        {/* MAP */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/facility_dashboard/facility_map")}
        >
          <Image source={require("../../assets/icons/map.png")} style={styles.navImage} />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        {/* MESSAGES */}
        <TouchableOpacity style={styles.navItem}>
          <Image source={require("../../assets/icons/chatting.png")} style={styles.navImage} />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        {/* PROFILE */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/profile")}
        >
          <Image source={require("../../assets/icons/user.png")} style={styles.navImage} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>

        {/* SETTINGS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/facility_dashboard/settings")}>
          <Image source={require("../../assets/icons/setting_1.png")} style={styles.navImage} />
          <Text style={[
            styles.navLabel,
            pathname === "/facility_dashboard/settings" && styles.navActive]}>
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
    padding: 20,
    paddingBottom: 100,
    backgroundColor: "#f5f5f5",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    fontSize: 18,
    fontWeight: "600",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  searchBox: {
    marginTop: 15,
    backgroundColor: "#dff0d8",
    borderRadius: 25,
    padding: 12,
  },

  banner: {
    marginTop: 20,
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  bannerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  bannerSub: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  viewAll: {
    color: "#777",
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },

  itemTitle: {
    fontWeight: "bold",
  },

  itemSub: {
    color: "#777",
  },

  statusGreen: {
    color: "green",
    fontWeight: "600",
  },

  statusGray: {
    color: "gray",
  },

  facilityCard: {
    marginRight: 15,
    marginTop: 10,
  },

  facilityImage: {
    width: 150,
    height: 120,
    borderRadius: 15,
  },

  facilityName: {
    marginTop: 5,
    fontWeight: "600",
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