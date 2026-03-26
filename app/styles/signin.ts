import { StyleSheet } from "react-native";
 
const signinStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#backg", // keep using bg-backg via className on View
  },
 
  // Background images
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    width: 450,
    height: 530,
  },
  bgLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1000,
    height: 1000,
    opacity: 0.5,
    zIndex: 1,
  },
 
  // Back button
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
 
  // Logo
  logo: {
    position: "absolute",
    top: 110,
    zIndex: 10,
    width: 110,
    height: 110,
  },
 
  // Welcome text
  welcomeText: {
    position: "absolute",
    top: 215,
    zIndex: 10,
  },
 
  // Subtitle
  subtitleText: {
    position: "absolute",
    top: 250,
    zIndex: 10,
    textAlign: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
 
  // Email label
  emailLabel: {
    position: "absolute",
    zIndex: 10,
    top: 310,
    left: 50,
  },
 
  // Email input wrapper
  emailInputWrapper: {
    position: "absolute",
    top: 335,
    alignSelf: "center",
    zIndex: 10,
    width: 320,
    height: 50,
  },
 
  // Password label
  passwordLabel: {
    position: "absolute",
    zIndex: 10,
    top: 400,
    left: 50,
  },
 
  // Password input wrapper
  passwordInputWrapper: {
    position: "absolute",
    top: 425,
    alignSelf: "center",
    zIndex: 10,
    width: 320,
    height: 50,
  },
 
  // Shared TextInput style
  textInput: {
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#7ED957",
    paddingRight: 15,
    fontSize: 13,
  },
  textInputWithRightPadding: {
    paddingLeft: 45,
    paddingRight: 45,
  },
  textInputWithLeftPadding: {
    paddingLeft: 45,
  },
 
  // Left icon inside input
  inputIconLeft: {
    position: "absolute",
    left: 15,
    top: 13,
    width: 24,
    height: 24,
    zIndex: 11,
    opacity: 0.3,
  },
 
  // Right icon (show/hide password)
  inputIconRight: {
    position: "absolute",
    right: 15,
    top: 13,
    zIndex: 11,
  },
  inputIconRightImage: {
    width: 24,
    height: 24,
    opacity: 0.3,
  },
 
  // Forgot password
  forgotPassword: {
    position: "absolute",
    top: 485,
    right: 50,
    zIndex: 15,
    width: 120,
  },
 
  // Sign In button
  signInButton: {
    position: "absolute",
    top: 525,
    zIndex: 10,
    width: 180,
    height: 45,
    backgroundColor: "#257901",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
 
  // "or continue with" text
  orContinueText: {
    position: "absolute",
    zIndex: 10,
    fontSize: 12,
    marginTop: 345,
    width: 120,
    textAlign: "center",
  },
 
  // Social buttons row
  socialRow: {
    position: "absolute",
    top: 670,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  socialIcon: {
    width: 45,
    height: 45,
  },
 
  // Sign up link
  signUpLink: {
    position: "absolute",
    zIndex: 10,
    bottom: 40,
  },
  signUpLinkText: {
    zIndex: 10,
    fontSize: 12,
  },
});
 
export default signinStyles;