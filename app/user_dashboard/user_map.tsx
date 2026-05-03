import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Platform,
  Animated,
  PanResponder,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { useRouter, usePathname } from "expo-router";

const NAV_HEIGHT = 70;

type Coord = { latitude: number; longitude: number };

export default function MapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const mapRef = useRef<MapView | null>(null);

  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [showList, setShowList] = useState(false);
  const [sortedFacilities, setSortedFacilities] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const translateY = useRef(new Animated.Value(300)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowList(false));
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const facilities = [
    { id: "1", name: "Dyma Trading", latitude: 10.317, longitude: 123.884 },
    { id: "2", name: "Villa Fe Junk Shop", latitude: 10.318, longitude: 123.886 },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(coords);

      setTimeout(() => {
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }, 500);
    })();
  }, []);

  const getDistanceKm = (a: Coord, b: any) => {
    const R = 6371;
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLon = (b.longitude - a.longitude) * (Math.PI / 180);

    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return (R * c).toFixed(2);
  };

  const handleShowNearest = () => {
    if (!userLocation) return;

    const sorted = facilities
      .map((f) => ({
        ...f,
        distance: getDistanceKm(userLocation, f),
      }))
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    setSortedFacilities(sorted);
    setShowList(true);

    translateY.setValue(300);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = () => {
    const found = facilities.find((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );

    if (found) {
      mapRef.current?.animateToRegion({
        latitude: found.latitude,
        longitude: found.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const goToFacility = (f: any) => {
    mapRef.current?.animateToRegion({
      latitude: f.latitude,
      longitude: f.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search facilities..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <Image
            source={require("../../assets/icons/icon.png")}
            style={styles.avatar}
          />
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleShowNearest}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Show Nearest Facilities
          </Text>
        </TouchableOpacity>

        {/* MAP */}
        <MapView
          ref={mapRef}
          style={{ flex: 1, paddingBottom: NAV_HEIGHT }}
          showsUserLocation
          showsMyLocationButton={Platform.OS === "android"}
          initialRegion={{
            latitude: 10.3157,
            longitude: 123.8854,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {facilities.map((f) => (
            <Marker
              key={f.id}
              coordinate={{ latitude: f.latitude, longitude: f.longitude }}
              title={f.name}
              onPress={() => goToFacility(f)}
            />
          ))}
        </MapView>

        {/* LEGEND */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.row}>
            <View style={styles.blueDot} />
            <Text>Your Location</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.greenDot} />
            <Text>Recycling Facility</Text>
          </View>
        </View>

        {/* LIST */}
        {showList && (
          <Animated.View
            style={[
              styles.listContainer,
              { bottom: NAV_HEIGHT, transform: [{ translateY }] },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragBar} />
            <Text style={styles.listTitle}>Nearest Facilities</Text>

            <FlatList
              data={sortedFacilities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => goToFacility(item)}
                >
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  <Text style={{ color: "#555" }}>
                    {item.distance} km away
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        {/* NAVBAR */}
        <View style={styles.bottomNav}>

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

          <TouchableOpacity style={styles.navItem}>
            <Image source={require("../../assets/icons/chatting.png")} style={styles.navImage} />
            <Text style={styles.navLabel}>Messages</Text>
          </TouchableOpacity>

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

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 3,
    flexDirection: "row",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#dff0d8",
    padding: 12,
    borderRadius: 25,
  },
  avatar: {
    width: 40,
    height: 40,
    marginLeft: 10,
    borderRadius: 20,
  },
  button: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    backgroundColor: "#1b5e20",
    padding: 12,
    borderRadius: 25,
    zIndex: 3,
  },
  legend: {
    position: "absolute",
    bottom: NAV_HEIGHT + 200,
    left: 30,
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    zIndex: 5,
  },
  legendTitle: { fontWeight: "bold", marginBottom: 5 },
  row: { flexDirection: "row", alignItems: "center" },
  blueDot: {
    width: 10,
    height: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    marginRight: 5,
  },
  greenDot: {
    width: 10,
    height: 10,
    backgroundColor: "green",
    borderRadius: 5,
    marginRight: 5,
  },
  listContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    maxHeight: 250,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  listTitle: { fontWeight: "bold", marginBottom: 10 },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: "#aaa",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
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
    justifyContent: "center",
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