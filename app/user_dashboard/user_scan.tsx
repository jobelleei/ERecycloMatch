import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { YOLO_URL } from "../../config";

export default function ScanScreen() {
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  const [flash, setFlash] = useState<"on" | "off">("off");
  const [facing, setFacing] = useState<CameraType>("back");

  const router = useRouter();
  const pathname = usePathname();

  if (!permission) return <View />;

  if (!permission.granted) {
    requestPermission();
    return <View />;
  }

  const takePicture = async () => {
  try {
    if (scanning) return;

    setScanning(true);

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
    });

    // TURN FLASH OFF AFTER CAPTURE
    setFlash("off");

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

    const rawText = await response.text();

    console.log("YOLO RAW RESPONSE:", rawText);

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.log("YOLO RESPONSE IS NOT JSON:", rawText);

      Alert.alert(
        "Scan Error",
        "YOLO backend did not return valid JSON."
      );

      return;
    }

    console.log("YOLO PARSED RESPONSE:", data);

    let detected = "Unknown";

    if (data.label) {
      detected = data.label;
    } else if (data.class_name) {
      detected = data.class_name;
    } else if (data.class) {
      detected = data.class;
    } else if (data.detected_item) {
      detected = data.detected_item;
    } else if (data.item_name) {
      detected = data.item_name;
    } else if (data.prediction) {
      detected = data.prediction;
    } else if (data.result) {
      detected = data.result;
    } else if (data.detections && data.detections.length > 0) {
      detected =
        data.detections[0].label ||
        data.detections[0].class ||
        data.detections[0].class_name ||
        data.detections[0].name ||
        data.detections[0].item_name ||
        "Unknown";
    }

    console.log("DETECTED ITEM:", detected);

    if (!detected || detected === "Unknown") {
      Alert.alert(
        "Item Not Detected",
        "The item was not recognized. Try scanning again with better lighting."
      );
    }

    router.push({
      pathname: "/user_dashboard/user_result" as any,
      params: {
        image: photo.uri,
        label: detected,
      },
    });
  } catch (error) {
    console.log("SCAN ERROR:", error);

    Alert.alert(
      "Scan Failed",
      "Please check your YOLO backend or API URL."
    );
  } finally {
    setScanning(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan E-Waste</Text>

        <Image
          source={require("../../assets/icons/icon.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.scanBox}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flash === "on"}
        />

        <TouchableOpacity
          style={styles.flashButton}
          onPress={() =>
            setFlash((prev) => (prev === "off" ? "on" : "off"))
          }
        >
          <Text style={styles.flashText}>
            {flash === "on" ? "Flash On" : "Flash Off"}
          </Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Image
            source={require("../../assets/icons/camera.png")}
            style={styles.cameraIcon}
          />

          <Text style={styles.scanText}>
            Point camera at e-waste
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, scanning && styles.disabledButton]}
        onPress={takePicture}
        disabled={scanning}
      >
        <Image
          source={require("../../assets/icons/camera.png")}
          style={styles.buttonIcon}
        />

        <Text style={styles.buttonText}>
          {scanning ? "Scanning..." : "Capture"}
        </Text>
      </TouchableOpacity>

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
              pathname === "/user_dashboard/user_scan" &&
                styles.navActive,
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
              pathname === "/user_dashboard/user_map" &&
                styles.navActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/messages")}>
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
              pathname === "/user_dashboard/profile" &&
                styles.navActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

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
              pathname === "/user_dashboard/settings" &&
                styles.navActive,
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

  flashButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  flashText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
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

  disabledButton: {
    backgroundColor: "#8aa887",
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