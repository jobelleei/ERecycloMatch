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
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserDashboard() {
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname(); // ✅ NEW

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem("user");

      if (user) {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || parsed.email || "User");
      }
    };

    loadUser();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.welcome}>
            Welcome Back{userName ? `, ${userName}` : ""}!
          </Text>
          <Image
            source={require("../../assets/icons/icon.png")} // ✅ FIXED
            style={styles.avatar}
          />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search Items, Facilities"
            placeholderTextColor="#777"
          />
        </View>

        {/* BANNER */}
        <ImageBackground
          source={require("../../assets/images/banner.jpg")}
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

        {/* RECENT ITEMS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {/* ITEMS */}
        <View style={styles.itemCard}>
          <Image
            source={require("../../assets/images/ip6s.jpg")}
            style={styles.itemImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.itemTitle}>Iphone 6s</Text>
            <Text style={styles.itemSub}>Smartphone</Text>
          </View>
          <Text style={styles.statusGreen}>Listed</Text>
        </View>

        <View style={styles.itemCard}>
          <Image
            source={require("../../assets/images/samsung.jpg")}
            style={styles.itemImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.itemTitle}>Samsung Digi Cam</Text>
            <Text style={styles.itemSub}>Camera</Text>
          </View>
          <Text style={styles.statusGray}>Pending</Text>
        </View>

        {/* FACILITIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Partnered Recycling Facilities
          </Text>
          <Text style={styles.viewAll}>View More</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.facilityCard}>
            <Image
              source={require("../../assets/images/dyma.webp")}
              style={styles.facilityImage}
            />
            <Text style={styles.facilityName}>
              Dyma Trading & Junk Shop
            </Text>
          </View>

          <View style={styles.facilityCard}>
            <Image
              source={require("../../assets/images/villa.webp")}
              style={styles.facilityImage}
            />
            <Text style={styles.facilityName}>
              Villa Fe Junk Shop
            </Text>
          </View>
        </ScrollView>

      </ScrollView>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>

        {/* HOME ✅ ACTIVE */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard")}
        >
          <Image source={require("../../assets/icons/home.png")} style={styles.navImage} />
          <Text style={[
            styles.navLabel,
            pathname === "/user_dashboard" && styles.navActive
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* SCAN */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_scan")}
        >
          <Image source={require("../../assets/icons/scan.png")} style={styles.navImage} />
          <Text style={[
            styles.navLabel,
            pathname === "/user_dashboard/user_scan" && styles.navActive
          ]}>
            Scan
          </Text>
        </TouchableOpacity>

        {/* MAP */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map")}
        >
          <Image source={require("../../assets/icons/map.png")} style={styles.navImage} />
          <Text style={[
            styles.navLabel,
            pathname === "/user_dashboard/user_map" && styles.navActive
          ]}>
            Map
          </Text>
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
          <Text style={[
            styles.navLabel,
            pathname === "/profile" && styles.navActive
          ]}>
            Profile
          </Text>
        </TouchableOpacity>

        {/* SETTINGS */}
        <TouchableOpacity style={styles.navItem}>
          <Image source={require("../../assets/icons/setting_1.png")} style={styles.navImage} />
          <Text style={styles.navLabel}>Settings</Text>
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
    width: 160,
    height: 140,
    borderRadius: 15,
  },

  facilityName: {
    marginTop: 5,
    fontWeight: "600",
    width: 160,
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