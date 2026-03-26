import { StyleSheet } from "react-native";

const individualSignupStyles = StyleSheet.create({
  // Background images
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    width: 400,
    height: 430,
    marginStart: 43,
    zIndex: 0,
  },
  bgLayerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  bgLayerImage: {
    width: 1000,
    height: 1000,
    opacity: 0.5,
  },

  // Back button
  backButton: {
    position: "absolute",
    top: 50,
    left: 10,
    zIndex: 3,
  },
  backButtonIcon: {
    width: 35,
    height: 35,
    marginStart: 5,
  },

  // KeyboardAvoidingView
  keyboardAvoidingView: {
    flex: 1,
    zIndex: 2,
  },

  // ScrollView
  scrollView: {
    zIndex: 2,
  },

  // ScrollView content
  scrollContent: {
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 100,
  },

  // Logo
  logo: {
    marginTop: 20,
    width: 100,
    height: 100,
  },

  // Title
  title: {
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // User type toggle container
  userTypeToggle: {
    marginTop: 25,
    flexDirection: "row",
    borderColor: "#7ED957",
    width: 280,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Individual tab - active
  individualTabActive: {
    flex: 1,
    backgroundColor: "#257901",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  // Individual tab - inactive
  individualTabInactive: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  individualTabIconActive: {
    width: 18,
    height: 18,
    tintColor: "white",
  },
  individualTabIconInactive: {
    width: 18,
    height: 18,
    tintColor: "#666",
  },
  tabTextActive: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
  tabTextInactive: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },

  // Facility tab - active
  facilityTabActive: {
    flex: 1,
    backgroundColor: "#257901",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  // Facility tab - inactive
  facilityTabInactive: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  facilityTabIconActive: {
    width: 25,
    height: 25,
    tintColor: "white",
  },
  facilityTabIconInactive: {
    width: 25,
    height: 25,
    tintColor: "#666",
  },

  // Input field labels
  firstInputLabel: {
    marginTop: 30,
    alignSelf: "flex-start",
    marginLeft: 45,
  },
  inputLabel: {
    marginTop: 10,
    alignSelf: "flex-start",
    marginLeft: 45,
  },
  confirmPasswordLabel: {
    marginTop: 15,
    alignSelf: "flex-start",
    marginLeft: 45,
  },

  // Input wrappers
  inputWrapper: {
    marginTop: 5,
    width: 320,
    height: 50,
  },
  confirmPasswordWrapper: {
    marginTop: 10,
    width: 320,
    height: 50,
  },

  // TextInput styles
  textInputShort: {
    width: "100%",
    height: "85%",
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#7ED957",
    paddingLeft: 45,
    paddingRight: 15,
    fontSize: 13,
  },
  textInputTall: {
    width: "100%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#7ED957",
    paddingLeft: 45,
    paddingRight: 15,
    fontSize: 13,
  },
  textInputTallWithRightPadding: {
    width: "100%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#7ED957",
    paddingLeft: 45,
    paddingRight: 45,
    fontSize: 13,
  },

  // Left icon inside input
  inputIconLeft: {
    position: "absolute",
    left: 15,
    top: 10,
    width: 24,
    height: 24,
    zIndex: 11,
    opacity: 0.3,
  },

  // Right icon (show/hide password)
  passwordToggle: {
    position: "absolute",
    right: 15,
    top: 13,
  },
  confirmPasswordToggle: {
    position: "absolute",
    right: 15,
    top: 10,
  },
  passwordToggleIcon: {
    width: 24,
    height: 24,
    opacity: 0.3,
  },
  confirmPasswordToggleIcon: {
    width: 24,
    height: 24,
    opacity: 0.3,
    top: -2,
  },

  // Sign Up button
  signUpButton: {
    marginTop: 30,
    width: 180,
    height: 45,
    backgroundColor: "#257901",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Social buttons row
  socialRow: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  socialIcon: {
    width: 45,
    height: 45,
  },

  // Sign in link
  signInLink: {
    marginTop: 20,
  },
  signInLinkText: {
    zIndex: 10,
    fontSize: 12,
  },
});

export default individualSignupStyles;