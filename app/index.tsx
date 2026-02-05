import { Text, View, Image, StyleSheet, Pressable } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-backg">
      
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text className="text-5xl text-primary font-bold">
        ERECYCLOMATCH
      </Text>
      <Text className="text-1xl mt-3">Recyle Smarter. Match Faster</Text>

      <Pressable
        onPress={() => console.log("Get Started")}
        className="mt-20 w-64 h-14 bg-primary rounded-full justify-center items-center">
          <Text className="text-white font-bold">Get Started</Text>
      </Pressable>

      <Text className="mt-10">OR</Text>

      <Pressable
        onPress={() => console.log("I already have an account")}
        className="mt-10 w-64 h-14 bg-white border border-black rounded-full justify-center items-center">
          <Text className="text-black">I already have an account</Text>
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
