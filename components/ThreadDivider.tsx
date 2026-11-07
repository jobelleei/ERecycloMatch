import { StyleSheet, Text, View } from "react-native";

// Line shown in a chat where a new transaction starts,
// e.g. "New request · Keyboard · Nov 4"
export default function ThreadDivider({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#b9c8b4",
  },
  label: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#1b5e20",
    maxWidth: "75%",
  },
});
