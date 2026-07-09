import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, type ComponentProps } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import CodifyLogoSvg from "@/assets/icons/images/codify-logo.svg";

const { width, height } = Dimensions.get("window");

const BASE_WIDTH = 440;
const BASE_HEIGHT = 956;

const sx = (value: number) => (width / BASE_WIDTH) * value;
const sy = (value: number) => (height / BASE_HEIGHT) * value;
const ms = (value: number) => Math.min(sx(value), sy(value));

const ONBOARDING_STORAGE_KEY = "codify_has_seen_onboarding_v2";

type IconName = ComponentProps<typeof Ionicons>["name"];

type FloatingPosition = {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
};

type FloatingCard = {
  id: string;
  type: "icon" | "text" | "wide" | "score" | "compare";
  title?: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBg?: string;
  position: FloatingPosition;
  width?: number;
  height?: number;
  rotate?: string;
};

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  floatingCards: FloatingCard[];
};

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "verification",
    title: "Product Verification",
    description:
      "Instantly check FDA registration status. Point your camera at any product to know if it's safe and approved.",
    floatingCards: [
      {
        id: "shield",
        type: "icon",
        icon: "shield-checkmark-outline",
        iconColor: "#4F46E5",
        position: { top: 255, left: 40 },
        width: 48,
        height: 48,
        rotate: "-7deg",
      },
      {
        id: "qr",
        type: "icon",
        icon: "qr-code-outline",
        iconColor: "#2563EB",
        position: { top: 245, right: 42 },
        width: 54,
        height: 54,
        rotate: "6deg",
      },
      {
        id: "live",
        type: "wide",
        title: "Live Check",
        icon: "ellipse",
        iconColor: "#34D399",
        position: { top: 360, left: 24 },
        width: 93,
        height: 31,
      },
      {
        id: "verified",
        type: "text",
        title: "FDA Verified",
        subtitle: "Safe product",
        icon: "checkmark-circle-outline",
        iconColor: "#00BC7D",
        iconBg: "#ECFDF5",
        position: { top: 378, right: 26 },
        width: 123,
        height: 47,
      },
    ],
  },
  {
    id: "ingredients",
    title: "Ingredient Analysis",
    description:
      "Understand what you consume. Get detailed health scores, allergen warnings, and clean ingredient breakdowns.",
    floatingCards: [
      {
        id: "score",
        type: "score",
        title: "92/100",
        subtitle: "HEALTH SCORE",
        icon: "pulse-outline",
        iconColor: "#7C3AED",
        position: { top: 160, left: 49 },
        width: 112,
        height: 76,
      },
      {
        id: "allergen",
        type: "text",
        title: "Allergen Alert",
        subtitle: "Contains Gluten",
        icon: "warning",
        iconColor: "#F87171",
        iconBg: "#FFF1F2",
        position: { top: 174, right: 15 },
        width: 135,
        height: 52,
      },
      {
        id: "ingredients",
        type: "wide",
        title: "12 Ingredients",
        icon: "water-outline",
        iconColor: "#4F46E5",
        position: { top: 370, left: 52 },
        width: 112,
        height: 31,
      },
      {
        id: "heart",
        type: "icon",
        icon: "heart",
        iconColor: "#FF637E",
        position: { top: 343, right: 58 },
        width: 48,
        height: 48,
      },
    ],
  },
  {
    id: "alternatives",
    title: "Safer Alternatives",
    description:
      "Make healthier choices effortlessly. Compare products side-by-side and discover better options on the market.",
    floatingCards: [
      {
        id: "organic",
        type: "text",
        title: "Organic Alt.",
        subtitle: "Better choice",
        icon: "leaf-outline",
        iconColor: "#00BC7D",
        iconBg: "#ECFDF5",
        position: { top: 184, left: 35 },
        width: 116,
        height: 51,
      },
      {
        id: "sugar",
        type: "text",
        title: "High Sugar",
        subtitle: "Current",
        icon: "warning-outline",
        iconColor: "#FF637E",
        iconBg: "#FFF1F2",
        position: { top: 200, right: 15 },
        width: 116,
        height: 51,
      },
      {
        id: "alt",
        type: "wide",
        title: "Alternatives",
        icon: "swap-horizontal-outline",
        iconColor: "#7C3AED",
        position: { top: 376, left: 48 },
        width: 118,
        height: 31,
      },
      {
        id: "compare",
        type: "compare",
        title: "Compare",
        icon: "swap-horizontal-outline",
        iconColor: "#7C3AED",
        position: { top: 353, right: 21 },
        width: 102,
        height: 72,
      },
    ],
  },
  {
    id: "welcome",
    title: "Welcome to Codify",
    description:
      "Your trusted companion for instant FDA product verification and ingredient analysis — right from your phone.",
    floatingCards: [],
  },
];

