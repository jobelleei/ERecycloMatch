import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserBottomNav from "../../components/UserBottomNav";
import {
  SCAN_CONFIRM_MIN_CONFIDENCE,
  SCAN_MIN_CONFIDENCE,
  YOLO_URL,
} from "../../config";
import DetectionOverlay, { Detection } from "../../components/DetectionOverlay";
import { setScanPhoto } from "../../utils/scanPhoto";

//Set the maximum width of the image uploaded for scanning.
const SCAN_UPLOAD_WIDTH = 1280;

//Set how long detection boxes remain visible before navigation.
const SHOW_BOX_MS = 1200;

//Define the AsyncStorage key for saving the user's scanning guide preference.
const SCAN_GUIDE_HIDDEN_KEY = "scanGuideHidden";

//Define the scanning tips displayed in the guide modal.
const SCAN_TIPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}[] = [
  {
    icon: "sunny-outline",
    title: "Use good lighting",
    text: "Scan in a bright place. Avoid dark rooms, shadows and glare. Turn on Flash if it's dim.",
  },
  {
    icon: "scan-outline",
    title: "Fit the whole item",
    text: "Keep the entire item inside the frame and let it fill most of the screen.",
  },
  {
    icon: "cube-outline",
    title: "One item at a time",
    text: "Scan a single item and remove other objects from the background.",
  },
  {
    icon: "hand-left-outline",
    title: "Hold steady",
    text: "Keep your phone still when you tap Capture so the photo isn't blurry.",
  },
];

