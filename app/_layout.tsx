import { Stack } from "expo-router";
import Toast from "react-native-toast-message"; // import toast package for showing notifications
import "./global.css";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="individual_signup" />
        <Stack.Screen name="facility_signup" />
        <Stack.Screen name="signin" />
      </Stack>
      <Toast /> {/* add toast component here so it works on all screens */}
    </>
  );
}