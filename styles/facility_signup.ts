import { StyleSheet } from "react-native";

export default StyleSheet.create({
  backgroundImage: {
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

  backButtonIcon: {
    width: 24,
    height: 24,
  },

  scrollContent: {
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 40,
  },

  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  toggleContainer: {
    flexDirection: "row",
    width: "85%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E7D32",
    overflow: "hidden",
    marginBottom: 20,
  },

  activeTab: {
    flex: 1,
    backgroundColor: "#1B5E20",
    padding: 10,
    alignItems: "center",
  },

  inactiveTab: {
    flex: 1,
    backgroundColor: "#E5E5E5",
    padding: 10,
    alignItems: "center",
  },

  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },

  inactiveText: {
    color: "#000",
  },

  label: {
    alignSelf: "flex-start",
    marginLeft: "8%",
    marginBottom: 5,
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
    marginBottom: 12,
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#666",
  },

  eye: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },

  input: {
    flex: 1,
  },

 uploadBox: {
  width: "85%",
  minHeight: 120,
  borderWidth: 1,
  borderColor: "#2E7D32",
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 5,
  overflow: "hidden", // 🔥 important
},

uploadedImage: {
  width: "100%",
  height: "100%",
  resizeMode: "contain",
},

  helper: {
    fontSize: 10,
    color: "#2E7D32",
    marginBottom: 15,
    width: "85%",
  },

  button: {
    width: "70%",
    height: 50,
    backgroundColor: "#1B5E20",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  link: {
    marginTop: 15,
  },
});