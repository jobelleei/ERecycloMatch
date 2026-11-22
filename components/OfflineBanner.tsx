import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";

export default function OfflineBanner() {
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline =
        state.isConnected === false || state.isInternetReachable === false;

      if (isOffline && !wasOffline.current) {
        wasOffline.current = true;
        Toast.show({
          type: "error",
          text1: "No internet connection",
          text2: "Check your Wi-Fi or data.",
          visibilityTime: 4000,
        });
      } else if (!isOffline && wasOffline.current && state.isInternetReachable) {
        wasOffline.current = false;
        Toast.show({
          type: "success",
          text1: "Back online",
          visibilityTime: 2500,
        });
      }
    });

    return unsubscribe;
  }, []);

  return null;
}

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return !(state.isConnected === false || state.isInternetReachable === false);
};
