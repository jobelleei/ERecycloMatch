import { StyleSheet } from "react-native";

//Styles for the individual sign up screen.
export default StyleSheet.create({
  //Full screen background image.
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  //Dark layer over the background.
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(207,232,198,0.85)",
  },

  //Back button in the top corner.
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },

  //Back arrow icon.
  backButtonIcon: {
    width: 24,
    height: 24,
  },

  //Scrollable form content.
  scrollContent: {
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 40,
  },

  //App logo.
  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },

  //Screen title.
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  //Individual/facility tab switcher.
  toggleContainer: {
    flexDirection: "row",
    width: "85%",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2E7D32",
    marginBottom: 20,
  },

  //Selected tab.
  activeTab: {
    flex: 1,
    backgroundColor: "#1B5E20",
    padding: 10,
    alignItems: "center",
  },

  //Unselected tab.
  inactiveTab: {
    flex: 1,
    backgroundColor: "#E5E5E5",
    padding: 10,
    alignItems: "center",
  },

  //Selected tab text.
  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },

  //Unselected tab text.
  inactiveText: {
    color: "#000",
  },

  //Input field label.
  label: {
    alignSelf: "flex-start",
    marginLeft: "8%",
    marginBottom: 5,
    fontWeight: "600",
  },

  //Input wrapper with icon.
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

  //Icon inside the input.
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#666",
  },

  //Show/hide password icon.
  eye: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },

  //Text input.
  input: {
    flex: 1,
    color: "#000000",
  },

  //Image upload area.
  uploadBox: {
    width: "85%",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
  },

  //Preview of the uploaded image.
  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  //Main action button.
  button: {
    marginTop: 10,
    width: "70%",
    height: 50,
    backgroundColor: "#1B5E20",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  //Main action button text.
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  //Text link.
  link: {
    marginTop: 15,
  },
});