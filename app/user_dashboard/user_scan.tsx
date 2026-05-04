import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { YOLO_URL } from "../../config";

export default function ScanScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const pathname = usePathname();

  if (!permission) return <View />;
  if (!permission.granted) {
    requestPermission();
    return <View />;
  }

  const takePicture = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync();

      const formData = new FormData();

      formData.append("file", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${YOLO_URL}/detect`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      let detected = "Unknown";

      if (data.detections && data.detections.length > 0) {
        detected = data.detections[0].label;
      }

      // ✅ FIXED: USER FLOW
      router.push({
        pathname: "/user_dashboard/user_result" as any,
        params: {
          image: photo.uri,
          label: detected,
        },
      });

    } catch (error) {
      console.log("ERROR:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan E-waste</Text>

        {/* ✅ FIXED ICON */}
        <Image
          source={require("../../assets/icons/icon.png")}
          style={styles.logo}
        />
      </View>

      {/* CAMERA */}
      <View style={styles.scanBox}>
        <CameraView ref={cameraRef} style={styles.camera} />

        <View style={styles.center}>
          <Image
            source={require("../../assets/icons/camera.png")}
            style={styles.cameraIcon}
          />
          <Text style={styles.scanText}>Point camera at e-waste</Text>
        </View>
      </View>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={takePicture}>
        <Image
          source={require("../../assets/icons/camera.png")}
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Capture</Text>
      </TouchableOpacity>

      {/* NAVBAR */}
      <View style={styles.bottomNav}>

        {/* HOME */}
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

        {/* SCAN ✅ ACTIVE */}
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
          onPress={() => router.push("/user_dashboard/profile")}
        >
          <Image source={require("../../assets/icons/user.png")} style={styles.navImage} />
          <Text style={[
            styles.navLabel,
            pathname === "/user_dashboard/profile" && styles.navActive
          ]}>
            Profile
          </Text>
        </TouchableOpacity>

        {/* SETTINGS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings")}>
          <Image source={require("../../assets/icons/setting_1.png")} style={styles.navImage} />
            <Text style={[
              styles.navLabel,
              pathname === "/user_dashboard/settings" && styles.navActive]}>
              Settings
            </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },

  scanBox: {
    marginTop: 20,
    height: 400,
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  center: {
    alignItems: "center",
  },

  cameraIcon: {
    width: 45,
    height: 45,
    tintColor: "#fff",
    opacity: 0.8,
  },

  scanText: {
    marginTop: 10,
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },

  button: {
    marginTop: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b5e20",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
  },

  buttonIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
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