import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Platform,
  Animated,
  PanResponder,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import FacilityBottomNav from "../../components/FacilityBottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { supabase } from "../../utils/supabase";

const NAV_HEIGHT = 70;

type Coord = {
  latitude: number;
  longitude: number;
};

type MapMode = "facilities" | "bins";

type MapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location?: string;
  address?: string;
  distance?: string;
  type: MapMode;
  openingDaysFrom?: string;
  openingDaysTo?: string;
  operatingHoursFrom?: string;
  operatingHoursTo?: string;
  acceptedItemTypes?: string;
  availableServices?: string;
};

const DEFAULT_DROP_OFF_BINS: MapPin[] = [
  {
    id: "default-bin-1",
    name: "Globe Store E-waste Zero Bin - SM City Bacolod",
    address:
      "Globe Store, 2/F North Wing, SM City, Reclamation Area, Bacolod, Negros Occidental",
    location:
      "Globe Store, 2/F North Wing, SM City, Reclamation Area, Bacolod, Negros Occidental",
    latitude: 10.6733468,
    longitude: 122.9420978,
    type: "bins",
  },
  {
    id: "default-bin-2",
    name: "Milabo Scrap and Resource",
    address: "Lopez Jaena St, Bacolod, Negros Occidental",
    location: "Lopez Jaena St, Bacolod, Negros Occidental",
    latitude: 10.6618621,
    longitude: 122.9550138,
    type: "bins",
  },
  {
    id: "default-bin-3",
    name: "Jalandon Junk Shop",
    address: "MXJ2+C3R, San Juan St, Bacolod, Negros Occidental",
    location: "MXJ2+C3R, San Juan St, Bacolod, Negros Occidental",
    latitude: 10.6810663,
    longitude: 122.948932,
    type: "bins",
  },
  {
    id: "default-bin-4",
    name: "Albert Junk Shop",
    address:
      "Lot 5, Sharina Heights, Block 2 Capricorn Street Subdivision, Bacolod, 6100 Negros Occidental",
    location:
      "Lot 5, Sharina Heights, Block 2 Capricorn Street Subdivision, Bacolod, 6100 Negros Occidental",
    latitude: 10.6579269,
    longitude: 122.9519758,
    type: "bins",
  },
  {
    id: "default-bin-5",
    name: "Albao JunkShops",
    address: "MX83+XVQ, Hilado Galo Sts, Bacolod, 6100 Negros Occidental",
    location: "MX83+XVQ, Hilado Galo Sts, Bacolod, 6100 Negros Occidental",
    latitude: 10.6651901,
    longitude: 122.9491131,
    type: "bins",
  },
];

