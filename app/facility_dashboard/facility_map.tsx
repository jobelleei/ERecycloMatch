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

type Coord = {
  latitude: number;
  longitude: number;
};

export default function FacilityMapScreen() {
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
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
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
    {
      id: "1",
      name: "Dyma Trading",
      latitude: 10.3009,
      longitude: 123.9072,
    },
    {
      id: "2",
      name: "Villa Fe Junk Shop",
      latitude: 10.3024,
      longitude: 123.9091,
    },
    {
      id: "3",
      name: "Jalandon Junk Shop",
      latitude: 10.679942,
      longitude: 122.9458734,
    },
    {
      id: "4",
      name: "RAMVIL JUNKSHOP",
      latitude: 10.6806711,
      longitude: 122.9493741,
    },
    {
      id: "5",
      name: "THERESE JUNK SHOP",
      latitude: 10.6639074,
      longitude: 122.9364048,
    },
    {
      id: "6",
      name: "Albao Junk Shop",
      latitude: 10.6668827,
      longitude: 122.9507507,
    },
  ];

  useEffect(() => {
    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

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
    };

    getCurrentLocation();
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
    if (!userLocation) {
      return;
    }

    const sorted = facilities
      .map((facility) => ({
        ...facility,
        distance: getDistanceKm(userLocation, facility),
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
    const found = facilities.find((facility) =>
      facility.name.toLowerCase().includes(search.toLowerCase())
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

  const goToFacility = (facility: any) => {
    mapRef.current?.animateToRegion({
      latitude: facility.latitude,
      longitude: facility.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
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

        <TouchableOpacity style={styles.button} onPress={handleShowNearest}>
          <Text style={styles.buttonText}>Show Nearest Facilities</Text>
        </TouchableOpacity>

        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          showsMyLocationButton={Platform.OS === "android"}
          initialRegion={{
            latitude: 10.3157,
            longitude: 123.8854,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {facilities.map((facility) => (
            <Marker
            key={facility.id}
            coordinate={{
              latitude: facility.latitude,
              longitude: facility.longitude,
            }}
            title={facility.name}
            pinColor="#008000"
            onPress={() => goToFacility(facility)}
          />
          ))}
        </MapView>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>

          <View style={styles.row}>
            <View style={styles.blueDot} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.greenDot} />
            <Text style={styles.legendText}>Recycling Facility</Text>
          </View>
        </View>

        {showList && (
          <Animated.View
            style={[
              styles.listContainer,
              {
                bottom: NAV_HEIGHT,
                transform: [{ translateY }],
              },
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
                  <Text style={styles.facilityName}>{item.name}</Text>
                  <Text style={styles.distanceText}>
                    {item.distance} km away
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/facility_dashboard" as any)}
          >
            <Image
              source={require("../../assets/icons/home.png")}
              style={styles.navImage}
            />
            <Text
              style={[
                styles.navLabel,
                pathname === "/facility_dashboard" && styles.navActive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.push("/facility_dashboard/facility_map" as any)
            }
          >
            <Image
              source={require("../../assets/icons/map.png")}
              style={styles.navImage}
            />
            <Text
              style={[
                styles.navLabel,
                pathname === "/facility_dashboard/facility_map" &&
                  styles.navActive,
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/messages" as any)}
          >
            <Image
              source={require("../../assets/icons/chatting.png")}
              style={styles.navImage}
            />
            <Text style={styles.navLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/profile" as any)}
          >
            <Image
              source={require("../../assets/icons/user.png")}
              style={styles.navImage}
            />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.push("/facility_dashboard/settings" as any)
            }
          >
            <Image
              source={require("../../assets/icons/setting_1.png")}
              style={styles.navImage}
            />
            <Text
              style={[
                styles.navLabel,
                pathname === "/facility_dashboard/settings" &&
                  styles.navActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  map: {
    flex: 1,
    paddingBottom: NAV_HEIGHT,
  },

  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 20,
    elevation: 20,
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
    zIndex: 20,
    elevation: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  legend: {
    position: "absolute",
    bottom: NAV_HEIGHT + 90,
    left: 20,
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    zIndex: 5,
    elevation: 5,
  },

  legendTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  legendText: {
    fontSize: 14,
    color: "#000",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

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
    zIndex: 30,
    elevation: 30,
  },

  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: "#aaa",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },

  listTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  facilityName: {
    fontWeight: "600",
  },

  distanceText: {
    color: "#555",
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
    zIndex: 40,
    elevation: 40,
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