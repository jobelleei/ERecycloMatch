import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { API_URL } from "../config";
import styles from "./styles/individual_signup";

export default function IndividualSignup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync();

    if (!result.canceled) {
      setImage(result.assets[0].uri ?? null);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !address || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
      });
      return;
    }

    if (password !== confirmpass) {
      Toast.show({
        type: "error",
        text1: "Password mismatch",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("password", password);

      if (image) {
        formData.append("id_image", {
          uri: image,
          name: "id.jpg",
          type: "image/jpeg",
        } as any);
      }

      const response = await fetch(`${API_URL}/api/individual-signup`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success!",
        });
        router.push("/signin");
      } else {
        Toast.show({
          type: "error",
          text1: data.message,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Connection Error",
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      
      {/* BACKGROUND FIX */}
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >

        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <Text style={styles.title}>
            Sign up and join the platform today!
          </Text>

          <View style={{ flexDirection: "row" }}>
            <Text style={styles.uploadLabel}>ID Verification</Text>
            <Text style={styles.uploadLabelSub}> (Required)</Text>
          </View>

          <Pressable onPress={openCamera}>
            <Text>Open Camera</Text>
          </Pressable>

          <Pressable onPress={handleSignUp}>
            <Text>Sign Up</Text>
          </Pressable>

        </ScrollView>

      </ImageBackground>
    </View>
  );
}