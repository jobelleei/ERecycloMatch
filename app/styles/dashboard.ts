import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },

  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },

  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // SEARCH BOX
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEFFCF',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#7ED957',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },

  // BANNER
  banner: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 0.5,
  },

  bannerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    opacity: 0.5,
  },

  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  bannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000',
    lineHeight: 34,
  },

  bannerSubtitle: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },

  // SECTION
  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  // VIEW ALL
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },

  arrowIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },

  // 🔥 NEW: NAV ICON (THIS FIXES YOUR PROBLEM)
  navImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 2,
  },

  // FACILITY CARDS
  facilityCard: {
    width: 200,
    marginRight: 12,
  },

  facilityImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    resizeMode: 'cover',
  },

  heartBtn: {
    position: 'absolute',
    bottom: 30,
    right: 8,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  facilityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginTop: 6,
    textAlign: 'center',
  },

  viewMoreCard: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  viewMoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  viewMoreArrow: {
    fontSize: 18,
    color: '#333',
  },

  viewMoreText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },

  // ITEM CARDS
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
    marginRight: 12,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  itemCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  itemStatus: {
    fontSize: 13,
    fontWeight: '600',
  },

  statusListed: {
    color: '#2d7a2d',
  },

  statusPending: {
    color: '#888',
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },

  navItem: {
    alignItems: 'center',
  },

  navIcon: {
    fontSize: 22,
  },

  navLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },

  navActive: {
    color: '#2d7a2d',
    fontWeight: '700',
  },

});