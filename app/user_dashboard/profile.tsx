import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState({
    name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const parsed = JSON.parse(stored);

        setUser({
          name: parsed.name || "",
          email: parsed.email || "",
          address: parsed.address || "",
        });
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/signin");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/icons/avatar.png")}
          style={styles.avatar}
        />

        <View>
          <Text style={styles.name}>{user.name || "User"}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.locationRow}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.iconSmall}
            />
            <Text style={styles.address}>
              {user.address
                ? user.address.split(",").slice(1, 3).join(", ").trim()
                : "No location"}
            </Text>{" "}
          </View>
        </View>
      </View>

      {/* MENU */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/user_dashboard/user_myItems")}
        >
          <Image
            source={require("../../assets/icons/box.png")}
            style={styles.icon}
          />

          <Text style={styles.text}>My Items</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Image
            source={require("../../assets/icons/price-tag.png")}
            style={styles.icon}
          />
          <Text style={styles.text}>My Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Image
            source={require("../../assets/icons/recycle.png")}
            style={styles.icon}
          />
          <Text style={styles.text}>Recycling History</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Image
          source={require("../../assets/icons/logout_copy.png")}
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>
        {/* HOME */}
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

        {/* SCAN */}
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

        {/* MAP */}
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

        {/* MESSAGES */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        {/* PROFILE */}
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
  header: {
    backgroundColor: "#1b5e20",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },

  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  email: {
    color: "#fff",
    marginTop: 4,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  address: {
    color: "#fff",
    marginLeft: 5,
  },

  iconSmall: {
    width: 14,
    height: 14,
  },

  menu: {
    marginTop: 20,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  text: {
    fontSize: 16,
  },

  logout: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: "#1b5e20",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#fff",
  },

  logoutText: {
    color: "#fff",
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
