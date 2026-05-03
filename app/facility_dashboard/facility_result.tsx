import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanResult() {
  const { image, label } = useLocalSearchParams();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [issue, setIssue] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const issues = ["Broken Screen", "Battery Issue", "Water Damage"];

  // 🔥 Suggestions
  const getSuggestions = (item: string) => {
    if (!item) return [];

    if (item.toLowerCase().includes("phone")) {
      return [
        "Delete all personal data",
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Scanning E-Waste</Text>
          <Text style={styles.close} onPress={() => router.back()}>
            ✕
          </Text>
        </View>

        {/* IMAGE (SAFE) */}
        {image ? (
          <Image source={{ uri: image as string }} style={styles.image} />
        ) : (
          <View style={[styles.image, { justifyContent: "center", alignItems: "center" }]}>
            <Text>No Image</Text>
          </View>
        )}

        <Text style={styles.identified}>Item identified</Text>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.item}>{label}</Text>

          {/* DESCRIPTION */}
          <Text style={styles.label}>Description:</Text>
          <TextInput
            placeholder="Enter description..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          {/* ISSUE */}
          <Text style={styles.label}>Issue:</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setModalVisible(true)}
          >
            <Text style={issue ? styles.dropdownText : styles.placeholder}>
              {issue || "Select Issue"}
            </Text>
          </TouchableOpacity>

          {/* MODAL */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <Pressable
              style={styles.overlay}
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.modalBox}>
                {issues.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.option}
                    onPress={() => {
                      setIssue(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>

          {/* SUGGESTIONS */}
          <Text style={styles.label}>Suggestions:</Text>
          {suggestions.map((s, i) => (
            <Text key={i} style={styles.suggestion}>
              • {s}
            </Text>
          ))}
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Find a Match!</Text>
        </TouchableOpacity>

        <Text style={styles.scanAgain} onPress={() => router.back()}>
          Scan Another Item
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
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
  },

  close: {
    fontSize: 20,
  },

  image: {
    width: "100%",
    height: 250,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: "#ddd",
  },

  identified: {
    textAlign: "center",
    marginTop: 12,
    color: "#555",
    fontSize: 14,
  },

  card: {
    marginTop: 20,
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 16,
  },

  item: {
    fontSize: 20,
    fontWeight: "bold",
  },

  label: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 15,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },

  dropdown: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
  },

  dropdownText: {
    fontSize: 14,
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
    paddingVertical: 10,
  },

  option: {
    padding: 15,
  },

  optionText: {
    fontSize: 16,
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
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  scanAgain: {
    textAlign: "center",
    marginTop: 12,
    color: "#555",
    fontSize: 14,
  },
});