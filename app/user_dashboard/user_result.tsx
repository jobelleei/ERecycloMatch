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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

type IssueOption = {
  name: string;
  deduction: number;
};

export default function ScanResult() {
  const { image, label } = useLocalSearchParams();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<IssueOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hazardStatus = 100;

  const issues: IssueOption[] = [
    { name: "Broken Screen", deduction: 10 },
    { name: "Burned Battery", deduction: 15 },
    { name: "Water Damage", deduction: 20 },
    { name: "Missing Parts", deduction: 10 },
    { name: "Damaged Charging Port", deduction: 8 },
    { name: "Not Turning On", deduction: 18 },
    { name: "Cracked Body", deduction: 7 },
    { name: "Overheating", deduction: 12 },
    { name: "Corrosion/Rust", deduction: 15 },
  ];

  const totalDeduction = selectedIssues.reduce(
    (sum, issue) => sum + issue.deduction,
    0
  );

  const recyclability = Math.max(100 - totalDeduction, 0);

  const toggleIssue = (issue: IssueOption) => {
    const alreadySelected = selectedIssues.some(
      (selected) => selected.name === issue.name
    );

    if (alreadySelected) {
      setSelectedIssues(
        selectedIssues.filter((selected) => selected.name !== issue.name)
      );
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const getSuggestions = (item: string) => {
    if (!item) return [];

    if (item.toLowerCase().includes("phone")) {
      return [
        "Delete all personal data before recycling/trading",
        "Remove SIM card",
        "Backup important files",
      ];
    }

    if (item.toLowerCase().includes("laptop")) {
      return ["Wipe hard drive", "Remove battery", "Backup files"];
    }

    return ["Check item condition before recycling"];
  };

  const suggestions = getSuggestions(label as string);

  const handleUploadForVerification = async () => {
    try {
      if (!image || !label) {
        alert("No scanned item found.");
        return;
      }

      setUploading(true);

      const imageUri = image as string;
      const imageName = imageUri.split("/").pop() || "scanned_item.jpg";

      const formData = new FormData();

      formData.append("item_name", label as string);
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

      console.log("UPLOAD URL:", `${API_URL}/item_listing_user.php`);

      const response = await fetch(`${API_URL}/item_listing_user.php`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      console.log("RAW UPLOAD RESPONSE:", rawText);

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {
        alert("Server did not return JSON. Check item_listing_user.php.");
        return;
      }

      alert(data.message);

      if (data.message === "Item submitted for verification") {
        router.back();
      }
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      alert("Upload failed. Check your API URL or PHP file.");
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
          <Text style={styles.item}>{label || "Unknown Item"}</Text>

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

                {issues.map((issue, index) => {
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
                        {issue.name} (-{issue.deduction}%)
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

          {suggestions.map((s, i) => (
            <Text key={i} style={styles.suggestion}>
              • {s}
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