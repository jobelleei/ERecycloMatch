import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

type IssueOption = {
  name: string;
  deduction: number;
  hazard: number;
};

type ItemData = {
  issues: IssueOption[];
  suggestions: string[];
};

const NONE_ISSUE = { name: "None", deduction: 0, hazard: 0 };

const ITEM_DATA: Record<string, ItemData> = {
  laptop: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Screen cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastic case", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove battery if detachable",
      "Check PCB for corrosion",
      "Separate plastics and metals",
    ],
  },

  smartphone: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Screen cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastic case", deduction: 15, hazard: 5 },
      { name: "Rare earth magnets unrecoverable", deduction: 10, hazard: 5 },
      { name: "Hazardous substances", deduction: 20, hazard: 20 },
    ],
    suggestions: [
      "Take out SIM/battery if removable",
      "Inspect screen for cracks",
      "Isolate hazardous PCB parts",
    ],
  },

  printer: {
    issues: [
      NONE_ISSUE,
      { name: "Toner residue", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove toner/ink cartridges",
      "Separate plastic casing",
      "Send PCB to e-waste facility",
    ],
  },

  camera: {
    issues: [
      NONE_ISSUE,
      { name: "Lens cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Detach battery pack",
      "Inspect lens for cracks",
      "Separate plastics from metals",
    ],
  },

  battery: {
    issues: [
      NONE_ISSUE,
      { name: "Non-removable", deduction: 30, hazard: 15 },
      { name: "Damaged", deduction: 40, hazard: 30 },
      { name: "Hazardous chemicals", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Check for swelling or leaks",
      "Store in fireproof container",
      "Send to accredited recycler",
    ],
  },

  speaker: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Magnet unrecoverable", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove magnets if possible",
      "Separate plastic casing",
      "Inspect PCB for damage",
    ],
  },

  microwave: {
    issues: [
      NONE_ISSUE,
      { name: "Magnetron damaged", deduction: 25, hazard: 15 },
      { name: "Mixed plastic casing", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 20, hazard: 10 },
      { name: "Glass plate broken", deduction: 10, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Discharge capacitors safely",
      "Remove glass plate",
      "Handle magnetron with care",
    ],
  },

  oven: {
    issues: [
      NONE_ISSUE,
      { name: "Heating element damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Detach heating element",
      "Separate metal housing",
      "Inspect PCB for corrosion",
    ],
  },

  toaster: {
    issues: [
      NONE_ISSUE,
      { name: "Heating coil damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove heating coils",
      "Separate plastics and metals",
      "Check wiring for burns",
    ],
  },

  refrigerator: {
    issues: [
      NONE_ISSUE,
      { name: "Compressor damaged", deduction: 30, hazard: 15 },
      { name: "Insulation foam", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous refrigerants", deduction: 25, hazard: 30 },
    ],
    suggestions: [
      "Remove compressor unit",
      "Handle refrigerants properly",
      "Separate insulation foam",
    ],
  },

  "air conditioner": {
    issues: [
      NONE_ISSUE,
      { name: "Compressor damaged", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous refrigerants", deduction: 30, hazard: 30 },
    ],
    suggestions: [
      "Remove compressor safely",
      "Check PCB for damage",
      "Handle refrigerant gases carefully",
    ],
  },

  monitor: {
    issues: [
      NONE_ISSUE,
      { name: "Screen cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous flame retardants", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Handle cracked screen carefully",
      "Separate plastics and metals",
      "Send PCB to recycler",
    ],
  },

  tablet: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "Screen cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove battery if detachable",
      "Handle cracked screen carefully",
      "Separate plastics and metals",
    ],
  },

  "power bank": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Check battery for swelling/leaks",
      "Store in fireproof container",
      "Send to accredited recycler",
    ],
  },

  router: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove detachable antennas",
      "Separate casing and PCB",
      "Send PCB to accredited recycler",
    ],
  },

  "wifi router": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove detachable antennas",
      "Separate casing and PCB",
      "Send PCB to accredited recycler",
    ],
  },

  keyboard: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Keys damaged", deduction: 10, hazard: 5 },
      { name: "Hazardous coatings", deduction: 20, hazard: 15 },
    ],
    suggestions: [
      "Remove keycaps",
      "Separate plastic casing",
      "Inspect PCB for corrosion",
    ],
  },

  mouse: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove battery if wireless",
      "Separate plastics",
      "Inspect PCB for damage",
    ],
  },

  "phone charger": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove damaged wires",
      "Separate casing and PCB",
      "Send capacitors to accredited recycler",
    ],
  },

  "laptop charger": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Remove damaged wires",
      "Separate casing and PCB",
      "Send capacitors to accredited recycler",
    ],
  },

  television: {
    issues: [
      NONE_ISSUE,
      { name: "Screen cracked", deduction: 25, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous flame retardants", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Handle cracked screen carefully",
      "Separate casing and PCB",
      "Send hazardous components to recycler",
    ],
  },

  unknown: {
    issues: [
      NONE_ISSUE,
      { name: "Unknown material composition", deduction: 30, hazard: 15 },
      { name: "Non-removable battery if present", deduction: 20, hazard: 15 },
      { name: "Mixed plastics/metals", deduction: 15, hazard: 5 },
      { name: "Hazardous substances potential", deduction: 30, hazard: 20 },
    ],
    suggestions: [
      "Inspect for removable battery or power source",
      "Check for burned surfaces, corrosion, or leaks",
      "Separate plastics, metals, and electronics if possible",
    ],
  },
};

