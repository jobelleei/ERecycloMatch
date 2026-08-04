import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function ItemDetails() {
  const router = useRouter();
  const { item_id } =
    useLocalSearchParams();

  const [item, setItem] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchItem();
  }, []);

  const getPublicImageUrl = (
    bucket: string,
    path: string
  ) => {
    if (!path) return "";

    if (
      String(path).startsWith(
        "http"
      )
    ) {
      return path;
    }

    const { data } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(
          String(path)
        );

    return (
      data?.publicUrl || ""
    );
  };

  const fetchItem =
    async () => {
      try {
        setLoading(true);

        const { data, error } =
          await supabase
            .from("items")
            .select("*")
            .eq(
              "id",
              String(item_id)
            )
            .maybeSingle();

        if (error) {
          console.log(
            "FETCH ITEM ERROR:",
            error
          );
          return;
        }

        setItem(data);
      } catch (error) {
        console.log(
          "ITEM DETAILS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  const openOwnerProfile =
    () => {
      router.push({
        pathname:
          "/facility_dashboard/user_view_profile",
        params: {
          user_id: String(
            item?.user_id ||
              item?.submitter_user_id ||
              ""
          ),
          name: String(
            item?.submitter_name ||
              "User"
          ),
        },
      });
    };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2f7d1f"
        />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <Text>
          Item not found.
        </Text>
      </SafeAreaView>
    );
  }

  const itemImage =
    getPublicImageUrl(
      "item-images",
      item.item_image ||
        item.image ||
        item.image_path ||
        ""
    );

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="#222"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Item Details
          </Text>

          <View
            style={{
              width: 28,
            }}
          />
        </View>

        {/* Image */}
        <Image
          source={
            itemImage
              ? {
                  uri: itemImage,
                }
              : require("../../assets/icons/icon.png")
          }
          style={
            styles.image
          }
        />

        {/* Content */}
        <View
          style={
            styles.content
          }
        >
          <Text
            style={
              styles.title
            }
          >
            {item.item_name ||
              item.item_type ||
              "Unnamed Item"}
          </Text>

          <Text
            style={
              styles.postedBy
            }
          >
            Posted by{" "}
            {item.submitter_name ||
              "Unknown User"}
          </Text>

          <View
            style={
              styles.statusBox
            }
          >
            <Text
              style={
                styles.statusText
              }
            >
              {item.match_status ||
                item.status ||
                "Listed"}
            </Text>
          </View>

          {/* Description */}
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Description
            </Text>

            <Text
              style={
                styles.value
              }
            >
              {item.description ||
                "No description provided."}
            </Text>
          </View>

          {/* Issues */}
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Issues /
              Condition
            </Text>

            <Text
              style={
                styles.value
              }
            >
              {item.issues ||
                item.selected_issues ||
                "No issues specified."}
            </Text>
          </View>

          {/* Location */}
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Location
            </Text>

            <Text
              style={
                styles.value
              }
            >
              {item.location ||
                item.address ||
                "No location provided"}
            </Text>
          </View>

          {/* View User */}
          <TouchableOpacity
            style={
              styles.button
            }
            onPress={
              openOwnerProfile
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              View User
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f5f5f5",
    },

    loadingContainer:
      {
        flex: 1,
        justifyContent:
          "center",
        alignItems:
          "center",
      },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      padding: 20,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight:
        "700",
      color: "#222",
    },

    image: {
      width: "100%",
      height: 300,
      backgroundColor:
        "#eee",
    },

    content: {
      padding: 20,
    },

    title: {
      fontSize: 24,
      fontWeight:
        "700",
      color: "#222",
    },

    postedBy: {
      marginTop: 8,
      fontSize: 14,
      color: "#2f7d1f",
      fontWeight:
        "600",
    },

    statusBox: {
      marginTop: 15,
      alignSelf:
        "flex-start",
      backgroundColor:
        "#e8f5e9",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },

    statusText: {
      color:
        "#2f7d1f",
      fontWeight:
        "700",
    },

    section: {
      marginTop: 25,
    },

    label: {
      fontSize: 16,
      fontWeight:
        "700",
      color: "#222",
      marginBottom: 8,
    },

    value: {
      fontSize: 15,
      lineHeight: 24,
      color: "#555",
    },

    button: {
      marginTop: 35,
      backgroundColor:
        "#2f7d1f",
      paddingVertical: 15,
      borderRadius: 15,
      alignItems:
        "center",
      marginBottom: 40,
    },

    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight:
        "700",
    },
  });