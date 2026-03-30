import { StyleSheet } from "react-native";

const facilitySignupStyles = StyleSheet.create({
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

  backButton: {
    position: "absolute",
    top: 50,
    left: 10,
    zIndex: 10,
  },
  backButtonIcon: {
    width: 35,
    height: 35,
    marginStart: 5,
  },

  scrollView: {
    zIndex: 2,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 100,
  },

  logo: {
    marginTop: 20,
    width: 100,
    height: 100,
  },

  title: {
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 20,
  },

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
  individualTabActive: {
    flex: 1,
    backgroundColor: "#257901",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
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
  facilityTabActive: {
    flex: 1,
    backgroundColor: "#257901",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
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
  uploadLabel: {
    marginTop: 15,
    alignSelf: "flex-start",
    marginLeft: 45,
  },
  uploadLabelSub: {
    color: "#666",
  },

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

  inputIconLeft: {
    position: "absolute",
    left: 15,
    top: 10,
    width: 24,
    height: 24,
    zIndex: 11,
    opacity: 0.3,
  },

  passwordToggle: {
    position: "absolute",
    right: 15,
    top: 13,
  },
  passwordToggleIcon: {
    width: 24,
    height: 24,
    opacity: 0.3,
    top: -2,
  },

  uploadBox: {
    marginTop: 15,
    width: 320,
    height: 300,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7ED957",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  uploadedImageLabel: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    color: "white",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  uploadIcon: {
    width: 50,
    height: 50,
    opacity: 0.4,
  },
  uploadPlaceholderText: {
    color: "#999",
    textAlign: "center",
  },

  uploadHelperText: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
    width: "100%",
  },

  signUpButton: {
    marginTop: 30,
    width: 180,
    height: 45,
    backgroundColor: "#257901",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

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

  signInLink: {
    marginTop: 30,
  },
  signInLinkText: {
    fontSize: 12,
  },
});

export default facilitySignupStyles;