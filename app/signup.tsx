import { ImageBackground, View, Image, Pressable, Text, TextInput } from "react-native";
import { useRouter } from 'expo-router';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { useState } from "react";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="flex-1 justify-center items-center bg-backg">
      <ImageBackground
        source={require("../assets/images/firstbg.png")}
        style={{ 
          position: 'absolute',
          bottom: 0, 
          width: 450, 
          height: 530
        }}>
      </ImageBackground>

      <Image
        source={require("../assets/images/bglayer.png")}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1000, 
          height: 1000, 
          opacity: 0.5,
          zIndex: 1
        }}
        resizeMode="cover"
      />

      <Pressable
        onPress={() => router.push('/')}
        style={{ 
          position: 'absolute',
          top: 50,
          left: 10,
          zIndex: 10
        }}
      >
        <Image
          source={require("../assets/images/backbutton.png")} 
          style={{ width: 35, height: 35, marginStart: 5 }}
        />
      </Pressable>

      <Image
        source={require("../assets/images/icon.png")}
        style={{
          position: 'absolute',
          top: 110,
          zIndex: 10,
          width: 110,
          height: 110,
        }}
      />

      <Text className="text-4xl font-bold" 
        style={{ 
          position: 'absolute',
          top: 215,
          zIndex: 10,
        }}>Welcome Back!
      </Text>

      <Text className="text-1xl" 
        style={{ 
          position: 'absolute',
          top: 250,
          zIndex: 10,
        }}>Sign in to continue recycling.
      </Text>

      <Text className="text-1xl font-bold"
        style={{
            position: 'absolute',
            zIndex: 10,
            top: 310,
            left: 50
        }}>Email</Text>

      <View style={{
        position: 'absolute',
        top: 335,
        alignSelf: 'center',
        zIndex: 10,
        width: 320,
        height: 50,
      }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Email"
          placeholderTextColor="#999"
          style={{
            width: '100%',
            height: '100%',
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
          source={require("../assets/images/email.png")}
          style={{
            position: 'absolute',
            left: 15,
            top: 13,
            width: 24,
            height: 24,
            zIndex: 11,
            opacity: 0.3
          }}
        /> 
      </View>

      <Text className="text-1xl font-bold"
        style={{
            position: 'absolute',
            zIndex: 10,
            top: 400,
            left: 50
        }}>Password</Text>

      <View style={{
        position: 'absolute',
        top: 425,  
        alignSelf: 'center',
        zIndex: 10,
        width: 320,
        height: 50,
      }}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry={true} 
          style={{
            width: '100%',
            height: '100%',
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
          source={require("../assets/images/padlock.png")} 
          style={{
            position: 'absolute',
            left: 15,
            top: 13,
            width: 24,
            height: 24,
            zIndex: 11,
            opacity: 0.3
          }}
        /> 
      </View>

      <Pressable
        onPress={() => router.push('/')}
        style={{
            position: 'absolute',
            top: 485,
            right: 50,
            zIndex: 10,
        }}
        >
        <Text className="text-sm">
            Forgot Password?
        </Text>
    </Pressable>


      <Pressable
        onPress={() => router.push('/')}
        style={{
            position: 'absolute',
            top: 525,
            zIndex: 10,
            width: 180,
            height: 45,
            backgroundColor: '#257901',
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        }}
        >
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </Pressable>

      <Text
      style={{
        position: 'absolute',
        zIndex: 10,
        fontSize: 12,
        marginTop: 300
      }}>or continue with</Text>
    </View>
  );
}