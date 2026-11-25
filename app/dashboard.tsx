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

//Import the dashboard styles.
import { styles } from '../styles/dashboard';

//Main component for the Home screen.
const HomeScreen = () => {
  //Store whether each recycling facility is liked.
  const [liked1, setLiked1] = useState(false);
  const [liked2, setLiked2] = useState(false);

  return (
    //Safe area prevents content from overlapping the device edges.
    <SafeAreaView style={styles.safeArea}>
      {/* Set the status bar text and icons to dark. */}
      <StatusBar barStyle="dark-content" />

      {/* Main scrollable container for the Home screen content. */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header section containing the welcome message and profile icon. */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <TouchableOpacity>
            <Image
              source={require('../assets/icons/icon.png')}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Search bar for finding items and recycling facilities. */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Items, Facilities..."
            placeholderTextColor="#7C7979"
          />
        </View>

        {/* Banner section displaying the main promotional image and text. */}
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

        {/* Section displaying partnered recycling facilities. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Partnered Recycling Facilities
          </Text>

          {/* Horizontal scrolling list of facility cards. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>

            {/* First recycling facility card. */}
            <TouchableOpacity style={styles.facilityCard}>
              <Image
                source={require('../assets/images/dyma.webp')}
                style={styles.facilityImage}
              />

              {/* Button for adding or removing the first facility from favorites. */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => setLiked1(!liked1)}
              >
                <Image
                  source={
                    // Display a red heart when liked, otherwise show the default heart.
                    liked1
                      ? require('../assets/icons/red.png')
                      : require('../assets/icons/heart.png')
                  }
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              {/* Display the first facility's name. */}
              <Text style={styles.facilityName}>
                Dyma Trading & Junk Shop.
              </Text>
            </TouchableOpacity>

            {/* Second recycling facility card. */}
            <TouchableOpacity style={styles.facilityCard}>
              <Image
                source={require('../assets/images/villa.webp')}
                style={styles.facilityImage}
              />

              {/* Button for adding or removing the second facility from favorites. */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => setLiked2(!liked2)}
              >
                <Image
                  source={
                    // Display a red heart when liked, otherwise show the default heart.
                    liked2
                      ? require('../assets/icons/red.png')
                      : require('../assets/icons/heart.png')
                  }
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              {/* Display the second facility's name. */}
              <Text style={styles.facilityName}>
                VILLA FE JUNK SHOP
              </Text>
            </TouchableOpacity>

            {/* Card that directs users to view more recycling facilities. */}
            <TouchableOpacity style={styles.viewMoreCard}>
              <View style={styles.viewMoreCircle}>
                <Text style={styles.viewMoreArrow}>→</Text>
              </View>
              <Text style={styles.viewMoreText}>View More</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Section for displaying recently added items. */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>

            {/* View All option for accessing the complete list of items. */}
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

      {/* Bottom navigation bar containing the main app sections. */}
      <View style={styles.bottomNav}>

        {/* Home navigation item. */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.navImage}
          />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>

        {/* Scan navigation item. */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/scan.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>

        {/* Upload navigation item. */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/upload_2.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Upload</Text>
        </TouchableOpacity>

        {/* Map navigation item. */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/map.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>

        {/* Messages navigation item. */}
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../assets/icons/chatting.png')}
            style={styles.navImage}
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>

        {/* Settings navigation item. */}
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

// Export the HomeScreen component so it can be used in other files.
export default HomeScreen;