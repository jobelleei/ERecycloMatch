import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { useRouter } from "expo-router";

import { YOLO_URL } from "../config";

export default function ScanScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    requestPermission();
    return <View />;
  }

  const takePicture = async () => {
    try {
      console.log("SCAN CLICKED");

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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      console.log("YOLO RESULT:", data);

      let detected = "Unknown";

      if (data.detections && data.detections.length > 0) {
        detected = data.detections[0].label;
      }

      // 🔥 NAVIGATE TO RESULT SCREEN
      router.push({
  pathname: "/scan_result" as any,
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
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan E-waste</Text>

        <Image
          source={require("../assets/icons/icon.png")}
          style={styles.logo}
        />
      </View>

      {/* CAMERA */}
      <View style={styles.scanBox}>
        <CameraView ref={cameraRef} style={styles.camera} />

        <View style={styles.center}>
          <Image
            source={require("../assets/icons/camera.png")}
            style={styles.cameraIcon}
          />
          <Text style={styles.scanText}>Point camera at e-waste</Text>
        </View>
      </View>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={takePicture}>
        <Image
          source={require("../assets/icons/camera.png")}
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>Capture</Text>
      </TouchableOpacity>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard")}
        >
          <Image
            source={require("../assets/icons/home.png")}
            style={styles.navIcon}
          />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../assets/icons/scan.png")}
            style={styles.navIcon}
          />
          <Text style={[styles.navLabel, styles.active]}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../assets/icons/upload_2.png")}
            style={styles.navIcon}
          />
          <Text style={styles.navLabel}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../assets/icons/map.png")}
            style={styles.navIcon}
          />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../assets/icons/chatting.png")}
            style={styles.navIcon}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require("../assets/icons/setting_1.png")}
            style={styles.navIcon}
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
    backgroundColor: "#f5f5f5",
    paddingTop: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
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
    elevation: 3,
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

  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  navItem: {
    alignItems: "center",
  },

  navIcon: {
    width: 22,
    height: 22,
  },

  navLabel: {
    fontSize: 11,
    color: "#777",
  },

  active: {
    color: "green",
    fontWeight: "600",
  },
});