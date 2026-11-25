import { StyleSheet } from "react-native";

//Styles for the welcome screen.
export default StyleSheet.create({
  //Main screen container.
  container: {
    flex: 1,
    backgroundColor: "#CFE8C6",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  //App logo.
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },

  //Screen title.
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  //Text under the title.
  subtitle: {
    marginTop: 10,
    marginBottom: 30,
    color: "#333",
  },

  //Primary button.
  primaryBtn: {
    backgroundColor: "#4CAF50",
    width: "80%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  //Primary button text.
  primaryText: {
    color: "#fff",
    fontWeight: "bold",
  },

  //Divider text between buttons.
  or: {
    marginVertical: 20,
  },

  //Secondary outlined button.
  secondaryBtn: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  //Secondary button text.
  secondaryText: {
    color: "#000",
  },

  //Footer text.
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: "#555",
  },
});