//Main component responsible for capturing and identifying e-waste.
export default function ScanScreen() {
  //Create a reference to access the camera methods.
  const cameraRef = useRef<any>(null);

  //Get camera permission status and the function for requesting permission.
  const [permission, requestPermission] = useCameraPermissions();

  //Track whether an item is currently being scanned.
  const [scanning, setScanning] = useState(false);

  //Store the logged-in user's ID.
  const [userId, setUserId] = useState("");

  //Store the current flash setting.
  const [flash, setFlash] = useState<"on" | "off">("off");

  //Track whether the front or back camera is being used.
  const [facing, setFacing] = useState<CameraType>("back");

  //Control the visibility of the unknown item modal.
  const [showUnknownModal, setShowUnknownModal] = useState(false);

  //Store the captured image displayed during the scanning process.
  const [capturedPreview, setCapturedPreview] = useState("");

  //Store the detection results returned by the YOLO backend.
  const [detections, setDetections] = useState<Detection[]>([]);

  //Store the label displayed when the scanner asks the user to confirm an item.
  const [confirmLabel, setConfirmLabel] = useState("");

  //Store the function that receives the user's confirmation answer.
  const confirmAnswerRef = useRef<((yes: boolean) => void) | null>(null);

  //Display a confirmation prompt and wait for the user's answer.
  const askToConfirm = (label: string) =>
    new Promise<boolean>((resolve) => {
      confirmAnswerRef.current = resolve;
      setConfirmLabel(label);
    });

  //Process the user's answer and resolve the pending confirmation.
  const answerConfirm = (yes: boolean) => {
    setConfirmLabel("");
    confirmAnswerRef.current?.(yes);
    confirmAnswerRef.current = null;
  };

  //Store the dimensions of the captured image for displaying detection boxes.
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  //Control the visibility of the scanning guide modal.
  const [showGuide, setShowGuide] = useState(false);

  //Track whether the user wants to hide the guide in future sessions.
  const [dontShowGuideAgain, setDontShowGuideAgain] = useState(false);

  //Initialize the router for navigating to the scan result screen.
  const router = useRouter();

  //Request camera permission when permission has not yet been granted.
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  //Load the logged-in user's ID from local storage when the screen opens.
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      //Convert the stored user information into an object.
      const parsed = JSON.parse(stored);

      //Retrieve the user ID from the available storage structures.
      const id = parsed?.id || parsed?.user?.id || parsed?.data?.id || "";

      setUserId(String(id));
    };

    loadUser();
  }, []);

  //Load the user's saved preference for displaying scanning instructions.
  useEffect(() => {
    const loadGuidePreference = async () => {
      try {
        const hidden = await AsyncStorage.getItem(SCAN_GUIDE_HIDDEN_KEY);
        setDontShowGuideAgain(hidden === "true");

        //Display the guide if the user has not chosen to hide it.
        if (hidden !== "true") setShowGuide(true);
      } catch {
        //Display the guide if retrieving the saved preference fails.
        setShowGuide(true);
      }
    };

    loadGuidePreference();
  }, []);

  //Close the scanning guide and save the user's display preference.
  const closeGuide = async () => {
    setShowGuide(false);

    try {
      //Save the preference if the user selected Don't show this again.
      if (dontShowGuideAgain) {
        await AsyncStorage.setItem(SCAN_GUIDE_HIDDEN_KEY, "true");
      } else {
        //Remove the saved preference to show the guide again next time.
        await AsyncStorage.removeItem(SCAN_GUIDE_HIDDEN_KEY);
      }
    } catch (error) {
      console.log("SAVE SCAN GUIDE PREFERENCE ERROR:", error);
    }
  };

  //Extract the detected item label from different possible backend response fields.
  const getDetectedLabel = (data: any) => {
    if (data?.label) return data.label;
    if (data?.class_name) return data.class_name;
    if (data?.class) return data.class;
    if (data?.detected_item) return data.detected_item;
    if (data?.item_name) return data.item_name;
    if (data?.prediction) return data.prediction;
    if (data?.result) return data.result;

    //Check the detections array if no direct label is available.
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

    //Return Unknown when no valid detection label is found.
    return "Unknown";
  };

  //Upload the captured image to the YOLO backend for object detection.
  const uploadToYolo = (photoUri: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      //Build the detection endpoint URL.
      const detectUrl = `${YOLO_URL}/detect`;

      //Create FormData to send the image as a file.
      const formData = new FormData();

      formData.append("file", {
        uri: photoUri,
        name: "scan.jpg",
        type: "image/jpeg",
      } as any);

      //Create an XMLHttpRequest for sending the image to the backend.
      const xhr = new XMLHttpRequest();

      //Configure the request method and endpoint.
      xhr.open("POST", detectUrl);

      //Set the maximum waiting time to 30 seconds.
      xhr.timeout = 30000;

      //Handle the backend response after the request completes.
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(
              `YOLO backend returned status ${xhr.status}. Check your backend terminal.`,
            ),
          );
          return;
        }

        try {
          //Convert the backend's JSON response into an object.
          const parsed = JSON.parse(xhr.responseText);
          resolve(parsed);
        } catch (error) {
          //Reject the request if the response is not valid JSON.
          reject(
            new Error("YOLO backend responded but did not return valid JSON."),
          );
        }
      };

      //Handle connection errors when the backend cannot be reached.
      xhr.onerror = () => {
        reject(
          new Error(
            "Cannot reach YOLO backend from your phone. Check Wi-Fi, or open this on your phone browser first: " +
              YOLO_URL,
          ),
        );
      };

      //Handle requests that exceed the allowed waiting time.
      xhr.ontimeout = () => {
        reject(
          new Error(
            "Scan timeout. The YOLO backend did not respond within 30 seconds.",
          ),
        );
      };

      //Send the image to the YOLO detection endpoint.
      xhr.send(formData);
    });
  };

  //Resize and compress the captured photo before uploading it.
  const resizeForScan = async (
    photoUri: string,
  ): Promise<{ uri: string; base64?: string; width?: number; height?: number }> => {
    //Create an image manipulation context using the captured photo.
    const context = ImageManipulator.manipulate(photoUri);

    try {
      //Resize the image to the configured upload width.
      context.resize({ width: SCAN_UPLOAD_WIDTH });

      //Apply the image modifications.
      const rendered = await context.renderAsync();

      try {
        //Save the resized image as a compressed JPEG with Base64 data.
        const saved = await rendered.saveAsync({
          compress: 0.7,
          format: SaveFormat.JPEG,
          base64: true,
        });

        //Return the image URI, Base64 data, and image dimensions.
        return {
          uri: saved.uri,
          base64: saved.base64,
          width: saved.width,
          height: saved.height,
        };
      } finally {
        //Release the rendered image resources.
        rendered.release();
      }
    } catch (error) {
      //Use the original photo if resizing fails.
      console.warn("[scan] resize failed, using original photo:", error);
      return { uri: photoUri };
    } finally {
      //Release the image manipulation context.
      context.release();
    }
  };

  //Capture a photo, send it to YOLO, and process the detection result.
  const takePicture = async () => {
    //Prevent capturing while scanning or while the guide is displayed.
    if (scanning || showGuide) return;

    try {
      //Check whether the camera reference is available.
      if (!cameraRef.current) {
        Alert.alert("Camera Error", "Camera is not ready yet.");
        return;
      }

      //Set the scanning state and record the start time.
      setScanning(true);
      const scanStart = Date.now();

      //Capture an image using the camera.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      //Turn off the flash after capturing the photo.
      setFlash("off");

      //Stop if the camera did not return a valid image URI.
      if (!photo?.uri) {
        Alert.alert("Scan Error", "Failed to capture image.");
        return;
      }

      //Resize the captured photo before sending it to the backend.
      const scanImage = await resizeForScan(photo.uri);
      const resizeDone = Date.now();

      //Save the image dimensions for positioning detection boxes.
      setPreviewSize({
        width: scanImage.width || 0,
        height: scanImage.height || 0,
      });

      //Display the captured image using Base64 data when available.
      setCapturedPreview(
        scanImage.base64
          ? `data:image/jpeg;base64,${scanImage.base64}`
          : scanImage.uri,
      );

      //Send the resized image to the YOLO backend.
      const data = await uploadToYolo(scanImage.uri);
      const yoloDone = Date.now();

      //Log the time spent capturing, resizing, and processing the image.
      console.log("[scan] timing (ms):", {
        captureAndResize: resizeDone - scanStart,
        yoloRequest: yoloDone - resizeDone,
        serverPredict: Math.round(Number(data?.processing_time || 0) * 1000),
        total: yoloDone - scanStart,
        label: data?.label,
      });

      //Display an error if the backend reports an unsuccessful scan.
      if (data?.success === false) {
        Alert.alert(
          "Scan Failed",
          data?.message || "YOLO backend could not detect the item.",
        );
        return;
      }

      //Extract the detected item's label from the backend response.
      let detected = getDetectedLabel(data);

      //Use Unknown if the returned label is empty.
      if (!detected || String(detected).trim() === "") {
        detected = "Unknown";
      }

      //Define labels that indicate an unsuccessful or unidentified detection.
      const unidentifiedItems = [
        "unknown",
        "unidentified",
        "none",
        "no detection",
        "not detected",
      ];

      //Retrieve the detection confidence value from the backend.
      let confidenceValue = Number(data?.confidence || 0);

      //Treat detections below the minimum confidence threshold as Unknown.
      if (confidenceValue < SCAN_MIN_CONFIDENCE) {
        detected = "Unknown";
      }

      //Retrieve valid detection boxes from the backend response.
      let boxes: Detection[] = Array.isArray(data?.detections)
        ? data.detections.filter(
            (d: any) => Array.isArray(d?.box) && d.box.length === 4,
          )
        : [];

      //Check whether the detected label represents an unidentified item.
      if (unidentifiedItems.includes(String(detected).trim().toLowerCase())) {
        //Retrieve the backend's alternative prediction, if available.
        const guess = data?.guess;

        //Check whether the alternative prediction meets the confirmation threshold.
        const hasGuess =
          guess?.label &&
          Number(guess.confidence || 0) >= SCAN_CONFIRM_MIN_CONFIDENCE;

        //Show the unknown modal if no reliable alternative prediction exists.
        if (!hasGuess) {
          setShowUnknownModal(true);
          return;
        }

        //Prepare the alternative prediction's bounding box.
        const guessBox: Detection[] =
          Array.isArray(guess.box) && guess.box.length === 4 ? [guess] : [];

        //Display the alternative prediction's bounding box when image dimensions are available.
        if (guessBox.length > 0 && scanImage.width && scanImage.height) {
          setDetections(guessBox);
        }

        //Ask the user to confirm the alternative predicted item.
        const confirmed = await askToConfirm(String(guess.label));

        //Show the unknown modal if the user rejects the prediction.
        if (!confirmed) {
          setDetections([]);
          setShowUnknownModal(true);
          return;
        }

        //Use the confirmed prediction as the detected item.
        detected = String(guess.label);
        confidenceValue = Number(guess.confidence || 0);
        boxes = [];
      }

      //Convert the confidence value into a string for navigation parameters.
      const confidence = String(confidenceValue);

      //Retrieve the backend's processing time or use zero if unavailable.
      const processingTime =
        data?.processing_time !== undefined && data?.processing_time !== null
          ? String(data.processing_time)
          : "0";

      //Retrieve the total detection time or use zero if unavailable.
      const totalTime =
        data?.total_time !== undefined && data?.total_time !== null
          ? String(data.total_time)
          : "0";

      //Display the detection boxes briefly when valid image dimensions are available.
      if (boxes.length > 0 && scanImage.width && scanImage.height) {
        setDetections(boxes);
        await new Promise((resolve) => setTimeout(resolve, SHOW_BOX_MS));
      }

      //Temporarily store the scanned photo for use on the result screen.
      setScanPhoto(scanImage.uri, scanImage.base64);

      //Navigate to the result screen and pass the detection information.
      router.push({
        pathname: "/user_dashboard/user_result" as any,
        params: {
          image: scanImage.uri,
          label: detected,
          confidence: confidence,
          processing_time: processingTime,
          total_time: totalTime,
        },
      });
    } catch (error: any) {
      //Display an error if image capture or backend processing fails.
      Alert.alert(
        "Scan Failed",
        error?.message ||
          "The YOLO backend could not be reached. Please check if backend is running and YOLO_URL is correct.",
      );
    } finally {
      //Reset the scanning state and clear temporary preview information.
      setScanning(false);
      setCapturedPreview("");
      setDetections([]);
    }
  };

  //Display a loading screen while camera permission status is being retrieved.
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera permission...</Text>
      </View>
    );
  }

  //Display a permission request screen if camera access has not been granted.
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan e-waste.
        </Text>

        {/*Button that allows the user to grant camera permission.*/}
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  //Render the main scanning interface after camera permission is granted.
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      {/*Header containing the screen title, tips button, and application logo.*/}
      <View style={styles.header}>
        <Text style={styles.title}>Scan E-Waste</Text>

        <View style={styles.headerRight}>
          {/*Button for opening the scanning instructions.*/}
          <TouchableOpacity
            style={styles.tipsButton}
            onPress={() => setShowGuide(true)}
            disabled={scanning}
          >
            <Ionicons name="help-circle-outline" size={20} color="#1b5e20" />
            <Text style={styles.tipsButtonText}>Tips</Text>
          </TouchableOpacity>

          {/*Display the application logo.*/}
          <Image
            source={require("../../assets/icons/icon.png")}
            style={styles.logo}
          />
        </View>
      </View>

      {/*Camera preview and scanning controls container.*/}
      <View style={styles.scanBox}>
        {/*Display the live camera feed.*/}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          active={true}
          mode="picture"
          enableTorch={flash === "on"}
          onCameraReady={() => {
            console.log("CAMERA READY");
          }}
          onMountError={(error) => {
            //Log and display an error if the camera preview cannot start.
            console.error("CAMERA MOUNT ERROR:", error);

            Alert.alert(
              "Camera Error",
              error.message || "The camera preview could not start.",
            );
          }}
        />

        {/*Display the captured photo over the camera preview.*/}
        {capturedPreview ? (
          <Image
            source={{ uri: capturedPreview }}
            style={styles.capturedPreview}
            resizeMode="cover"
          />
        ) : null}

        {/*Display bounding boxes when detection results are available.*/}
        {capturedPreview && detections.length > 0 ? (
          <DetectionOverlay
            detections={detections}
            imageWidth={previewSize.width}
            imageHeight={previewSize.height}
          />
        ) : null}

        {/*Button for switching the camera flash on or off.*/}
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => setFlash((prev) => (prev === "off" ? "on" : "off"))}
          disabled={scanning || showUnknownModal}
        >
          <Text style={styles.flashText}>
            {flash === "on" ? "Flash On" : "Flash Off"}
          </Text>
        </TouchableOpacity>

        {/*Button for switching between the front and back cameras.*/}
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() =>
            setFacing((prev) => (prev === "back" ? "front" : "back"))
          }
          disabled={scanning}
        >
          <Text style={styles.flipText}>Flip</Text>
        </TouchableOpacity>

        {/*Display the camera icon and current scanning status.*/}
        <View style={styles.center}>
          <Image
            source={require("../../assets/icons/camera.png")}
            style={styles.cameraIcon}
          />

          <Text style={styles.scanText}>
            {confirmLabel
              ? "Please confirm the item"
              : detections.length > 0
              ? "E-waste detected"
              : scanning
                ? "Scanning item..."
                : "Point camera at e-waste"}
          </Text>
        </View>
      </View>

      {/*Capture button that starts the image scanning process.*/}
      <TouchableOpacity
        style={[styles.button, scanning && styles.disabledButton]}
        onPress={takePicture}
        disabled={scanning || showGuide}
      >
        <Image
          source={require("../../assets/icons/camera.png")}
          style={styles.buttonIcon}
        />

        {/*Update the button label while scanning is in progress.*/}
        <Text style={styles.buttonText}>
          {scanning ? "Scanning..." : "Capture"}
        </Text>
      </TouchableOpacity>

      {/*Confirmation modal for alternative predictions from the YOLO backend.*/}
      {confirmLabel ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="help-circle"
              size={55}
              color="#15803D"
              style={styles.modalIcon}
            />

            {/*Display the alternative predicted item for confirmation.*/}
            <Text style={styles.modalTitle}>
              Is this a {confirmLabel.replace(/-/g, " ")}?
            </Text>

            <Text style={styles.modalText}>
              The scanner isn&apos;t completely sure. Confirm only if the item
              in the photo is this electronic device.
            </Text>

            {/*Accept the alternative prediction.*/}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => answerConfirm(true)}
            >
              <Text style={styles.modalButtonText}>Yes, continue</Text>
            </TouchableOpacity>

            {/*Reject the alternative prediction.*/}
            <TouchableOpacity onPress={() => answerConfirm(false)}>
              <Text style={styles.modalLinkText}>No, it&apos;s something else</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/*Modal displayed when the scanner cannot identify an e-waste item.*/}
      {showUnknownModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="warning"
              size={55}
              color="#d32f2f"
              style={styles.modalIcon}
            />

            <Text style={styles.modalTitle}>Unknown</Text>

            <Text style={styles.modalText}>
              No e-waste was recognised in this photo. If it is e-waste, scan
              again with better lighting and the item in the middle of the frame.
            </Text>

            {/*Close the modal and allow the user to scan again.*/}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowUnknownModal(false);
                setScanning(false);
              }}
            >
              <Text style={styles.modalButtonText}>Scan Again</Text>
            </TouchableOpacity>

            {/*Close the modal and display the scanning guide.*/}
            <TouchableOpacity
              onPress={() => {
                setShowUnknownModal(false);
                setScanning(false);
                setShowGuide(true);
              }}
            >
              <Text style={styles.modalLinkText}>View scanning tips</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/*Modal containing instructions for taking better scanning photos.*/}
      {showGuide && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="camera-outline"
              size={46}
              color="#15803D"
              style={styles.modalIcon}
            />

            <Text style={styles.modalTitle}>Before You Scan</Text>
            <Text style={styles.guideSubtitle}>
              Follow these tips for a more accurate result.
            </Text>

            {/*Display each scanning tip with its corresponding icon and description.*/}
            <View style={styles.tipsList}>
              {SCAN_TIPS.map((tip) => (
                <View key={tip.title} style={styles.tipRow}>
                  <View style={styles.tipIconWrapper}>
                    <Ionicons name={tip.icon} size={20} color="#15803D" />
                  </View>

                  <View style={styles.tipTextWrapper}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipText}>{tip.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/*Checkbox for saving the user's preference to hide the guide.*/}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setDontShowGuideAgain((prev) => !prev)}
            >
              <Ionicons
                name={dontShowGuideAgain ? "checkbox" : "square-outline"}
                size={20}
                color="#15803D"
              />
              <Text style={styles.checkboxText}>Don't show this again</Text>
            </TouchableOpacity>

            {/*Close the guide and save the selected preference.*/}
            <TouchableOpacity style={styles.modalButton} onPress={closeGuide}>
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/*Display the user navigation bar when a valid user ID is available.*/}
      {userId && <UserBottomNav userId={userId} active="scan" />}
    </SafeAreaView>
  );
}

