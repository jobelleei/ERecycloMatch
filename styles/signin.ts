import { StyleSheet } from "react-native";

//Styles for the sign in screen.
export default StyleSheet.create({
  //Main screen container.
  container: {
    flex: 1,
    backgroundColor: "#CFE8C6",
    alignItems: "center",
    justifyContent: "center",
  },

  //Background image.
  background: {
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
  backIcon: {
    width: 24,
    height: 24,
  },

  //App logo.
  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },

  //Screen title.
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },

  //Text under the title.
  subtitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 25,
  },

  //Input field label.
  label: {
    alignSelf: "flex-start",
    marginLeft: "10%",
    marginTop: 10,
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
    marginTop: 5,
  },

  //Icon inside the input.
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#666",
  },

  //Show/hide password icon.
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: "#666",
  },

  //Text input.
  input: {
    flex: 1,
    fontSize: 14,
  },

  //Forgot password link.
  forgot: {
    alignSelf: "flex-end",
    marginRight: "10%",
    marginTop: 8,
    color: "#333",
  },

  //Main action button.
  button: {
    marginTop: 25,
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
    fontSize: 16,
    fontWeight: "bold",
  },
});