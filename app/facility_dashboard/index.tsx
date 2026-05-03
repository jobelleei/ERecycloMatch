import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router"; // ✅ ADD

export default function FacilityDashboard() {
  const router = useRouter(); // ✅ ADD

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Facility Dashboard</Text>

      {/* 🔥 BOTTOM NAV */}
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <TouchableOpacity>
          <Text>Home</Text>
        </TouchableOpacity>

        {/* ✅ SCAN CONNECTED */}
        <TouchableOpacity onPress={() => router.push("/scan")}>
          <Text>Scan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}