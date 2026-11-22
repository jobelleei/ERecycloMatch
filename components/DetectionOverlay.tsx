import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

export type Detection = {
  label: string;
  confidence: number;
  box: [number, number, number, number];
};

type Props = {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
};

const formatLabel = (label: string) => label.replace(/-/g, " ");

export default function DetectionOverlay({
  detections,
  imageWidth,
  imageHeight,
}: Props) {
  const [area, setArea] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  };

  const ready =
    area.width > 0 && area.height > 0 && imageWidth > 0 && imageHeight > 0;

  const scale = ready
    ? Math.max(area.width / imageWidth, area.height / imageHeight)
    : 0;
  const offsetX = (area.width - imageWidth * scale) / 2;
  const offsetY = (area.height - imageHeight * scale) / 2;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {ready &&
        detections.map((detection, index) => {
          const [x1, y1, x2, y2] = detection.box;
          const isPrimary = index === 0;

          const left = offsetX + x1 * imageWidth * scale;
          const top = offsetY + y1 * imageHeight * scale;
          const width = (x2 - x1) * imageWidth * scale;
          const height = (y2 - y1) * imageHeight * scale;

          return (
            <View
              key={`${detection.label}-${index}`}
              style={[
                styles.box,
                isPrimary ? styles.primaryBox : styles.otherBox,
                { left, top, width, height },
              ]}
            >
              {isPrimary && (
                <View style={[styles.tag, top < 34 && styles.tagInside]}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {formatLabel(detection.label)}{" "}
                    {Math.round(detection.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    borderRadius: 6,
  },
  primaryBox: {
    borderWidth: 3,
    borderColor: "#22C55E",
  },
  otherBox: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
  },
  tag: {
    position: "absolute",
    top: -30,
    left: -3,
    maxWidth: 260,
    backgroundColor: "#15803D",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagInside: {
    top: 4,
    left: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
