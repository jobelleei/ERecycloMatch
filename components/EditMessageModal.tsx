import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/*
 * Small dialog for correcting a chat message that was already sent
 * (for example a typo). Opened by long-pressing your own message.
 */

type Props = {
  visible: boolean;
  initialText: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (text: string) => void;
};

export default function EditMessageModal({
  visible,
  initialText,
  saving,
  onCancel,
  onSave,
}: Props) {
  const [text, setText] = useState(initialText);

  const trimmed = text.trim();
  const canSave = !saving && trimmed !== "" && trimmed !== initialText.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      // Start from the current message each time the dialog opens
      onShow={() => setText(initialText)}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.box}>
          <Text style={styles.title}>Edit message</Text>

          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            style={styles.input}
            placeholder="Type your message"
            editable={!saving}
          />

          <View style={styles.buttons}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.saveButton, !canSave && styles.disabled]}
              onPress={() => onSave(trimmed)}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 12,
  },
  input: {
    minHeight: 80,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#222",
    textAlignVertical: "top",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  cancelText: { color: "#c62828", fontWeight: "700", fontSize: 15 },
  saveButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
});
