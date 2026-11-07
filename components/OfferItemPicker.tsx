import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

/*
 * Shown when a user answers a facility posting ("Looking for: Keyboard").
 * The user picks one of their scanned items, or takes a photo, so the
 * request carries a real picture of the item they are offering. The chat's
 * "Requested Item" card then shows that photo on both sides.
 */

export type OfferedItem = {
  itemId: string | null;
  itemName: string;
  // Storage path in the "item-images" bucket, e.g. "items/12-1793719373448.jpg"
  photoPath: string;
};

type Props = {
  visible: boolean;
  userId: string;
  itemNeeded: string;
  onCancel: () => void;
  onSelect: (item: OfferedItem) => void;
};

type UserItem = {
  id: string;
  item_name: string;
  item_image: string;
  status: string;
};

const BUCKET = "item-images";

// Items that can still be offered (not rejected, finished or deleted)
const UNAVAILABLE = ["rejected", "finished", "deleted", "matched"];

const publicUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || "";
};

export default function OfferItemPicker({
  visible,
  userId,
  itemNeeded,
  onCancel,
  onSelect,
}: Props) {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Keeps the Cancel button above the phone's navigation bar
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("items")
          .select("id, item_name, item_image, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) console.log("OFFER PICKER ITEMS ERROR:", error);

        const usable = (data || []).filter(
          (item: any) =>
            String(item.item_image || "").trim() !== "" &&
            !UNAVAILABLE.includes(String(item.status || "").toLowerCase()),
        );

        if (!cancelled) setItems(usable as UserItem[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera access needed",
          "Allow camera access to take a photo of your item.",
          permission.canAskAgain
            ? [{ text: "OK" }]
            : [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploading(true);

      // Same upload method as the scan result screen
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);
      const filePath = `items/${userId}-${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        });

      if (error) throw error;

      onSelect({ itemId: null, itemName: itemNeeded, photoPath: filePath });
    } catch (error: any) {
      console.log("OFFER PHOTO UPLOAD ERROR:", error);
      Alert.alert(
        "Photo upload failed",
        error?.message || "Please check your internet connection and try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: UserItem }) => (
    <Pressable
      style={styles.itemRow}
      disabled={uploading}
      onPress={() =>
        onSelect({
          itemId: String(item.id),
          itemName: item.item_name || itemNeeded,
          photoPath: item.item_image,
        })
      }
    >
      <Image source={{ uri: publicUrl(item.item_image) }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.item_name || "Item"}
        </Text>
        <Text style={styles.itemStatus}>{item.status || ""}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: 28 + insets.bottom }]}>
          <Text style={styles.title}>Which item are you offering?</Text>
          <Text style={styles.subtitle}>
            The facility is looking for:{" "}
            <Text style={{ fontWeight: "700" }}>{itemNeeded || "an item"}</Text>
            . Pick one of your scanned items or take a photo so they can see it.
          </Text>

          <Pressable
            style={[styles.cameraButton, uploading && { opacity: 0.6 }]}
            onPress={takePhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.cameraText}>Take a photo of the item</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.sectionLabel}>Or choose from your items</Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color="#1B5E20" />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              style={{ maxHeight: 300 }}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  No scanned items with photos yet. Take a photo instead.
                </Text>
              }
            />
          )}

          <Pressable style={styles.cancel} onPress={onCancel} disabled={uploading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1B5E20" },
  subtitle: { fontSize: 13, color: "#555", marginTop: 6, lineHeight: 19 },
  cameraButton: {
    marginTop: 16,
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  cameraText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  thumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: "#eee" },
  itemName: { fontSize: 15, fontWeight: "600", color: "#222" },
  itemStatus: { fontSize: 12, color: "#777", marginTop: 2 },
  empty: { color: "#777", fontSize: 13, paddingVertical: 14 },
  cancel: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  cancelText: { color: "#c62828", fontWeight: "700", fontSize: 15 },
});
