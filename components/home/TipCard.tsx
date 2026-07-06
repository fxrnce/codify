import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const tips = [
  {
    title: "Check FDA Status",
    description:
      "Always verify the FDA registration number on products before purchase.",
    icon: "search-outline",
    iconColor: "#9B4F96",
  },
  {
    title: "Allergen Alerts",
    description:
      "Set your allergen preferences in Profile to get instant warnings.",
    icon: "warning-outline",
    iconColor: "#FFB757",
  },
  {
    title: "Health Score",
    description:
      "Products scoring 75+ are considered healthier choices for you.",
    icon: "heart-outline",
    iconColor: "#37C275",
  },
  {
    title: "Alternatives",
    description:
      "Every flagged product comes with safer alternatives you can try.",
    icon: "refresh-outline",
    iconColor: "#579EF1",
  },
];

export default function TipCard() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {tips.map((tip, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.tipHeader}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#7A78FF"
              />
              <Text style={styles.tipLabel}>TIP</Text>
            </View>

            <View style={styles.contentRow}>
              <Ionicons
                name={tip.icon as any}
                size={30}
                color={tip.iconColor}
                style={styles.mainIcon}
              />

              <View style={styles.textContainer}>
                <Text style={styles.title}>{tip.title}</Text>
                <Text style={styles.description}>{tip.description}</Text>
              </View>
            </View>

            <View style={styles.dots}>
              {tips.map((_, dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.dot,
                    activeIndex === dotIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  card: {
    width: CARD_WIDTH,
    height: 143,

    backgroundColor: "#EEF3FF",
    borderRadius: 20,

    paddingHorizontal: 22,
    paddingTop: 17,

    overflow: "hidden",
  },

  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  tipLabel: {
    marginLeft: 10,

    fontSize: 16,
    fontWeight: "700",
    color: "#4F39F6",
    letterSpacing: 0.25,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginTop: 18,
  },

  mainIcon: {
    marginTop: 1,
  },

  textContainer: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D293D",
    opacity: 0.85,
  },

  description: {
    marginTop: 6,

    fontSize: 12,
    fontWeight: "600",
    lineHeight: 20,

    color: "#8E9198",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,

    backgroundColor: "#BFC7E4",

    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#615FFF",
  },
});