const normalizeText = (value: string) => {
  return value.toLowerCase().trim();
};

const getItemData = (item: string): ItemData => {
  const normalizedLabel = normalizeText(item || "");

  if (ITEM_DATA[normalizedLabel]) {
    return ITEM_DATA[normalizedLabel];
  }

  const matchedKey = Object.keys(ITEM_DATA).find((key) =>
    normalizedLabel.includes(key)
  );

  return matchedKey ? ITEM_DATA[matchedKey] : ITEM_DATA.unknown;
};

export default function ScanResult() {
  const { image, label } = useLocalSearchParams();
  const router = useRouter();

  const itemName = typeof label === "string" ? label : "Unknown";
  const itemData = getItemData(itemName);

  const [description, setDescription] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<IssueOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const totalDeduction = selectedIssues.reduce(
    (sum, issue) => sum + issue.deduction,
    0
  );

  const totalHazard = selectedIssues.reduce(
    (sum, issue) => sum + issue.hazard,
    0
  );

  const recyclability = Math.max(100 - totalDeduction, 0);
  const hazardStatus = Math.min(totalHazard, 100);

  const toggleIssue = (issue: IssueOption) => {
    const alreadySelected = selectedIssues.some(
      (selected) => selected.name === issue.name
    );

    if (alreadySelected) {
      setSelectedIssues(
        selectedIssues.filter((selected) => selected.name !== issue.name)
      );
      return;
    }

    if (issue.name === "None") {
      setSelectedIssues([issue]);
      return;
    }

    const filteredIssues = selectedIssues.filter(
      (selected) => selected.name !== "None"
    );

    setSelectedIssues([...filteredIssues, issue]);
  };

  const validateForm = () => {
    if (!image) {
      Alert.alert("Missing Image", "Please scan an item first.");
      return false;
    }

    if (!itemName || itemName === "Unknown") {
      Alert.alert("Missing Item", "No identified item found.");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Missing Description", "Please enter a description.");
      return false;
    }

    if (selectedIssues.length === 0) {
      Alert.alert("Missing Issues", "Please select at least one issue.");
      return false;
    }

    return true;
  };

  const handleUploadForVerification = async () => {
    try {
      if (!validateForm()) return;

      setUploading(true);

      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const submitterName =
        parsedUser?.name ||
        parsedUser?.user?.name ||
        parsedUser?.data?.name ||
        "Unknown User";

      const imageUri = image as string;
      const imageName = imageUri.split("/").pop() || "scanned_item.jpg";

      const formData = new FormData();

      formData.append("submitter_name", submitterName);
      formData.append("item_name", itemName);
      formData.append("description", description.trim());

      formData.append(
        "issues",
        selectedIssues.map((issue) => issue.name).join(", ")
      );

      formData.append("hazard_status", String(hazardStatus));
      formData.append("recyclability", String(recyclability));

      formData.append("item_image", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: imageName,
        type: "image/jpeg",
      } as any);

      const response = await fetch(`${API_URL}/item_listing_user.php`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      console.log("RAW UPLOAD RESPONSE:", rawText);

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        Alert.alert(
          "Server Error",
          "Server did not return JSON. Check item_listing_user.php."
        );
        return;
      }

      Alert.alert("Upload Status", data.message);

      if (data.message === "Item submitted for verification") {
        router.back();
      }
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      Alert.alert("Upload Failed", "Check your API URL or PHP file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scanning E-Waste</Text>

          <Text style={styles.close} onPress={() => router.back()}>
            ✕
          </Text>
        </View>

        {image ? (
          <Image source={{ uri: image as string }} style={styles.image} />
        ) : (
          <View style={styles.noImageBox}>
            <Text>No Image</Text>
          </View>
        )}

        <Text style={styles.identified}>Item identified</Text>

        <View style={styles.card}>
          <Text style={styles.item}>{itemName}</Text>

          <Text style={styles.statusText}>
            Hazard Status: <Text style={styles.bold}>{hazardStatus}%</Text>
          </Text>

          <Text style={styles.statusText}>
            Recyclability: <Text style={styles.bold}>{recyclability}%</Text>
          </Text>

          <Text style={styles.label}>Description:</Text>

          <TextInput
            placeholder="Enter description..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
          />

          <Text style={styles.label}>Issues:</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setModalVisible(true)}
          >
            <Text
              style={
                selectedIssues.length > 0
                  ? styles.dropdownText
                  : styles.placeholder
              }
            >
              {selectedIssues.length > 0
                ? selectedIssues.map((issue) => issue.name).join(", ")
                : "Select issues"}
            </Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Select Issues</Text>

                {itemData.issues.map((issue, index) => {
                  const isSelected = selectedIssues.some(
                    (selected) => selected.name === issue.name
                  );

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.option,
                        isSelected && styles.selectedOption,
                      ]}
                      onPress={() => toggleIssue(issue)}
                    >
                      <Text style={styles.optionText}>
                        {isSelected ? "✓ " : ""}
                        {issue.name} (-{issue.deduction}%, +{issue.hazard}%
                        hazard)
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Suggestions:</Text>

          {itemData.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestion}>
              • {suggestion}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, uploading && styles.disabledButton]}
          onPress={handleUploadForVerification}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "Uploading..." : "Upload for Verification"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.scanAgain} onPress={() => router.back()}>
          ⟳ Scan Another Item
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    padding: 20,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  close: {
    fontSize: 28,
    fontWeight: "bold",
  },

  image: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginTop: 20,
  },

  noImageBox: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ddd",
  },

  identified: {
    textAlign: "center",
    marginTop: 12,
    color: "#222",
    fontSize: 16,
  },

  card: {
    marginTop: 20,
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 12,
  },

  item: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },

  statusText: {
    fontSize: 16,
    marginTop: 2,
  },

  bold: {
    fontWeight: "bold",
  },

  label: {
    marginTop: 12,
    fontWeight: "bold",
    fontSize: 15,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    minHeight: 45,
    textAlignVertical: "top",
  },

  dropdown: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },

  dropdownText: {
    fontSize: 14,
    color: "#000",
  },

  placeholder: {
    color: "#888",
    fontSize: 14,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  selectedOption: {
    backgroundColor: "#e8f5e9",
  },

  optionText: {
    fontSize: 15,
  },

  doneButton: {
    marginTop: 15,
    backgroundColor: "#1b5e20",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  suggestion: {
    marginTop: 6,
    fontSize: 14,
  },

  button: {
    marginTop: 25,
    backgroundColor: "#1b5e20",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "75%",
    alignSelf: "center",
  },

  disabledButton: {
    backgroundColor: "#8aa887",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  scanAgain: {
    textAlign: "center",
    marginTop: 15,
    color: "#333",
    fontSize: 15,
  },
});