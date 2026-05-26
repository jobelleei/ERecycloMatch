import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { supabase } from "./utils/supabase";

type Profile = {
  id: number;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
};

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState("Checking Supabase connection...");

  useEffect(() => {
    const getProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, email, role, status");

        if (error) {
          console.log("SUPABASE ERROR:", error.message);
          setMessage(error.message);
          return;
        }

        console.log("SUPABASE DATA:", data);

        setProfiles(data || []);

        if (data && data.length > 0) {
          setMessage("Supabase connected successfully.");
        } else {
          setMessage("Supabase connected. No profiles yet.");
        }
      } catch (error) {
        console.log("UNKNOWN ERROR:", error);

        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Unknown error occurred.");
        }
      }
    };

    getProfiles();
  }, []);

  return (
    <View style={{ flex: 1, padding: 30, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>
        Supabase Test
      </Text>

      <Text style={{ marginBottom: 20 }}>{message}</Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              backgroundColor: "#f2f2f2",
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {item.name || "No name"}
            </Text>

            <Text>{item.username ? `@${item.username}` : "No username"}</Text>

            <Text>{item.email || "No email"}</Text>

            <Text>
              {item.role || "No role"} - {item.status || "No status"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}