//Define the styles used by the camera screen, buttons, and modals.
const styles = StyleSheet.create({
  //Layout for the camera permission loading and request screens.
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

  //Header layout and title styling.
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  //Styling for the scanning tips button and application logo.
  tipsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tipsButtonText: {
    color: "#1b5e20",
    fontSize: 13,
    fontWeight: "600",
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },

  //Camera preview container with rounded corners.
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
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.08 }],
  },

  //Position the captured image over the camera preview.
  capturedPreview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },

  //Position and style the flash and camera flip controls.
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

  //Center the camera icon and scanning status text.
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
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

  //Style the main capture button and its disabled appearance.
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

  //General overlay and container styling for the modal dialogs.
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContainer: {
    width: "92%",
    maxWidth: 460,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 8,
  },

  //Styling for modal icons, headings, and descriptions.
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  modalText: {
    marginTop: 12,
    fontSize: 10,
    color: "#555",
    textAlign: "center",
    lineHeight: 14,
  },

  //Styling for the main modal action button and secondary text button.
  modalButton: {
    backgroundColor: "#15803D",
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 12,
    width: "80%",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  modalLinkText: {
    marginTop: 12,
    color: "#15803D",
    fontSize: 13,
    fontWeight: "600",
  },

  //Styling for the scanning guide subtitle and list of tips.
  guideSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
    textAlign: "center",
  },
  tipsList: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipTextWrapper: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  tipText: {
    marginTop: 2,
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
  },

  //Styling for the "Don't show this again" checkbox row.
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 18,
  },
  checkboxText: {
    fontSize: 13,
    color: "#333",
  },
});