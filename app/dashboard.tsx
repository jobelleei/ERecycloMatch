import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { styles } from './styles/dashboard';

const HomeScreen = () => {
  const [liked1, setLiked1] = useState(false);
  const [liked2, setLiked2] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Welcome */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <TouchableOpacity>
            <Image
              source={require('../assets/icons/icon.png')}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>

        {/*Search Bar*/}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Items, Facilities..."
            placeholderTextColor="#7C7979"
          />
        </View>

        <View style={styles.banner}>
          <Image
            source={require('../assets/images/banner.jpg')}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>
              RECYCLE SMARTER{'\n'}MATCH FASTER
            </Text>
            <Text style={styles.bannerSubtitle}>
              Find the right place for your e-waste with just a few clicks.
            </Text>
          </View>
        </View>

        {/*Partnered Recycling Facilities*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Partnered Recycling Facilities
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>

            <TouchableOpacity style={styles.facilityCard}>
              <Image
                source={require('../assets/images/dyma.webp')}
                style={styles.facilityImage}
              />

              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => setLiked1(!liked1)}
              >
                <Image
                  source={
                    liked1
                      ? require('../assets/icons/red.png')
                      : require('../assets/icons/heart.png')
                  }
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              <Text style={styles.facilityName}>
                Dyma Trading & Junk Shop.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.facilityCard}>
              <Image
                source={require('../assets/images/villa.webp')}
                style={styles.facilityImage}
              />

              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => setLiked2(!liked2)}
              >
                <Image
                  source={
                    liked2
                      ? require('../assets/icons/red.png')
                      : require('../assets/icons/heart.png')
                  }
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              <Text style={styles.facilityName}>
                VILLA FE JUNK SHOP
              </Text>
            </TouchableOpacity>

            {/* View More */}
            <TouchableOpacity style={styles.viewMoreCard}>
              <View style={styles.viewMoreCircle}>
                <Text style={styles.viewMoreArrow}>→</Text>
              </View>
              <Text style={styles.viewMoreText}>View More</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Recent Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>

            <TouchableOpacity style={styles.viewAllContainer}>
              <Text style={styles.viewAllText}>View All</Text>
              <Image
                source={require('../assets/icons/greater.png')}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.navImage}
          />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/scan.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/upload_2.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/map.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/chatting.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/setting_1.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Setting</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

export default HomeScreen;