import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/*
 * Shown on every screen while the phone has no working internet, so empty
 * lists and a blank map are not mistaken for "no data". Also covers weak
 * signal: connected to Wi-Fi or data, but nothing gets through.
 *
 * Briefly says "Back online" when the connection returns.
 * Touches pass through it, so it never blocks the screen below.
 */
export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [backOnline, setBackOnline] = useState(false);
  const wasOffline = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable is null while still checking: not offline yet
      const isOffline =
        state.isConnected === false || state.isInternetReachable === false;

      setOffline(isOffline);

      if (hideTimer.current) clearTimeout(hideTimer.current);

      if (isOffline) {
        wasOffline.current = true;
        setBackOnline(false);
      } else if (wasOffline.current) {
        wasOffline.current = false;
        setBackOnline(true);
        hideTimer.current = setTimeout(() => setBackOnline(false), 2500);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!offline && !backOnline) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.banner,
        { top: insets.top },
        offline ? styles.offline : styles.online,
      ]}
    >
      <Text style={styles.text}>
        {offline
          ? "No internet connection. Check your Wi-Fi or data."
          : "Back online"}
      </Text>
    </View>
  );
}

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return !(state.isConnected === false || state.isInternetReachable === false);
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 20,
  },
  offline: {
    backgroundColor: "#B3261E",
  },
  online: {
    backgroundColor: "#1B5E20",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
