import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import UserBottomNav from "../../components/UserBottomNav";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function MyItems() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [submitterName, setSubmitterName] = useState("");
  const [userId, setUserId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedDescription, setEditedDescription] = useState("");

  const [modalIssuePhotos, setModalIssuePhotos] = useState<any[]>([]);
  const [loadingIssuePhotos, setLoadingIssuePhotos] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageSource, setPreviewImageSource] = useState<any>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const getItemStatus = (item: any) => {
    const status =
      item.status ||
      item.item_status ||
      item.approval_status ||
      item.match_status ||
      "";

    const cleanStatus = String(status || "")
      .trim()
      .toLowerCase();

    if (cleanStatus === "rejected") return "Rejected";
    if (cleanStatus === "approved") return "Approved";
    if (cleanStatus === "listed") return "Listed";
    if (cleanStatus === "pending") return "Pending";

    return "Pending";
  };

  const getItemTimeValue = (item: any) => {
    const dateValue =
      item.listed_at ||
      item.date_listed ||
      item.submitted_at ||
      item.created_at ||
      item.updated_at ||
      item.date_created ||
      item.date_submitted ||
      item.id ||
      0;

    const date = new Date(dateValue);

    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    const numberValue = Number(dateValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const sortByLatest = (list: any[]) => {
    return [...list].sort((a, b) => getItemTimeValue(b) - getItemTimeValue(a));
  };

  const filteredItems =
    filter === "All"
      ? items
      : items.filter((item) => getItemStatus(item) === filter);

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  useEffect(() => {
    if (userId) {
      fetchItems();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const finalUserId =
        actualUser?.id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.user_id ||
        "";

      const userName =
        actualUser?.name ||
        actualUser?.fullname ||
        actualUser?.full_name ||
        actualUser?.username ||
        parsed?.name ||
        parsed?.fullname ||
        parsed?.full_name ||
        parsed?.username ||
        "";

      setUserId(String(finalUserId));
      setSubmitterName(String(userName).trim());
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  };

  const fetchItems = async () => {
    try {
      if (!userId) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", String(userId))
        .not("status", "in", '("Finished","Recycled")')
        .not("match_status", "in", '("Finished","Recycled")')
        .order("created_at", { ascending: false });

      if (error) {
        console.log("FETCH ITEMS ERROR:", error);
        setItems([]);
        return;
      }

      console.log("MY ITEMS DATA:", data);

      setItems(sortByLatest(data || []));
    } catch (error) {
      console.log("FETCH ITEMS ERROR:", error);
      setItems([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const listItem = async (item: any) => {
    const status = getItemStatus(item);

    if (status === "Rejected") {
      Alert.alert("Not Allowed", "Rejected items cannot be listed.");
      return;
    }

    if (status === "Listed") {
      Alert.alert("Already Listed", "This item is already listed.");
      return;
    }

    if (status !== "Approved") {
      Alert.alert("Not Allowed", "Only approved items can be listed.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found. Please log in again.");
      return;
    }

    try {
      const listedAt = new Date().toISOString();

      const { error } = await supabase
        .from("items")
        .update({
          status: "Listed",
          match_status: "Listed",
          listed_at: listedAt,
        })
        .eq("id", item.id)
        .eq("user_id", String(userId));

      if (error) {
        Alert.alert("List Item", error.message);
        return;
      }

      Alert.alert("List Item", "Item listed successfully.");

      setItems((prevItems) =>
        sortByLatest(
          prevItems.map((currentItem) =>
            String(currentItem.id) === String(item.id)
              ? {
                  ...currentItem,
                  status: "Listed",
                  match_status: "Listed",
                  listed_at: listedAt,
                }
              : currentItem,
          ),
        ),
      );

      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.log("LIST ITEM ERROR:", error);
      Alert.alert("Error", "Failed to list item.");
    }
  };

  const getPublicImageUrl = (bucket: string, path: string) => {
    if (!path) return "";

    const cleanPath = String(path).trim();

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

    return data?.publicUrl || "";
  };

  const extractStoragePath = (value: string, bucketName: string) => {
    if (!value || String(value).trim() === "") return "";

    const cleanValue = String(value).trim();

    if (!cleanValue.startsWith("http")) {
      return cleanValue;
    }

    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = cleanValue.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    const pathWithQuery = cleanValue.substring(markerIndex + marker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0]);
  };

  const getItemImageSource = (item: any) => {
    const imagePath =
      item?.item_image ||
      item?.image ||
      item?.image_path ||
      item?.item_image_url ||
      item?.image_url ||
      item?.photo ||
      item?.photo_url ||
      "";

    console.log("MY ITEMS IMAGE PATH:", imagePath);

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/icon.png");
    }

    const imageUrl = getPublicImageUrl("item-images", String(imagePath));

    console.log("MY ITEMS IMAGE URL:", imageUrl);

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${item?.updated_at || item?.created_at || Date.now()}`,
    };
  };

  const getIssuePhotoImageSource = (photo: any) => {
    const imagePath =
      photo?.image_url ||
      photo?.image_path ||
      photo?.photo_url ||
      photo?.photo ||
      "";

    console.log("ISSUE PHOTO PATH:", imagePath);

    if (!imagePath || String(imagePath).trim() === "") {
      return require("../../assets/icons/icon.png");
    }

    if (String(imagePath).startsWith("http")) {
      return {
        uri: `${String(imagePath).trim()}?v=${
          photo?.updated_at || photo?.created_at || Date.now()
        }`,
      };
    }

    const imageUrl = getPublicImageUrl("item-issue-photos", String(imagePath));

    console.log("ISSUE PHOTO URL:", imageUrl);

    if (!imageUrl) {
      return require("../../assets/icons/icon.png");
    }

    return {
      uri: `${imageUrl}?v=${
        photo?.updated_at || photo?.created_at || Date.now()
      }`,
    };
  };

  const fetchIssuePhotosForItem = async (item: any) => {
    try {
      if (!item?.id) {
        setModalIssuePhotos([]);
        return;
      }

      setLoadingIssuePhotos(true);

      const { data, error } = await supabase
        .from("item_issue_photos")
        .select("*")
        .eq("item_id", item.id)
        .order("created_at", { ascending: true });

      console.log("ITEM ISSUE PHOTOS DATA:", data);
      console.log("ITEM ISSUE PHOTOS ERROR:", error);

      if (error) {
        setModalIssuePhotos([]);
        return;
      }

      setModalIssuePhotos(data || []);
    } catch (error) {
      console.log("FETCH ISSUE PHOTOS ERROR:", error);
      setModalIssuePhotos([]);
    } finally {
      setLoadingIssuePhotos(false);
    }
  };

  const openImagePreview = (source: any, title: string) => {
    setPreviewImageSource(source);
    setPreviewTitle(title);

    setEditVisible(false);

    setTimeout(() => {
      setPreviewVisible(true);
    }, 250);
  };

  const closeImagePreview = () => {
    setPreviewVisible(false);
    setPreviewImageSource(null);
    setPreviewTitle("");

    if (editingItem) {
      setTimeout(() => {
        setEditVisible(true);
      }, 250);
    }
  };

  const openItemModal = async (item: any) => {
    setEditingItem(item);
    setEditedDescription(item.description || "");
    setModalIssuePhotos([]);
    setEditVisible(true);

    await fetchIssuePhotosForItem(item);
  };

  const updateDescription = async () => {
    if (!editingItem) return;

    Keyboard.dismiss();

    if (getItemStatus(editingItem) === "Rejected") {
      setEditVisible(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("items")
        .update({
          description: editedDescription,
        })
        .eq("id", editingItem.id)
        .eq("user_id", String(userId));

      if (error) {
        Alert.alert("Update Item", error.message);
        return;
      }

      Alert.alert("Update Item", "Description updated successfully.");

      setEditVisible(false);
      setEditingItem(null);
      setModalIssuePhotos([]);
      fetchItems();
    } catch (error) {
      console.log("UPDATE DESCRIPTION ERROR:", error);
      Alert.alert("Error", "Failed to update description.");
    }
  };

  const deleteItem = async (item: any) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This will be deleted from your account and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const itemImageValue =
                item?.item_image ||
                item?.image ||
                item?.image_path ||
                item?.item_image_url ||
                item?.image_url ||
                item?.photo ||
                item?.photo_url ||
                "";

              const itemImagePath = extractStoragePath(
                String(itemImageValue || ""),
                "item-images",
              );

              const { data: issuePhotosData, error: issuePhotosFetchError } =
                await supabase
                  .from("item_issue_photos")
                  .select("*")
                  .eq("item_id", item.id);

              if (issuePhotosFetchError) {
                console.log(
                  "FETCH ISSUE PHOTOS BEFORE DELETE ERROR:",
                  issuePhotosFetchError,
                );
              }

              const issuePhotoPaths =
                issuePhotosData
                  ?.map((photo: any) => {
                    const photoValue =
                      photo?.image_url ||
                      photo?.image_path ||
                      photo?.photo_url ||
                      photo?.photo ||
                      "";

                    return extractStoragePath(
                      String(photoValue || ""),
                      "item-issue-photos",
                    );
                  })
                  .filter(
                    (path: string) => path && String(path).trim() !== "",
                  ) || [];

              console.log("DELETE ITEM IMAGE PATH:", itemImagePath);
              console.log("DELETE ISSUE PHOTO PATHS:", issuePhotoPaths);

              if (itemImagePath) {
                const { error: itemImageDeleteError } = await supabase.storage
                  .from("item-images")
                  .remove([itemImagePath]);

                if (itemImageDeleteError) {
                  console.log(
                    "DELETE ITEM IMAGE STORAGE ERROR:",
                    itemImageDeleteError,
                  );
                }
              }

              if (issuePhotoPaths.length > 0) {
                const { error: issueImagesDeleteError } = await supabase.storage
                  .from("item-issue-photos")
                  .remove(issuePhotoPaths);

                if (issueImagesDeleteError) {
                  console.log(
                    "DELETE ISSUE PHOTOS STORAGE ERROR:",
                    issueImagesDeleteError,
                  );
                }
              }

              const { error: issueRowsDeleteError } = await supabase
                .from("item_issue_photos")
                .delete()
                .eq("item_id", item.id);

              if (issueRowsDeleteError) {
                console.log(
                  "DELETE ISSUE PHOTO ROWS ERROR:",
                  issueRowsDeleteError,
                );
              }

              const { error: itemDeleteError } = await supabase
                .from("items")
                .delete()
                .eq("id", item.id)
                .eq("user_id", String(userId));

              if (itemDeleteError) {
                Alert.alert("Delete Item", itemDeleteError.message);
                return;
              }

              Alert.alert("Delete Item", "Item deleted successfully.");

              setItems((prevItems) =>
                prevItems.filter(
                  (currentItem) => String(currentItem.id) !== String(item.id),
                ),
              );

              setSelectedItem(null);
              fetchItems();
            } catch (error) {
              console.log("DELETE ITEM ERROR:", error);
              Alert.alert("Error", "Failed to delete item.");
            }
          },
        },
      ],
    );
  };

  const getStatusStyle = (status: string) => {
    if (status === "Pending") return styles.pending;
    if (status === "Approved") return styles.approved;
    if (status === "Listed") return styles.listed;
    if (status === "Rejected") return styles.rejected;

    return styles.pending;
  };

  const renderActionButtons = (item: any) => {
    const status = getItemStatus(item);

    if (status === "Pending") {
      return (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openItemModal(item)}
          >
            <Text style={styles.actionText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === "Approved" || status === "Listed") {
      return (
        <View style={styles.actionContainer}>
          {status !== "Listed" && (
            <TouchableOpacity
              style={styles.listButton}
              onPress={() => listItem(item)}
            >
              <Text style={styles.listText}>List</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openItemModal(item)}
          >
            <Text style={styles.actionText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openItemModal(item)}
        >
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const cleanIssues = (issues: string) => {
    if (!issues) return "None";

    return issues
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s*recyclability/gi, "")
      .replace(/\s*hazard/gi, "")
      .trim();
  };

  const renderItem = ({ item }: any) => {
    const status = getItemStatus(item);
    const uniqueKey = `${item.id}-${status}`;

    return (
      <View>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            setSelectedItem(selectedItem === uniqueKey ? null : uniqueKey)
          }
        >
          <Image source={getItemImageSource(item)} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.item_name}</Text>

            <Text style={styles.itemCategory}>
              {item.description || "No description"}
            </Text>

            <Text style={[styles.itemStatus, getStatusStyle(status)]}>
              {status}
            </Text>
          </View>

          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>

        {selectedItem === uniqueKey && renderActionButtons(item)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Items</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{items.length}</Text>
          <Text style={styles.statsLabel}>Total</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => getItemStatus(item) === "Approved").length}
          </Text>
          <Text style={styles.statsLabel}>Approved</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => getItemStatus(item) === "Listed").length}
          </Text>
          <Text style={styles.statsLabel}>Listed</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {items.filter((item) => getItemStatus(item) === "Rejected").length}
          </Text>
          <Text style={styles.statsLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {["All", "Pending", "Approved", "Listed", "Rejected"].map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filter === status && styles.activeFilterButton,
                ]}
                onPress={() => {
                  setFilter(status);
                  setSelectedItem(null);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === status && styles.activeFilterText,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.id}-${getItemStatus(item)}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {filter.toLowerCase()} items yet.
          </Text>
        }
      />

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalBox}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalTitle}>
                  {getItemStatus(editingItem || {}) === "Rejected"
                    ? "Rejected Item Details"
                    : getItemStatus(editingItem || {}) === "Listed"
                      ? "Listed Item Details"
                      : "Update Item"}
                </Text>

                {editingItem && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        openImagePreview(
                          getItemImageSource(editingItem),
                          "Item Photo",
                        )
                      }
                    >
                      <Image
                        source={getItemImageSource(editingItem)}
                        style={styles.modalImage}
                      />
                    </TouchableOpacity>

                    <Text style={styles.imageHint}>
                      Tap the image to view the whole photo.
                    </Text>

                    <Text style={styles.modalLabel}>
                      Submitted Issue Photos
                    </Text>

                    {loadingIssuePhotos ? (
                      <View style={styles.issuePhotosEmptyBox}>
                        <Text style={styles.issuePhotosEmptyText}>
                          Loading issue photos...
                        </Text>
                      </View>
                    ) : modalIssuePhotos.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.issuePhotosScroll}
                      >
                        {modalIssuePhotos.map((photo, index) => {
                          const source = getIssuePhotoImageSource(photo);

                          return (
                            <TouchableOpacity
                              key={`issue-photo-${photo.id || index}`}
                              style={styles.issuePhotoPreviewCard}
                              activeOpacity={0.85}
                              onPress={() =>
                                openImagePreview(
                                  source,
                                  photo.issue_name ||
                                    `Issue Photo ${index + 1}`,
                                )
                              }
                            >
                              <Image
                                source={source}
                                style={styles.issuePhotoPreviewImage}
                              />

                              <Text
                                style={styles.issuePhotoPreviewTitle}
                                numberOfLines={2}
                              >
                                {photo.issue_name || `Issue Photo ${index + 1}`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <View style={styles.issuePhotosEmptyBox}>
                        <Text style={styles.issuePhotosEmptyText}>
                          No issue photos submitted for this item.
                        </Text>
                      </View>
                    )}

                    <Text style={styles.modalLabel}>Item Name</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.item_name}
                    </Text>

                    <Text style={styles.modalLabel}>Issues</Text>
                    <Text style={styles.readOnlyText}>
                      {cleanIssues(editingItem.issues)}
                    </Text>

                    <Text style={styles.modalLabel}>Hazard Status</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.hazard_status}%
                    </Text>

                    <Text style={styles.modalLabel}>Recyclability</Text>
                    <Text style={styles.readOnlyText}>
                      {editingItem.recyclability}%
                    </Text>

                    <Text style={styles.modalLabel}>Status</Text>
                    <Text
                      style={[
                        styles.readOnlyText,
                        getStatusStyle(getItemStatus(editingItem)),
                      ]}
                    >
                      {getItemStatus(editingItem)}
                    </Text>

                    {getItemStatus(editingItem) === "Rejected" && (
                      <>
                        <Text style={styles.modalLabel}>
                          Reason for Rejection
                        </Text>

                        <View style={styles.rejectionBox}>
                          <Text style={styles.rejectionText}>
                            {editingItem.reject_reason ||
                              editingItem.rejection_reason ||
                              editingItem.reason ||
                              "No reason provided"}
                          </Text>
                        </View>
                      </>
                    )}

                    <Text style={styles.modalLabel}>Description</Text>

                    {getItemStatus(editingItem) === "Rejected" ? (
                      <Text style={styles.readOnlyText}>
                        {editedDescription || "No description"}
                      </Text>
                    ) : (
                      <TextInput
                        value={editedDescription}
                        onChangeText={setEditedDescription}
                        style={styles.input}
                        multiline
                        textAlignVertical="top"
                      />
                    )}
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      getItemStatus(editingItem || {}) === "Rejected" &&
                        styles.fullWidthButton,
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditVisible(false);
                      setModalIssuePhotos([]);
                    }}
                  >
                    <Text style={styles.cancelText}>
                      {getItemStatus(editingItem || {}) === "Rejected"
                        ? "Close"
                        : "Cancel"}
                    </Text>
                  </TouchableOpacity>

                  {getItemStatus(editingItem || {}) !== "Rejected" && (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={updateDescription}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeImagePreview}
      >
        <View style={styles.fullImageScreen}>
          <View style={styles.fullImageHeader}>
            <Text style={styles.fullImageTitle} numberOfLines={1}>
              {previewTitle || "Image Preview"}
            </Text>

            <TouchableOpacity
              onPress={closeImagePreview}
              style={styles.fullImageCloseIcon}
            >
              <Text style={styles.fullImageCloseIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fullImageBody}>
            {previewImageSource && (
              <Image
                source={previewImageSource}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.fullImageCloseButton}
            onPress={closeImagePreview}
          >
            <Text style={styles.fullImageCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <UserBottomNav
        userId={userId}
        active="profile"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statsCard: {
    width: "23%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: "center",
    elevation: 3,
  },

  statsNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },

  statsLabel: {
    fontSize: 11,
    color: "gray",
    marginTop: 5,
  },

  filterWrapper: {
    height: 45,
    marginBottom: 15,
  },

  filterContent: {
    alignItems: "center",
  },

  filterButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilterButton: {
    backgroundColor: "#1b5e20",
    borderColor: "#1b5e20",
  },

  filterText: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 12,
  },

  activeFilterText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },

  itemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  itemCategory: {
    color: "gray",
    marginTop: 2,
  },

  itemStatus: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 12,
  },

  listButton: {
    borderWidth: 1,
    borderColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  listText: {
    color: "green",
    fontWeight: "bold",
  },

  pending: {
    color: "#fbc02d",
  },

  approved: {
    color: "#1976d2",
  },

  listed: {
    color: "green",
  },

  rejected: {
    color: "red",
  },

  dots: {
    fontSize: 20,
    color: "gray",
  },

  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    marginTop: -5,
    gap: 8,
  },

  actionButton: {
    borderWidth: 1,
    borderColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
  },

  actionText: {
    color: "#1976d2",
    fontWeight: "bold",
  },

  deleteText: {
    color: "red",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 40,
    fontSize: 15,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  keyboardView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "85%",
  },

  modalScrollContent: {
    paddingBottom: 10,
  },

  modalImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    marginBottom: 5,
    resizeMode: "cover",
    backgroundColor: "#e0e0e0",
  },

  imageHint: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  modalLabel: {
    fontWeight: "bold",
    marginTop: 10,
  },

  readOnlyText: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },

  rejectionBox: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },

  rejectionText: {
    color: "red",
    fontWeight: "bold",
  },

  issuePhotosScroll: {
    marginTop: 8,
    marginBottom: 8,
  },

  issuePhotoPreviewCard: {
    width: 120,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  issuePhotoPreviewImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#ddd",
    resizeMode: "cover",
  },

  issuePhotoPreviewTitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },

  issuePhotosEmptyBox: {
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  issuePhotosEmptyText: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    minHeight: 80,
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  fullWidthButton: {
    width: "100%",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelText: {
    color: "gray",
    fontWeight: "bold",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },

  fullImageScreen: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 25,
  },

  fullImageHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fullImageTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  fullImageCloseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  fullImageCloseIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  fullImageBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.75,
  },

  fullImageCloseButton: {
    backgroundColor: "#1b5e20",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
  },

  fullImageCloseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
