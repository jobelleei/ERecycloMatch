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
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const pingBackend = async () => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      console.log("PING YOLO BACKEND:", YOLO_URL);

      const response = await fetch(YOLO_URL, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log("PING STATUS:", response.status);

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      return true;
    } catch (error: any) {
      clearTimeout(timeout);

      console.log("PING BACKEND ERROR:", error);

      throw new Error(
        "Cannot reach YOLO backend from your phone. Open this on your phone browser first: " +
          YOLO_URL
      );
    }
  };

  const getDetectedLabel = (data: any) => {
    if (data?.label) return data.label;
    if (data?.class_name) return data.class_name;
    if (data?.class) return data.class;
    if (data?.detected_item) return data.detected_item;
    if (data?.item_name) return data.item_name;
    if (data?.prediction) return data.prediction;
    if (data?.result) return data.result;

    if (Array.isArray(data?.detections) && data.detections.length > 0) {
      const firstDetection = data.detections[0];

      return (
        firstDetection?.label ||
        firstDetection?.class ||
        firstDetection?.class_name ||
        firstDetection?.name ||
        firstDetection?.item_name ||
        "Unknown"
      );
    }

    return "Unknown";
  };

  const uploadToYolo = (photoUri: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const detectUrl = `${YOLO_URL}/detect`;

      console.log("YOLO DETECT URL:", detectUrl);

      const formData = new FormData();

      formData.append("file", {
        uri: photoUri,
        name: "scan.jpg",
        type: "image/jpeg",
      } as any);

      const xhr = new XMLHttpRequest();

      xhr.open("POST", detectUrl);
      xhr.timeout = 30000;

      xhr.onload = () => {
        console.log("YOLO STATUS:", xhr.status);
        console.log("YOLO RAW RESPONSE:", xhr.responseText);

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(
              `YOLO backend returned status ${xhr.status}. Check your backend terminal.`
            )
          );
          return;
        }

        try {
          const parsed = JSON.parse(xhr.responseText);
          resolve(parsed);
        } catch (error) {
          reject(new Error("YOLO backend responded but did not return valid JSON."));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            "Network error. Your phone cannot reach the YOLO backend. Check Wi-Fi, Mac firewall, and Local Network permission."
          )
        );
      };

      xhr.ontimeout = () => {
        reject(
          new Error(
            "Scan timeout. The YOLO backend did not respond within 30 seconds."
          )
        );
      };

      xhr.send(formData);
    });
  };

  const takePicture = async () => {
    if (scanning) return;

    try {
      if (!cameraRef.current) {
        Alert.alert("Camera Error", "Camera is not ready yet.");
        return;
      }

      setScanning(true);

      console.log("START SCANNING...");
      console.log("YOLO URL:", YOLO_URL);

      await pingBackend();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      setFlash("off");

      if (!photo?.uri) {
        Alert.alert("Scan Error", "Failed to capture image.");
        return;
      }

      console.log("PHOTO URI:", photo.uri);

      const data = await uploadToYolo(photo.uri);

      console.log("YOLO PARSED RESPONSE:", data);

      if (data?.success === false) {
        Alert.alert(
          "Scan Failed",
          data?.message || "YOLO backend could not detect the item."
        );
        return;
      }

      let detected = getDetectedLabel(data);

      if (!detected || String(detected).trim() === "") {
        detected = "Unknown";
      }

      const confidence =
        data?.confidence !== undefined && data?.confidence !== null
          ? String(data.confidence)
          : "0";

      const processingTime =
        data?.processing_time !== undefined && data?.processing_time !== null
          ? String(data.processing_time)
          : "0";

      const totalTime =
        data?.total_time !== undefined && data?.total_time !== null
          ? String(data.total_time)
          : "0";

      console.log("DETECTED ITEM:", detected);
      console.log("CONFIDENCE:", confidence);
      console.log("PROCESSING TIME:", processingTime);
      console.log("TOTAL TIME:", totalTime);

      router.push({
        pathname: "/user_dashboard/user_result" as any,
        params: {
          image: photo.uri,
          label: detected,
          confidence: confidence,
          processing_time: processingTime,
          total_time: totalTime,
        },
      });
    } catch (error: any) {
      console.log("SCAN ERROR:", error);

      Alert.alert(
        "Scan Failed",
        error?.message ||
          "The YOLO backend could not be reached. Please check if backend is running and YOLO_URL is correct."
      );
    } finally {
      console.log("STOP SCANNING...");
      setScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan e-waste.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          onPress={() => setFlash((prev) => (prev === "off" ? "on" : "off"))}
          disabled={scanning}
        >
          <Text style={styles.flashText}>
            {flash === "on" ? "Flash On" : "Flash Off"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.flipButton}
          onPress={() =>
            setFacing((prev) => (prev === "back" ? "front" : "back"))
          }
          disabled={scanning}
        >
          <Text style={styles.flipText}>Flip</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Image
            source={require("../../assets/icons/camera.png")}
            style={styles.cameraIcon}
          />

          <Text style={styles.scanText}>
            {scanning ? "Scanning item..." : "Point camera at e-waste"}
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
          disabled={scanning}
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
          disabled={scanning}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/user_map")}
          disabled={scanning}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/messages")}
          disabled={scanning}
        >
          <Image
            source={require("../../assets/icons/chatting.png")}
            style={styles.navImage}
          />

          <Text
            style={[
              styles.navLabel,
              pathname === "/user_dashboard/messages" && styles.navActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/profile")}
          disabled={scanning}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/user_dashboard/settings")}
          disabled={scanning}
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
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },

  permissionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },

  permissionButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },

  permissionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

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

  flipButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  flipText: {
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
    tintColor: "#fff",
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