export default function FacilityMapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const [facility, setFacility] = useState<any>(null);

  const mapRef = useRef<MapView | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );

  const facilitiesSignatureRef = useRef<string>("");
  const binsSignatureRef = useRef<string>("");

  const facilitiesRef = useRef<MapPin[]>([]);
  const binsRef = useRef<MapPin[]>([]);

  const handledRouteFocusKeyRef = useRef<string>("");
  const handledDropOffInterfaceKeyRef = useRef<string>("");
  const isApplyingRouteFocusRef = useRef(false);

  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("facilities");

  const [showList, setShowList] = useState(false);
  const [sortedPins, setSortedPins] = useState<MapPin[]>([]);

  const [facilities, setFacilities] = useState<MapPin[]>([]);
  const [dropOffBins, setDropOffBins] = useState<MapPin[]>([]);

  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<MapPin | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState("");

  const [search, setSearch] = useState("");
  const [loadingPins, setLoadingPins] = useState(false);

  const translateY = useRef(new Animated.Value(300)).current;

  const loadFacility = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) {
        router.replace("/signin" as any);
        return null;
      }

      const parsed = JSON.parse(stored);
      const actualUser = parsed.user || parsed.data || parsed;

      const role = String(actualUser?.role || parsed?.role || "").toLowerCase();

      if (role && role !== "facility") {
        router.replace("/user_dashboard" as any);
        return null;
      }

      const facilityId =
        actualUser?.id ||
        actualUser?.facility_id ||
        actualUser?.user_id ||
        parsed?.id ||
        parsed?.facility_id ||
        parsed?.user_id ||
        "";

      const facilityName =
        actualUser?.name ||
        actualUser?.facility_name ||
        actualUser?.username ||
        parsed?.name ||
        parsed?.facility_name ||
        parsed?.username ||
        "Facility";

      const finalFacility = {
        ...actualUser,
        id: String(facilityId),
        name: String(facilityName),
      };

      setFacility(finalFacility);

      return finalFacility;
    } catch (error) {
      console.log("LOAD FACILITY MAP USER ERROR:", error);
      return null;
    }
  };

  const getParamValue = (value: any) => {
    if (Array.isArray(value)) {
      return String(value[0] || "").trim();
    }

    return String(value || "").trim();
  };

  const shouldOpenDropOffBinsInterface = useMemo(() => {
    const mapModeParam = getParamValue(params.mapMode);
    const modeParam = getParamValue(params.mode);
    const showDropOffBinsParam = getParamValue(params.showDropOffBins);
    const openDropOffBinsParam = getParamValue(params.openDropOffBins);
    const selectedInterfaceParam = getParamValue(params.selectedInterface);
    const activeInterfaceParam = getParamValue(params.activeInterface);
    const activeTabParam = getParamValue(params.activeTab);
    const focusTypeParam = getParamValue(params.focusType);
    const selectedPinTypeParam = getParamValue(params.selectedPinType);

    return (
      mapModeParam === "bins" ||
      modeParam === "bins" ||
      showDropOffBinsParam === "true" ||
      openDropOffBinsParam === "true" ||
      selectedInterfaceParam === "drop_off_bins" ||
      activeInterfaceParam === "drop_off_bins" ||
      activeTabParam === "drop_off_bins" ||
      focusTypeParam === "drop_off_bin" ||
      selectedPinTypeParam === "bins"
    );
  }, [
    params.mapMode,
    params.mode,
    params.showDropOffBins,
    params.openDropOffBins,
    params.selectedInterface,
    params.activeInterface,
    params.activeTab,
    params.focusType,
    params.selectedPinType,
  ]);

  const dropOffInterfaceRouteKey = shouldOpenDropOffBinsInterface
    ? [
        getParamValue(params.mapMode),
        getParamValue(params.mode),
        getParamValue(params.showDropOffBins),
        getParamValue(params.openDropOffBins),
        getParamValue(params.selectedInterface),
        getParamValue(params.activeInterface),
        getParamValue(params.activeTab),
        getParamValue(params.focusType),
        getParamValue(params.selectedPinType),
      ].join("|")
    : "";

  const incomingSelectedBin = useMemo(() => {
    const rawLatitude =
      getParamValue(params.selectedBinLatitude) ||
      getParamValue(params.selectedPinLatitude) ||
      getParamValue(params.targetLatitude) ||
      getParamValue(params.latitude);

    const rawLongitude =
      getParamValue(params.selectedBinLongitude) ||
      getParamValue(params.selectedPinLongitude) ||
      getParamValue(params.targetLongitude) ||
      getParamValue(params.longitude);

    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);

    const shouldFocus =
      shouldOpenDropOffBinsInterface ||
      getParamValue(params.focusBin) === "true" ||
      getParamValue(params.openPinDetails) === "true" ||
      getParamValue(params.autoFocusPin) === "true";

    if (
      !shouldFocus ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude === 0 ||
      longitude === 0
    ) {
      return null;
    }

    const id =
      getParamValue(params.selectedBinId) ||
      getParamValue(params.selectedPinId) ||
      getParamValue(params.bin_id) ||
      `route-bin-${latitude}-${longitude}`;

    const name =
      getParamValue(params.selectedBinName) ||
      getParamValue(params.selectedPinName) ||
      getParamValue(params.targetName) ||
      getParamValue(params.bin_name) ||
      "Selected Drop Off Bin";

    const address =
      getParamValue(params.selectedBinAddress) ||
      getParamValue(params.selectedPinAddress) ||
      getParamValue(params.targetAddress) ||
      getParamValue(params.bin_address) ||
      "No address provided";

    return {
      id,
      name,
      address,
      location: address,
      latitude,
      longitude,
      type: "bins" as MapMode,
    };
  }, [
    params.selectedBinLatitude,
    params.selectedPinLatitude,
    params.targetLatitude,
    params.latitude,
    params.selectedBinLongitude,
    params.selectedPinLongitude,
    params.targetLongitude,
    params.longitude,
    params.focusBin,
    params.openPinDetails,
    params.autoFocusPin,
    params.selectedBinId,
    params.selectedPinId,
    params.bin_id,
    params.selectedBinName,
    params.selectedPinName,
    params.targetName,
    params.bin_name,
    params.selectedBinAddress,
    params.selectedPinAddress,
    params.targetAddress,
    params.bin_address,
    shouldOpenDropOffBinsInterface,
  ]);

  const incomingSelectedBinKey = incomingSelectedBin
    ? `${incomingSelectedBin.id}-${incomingSelectedBin.latitude}-${incomingSelectedBin.longitude}`
    : "";

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowList(false));
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadFacility();
    loadUserLocation();
    checkAndLoadFacilities(true, false);
    checkAndLoadDropOffBins(true, false);

    return () => {
      stopNavigation();
    };
  }, []);

  const loadUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("LOCATION PERMISSION DENIED");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(coords);

      if (incomingSelectedBin) {
        return;
      }

      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          600
        );
      }, 500);
    } catch (error) {
      console.log("LOCATION ERROR:", error);
    }
  };

  const normalizeText = (text: any) => {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getSearchWords = (keywordValue: string) => {
    return normalizeText(keywordValue)
      .split(" ")
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
  };

  const getValueFromKeys = (object: any, keys: string[]) => {
    if (!object) return "";

    for (const key of keys) {
      if (
        object[key] !== undefined &&
        object[key] !== null &&
        String(object[key]).trim() !== ""
      ) {
        return object[key];
      }
    }

    return "";
  };

  const getFacilityName = (facility: any) => {
    return (
      getValueFromKeys(facility, [
        "name",
        "facility_name",
        "business_name",
        "company_name",
        "shop_name",
        "organization_name",
        "full_name",
        "fullname",
        "username",
      ]) || "Unnamed Facility"
    );
  };

  const getFacilityAddress = (facility: any) => {
  const directAddress = getValueFromKeys(facility, [
    "location",
    "address",
    "complete_address",
    "facility_location",
    "facility_address",
  ]);

  if (directAddress) return String(directAddress);

  const barangay = getValueFromKeys(facility, ["barangay", "brgy"]);
  const municipality = getValueFromKeys(facility, [
    "municipality",
    "city",
    "city_municipality",
    "town",
  ]);
  const province = getValueFromKeys(facility, ["province"]);

  const parts = [barangay, municipality, province]
    .map((part) => String(part || "").trim())
    .filter((part) => part.length > 0);

  return parts.join(", ");
};

const getFacilityOpeningDaysFrom = (facility: any) => {
  return String(
    getValueFromKeys(facility, [
      "opening_days_from",
      "openingDaysFrom",
    ]) || ""
  ).trim();
};

const getFacilityOpeningDaysTo = (facility: any) => {
  return String(
    getValueFromKeys(facility, [
      "opening_days_to",
      "openingDaysTo",
    ]) || ""
  ).trim();
};

  const getFacilityOperatingHoursFrom = (facility: any) => {
    return String(
      getValueFromKeys(facility, [
        "operating_hours_from",
        "opening_time",
        "open_time",
        "hours_from",
      ]) || ""
    ).trim();
  };

  const getFacilityOperatingHoursTo = (facility: any) => {
    return String(
      getValueFromKeys(facility, [
        "operating_hours_to",
        "closing_time",
        "close_time",
        "hours_to",
      ]) || ""
    ).trim();
  };

  const getFacilityAcceptedItemTypes = (facility: any) => {
    return String(
      getValueFromKeys(facility, [
        "accepted_item_types",
        "accepted_items",
        "items_accepted",
        "item_types",
        "accepted_e_waste",
      ]) || ""
    ).trim();
  };

  const getFacilityAvailableServices = (facility: any) => {
    return String(
      getValueFromKeys(facility, [
        "available_services",
        "services",
        "facility_services",
        "service_offered",
        "services_offered",
      ]) || ""
    ).trim();
  };

  const formatOperatingHours = (from?: string, to?: string) => {
    const cleanFrom = String(from || "").trim();
    const cleanTo = String(to || "").trim();

    if (!cleanFrom && !cleanTo) {
      return "Not specified";
    }

    if (cleanFrom && !cleanTo) {
      return cleanFrom;
    }

    if (!cleanFrom && cleanTo) {
      return cleanTo;
    }

    return `${cleanFrom} - ${cleanTo}`;
  };

  const formatOpeningDays = (from?: string, to?: string) => {
  const cleanFrom = String(from || "").trim();
  const cleanTo = String(to || "").trim();

  if (!cleanFrom && !cleanTo) return "Not specified";
  if (cleanFrom && !cleanTo) return cleanFrom;
  if (!cleanFrom && cleanTo) return cleanTo;

  return `${cleanFrom} - ${cleanTo}`;
};

  const formatCommaText = (value?: string) => {
    const cleaned = String(value || "").trim();

    if (!cleaned) {
      return "Not specified";
    }

    return cleaned
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .join(", ");
  };

  const getLatitude = (item: any) => {
    return getValueFromKeys(item, [
      "latitude",
      "lat",
      "facility_latitude",
      "map_latitude",
    ]);
  };

  const getLongitude = (item: any) => {
    return getValueFromKeys(item, [
      "longitude",
      "lng",
      "long",
      "facility_longitude",
      "map_longitude",
    ]);
  };

  const isApprovedFacility = (profile: any) => {
    const role = normalizeText(
      getValueFromKeys(profile, ["role", "account_type", "user_type", "type"])
    );
    const status = normalizeText(
      getValueFromKeys(profile, [
        "status",
        "approval_status",
        "account_status",
        "verification_status",
      ])
    );

    const roleIsFacility =
      role.includes("facility") ||
      role.includes("recycling") ||
      role.includes("recycler");

    const statusIsApproved =
      status.includes("approved") ||
      status.includes("active") ||
      status.includes("verified");

    return roleIsFacility && statusIsApproved;
  };

  const getPinSearchText = (pin: MapPin) => {
    const typeWords =
      pin.type === "facilities"
        ? "facility facilities recycling recycle recycler e waste ewaste accepted items services operating hours"
        : "bin bins drop off dropoff e waste ewaste junk shop scrap disposal collection";

    return normalizeText(
      [
        pin.name,
        pin.address,
        pin.location,
        pin.operatingHoursFrom,
        pin.operatingHoursTo,
        pin.acceptedItemTypes,
        pin.availableServices,
        typeWords,
      ].join(" ")
    );
  };

  const filterPinsBySearch = (pinList: MapPin[], keywordValue = search) => {
    const keyword = normalizeText(keywordValue);
    const words = getSearchWords(keywordValue);

    if (!keyword || words.length === 0) {
      return pinList;
    }

    return pinList.filter((pin) => {
      const searchableText = getPinSearchText(pin);

      if (searchableText.includes(keyword)) {
        return true;
      }

      return words.every((word) => searchableText.includes(word));
    });
  };

  const getAllPins = () => {
    const combinedPins = [...facilitiesRef.current, ...binsRef.current];
    const uniquePins = new Map<string, MapPin>();

    combinedPins.forEach((pin) => {
      uniquePins.set(`${pin.type}-${pin.id}`, pin);
    });

    return Array.from(uniquePins.values());
  };

  const getPinsForSearch = (keywordValue = search) => {
    if (keywordValue.trim().length > 0) {
      return getAllPins();
    }

    return mapMode === "facilities" ? facilitiesRef.current : binsRef.current;
  };

  const extractBarangayMunicipalityProvince = (addressText: string) => {
    if (!addressText) return "";

    const parts = addressText
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length >= 3) {
      return `${parts[0]}, ${parts[1]}, ${parts[2]}, Philippines`;
    }

    if (parts.length === 2) {
      return `${parts[0]}, ${parts[1]}, Philippines`;
    }

    if (parts.length === 1) {
      return `${parts[0]}, Philippines`;
    }

    return `${addressText}, Philippines`;
  };

  const geocodeLocation = async (addressText: string) => {
    try {
      if (!addressText) return null;

      const cleanAddress = String(addressText).trim();

      const possibleAddresses = [
        cleanAddress,
        `${cleanAddress}, Philippines`,
        extractBarangayMunicipalityProvince(cleanAddress),
      ].filter((address, index, list) => {
        return address.trim().length > 0 && list.indexOf(address) === index;
      });

      for (const address of possibleAddresses) {
        const results = await Location.geocodeAsync(address);

        if (results && results.length > 0) {
          return {
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          };
        }
      }

      return null;
    } catch (error) {
      console.log("GEOCODE ERROR:", addressText, error);
      return null;
    }
  };

  const hasValidCoordinates = (latitude: any, longitude: any) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0 &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const getRowsSignature = (list: any[]) => {
    return list
      .map((row) => JSON.stringify(row))
      .sort()
      .join("::");
  };

  const getDistanceKmNumber = (a: Coord, b: Coord) => {
    const R = 6371;
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLon = (b.longitude - a.longitude) * (Math.PI / 180);

    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

    return R * c;
  };

  const getDistanceKm = (a: Coord, b: MapPin) => {
    return getDistanceKmNumber(a, {
      latitude: b.latitude,
      longitude: b.longitude,
    }).toFixed(2);
  };

  const updateNearestList = (pinList: MapPin[], keywordValue = search) => {
    const filteredPins = filterPinsBySearch(pinList, keywordValue);

    if (!userLocation) {
      setSortedPins(filteredPins);
      return filteredPins;
    }

    const sorted = filteredPins
      .map((pin) => ({
        ...pin,
        distance: getDistanceKm(userLocation, pin),
      }))
      .sort(
        (a, b) => parseFloat(a.distance || "0") - parseFloat(b.distance || "0")
      );

    setSortedPins(sorted);
    return sorted;
  };

  const buildFacilitiesFromRows = async (approvedFacilities: any[]) => {
    const finalFacilities: MapPin[] = [];

    for (const facility of approvedFacilities) {
      const addressText = getFacilityAddress(facility);
      const cleanedLocation = extractBarangayMunicipalityProvince(addressText);

      let coordinates: Coord | null = null;

      const latitude = getLatitude(facility);
      const longitude = getLongitude(facility);

      if (hasValidCoordinates(latitude, longitude)) {
        coordinates = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
      } else {
        if (!addressText) {
          continue;
        }

        coordinates = await geocodeLocation(addressText);
      }

      if (!coordinates) {
        continue;
      }

      finalFacilities.push({
      id: String(facility.id),
      name: getFacilityName(facility),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      location: cleanedLocation || addressText,
      address: addressText,
      type: "facilities",

      openingDaysFrom: getFacilityOpeningDaysFrom(facility),
      openingDaysTo: getFacilityOpeningDaysTo(facility),

      operatingHoursFrom: getFacilityOperatingHoursFrom(facility),
      operatingHoursTo: getFacilityOperatingHoursTo(facility),

      acceptedItemTypes: getFacilityAcceptedItemTypes(facility),
      availableServices: getFacilityAvailableServices(facility),
    });
    }

    return finalFacilities;
  };

  const buildBinsFromRows = async (bins: any[]) => {
    const finalBins: MapPin[] = [];

    for (const bin of bins) {
      const addressText = String(
        getValueFromKeys(bin, ["location", "address", "complete_address"]) || ""
      ).trim();

      const cleanedLocation = extractBarangayMunicipalityProvince(addressText);

      let coordinates: Coord | null = null;

      const latitude = getLatitude(bin);
      const longitude = getLongitude(bin);

      if (hasValidCoordinates(latitude, longitude)) {
        coordinates = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
      } else {
        if (!addressText) {
          continue;
        }

        coordinates = await geocodeLocation(addressText);
      }

      if (!coordinates) {
        continue;
      }

      finalBins.push({
        id: String(bin.id),
        name:
          getValueFromKeys(bin, ["name", "bin_name", "title"]) ||
          "Unnamed Drop Off Bin",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        location: cleanedLocation || addressText,
        address: addressText,
        type: "bins",
      });
    }

    return finalBins;
  };

  const checkAndLoadFacilities = async (
    forceLoad = false,
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoadingPins(true);
      }

      const { data, error } = await supabase.from("profiles").select("*");

      if (error) {
        console.log("CHECK FACILITIES ERROR:", error);
        return facilitiesRef.current;
      }

      const approvedFacilities = (data || []).filter((profile: any) =>
        isApprovedFacility(profile)
      );

      const newSignature = getRowsSignature(approvedFacilities);

      const hasChanges =
        forceLoad ||
        facilitiesSignatureRef.current === "" ||
        facilitiesSignatureRef.current !== newSignature;

      if (!hasChanges) {
        if (mapMode === "facilities") {
          updateNearestList(facilitiesRef.current, search);
        }

        return facilitiesRef.current;
      }

      const finalFacilities = await buildFacilitiesFromRows(approvedFacilities);

      facilitiesSignatureRef.current = newSignature;
      facilitiesRef.current = finalFacilities;

      setFacilities(finalFacilities);

      if (mapMode === "facilities") {
        updateNearestList(finalFacilities, search);
      }

      return finalFacilities;
    } catch (error) {
      console.log("CHECK AND LOAD FACILITIES ERROR:", error);
      return facilitiesRef.current;
    } finally {
      setLoadingPins(false);
    }
  };

  const checkAndLoadDropOffBins = async (
    forceLoad = false,
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoadingPins(true);
      }

      const { data, error } = await supabase
        .from("e_waste_drop_off_bins")
        .select("*");

      if (error) {
        binsSignatureRef.current = "default-drop-off-bins";
        binsRef.current = DEFAULT_DROP_OFF_BINS;

        setDropOffBins(DEFAULT_DROP_OFF_BINS);

        if (mapMode === "bins") {
          updateNearestList(DEFAULT_DROP_OFF_BINS, search);
        }

        return DEFAULT_DROP_OFF_BINS;
      }

      const activeBins = (data || []).filter((bin: any) => {
        const status = normalizeText(
          getValueFromKeys(bin, ["status", "state"]) || "active"
        );

        return (
          status === "" ||
          status.includes("active") ||
          status.includes("approved") ||
          status.includes("open")
        );
      });

      const newSignature = getRowsSignature(activeBins);

      const hasChanges =
        forceLoad ||
        binsSignatureRef.current === "" ||
        binsSignatureRef.current !== newSignature;

      if (!hasChanges) {
        if (mapMode === "bins") {
          updateNearestList(binsRef.current, search);
        }

        return binsRef.current;
      }

      let finalBins = await buildBinsFromRows(activeBins);

      if (finalBins.length === 0) {
        finalBins = DEFAULT_DROP_OFF_BINS;
      }

      binsSignatureRef.current =
        finalBins.length > 0 ? newSignature || "default-drop-off-bins" : "";

      binsRef.current = finalBins;

      setDropOffBins(finalBins);

      if (mapMode === "bins") {
        updateNearestList(finalBins, search);
      }

      return finalBins;
    } catch (error) {
      console.log("CHECK AND LOAD DROP OFF BINS ERROR:", error);

      binsSignatureRef.current = "default-drop-off-bins";
      binsRef.current = DEFAULT_DROP_OFF_BINS;

      setDropOffBins(DEFAULT_DROP_OFF_BINS);

      if (mapMode === "bins") {
        updateNearestList(DEFAULT_DROP_OFF_BINS, search);
      }

      return DEFAULT_DROP_OFF_BINS;
    } finally {
      setLoadingPins(false);
    }
  };

  const findMatchingBinPin = (targetPin: MapPin, pinList: MapPin[]) => {
    const exactIdMatch = pinList.find(
      (pin) => String(pin.id) === String(targetPin.id)
    );

    if (exactIdMatch) return exactIdMatch;

    const exactNameMatch = pinList.find(
      (pin) => normalizeText(pin.name) === normalizeText(targetPin.name)
    );

    if (exactNameMatch) return exactNameMatch;

    const coordinateMatch = pinList.find((pin) => {
      const latDifference = Math.abs(Number(pin.latitude) - targetPin.latitude);
      const lngDifference = Math.abs(
        Number(pin.longitude) - targetPin.longitude
      );

      return latDifference < 0.0008 && lngDifference < 0.0008;
    });

    if (coordinateMatch) return coordinateMatch;

    return targetPin;
  };

  const focusIncomingDropOffBin = async (targetPin: MapPin) => {
    try {
      isApplyingRouteFocusRef.current = true;

      setMapMode("bins");
      setSearch("");
      setShowList(false);

      const latestBins = await checkAndLoadDropOffBins(true, true);
      const matchedBin = findMatchingBinPin(targetPin, latestBins);

      const binExists = latestBins.some(
        (pin) => String(pin.id) === String(matchedBin.id)
      );

      const finalBins = binExists ? latestBins : [matchedBin, ...latestBins];

      binsRef.current = finalBins;
      setDropOffBins(finalBins);
      updateNearestList(finalBins, "");

      setSelectedPin(matchedBin);

      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: matchedBin.latitude,
            longitude: matchedBin.longitude,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          },
          800
        );
      }, 600);

      setTimeout(() => {
        isApplyingRouteFocusRef.current = false;
      }, 1200);
    } catch (error) {
      console.log("FOCUS INCOMING DROP OFF BIN ERROR:", error);
      isApplyingRouteFocusRef.current = false;
    }
  };

  const openDropOffBinsInterfaceFromRoute = async () => {
    try {
      isApplyingRouteFocusRef.current = true;

      setMapMode("bins");
      setSearch("");
      setSelectedPin(null);

      const latestBins = await checkAndLoadDropOffBins(true, true);

      binsRef.current = latestBins;
      setDropOffBins(latestBins);
      updateNearestList(latestBins, "");

      setShowList(true);
      translateY.setValue(300);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      const firstPinToFocus =
        userLocation && latestBins.length > 0
          ? [...latestBins]
              .map((pin) => ({
                ...pin,
                distanceNumber: getDistanceKmNumber(userLocation, pin),
              }))
              .sort((a, b) => a.distanceNumber - b.distanceNumber)[0]
          : latestBins[0];

      if (firstPinToFocus) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: firstPinToFocus.latitude,
              longitude: firstPinToFocus.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            800
          );
        }, 500);
      }

      setTimeout(() => {
        isApplyingRouteFocusRef.current = false;
      }, 1200);
    } catch (error) {
      console.log("OPEN DROP OFF BINS INTERFACE FROM ROUTE ERROR:", error);
      isApplyingRouteFocusRef.current = false;
    }
  };

  const refreshCurrentModePins = async (showLoader = true) => {
    if (mapMode === "facilities") {
      return await checkAndLoadFacilities(false, showLoader);
    }

    return await checkAndLoadDropOffBins(false, showLoader);
  };

  const openPinsList = async () => {
    if (search.trim().length > 0) {
      const latestFacilities = await checkAndLoadFacilities(true, true);
      const latestBins = await checkAndLoadDropOffBins(true, true);
      const latestPins = [...latestFacilities, ...latestBins];

      updateNearestList(latestPins, search);
    } else {
      const latestPins = await refreshCurrentModePins(true);

      updateNearestList(latestPins, search);
    }

    setShowList(true);
    setSelectedPin(null);

    translateY.setValue(300);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = async () => {
    const cleanSearch = search.trim();

    const latestFacilities = await checkAndLoadFacilities(true, true);
    const latestBins = await checkAndLoadDropOffBins(true, true);

    const latestPins = cleanSearch
      ? [...latestFacilities, ...latestBins]
      : mapMode === "facilities"
        ? latestFacilities
        : latestBins;

    const filteredPins = updateNearestList(latestPins, cleanSearch);

    if (!cleanSearch) {
      setSelectedPin(null);
      setShowList(true);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      return;
    }

    if (filteredPins.length > 0) {
      const firstResult = filteredPins[0];

      goToPinOnMap(firstResult);
      setSelectedPin(firstResult);
      setShowList(true);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      return;
    }

    setSelectedPin(null);
    setShowList(true);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    Alert.alert(
      "Not Found",
      "No facility or drop off bin matched your search."
    );
  };

  const goToPinOnMap = (pin: MapPin) => {
    mapRef.current?.animateToRegion(
      {
        latitude: pin.latitude,
        longitude: pin.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      700
    );
  };

  const openPinDetails = (pin: MapPin) => {
  console.log(pin);

  setSelectedPin(pin);
  setShowList(false);
  goToPinOnMap(pin);
};

  const isOwnFacilityPin = (pin: MapPin | null) => {
    if (!pin || pin.type !== "facilities") return false;

    return String(pin.id) === String(facility?.id || "");
  };

  const viewFacilityProfile = (pin: MapPin) => {
    if (pin.type !== "facilities") return;

    if (isOwnFacilityPin(pin)) {
      router.push("/facility_dashboard/profile" as any);
      return;
    }

    router.push({
      pathname: "/facility_dashboard/facility_view_profile" as any,
      params: {
        facility_id: pin.id,
      },
    });
  };

  const stopNavigation = async () => {
    try {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }

      setIsNavigating(false);
      setNavigationTarget(null);
      setRemainingDistance("");
    } catch (error) {
      console.log("STOP NAVIGATION ERROR:", error);
    }
  };

  const startNavigation = async (pin: MapPin) => {
    try {
      if (isOwnFacilityPin(pin)) {
        Alert.alert(
          "This is your facility",
          "You cannot start directions to your own pinned facility."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please allow location access to get directions."
        );
        return;
      }

      await stopNavigation();

      setSelectedPin(null);
      setShowList(false);
      setNavigationTarget(pin);
      setIsNavigating(true);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentCoords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setUserLocation(currentCoords);

      const initialDistance = getDistanceKmNumber(currentCoords, {
        latitude: pin.latitude,
        longitude: pin.longitude,
      });

      setRemainingDistance(initialDistance.toFixed(2));

      mapRef.current?.fitToCoordinates(
        [
          currentCoords,
          {
            latitude: pin.latitude,
            longitude: pin.longitude,
          },
        ],
        {
          edgePadding: {
            top: 120,
            right: 80,
            bottom: 220,
            left: 80,
          },
          animated: true,
        }
      );

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          const liveCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          setUserLocation(liveCoords);

          const distance = getDistanceKmNumber(liveCoords, {
            latitude: pin.latitude,
            longitude: pin.longitude,
          });

          setRemainingDistance(distance.toFixed(2));

          if (distance <= 0.05) {
            Alert.alert(
              "Arrived",
              `You are near ${pin.name}. Navigation will stop.`
            );

            stopNavigation();
          }
        }
      );

      locationSubscriptionRef.current = subscription;
    } catch (error) {
      console.log("START NAVIGATION ERROR:", error);

      Alert.alert(
        "Navigation Error",
        "Unable to start directions. Please check your location permission."
      );

      stopNavigation();
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearch(text);

    const currentPins =
      text.trim().length > 0
        ? getAllPins()
        : mapMode === "facilities"
          ? facilitiesRef.current
          : binsRef.current;

    updateNearestList(currentPins, text);

    if (text.trim().length > 0) {
      setShowList(true);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setSelectedPin(null);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSelectedPin(null);

    const currentPins =
      mapMode === "facilities" ? facilitiesRef.current : binsRef.current;

    updateNearestList(currentPins, "");
  };

  const switchMapMode = async (mode: MapMode) => {
    setMapMode(mode);
    setSearch("");
    setSelectedPin(null);
    setShowList(false);

    if (mode === "facilities") {
      const latestFacilities = await checkAndLoadFacilities(false, true);
      updateNearestList(latestFacilities, "");
    } else {
      const latestBins = await checkAndLoadDropOffBins(false, true);
      updateNearestList(latestBins, "");
    }
  };

  const renderFacilityInfoRow = (label: string, value: string) => {
    return (
      <View style={styles.facilityInfoRow}>
        <Text style={styles.facilityInfoLabel}>{label}</Text>
        <Text style={styles.facilityInfoValue}>{value}</Text>
      </View>
    );
  };

  const currentMapPins =
    search.trim().length > 0
      ? filterPinsBySearch([...facilities, ...dropOffBins], search)
      : mapMode === "facilities"
        ? filterPinsBySearch(facilities, search)
        : filterPinsBySearch(dropOffBins, search);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search facilities or drop off bins..."
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchTextChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          )}

          <Image
            source={require("../../assets/icons/icon.png")}
            style={styles.avatar}
          />
        </View>

        <View style={styles.modeButtonContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mapMode === "facilities" && styles.activeModeButton,
            ]}
            onPress={() => switchMapMode("facilities")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mapMode === "facilities" && styles.activeModeButtonText,
              ]}
            >
              Facilities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              mapMode === "bins" && styles.activeModeButton,
            ]}
            onPress={() => switchMapMode("bins")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mapMode === "bins" && styles.activeModeButtonText,
              ]}
            >
              E-Waste Drop Off Bins
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={openPinsList}>
          {loadingPins ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {mapMode === "facilities"
                ? "Show Facilities List"
                : "Show Drop Off Bins"}
            </Text>
          )}
        </TouchableOpacity>

        <MapView
          ref={mapRef}
          style={{ flex: 1, paddingBottom: NAV_HEIGHT }}
          showsUserLocation
          showsMyLocationButton={Platform.OS === "android"}
          initialRegion={{
            latitude: 10.6733468,
            longitude: 122.9420978,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {currentMapPins.map((pin) => (
            <Marker
              key={`${pin.type}-${pin.id}`}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              title={pin.name}
              description={pin.location || pin.address || ""}
              onPress={() => openPinDetails(pin)}
            >
              <View
                style={
                  pin.type === "facilities"
                    ? styles.facilityMarkerOuter
                    : styles.binMarkerOuter
                }
              >
                <View
                  style={
                    pin.type === "facilities"
                      ? styles.facilityMarkerInner
                      : styles.binMarkerInner
                  }
                />
              </View>
            </Marker>
          ))}

          {isNavigating && userLocation && navigationTarget && (
            <Polyline
              coordinates={[
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                {
                  latitude: navigationTarget.latitude,
                  longitude: navigationTarget.longitude,
                },
              ]}
              strokeWidth={5}
              strokeColor="#1b5e20"
            />
          )}
        </MapView>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>

          <View style={styles.row}>
            <View style={styles.blueDot} />
            <Text>Your Location</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.greenDot} />
            <Text>Recycling Facility</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.orangeDot} />
            <Text>E-Waste Drop Off Bin</Text>
          </View>

          {isNavigating && (
            <View style={styles.row}>
              <View style={styles.routeLine} />
              <Text>Direction Route</Text>
            </View>
          )}
        </View>

        {isNavigating && navigationTarget && (
          <View style={styles.routeBox}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle} numberOfLines={1}>
                Direction Route
              </Text>

              <Text style={styles.routeText} numberOfLines={1}>
                To: {navigationTarget.name}
              </Text>

              <Text style={styles.routeDistance}>
                Remaining distance: {remainingDistance || "0.00"} km
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cancelRouteButton}
              onPress={stopNavigation}
            >
              <Text style={styles.cancelRouteText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedPin && (
          <View style={styles.detailsBox}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.detailsScroll}
            >
              <Text style={styles.detailsTitle}>{selectedPin.name}</Text>

              <Text style={styles.typeLabel}>
                {selectedPin.type === "facilities"
                  ? "Recycling Facility"
                  : "E-Waste Drop Off Bin"}
              </Text>

              <Text style={styles.detailsAddress}>
                {selectedPin.location ||
                  selectedPin.address ||
                  "No address provided"}
              </Text>

            {selectedPin.type === "facilities" && (
              <View style={styles.facilityInfoBox}>
                {renderFacilityInfoRow(
                  "Opening Days",
                  formatOpeningDays(
                    selectedPin.openingDaysFrom,
                    selectedPin.openingDaysTo
                  )
                )}

                {renderFacilityInfoRow(
                  "Operating Hours",
                  formatOperatingHours(
                    selectedPin.operatingHoursFrom,
                    selectedPin.operatingHoursTo
                  )
                )}

                {renderFacilityInfoRow(
                  "Accepted Items",
                  formatCommaText(selectedPin.acceptedItemTypes)
                )}

                {renderFacilityInfoRow(
                  "Available Services",
                  formatCommaText(selectedPin.availableServices)
                )}
              </View>
            )}

              {isOwnFacilityPin(selectedPin) && (
                <Text style={styles.ownFacilityNote}>
                  This is your facility pin.
                </Text>
              )}

              <View style={styles.detailsButtonRow}>
                {selectedPin.type === "facilities" && (
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => viewFacilityProfile(selectedPin)}
                  >
                    <Text style={styles.profileButtonText}>
                      {isOwnFacilityPin(selectedPin)
                        ? "View My Profile"
                        : "View Profile"}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isOwnFacilityPin(selectedPin) && (
                  <TouchableOpacity
                    style={styles.goButton}
                    onPress={() => startNavigation(selectedPin)}
                  >
                    <Text style={styles.goButtonText}>
                      {selectedPin.type === "facilities"
                        ? "Go to this Facility"
                        : "Go to this Bin"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeDetailsButton}
                onPress={() => setSelectedPin(null)}
              >
                <Text style={styles.closeDetailsText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {showList && (
          <Animated.View
            style={[
              styles.listContainer,
              { bottom: NAV_HEIGHT, transform: [{ translateY }] },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragBar} />

            <Text style={styles.listTitle}>
              {search.trim().length > 0
                ? `Search Results for "${search.trim()}"`
                : mapMode === "facilities"
                  ? "Facilities List"
                  : "E-Waste Drop Off Bins"}
            </Text>

            <FlatList
              data={sortedPins}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => openPinDetails(item)}
                >
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>

                  {search.trim().length > 0 && (
                    <Text style={styles.listTypeText}>
                      {item.type === "facilities"
                        ? "Recycling Facility"
                        : "E-Waste Drop Off Bin"}
                    </Text>
                  )}

                  <Text style={{ color: "#555" }}>
                    {item.distance
                      ? `${item.distance} km away`
                      : "Distance not ready"}
                  </Text>

                  <Text style={{ color: "#777", marginTop: 3 }}>
                    {item.location || item.address || "No address"}
                  </Text>

                  {item.type === "facilities" && (
                    <Text style={styles.listExtraText} numberOfLines={2}>
                      Accepted Items: {formatCommaText(item.acceptedItemTypes)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {search.trim().length > 0
                    ? "No facility or drop off bin matched your search."
                    : mapMode === "facilities"
                      ? "No approved facilities with exact location found."
                      : "No active e-waste drop off bins found."}
                </Text>
              }
            />
          </Animated.View>
        )}

      <FacilityBottomNav
        facilityId={facility?.id || ""}
        active="map"
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#dff0d8",
    padding: 12,
    borderRadius: 25,
  },

  clearSearchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },

  clearSearchText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#555",
    marginTop: -2,
  },

  avatar: {
    width: 40,
    height: 40,
    marginLeft: 10,
    borderRadius: 20,
  },

  modeButtonContainer: {
    position: "absolute",
    top: 65,
    left: 12,
    right: 12,
    zIndex: 3,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  modeButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  activeModeButton: {
    backgroundColor: "#1b5e20",
  },

  modeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b5e20",
    textAlign: "center",
  },

  activeModeButtonText: {
    color: "#fff",
  },

  button: {
    position: "absolute",
    top: 115,
    alignSelf: "center",
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    zIndex: 3,
  },

  facilityMarkerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 128, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "green",
  },

  facilityMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "green",
  },

  binMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 152, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff9800",
  },

  binMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff9800",
  },

  legend: {
    position: "absolute",
    bottom: NAV_HEIGHT + 90,
    left: 20,
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    zIndex: 1,
    elevation: 1,
  },

  legendTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  blueDot: {
    width: 10,
    height: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    marginRight: 5,
  },

  greenDot: {
    width: 10,
    height: 10,
    backgroundColor: "green",
    borderRadius: 5,
    marginRight: 5,
  },

  orangeDot: {
    width: 10,
    height: 10,
    backgroundColor: "#ff9800",
    borderRadius: 5,
    marginRight: 5,
  },

  routeLine: {
    width: 16,
    height: 4,
    backgroundColor: "#1b5e20",
    borderRadius: 2,
    marginRight: 5,
  },

  routeBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: NAV_HEIGHT + 15,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    zIndex: 30,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  routeInfo: {
    flex: 1,
    marginRight: 10,
  },

  routeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1b5e20",
  },

  routeText: {
    marginTop: 3,
    fontSize: 12,
    color: "#444",
  },

  routeDistance: {
    marginTop: 3,
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "700",
  },

  cancelRouteButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelRouteText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  detailsBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: NAV_HEIGHT + 15,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    zIndex: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    maxHeight: 360,
  },

  detailsScroll: {
    maxHeight: 330,
  },

  detailsTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1b5e20",
  },

  typeLabel: {
    marginTop: 3,
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },

  detailsAddress: {
    marginTop: 5,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  facilityInfoBox: {
    marginTop: 10,
    backgroundColor: "#f4f8f4",
    borderRadius: 12,
    padding: 10,
  },

  facilityInfoRow: {
    marginBottom: 8,
  },

  facilityInfoLabel: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "700",
    marginBottom: 2,
  },

  facilityInfoValue: {
    fontSize: 12,
    color: "#444",
    lineHeight: 17,
  },

  ownFacilityNote: {
    marginTop: 8,
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "700",
  },

  detailsButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  profileButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1b5e20",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  profileButtonText: {
    color: "#1b5e20",
    fontWeight: "700",
    fontSize: 12,
  },

  goButton: {
    flex: 1,
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  goButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  closeDetailsButton: {
    marginTop: 8,
    alignItems: "center",
  },

  closeDetailsText: {
    color: "#777",
    fontWeight: "600",
    fontSize: 12,
  },

  listContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    maxHeight: 260,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    zIndex: 10,
    elevation: 10,
  },

  listTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  listTypeText: {
    color: "#1b5e20",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  listExtraText: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
  },

  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: "#aaa",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
});