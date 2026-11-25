import { StyleSheet } from 'react-native';

//Styles for the home dashboard screen.
export const styles = StyleSheet.create({

  //Safe area wrapper.
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  //Main screen container.
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },

  //Top header row.
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },

  //Welcome message.
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },

  //Profile picture icon.
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  //Search bar wrapper.
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

  //Search text input.
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },

  //Promo banner.
  banner: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 0.5,
  },

  //Banner image.
  bannerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    opacity: 0.5,
  },

  //Text overlay on the banner.
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

  //Banner title.
  bannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000',
    lineHeight: 34,
  },

  //Banner subtitle.
  bannerSubtitle: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },

  //Content section.
  section: {
    marginBottom: 24,
  },

  //Section title row.
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  //Section title.
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  //View all link wrapper.
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  //View all text.
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },

  //Arrow icon.
  arrowIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },

  //Navigation image.
  navImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 2,
  },

  //Facility card.
  facilityCard: {
    width: 200,
    marginRight: 12,
  },

  //Facility image.
  facilityImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    resizeMode: 'cover',
  },

  //Favorite button.
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

  //Facility name.
  facilityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginTop: 6,
    textAlign: 'center',
  },

  //View more card.
  viewMoreCard: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  //View more circle button.
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

  //View more arrow.
  viewMoreArrow: {
    fontSize: 18,
    color: '#333',
  },

  //View more text.
  viewMoreText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },

  //Item card.
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  //Item image.
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
    marginRight: 12,
  },

  //Item details.
  itemInfo: {
    flex: 1,
  },

  //Item name.
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  //Item category.
  itemCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  //Item status text.
  itemStatus: {
    fontSize: 13,
    fontWeight: '600',
  },

  //Listed status color.
  statusListed: {
    color: '#2d7a2d',
  },

  //Pending status color.
  statusPending: {
    color: '#888',
  },

  //Bottom navigation bar.
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },

  //Navigation item.
  navItem: {
    alignItems: 'center',
  },

  //Navigation icon.
  navIcon: {
    fontSize: 22,
  },

  //Navigation label.
  navLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },

  //Active navigation item.
  navActive: {
    color: '#2d7a2d',
    fontWeight: '700',
  },

});