function getPositionStyle(position: FloatingPosition) {
  return {
    top: position.top !== undefined ? sy(position.top) : undefined,
    left: position.left !== undefined ? sx(position.left) : undefined,
    right: position.right !== undefined ? sx(position.right) : undefined,
    bottom: position.bottom !== undefined ? sy(position.bottom) : undefined,
  };
}

function CenterLogo() {
  return (
    <View style={styles.centerLogoWrapper}>
      <LinearGradient
        colors={["#2563EB", "#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoGlow}
      />

      <View style={styles.logoBorder}>
        <View style={styles.logoCard}>
          <CodifyLogoSvg width={ms(37)} height={ms(32)} />
        </View>
      </View>
    </View>
  );
}

function FloatingItem({ item }: { item: FloatingCard }) {
  const sizeStyle = {
    width: item.width ? sx(item.width) : undefined,
    height: item.height ? sy(item.height) : undefined,
    transform: item.rotate ? [{ rotate: item.rotate }] : undefined,
  };

  if (item.type === "icon") {
    return (
      <View
        style={[
          styles.floatingIconCard,
          getPositionStyle(item.position),
          sizeStyle,
        ]}
      >
        <Ionicons
          name={item.icon!}
          size={ms(item.width === 54 ? 28 : 24)}
          color={item.iconColor}
        />
      </View>
    );
  }

  if (item.type === "wide") {
    return (
      <View
        style={[
          styles.floatingWideCard,
          getPositionStyle(item.position),
          sizeStyle,
        ]}
      >
        <Ionicons name={item.icon!} size={ms(12)} color={item.iconColor} />
        <Text style={styles.floatingWideText}>{item.title}</Text>
      </View>
    );
  }

  if (item.type === "score") {
    return (
      <View
        style={[styles.scoreCard, getPositionStyle(item.position), sizeStyle]}
      >
        <Text style={styles.scoreLabel}>{item.subtitle}</Text>

        <View style={styles.scoreRow}>
          <Ionicons name={item.icon!} size={ms(16)} color={item.iconColor} />
          <Text style={styles.scoreValue}>{item.title}</Text>
        </View>

        <View style={styles.scoreBarBg}>
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scoreBarFill}
          />
        </View>
      </View>
    );
  }

  if (item.type === "compare") {
    return (
      <View
        style={[styles.compareCard, getPositionStyle(item.position), sizeStyle]}
      >
        <View style={styles.compareTopRow}>
          <Ionicons name={item.icon!} size={ms(12)} color={item.iconColor} />
          <Text style={styles.compareTitle}>{item.title}</Text>
        </View>

        <View style={styles.compareBarsRow}>
          <View style={styles.compareBadBox} />
          <View style={styles.compareDivider} />
          <View style={styles.compareGoodBox} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.floatingTextCard,
        getPositionStyle(item.position),
        sizeStyle,
      ]}
    >
      <View
        style={[
          styles.floatingSmallIcon,
          { backgroundColor: item.iconBg ?? "#EEF2FF" },
        ]}
      >
        <Ionicons name={item.icon!} size={ms(14)} color={item.iconColor} />
      </View>

      <View style={styles.floatingTextContent}>
        <Text numberOfLines={1} style={styles.floatingTextTitle}>
          {item.title}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.floatingTextSubtitle,
            item.subtitle === "Better choice" && styles.greenSubtitle,
            item.title === "Allergen Alert" && styles.redSubtitle,
          ]}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = ONBOARDING_SLIDES[activeIndex];
  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      router.replace("/auth/sign-in" as never);
    } catch (error) {
      console.log("Failed to save onboarding status:", error);
      router.replace("/auth/sign-in" as never);
    }
  };

  const goNext = () => {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }

    setActiveIndex((currentIndex) => currentIndex + 1);
  };

  const goPrev = () => {
    if (isFirstSlide) {
      return;
    }

    setActiveIndex((currentIndex) => currentIndex - 1);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.background}>
        <View style={styles.blueBlur} />
        <View style={styles.purpleBlur} />
        <View style={styles.rightBlueBlur} />
        <View style={styles.leftBlueBlur} />

        <View style={styles.topBar}>
          <Text style={styles.counterActive}>{activeIndex + 1}</Text>
          <Text style={styles.counterInactive}>/4</Text>

          <Pressable style={styles.skipButton} onPress={finishOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.visualContainer}>
          <View style={styles.ringLarge} />
          <View style={styles.ringMedium} />
          <View style={styles.ringSmall} />

          <CenterLogo />
        </View>

        {activeSlide.floatingCards.map((item) => (
          <FloatingItem key={item.id} item={item} />
        ))}

        <View style={styles.bottomSheet}>
          <View style={styles.textBox}>
            <Text style={styles.title}>{activeSlide.title}</Text>

            <Text style={styles.description}>{activeSlide.description}</Text>
          </View>

          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.dot, activeIndex === index && styles.activeDot]}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.prevButton,
                isFirstSlide && styles.prevButtonDisabled,
              ]}
              onPress={goPrev}
            >
              <Text
                style={[
                  styles.prevText,
                  isFirstSlide && styles.prevTextDisabled,
                ]}
              >
                Prev
              </Text>
            </Pressable>

            <Pressable style={styles.nextButtonWrapper} onPress={goNext}>
              <LinearGradient
                colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButton}
              >
                <Text style={styles.nextText}>
                  {isLastSlide ? "Get Started" : "Next"}
                </Text>

                <Ionicons
                  name={isLastSlide ? "checkmark" : "arrow-forward"}
                  size={ms(18)}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const SHEET_HEIGHT = Math.max(sy(331), 300);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  background: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },

  blueBlur: {
    position: "absolute",
    width: sx(280),
    height: sx(280),
    borderRadius: sx(140),
    left: sx(-80),
    top: sy(-96),
    backgroundColor: "rgba(37,99,235,0.1)",
  },

  purpleBlur: {
    position: "absolute",
    width: sx(220),
    height: sx(220),
    borderRadius: sx(110),
    left: sx(312),
    top: sy(-48),
    backgroundColor: "rgba(124,58,237,0.09)",
  },

  rightBlueBlur: {
    position: "absolute",
    width: sx(180),
    height: sx(180),
    borderRadius: sx(90),
    left: sx(332),
    top: sy(211),
    backgroundColor: "rgba(79,70,229,0.07)",
  },

  leftBlueBlur: {
    position: "absolute",
    width: sx(160),
    height: sx(160),
    borderRadius: sx(80),
    left: sx(-64),
    top: sy(229),
    backgroundColor: "rgba(37,99,235,0.07)",
  },

  topBar: {
    position: "absolute",
    top: sy(36),
    left: sx(28),
    right: sx(34),
    height: sy(36),
    flexDirection: "row",
    alignItems: "center",
    zIndex: 50,
  },

  counterActive: {
    fontSize: ms(18),
    lineHeight: ms(22),
    fontWeight: "800",
    color: "#000000",
  },

  counterInactive: {
    fontSize: ms(18),
    lineHeight: ms(22),
    fontWeight: "800",
    color: "#9CA3AF",
  },

  skipButton: {
    position: "absolute",
    right: 0,
    width: sx(68),
    height: sy(36),
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  skipText: {
    fontSize: ms(14),
    lineHeight: ms(20),
    fontWeight: "600",
    color: "#64748B",
  },

  visualContainer: {
    position: "absolute",
    width: sx(448),
    height: sy(237),
    left: sx(-4),
    top: sy(230),
  },

  ringLarge: {
    position: "absolute",
    width: sx(346),
    height: sx(346),
    left: sx(51),
    top: sy(-108),
    borderRadius: sx(173),
    borderWidth: 1.17,
    borderColor: "rgba(124,58,237,0.04)",
  },

  ringMedium: {
    position: "absolute",
    width: sx(278),
    height: sx(278),
    left: sx(85),
    top: sy(-74),
    borderRadius: sx(139),
    borderWidth: 1.17,
    borderColor: "rgba(37,99,235,0.05)",
  },

  ringSmall: {
    position: "absolute",
    width: sx(210),
    height: sx(210),
    left: sx(119),
    top: sy(-40),
    borderRadius: sx(105),
    borderWidth: 1.17,
    borderColor: "rgba(79,70,229,0.08)",
  },

  centerLogoWrapper: {
    position: "absolute",
    width: sx(170),
    height: sx(170),
    left: sx(139),
    top: sy(-20),
    justifyContent: "center",
    alignItems: "center",
  },

  logoGlow: {
    position: "absolute",
    width: sx(170),
    height: sx(170),
    borderRadius: sx(44),
    opacity: 0.15,
  },

  logoBorder: {
    width: sx(150),
    height: sx(150),
    borderRadius: sx(42),
    borderWidth: 1.17,
    borderColor: "rgba(79,70,229,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoCard: {
    width: sx(122),
    height: sy(118),
    borderRadius: sx(22),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },

  floatingIconCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: sx(18),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,

    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },

  floatingWideCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 100,
    paddingHorizontal: sx(12),
    flexDirection: "row",
    alignItems: "center",
    gap: sx(6),
    zIndex: 15,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  floatingWideText: {
    fontSize: ms(10),
    lineHeight: ms(15),
    fontWeight: "600",
    color: "#475569",
  },

  floatingTextCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.17,
    borderColor: "#FFFFFF",
    borderRadius: sx(18),
    paddingHorizontal: sx(12),
    flexDirection: "row",
    alignItems: "center",
    gap: sx(8),
    zIndex: 15,

    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },

  floatingSmallIcon: {
    width: sx(24),
    height: sx(24),
    borderRadius: sx(12),
    justifyContent: "center",
    alignItems: "center",
  },

  floatingTextContent: {
    flex: 1,
  },

  floatingTextTitle: {
    fontSize: ms(10),
    lineHeight: ms(15),
    fontWeight: "700",
    color: "#1E293B",
  },

  floatingTextSubtitle: {
    fontSize: ms(9),
    lineHeight: ms(13),
    fontWeight: "400",
    color: "#94A3B8",
  },

  greenSubtitle: {
    color: "#10B981",
    fontWeight: "600",
  },

  redSubtitle: {
    color: "#1E293B",
    fontWeight: "700",
  },

  scoreCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.17,
    borderColor: "#FFFFFF",
    borderRadius: sx(18),
    paddingHorizontal: sx(15),
    paddingTop: sy(11),
    zIndex: 15,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },

  scoreLabel: {
    fontSize: ms(9),
    lineHeight: ms(14),
    fontWeight: "600",
    letterSpacing: 0.72,
    color: "#94A3B8",
  },

  scoreRow: {
    marginTop: sy(5),
    flexDirection: "row",
    alignItems: "center",
    gap: sx(6),
  },

  scoreValue: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontWeight: "900",
    color: "#1E293B",
  },

  scoreBarBg: {
    marginTop: sy(7),
    height: sy(4),
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },

  scoreBarFill: {
    width: "92%",
    height: "100%",
    borderRadius: 4,
  },

  compareCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.17,
    borderColor: "#FFFFFF",
    borderRadius: sx(18),
    paddingHorizontal: sx(15),
    paddingTop: sy(12),
    zIndex: 15,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 5,
  },

  compareTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sx(6),
  },

  compareTitle: {
    fontSize: ms(9),
    lineHeight: ms(14),
    fontWeight: "600",
    color: "#94A3B8",
  },

  compareBarsRow: {
    marginTop: sy(8),
    flexDirection: "row",
    alignItems: "center",
    gap: sx(6),
  },

  compareBadBox: {
    width: sx(28),
    height: sx(28),
    borderRadius: sx(8),
    backgroundColor: "#FFE4E6",
  },

  compareDivider: {
    width: sx(4),
    height: sy(20),
    borderRadius: 2,
    backgroundColor: "#F1F5F9",
  },

  compareGoodBox: {
    width: sx(28),
    height: sx(28),
    borderRadius: sx(8),
    backgroundColor: "#DCFCE7",
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: sx(44),
    borderTopRightRadius: sx(44),
    paddingTop: sy(36),
    paddingHorizontal: sx(28),
    paddingBottom: sy(24),

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -18,
    },
    shadowOpacity: 0.05,
    shadowRadius: 56,
    elevation: 12,
  },

  textBox: {
    height: sy(116),
    alignItems: "center",
  },

  title: {
    fontSize: ms(22),
    lineHeight: ms(33),
    fontWeight: "900",
    letterSpacing: -0.55,
    color: "#1E293B",
    textAlign: "center",
  },

  description: {
    marginTop: sy(12),
    maxWidth: sx(268),
    fontSize: ms(14),
    lineHeight: ms(24),
    fontWeight: "500",
    color: "#94A3B8",
    textAlign: "center",
  },

  dotsRow: {
    marginTop: sy(28),
    height: sy(5),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: sx(8),
  },

  dot: {
    width: sx(5),
    height: sx(5),
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },

  activeDot: {
    width: sx(28),
    backgroundColor: "#5B3FF4",
  },

  buttonRow: {
    marginTop: sy(34),
    height: sy(58),
    flexDirection: "row",
    gap: sx(12),
  },

  prevButton: {
    flex: 1,
    borderRadius: sx(22),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  prevButtonDisabled: {
    opacity: 0.75,
  },

  prevText: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontWeight: "700",
    color: "#64748B",
  },

  prevTextDisabled: {
    color: "#94A3B8",
  },

  nextButtonWrapper: {
    flex: 1,
    borderRadius: sx(22),

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 8,
  },

  nextButton: {
    flex: 1,
    borderRadius: sx(22),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: sx(8),
  },

  nextText: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
});
