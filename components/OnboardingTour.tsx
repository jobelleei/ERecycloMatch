import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { RefObject, useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export type TourStep = {
  key: string;
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  // The button/section to highlight. Steps without a target show a centered card.
  targetRef?: RefObject<any>;
  // Runs before the step is shown, e.g. to scroll the target into view.
  prepare?: () => void | Promise<void>;
};

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  steps: TourStep[];
  onFinish: () => void;
};

const HIGHLIGHT_PADDING = 6;
const TOOLTIP_GAP = 12;
const SCROLL_SETTLE_MS = 350;

// Stored per account so each new user sees the tour once.
export const getTourStorageKey = (tourName: string, accountId: string) =>
  `onboarding_done_${tourName}_${accountId}`;

export const hasCompletedTour = async (tourName: string, accountId: string) => {
  try {
    return (
      (await AsyncStorage.getItem(getTourStorageKey(tourName, accountId))) ===
      "true"
    );
  } catch {
    return false;
  }
};

export const markTourCompleted = async (
  tourName: string,
  accountId: string,
) => {
  try {
    await AsyncStorage.setItem(getTourStorageKey(tourName, accountId), "true");
  } catch (error) {
    console.log("SAVE ONBOARDING TOUR ERROR:", error);
  }
};

const measureTarget = (ref?: RefObject<any>): Promise<Rect | null> =>
  new Promise((resolve) => {
    const node = ref?.current;

    if (!node?.measureInWindow) {
      resolve(null);
      return;
    }

    node.measureInWindow((x: number, y: number, width: number, height: number) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });

export default function OnboardingTour({ visible, steps, onFinish }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    if (!visible || !step) return;

    let cancelled = false;

    const showStep = async () => {
      setReady(false);

      if (step.prepare) {
        await step.prepare();
        await new Promise((resolve) => setTimeout(resolve, SCROLL_SETTLE_MS));
      }

      const measured = await measureTarget(step.targetRef);

      if (cancelled) return;

      setRect(measured);
      setReady(true);
    };

    showStep();

    return () => {
      cancelled = true;
    };
    // Keyed on step.key: the steps array is usually rebuilt on every render.
  }, [visible, index, step?.key]);

  if (!visible || !step) return null;

  const goNext = () => (isLast ? onFinish() : setIndex((prev) => prev + 1));
  const goBack = () => !isFirst && setIndex((prev) => prev - 1);

  const hole = rect
    ? {
        x: Math.max(0, rect.x - HIGHLIGHT_PADDING),
        y: Math.max(0, rect.y - HIGHLIGHT_PADDING),
        width: rect.width + HIGHLIGHT_PADDING * 2,
        height: rect.height + HIGHLIGHT_PADDING * 2,
      }
    : null;

  // Put the tooltip below the highlight, or above it when there isn't room.
  const showTooltipAbove = hole
    ? hole.y + hole.height > screenHeight * 0.55
    : false;

  const tooltipPosition = hole
    ? showTooltipAbove
      ? { bottom: screenHeight - hole.y + TOOLTIP_GAP }
      : { top: hole.y + hole.height + TOOLTIP_GAP }
    : { top: screenHeight * 0.3 };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFinish}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Dim everything except the highlighted button */}
        {hole && ready ? (
          <>
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
            <View
              style={[
                styles.dim,
                { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 },
              ]}
            />
            <View
              style={[
                styles.dim,
                { top: hole.y, left: 0, width: hole.x, height: hole.height },
              ]}
            />
            <View
              style={[
                styles.dim,
                {
                  top: hole.y,
                  left: hole.x + hole.width,
                  right: 0,
                  height: hole.height,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.highlight,
                {
                  top: hole.y,
                  left: hole.x,
                  width: hole.width,
                  height: hole.height,
                },
              ]}
            />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}

        {ready && (
          <View
            style={[
              styles.tooltip,
              tooltipPosition,
              { left: 16, right: 16, maxWidth: screenWidth - 32 },
            ]}
          >
            <View style={styles.tooltipHeader}>
              {step.icon && (
                <View style={styles.iconWrapper}>
                  <Ionicons name={step.icon} size={20} color="#2e7d32" />
                </View>
              )}

              <Text style={styles.title}>{step.title}</Text>

              <Text style={styles.counter}>
                {index + 1}/{steps.length}
              </Text>
            </View>

            <Text style={styles.description}>{step.description}</Text>

            <View style={styles.actions}>
              {!isLast ? (
                <TouchableOpacity onPress={onFinish} hitSlop={8}>
                  <Text style={styles.skipText}>Skip tour</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <View style={styles.navButtons}>
                {!isFirst && (
                  <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.nextButton} onPress={goNext}>
                  <Text style={styles.nextText}>
                    {isLast ? "Get Started" : "Next"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  highlight: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#7bd389",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  counter: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipText: {
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#2e7d32",
  },
  backText: {
    color: "#2e7d32",
    fontWeight: "700",
    fontSize: 13,
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#2e7d32",
  },
  nextText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
