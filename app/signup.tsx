import { ImageBackground, View } from "react-native";

export default function Signup() {
  return (
    <View className="flex-1 justify-center items-center bg-backg">
      <ImageBackground
        source={require("../assets/images/firstbg.png")}
        style={{ width: 400, height: 530, }}
      />
    </View>
  );
}