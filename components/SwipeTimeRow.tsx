import { type ReactNode, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

/*
 * Chat bubble row that reveals the message's date and time when the bubble is
 * swiped to the left. Used for messages whose time is hidden because they
 * were sent in the same minute as the next one. Slides back by itself.
 */

type Props = {
  children: ReactNode;
  // Full date and time, e.g. "4 Nov 2026, 12:14 am"
  timeText: string;
};

const AUTO_CLOSE_MS = 2500;

export default function SwipeTimeRow({ children, timeText }: Props) {
  const swipeRef = useRef<SwipeableMethods | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderTime = () => (
    <View style={styles.timeAction}>
      <Text style={styles.timeText}>{timeText}</Text>
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={30}
      overshootRight={false}
      renderRightActions={renderTime}
      onSwipeableOpen={() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(
          () => swipeRef.current?.close(),
          AUTO_CLOSE_MS,
        );
      }}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  timeAction: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  timeText: {
    fontSize: 11,
    color: "#777",
  },
});
