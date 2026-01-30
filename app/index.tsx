import { Text, View, ImageBackground, StyleSheet } from "react-native";

export default function Index() {
  return (
    <ImageBackground
      source={{ uri: 'https://i.pinimg.com/736x/9c/67/38/9c6738bf74f94adf5ed0f9e4170cbf2d.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Edit app/index.tsx to edit this screen.</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});