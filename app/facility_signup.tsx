import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Toast from 'react-native-toast-message'; // import toast for showing notifications instead of alert()
import { API_URL } from '../config'; //for IP URL


export default function individual_signup() {
  const router = useRouter();
  const [user, setUser] = useState("facility");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [contactNum, setContactNum] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmPass] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {//for fetching image from gallery
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
      Toast.show({//for error handling
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Permission required to access gallery.',
    });
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};


const handleSignUp = async () => {
  if (!name || !location || !email || !contactNum || !password) {
    Toast.show({
      type: 'error',
      text1: 'Missing Fields',
      text2: 'Please fill in all fields.',
    });
    return;
  }
  if (password !== confirmpass) {
    Toast.show({
      type: 'error',
      text1: 'Password Error',
      text2: 'Passwords do not match.',
    });
    return;
  }
  if (!image) {
    Toast.show({
      type: 'error',
      text1: 'Missing File',
      text2: 'Please upload your facility certification.',
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('location', location);
    formData.append('email', email);
    formData.append('contactNum', contactNum);
    formData.append('password', password);
    formData.append('confirmpass', confirmpass);
    formData.append('certification', {
      uri: image,
      name: 'certification.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(`${API_URL}/api/facility-signup`, {
      method: 'POST',
      body: formData,
  });
    const data = await response.json();

    if (response.ok) {
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Facility registered successfully!',
      });
      router.push('/signin');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: data.message || 'Something went wrong.',
      });
    }
  } catch (err: any) {
      console.log('Facility signup error:', err.message);
      Toast.show({
      type: 'error',
      text1: 'Connection Error',
      text2: 'Could not connect to server.',
    });
  }
};

  
  return (
    <View className="flex-1 bg-backg">
      <ImageBackground
        source={require("../assets/images/secondbg.png")}
        style={{
          position: 'absolute',
          bottom: 0,
          width: 400,
          height: 430,
          marginStart: 43,
          zIndex: 0
        }}>
      </ImageBackground>

      <View
        pointerEvents="none" // prevents the background image from blocking touches on buttons and inputs
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    >
      <Image
        source={require("../assets/images/bglayer.png")}
        style={{
          width: 1000,
          height: 1000,
          opacity: 0.5,
        }}
        resizeMode="cover"
      />
</View>

      <Pressable // This is for the back button
        onPress={() => router.push('/')}
        style={{
          position: 'absolute',
          top: 50,
          left: 10,
          zIndex: 10
        }}>
        <Image
          source={require("../assets/icons/backbutton.png")} 
          style={{ width: 35, height: 35, marginStart: 5 }}
        />
      </Pressable>

      <ScrollView
        style={{ zIndex: 2 }} 
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: 70,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}>

        <Image //logo (to be changed/updated)
          source={require("../assets/icons/icon.png")}
          style={{
            marginTop: 20,
            width: 100,
            height: 100,
          }}/>

        <Text className="text-3xl font-bold" 
          style={{ 
            marginTop: 5,
            textAlign: 'center',
            paddingHorizontal: 20,
          }}>Sign up and join the platform today!</Text>

        <View style={{ //user type choices
          marginTop: 25, 
          flexDirection: 'row',
          borderColor: '#7ED957',
          width: 280,
          height: 40,
          borderRadius: 10,
          borderWidth: 1,
          overflow: 'hidden',
        }}>

          <Pressable //for the individual user button
            onPress={() => {setUser("individual")
              router.push("/individual_signup");
            }}
            style={{
              flex: 1,
              backgroundColor: user === "individual" ? '#257901' : 'white',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <Image
              source={require("../assets/icons/individual.png")}
              style={{
                width: 18,
                height: 18,
                tintColor: user === "individual" ? 'white' : '#666',
              }}
            />
            <Text style={{
              color: user === "individual" ? 'white' : '#666',
              fontSize: 13,
              fontWeight: '500',
            }}>Individual</Text>
          </Pressable>

          <Pressable //for the facility/shop user button
            onPress={() => {
              setUser("facility");
              router.push('/facility_signup');
            }}
            style={{
              flex: 1,
              backgroundColor: user === "facility" ? '#257901' : 'white',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Image
              source={require("../assets/icons/facility.png")} 
              style={{
                width: 25,
                height: 25,
                tintColor: user === "facility" ? 'white' : '#666',
              }}
            />
            <Text style={{
              color: user === "facility" ? 'white' : '#666',
              fontSize: 13,
              fontWeight: '500',
            }}>Facility/Shop</Text>
          </Pressable>
        </View>

        <Text className="text-1xl font-bold" //facility name input label
          style={{
              marginTop: 30,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Facility Name</Text>

        <View style={{
          marginTop: 5,
          width: 320,
          height: 50,
        }}>
          <TextInput //facility name input form
            value={name}
            onChangeText={setName}
            placeholder="Enter Facility Name"
            placeholderTextColor="#999"
            style={{
              width: '100%',
              height: '85%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45, 
              paddingRight: 15,
              fontSize: 13,
            }}
          />

          <Image
            source={require("../assets/icons/facility.png")} //facility icon
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              zIndex: 11,
              opacity: 0.3
            }}/> 
        </View>

        <Text className="text-1xl font-bold" //location input label
          style={{
              marginTop: 10,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Location</Text>

        <View style={{
          marginTop: 5,
          width: 320,
          height: 50,
        }}>
          <TextInput //location input form
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your Location"
            placeholderTextColor="#999"
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45, 
              paddingRight: 15,
              fontSize: 13,
            }}
          />

          <Image
            source={require("../assets/icons/location.png")} //location icon
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              zIndex: 11,
              opacity: 0.3
            }}/> 
        </View>

        <Text className="text-1xl font-bold" //email input label
          style={{
              marginTop: 10,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Email</Text>

        <View style={{
          marginTop: 5,
          width: 320,
          height: 50,
        }}>
          <TextInput //Email input form
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45, 
              paddingRight: 15,
              fontSize: 13,
            }}
          />

          <Image
            source={require("../assets/icons/email.png")} //email icon
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              zIndex: 11,
              opacity: 0.3
            }}/> 
        </View>

        <Text className="text-1xl font-bold" //contact number input label
          style={{
              marginTop: 10,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Contact Number</Text>

        <View style={{
          marginTop: 5,
          width: 320,
          height: 50,
        }}>
          <TextInput //contact number input form
            value={contactNum}
            onChangeText={setContactNum}
            placeholder="Enter your Contact Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45, 
              paddingRight: 15,
              fontSize: 13,
            }}
          />

          <Image
            source={require("../assets/icons/telephone.png")} //contact number icon
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              zIndex: 11,
              opacity: 0.3
            }}/> 
        </View>

        <Text className="text-1xl font-bold" //password input label
          style={{
              marginTop: 10,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Password</Text>

        <View style={{
          marginTop: 5,
          width: 320,
          height: 50,
        }}>
          <TextInput //password input form
            value={password}
            onChangeText={setPassword}
            placeholder="Create a Password"
            placeholderTextColor="#999"
            secureTextEntry={!isPasswordVisible}
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45,
              paddingRight: 45,
              fontSize: 13,
            }}
          />
          <Image
            source={require("../assets/icons/padlock.png")}
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              opacity: 0.3
            }}
          />
          <Pressable //this is for the view/hide password function for the password form
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{
              position: 'absolute',
              right: 15,
              top: 13,
            }}
          >
            <Image
              source={
                isPasswordVisible  //changing of "eye" icon when clicked
                  ? require("../assets/icons/hide.png")
                  : require("../assets/icons/view.png")
              }
              style={{
                width: 24,
                height: 24,
                opacity: 0.3,
                top: -2
              }}
            />
          </Pressable>
        </View>

        
        <Text className="text-1xl font-bold" //confirm password label
          style={{
              marginTop: 15,
              alignSelf: 'flex-start',
              marginLeft: 45,
          }}>Confirm Password</Text>

        <View style={{
          marginTop: 10,
          width: 320,
          height: 50,
        }}>
          <TextInput //confirm password input form
            value={confirmpass}
            onChangeText={setConfirmPass}
            placeholder="Confirm your Password"
            placeholderTextColor="#999"
            secureTextEntry={!isConfirmPasswordVisible}
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#7ED957',
              paddingLeft: 45,
              paddingRight: 45,
              fontSize: 13,
            }}
          />
          <Image
            source={require("../assets/icons/padlock.png")}
            style={{
              position: 'absolute',
              left: 15,
              top: 10,
              width: 24,
              height: 24,
              opacity: 0.3
            }}
          />
          <Pressable //this is for the view/hide password function for the confirm password form
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            style={{
              position: 'absolute',
              right: 15,
              top: 13,
            }}
          >
            <Image
              source={
                isConfirmPasswordVisible  //changing of "eye" icon when clicked
                  ? require("../assets/icons/hide.png")
                  : require("../assets/icons/view.png")
              }
              style={{
                width: 24,
                height: 24,
                opacity: 0.3,
                top: -2
              }}
            />
          </Pressable>
        </View>

        <Text className="text-1xl font-bold" //upload file label
          style={{
            marginTop: 15,
            alignSelf: 'flex-start',
            marginLeft: 45,}}>Facility Certification <Text style={{ color: '#666'}}>(Required)</Text></Text>

        <Pressable
          onPress={() => { //the upload image function should be added here
            console.log('Upload certification document');
            pickImage();
          }}
          style={{
            marginTop: 15,
            width: 320,
            height: 150,
            backgroundColor: 'white',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#7ED957',
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            overflow: 'hidden', // add new code
          }}
        >
  {image ? (
    <>
      <Image //new  blocks of code added for viewwing of image inside the box field
        source={{ uri: image }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 10
        }}
        resizeMode="cover"
      />
      <Text style={{
        position: 'absolute',
        bottom: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        fontSize: 11,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
      }}>Tap to change</Text>
    </>
  ) : (
    <>
          <Image
            source={require("../assets/icons/upload.png")}
            style={{
              width: 30,
              height: 30,
              opacity: 0.4,
            }}
          />
          <Text style={{
            color: '#999',
            textAlign: 'center',
          }}>Upload Certification Document</Text>
          </>
        )}
        </Pressable>

        <Text style={{
          marginTop: 10,
          fontSize: 12,
          color: '#666',
          textAlign: 'center',
          paddingHorizontal: 40,
          width: '100%', }}>This help us verify your facility is legitimate and compliant</Text>
            
        <Pressable //sign up button
          onPress={handleSignUp} // calling the variable
          style={{
              marginTop: 30,
              width: 180,
              height: 45,
              backgroundColor: '#257901',
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
          }}
        >
          <Text className="text-white font-bold text-lg">Sign Up</Text>
        </Pressable>

        <View //social sign up choices button
          style={{
            marginTop: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
          }}>
          <Pressable //sign in with fb button
            onPress={() => router.push('/')}>
            <Image
              source={require("../assets/icons/fb.png")}
              style={{
                width: 45,
                height: 45,
              }}/>
          </Pressable>

          <Pressable //sign in with google button
            onPress={() => router.push('/')}>
            <Image
              source={require("../assets/icons/google.png")}
              style={{
                width: 45,
                height: 45,
              }}/>
          </Pressable>
        </View>

        <Pressable //already have an account button
            onPress={() => router.push('/signin')}
            style={{
                marginTop: 30,
            }}>
                <Text
                style={{
                    fontSize: 12
                }}>Already have an account? Sign in here!</Text>
            </Pressable>
      </ScrollView>
    </View>
  );
}