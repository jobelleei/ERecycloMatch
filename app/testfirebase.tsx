import { addDoc, collection } from "firebase/firestore";
import { Text, View } from "react-native";
import { db } from "./user_dashboard/firebaseConfig";

export default function TestFirebase() {
  const testFirebase = async () => {
    try {
      await addDoc(collection(db, "test"), {
        message: "Firebase Connected Successfully",
      });

      console.log("FIREBASE CONNECTED");
    } catch (error) {
      console.log(error);
    }
  };

  testFirebase();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Testing Firebase...</Text>
    </View>
  );
}
