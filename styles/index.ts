import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CFE8C6",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 30,
    color: "#333",
  },

  primaryBtn: {
    backgroundColor: "#4CAF50",
    width: "80%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontWeight: "bold",
  },

  or: {
    marginVertical: 20,
  },

  secondaryBtn: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: "#000",
  },

  footer: {
    marginTop: 30,
    fontSize: 12,
    color: "#555",
  },
});