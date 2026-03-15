import axios from "axios";
import { useRouter } from 'expo-router';
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { API_URL } from "../config";

export default function Index() {
  const router = useRouter();

    useEffect(() => {
    axios.get(`${API_URL}/`,{
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(res => {
        console.log("Backend says:", res.data);
      })
      .catch(err => {
        console.log("Error connecting:", err);
      });
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-backg">
      
      <Image
        source={require("../assets/icons/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text className="text-5xl text-primary font-bold">
        ERECYCLOMATCH
      </Text>
      <Text className="text-1xl mt-3"
      style={{
        textAlign: 'center',
        paddingHorizontal: 20,
        width: '100%',
      }}>Recyle Smarter. Match Faster</Text>

      <Pressable
      onPress={() => router.push('/individual_signup')} //sign up button
      className="mt-20 w-64 h-14 bg-primary rounded-full justify-center items-center flex-row">
        <Text className="text-white font-bold">Get Started</Text>
        <Image
          source={require("../assets/icons/right-arrow.png")}
          style={{ width: 20, height: 25, marginLeft: 10 }}
          resizeMode="contain"
        />
      </Pressable>

      <Text className="mt-10">OR</Text>

      <Pressable
        onPress={() => router.push('/signin')} //sign up button
        className="mt-10 w-72 h-14 bg-white border border-black rounded-full justify-center items-center">
          <Text className="text-black">I already have an account </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 1000,
    height: 200,
    marginBottom: 20,
  },
});