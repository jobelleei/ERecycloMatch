import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CFE8C6",
    alignItems: "center",
    justifyContent: "center",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(207,232,198,0.85)",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },

  backIcon: {
    width: 24,
    height: 24,
  },

  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 25,
  },

  label: {
    alignSelf: "flex-start",
    marginLeft: "10%",
    marginTop: 10,
    fontWeight: "600",
  },

  inputBox: {
    width: "85%",
    height: 50,
    backgroundColor: "#E5E5E5",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 5,
  },

  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#666",
  },

  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },

  input: {
    flex: 1,
    fontSize: 14,
  },

  forgot: {
    alignSelf: "flex-end",
    marginRight: "10%",
    marginTop: 8,
    color: "#333",
  },

  button: {
    marginTop: 25,
    width: "70%",
    height: 50,
    backgroundColor: "#1B5E20",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});