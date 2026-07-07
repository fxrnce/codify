import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CodifyLogo from "../assets/icons/images/codify-logo.svg";

type StatItem = {
  id: string;
  emoji: string;
  value: string;
  label: string;
};

type FeatureItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBoxColor: string;
  title: string;
  description: string;
};

type TeamMember = {
  id: string;
  initials: string;
  name: string;
  role: string;
  color: string;
};

type ResourceItem = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
};

const STATS: StatItem[] = [
  {
    id: "products",
    emoji: "📦",
    value: "50k+",
    label: "Products",
  },
  {
    id: "users",
    emoji: "👥",
    value: "10k+",
    label: "Users",
  },
  {
    id: "uptime",
    emoji: "⚡",
    value: "99.9%",
    label: "Uptime",
  },
  {
    id: "region",
    emoji: "🇵🇭",
    value: "PH",
    label: "FDA Region",
  },
];

const FEATURES: FeatureItem[] = [
  {
    id: "barcode",
    icon: "scan-outline",
    iconColor: "#615FFF",
    iconBoxColor: "#EEF2FF",
    title: "Barcode & QR Scanning",
    description:
      "Instantly scan product barcodes and QR codes to fetch real-time FDA registration data.",
  },
  {
    id: "fda",
    icon: "shield-checkmark-outline",
    iconColor: "#00BC7D",
    iconBoxColor: "#ECFDF5",
    title: "FDA Verification",
    description:
      "Cross-references the Philippine FDA database to confirm product registration and compliance status.",
  },
  {
    id: "allergen",
    icon: "notifications-outline",
    iconColor: "#FE9A00",
    iconBoxColor: "#FFFBEB",
    title: "Allergen Alerts",
    description:
      "Personalized warnings when scanned products contain allergens you've flagged in your profile.",
  },
  {
    id: "ingredient",
    icon: "flash-outline",
    iconColor: "#955BFF",
    iconBoxColor: "#F5F3FF",
    title: "Ingredient Analysis",
    description:
      "Color-coded ingredient breakdowns help you quickly identify safe, caution, and restricted substances.",
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "jan-kurt",
    initials: "AJK",
    name: "Aquino, Jan Kurt",
    role: "Researcher",
    color: "#827AFF",
  },
  {
    id: "roselyn",
    initials: "BR",
    name: "Bitangcol, Roselyn",
    role: "Researcher",
    color: "#00CC99",
  },
  {
    id: "luis-gabriel",
    initials: "LLG",
    name: "Layug, Luis Gabriel",
    role: "Researcher",
    color: "#FF9D00",
  },
  {
    id: "charles-bryan",
    initials: "SCB",
    name: "Surla, Charles Bryan",
    role: "Researcher",
    color: "#F34B4D",
  },
  {
    id: "elizalde",
    initials: "TL",
    name: "Tolentino, Elizalde Jr.",
    role: "Researcher",
    color: "#D3C639",
  },
  {
    id: "john-laurence",
    initials: "OJL",
    name: "Ocampo, John Laurence",
    role: "Programmer & Desinger",
    color: "#3DAFE0",
  },
];

const RESOURCES: ResourceItem[] = [
  {
    id: "website",
    emoji: "🌐",
    title: "Official Website",
    subtitle: "www.codify.ph",
  },
  {
    id: "support",
    emoji: "💬",
    title: "Support Center",
    subtitle: "support.codify.ph",
  },
  {
    id: "fda",
    emoji: "🏛️",
    title: "FDA Philippines",
    subtitle: "www.fda.gov.ph",
  },
  {
    id: "bugs",
    emoji: "🐞",
    title: "Report an Issue",
    subtitle: "bugs.codify.ph",
  },
];

export default function AboutCodifyScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#2563EB", "#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.largeCircle} />
        <View style={styles.smallCircle} />
        <View style={styles.bottomCircle} />

        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>About Codify</Text>
        </View>

        <View style={styles.appInfoContainer}>
          <View style={styles.logoBox}>
            <CodifyLogo width={46} height={40} />
          </View>

          <Text style={styles.appName}>Codify</Text>

          <Text style={styles.appSubtitle}>
            FDA Product Verification & Ingredient Analysis
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.badgeText}>v1.0.0</Text>
            </View>

            <View style={styles.madeInBadge}>
              <Text style={styles.badgeText}>🇵🇭 Made in PH</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.missionCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="heart-outline" size={22} color="#FF2056" />
            <Text style={styles.cardTitle}>Our Mission</Text>
          </View>

          <Text style={styles.missionText}>
            Codify empowers Filipino consumers to make informed, safe, and
            healthy purchasing decisions by providing instant access to FDA
            product verification and comprehensive ingredient analysis — all
            through a simple barcode scan.
          </Text>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <Text style={styles.statEmoji}>{item.emoji}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featuresCard}>
          <View style={styles.featuresTitleRow}>
            <Ionicons name="star-outline" size={24} color="#615FFF" />
            <Text style={styles.cardTitle}>Key Features</Text>
          </View>

          {FEATURES.map((feature, index) => {
            const isLastItem = index === FEATURES.length - 1;

            return (
              <View
                key={feature.id}
                style={[styles.featureRow, isLastItem && styles.featureRowLast]}
              >
                <View
                  style={[
                    styles.featureIconBox,
                    { backgroundColor: feature.iconBoxColor },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={feature.iconColor}
                  />
                </View>

                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.teamCard}>
          <View style={styles.teamTitleRow}>
            <Ionicons name="star-outline" size={24} color="#615FFF" />
            <Text style={styles.cardTitle}>Meet the Team</Text>
          </View>

          {TEAM_MEMBERS.map((member, index) => {
            const isLastItem = index === TEAM_MEMBERS.length - 1;

            return (
              <View
                key={member.id}
                style={[styles.teamRow, isLastItem && styles.teamRowLast]}
              >
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: member.color },
                  ]}
                >
                  <Text style={styles.memberInitials}>{member.initials}</Text>
                </View>

                <View style={styles.memberTextBox}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.resourcesCard}>
          <View style={styles.resourcesTitleRow}>
            <Ionicons name="globe-outline" size={24} color="#615FFF" />
            <Text style={styles.cardTitle}>Resources</Text>
          </View>

          {RESOURCES.map((resource, index) => {
            const isLastItem = index === RESOURCES.length - 1;

            return (
              <View
                key={resource.id}
                style={[
                  styles.resourceRow,
                  isLastItem && styles.resourceRowLast,
                ]}
              >
                <Text style={styles.resourceEmoji}>{resource.emoji}</Text>

                <View style={styles.resourceTextBox}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceSubtitle}>
                    {resource.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerLogoBox}>
            <CodifyLogo width={46} height={40} />
          </View>

          <Text style={styles.footerTitle}>Codify v1.0.0</Text>
          <Text style={styles.footerSubtitle}>
            Build with Confidence In the Philippines
          </Text>

          <Text style={styles.footerCopyright}>
            © 2026 Codify Technologies, Inc.{"\n"}All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  header: {
    height: 338,
    paddingTop: 56,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  largeCircle: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
    right: -56,
    top: -56,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  smallCircle: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    right: 80,
    top: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  bottomCircle: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    left: -48,
    bottom: -48,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  topRow: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  appInfoContainer: {
    marginTop: 32,
    alignItems: "center",
  },

  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },

  appName: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: "#FFFFFF",
  },

  appSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  badgeRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  versionBadge: {
    height: 26,
    minWidth: 62,
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  madeInBadge: {
    height: 26,
    minWidth: 108,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scrollContent: {
    paddingTop: 19,
    paddingHorizontal: 14,
    paddingBottom: 32,
  },

  missionCard: {
    minHeight: 185,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    paddingTop: 16,
    paddingHorizontal: 17,
    paddingBottom: 18,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  missionText: {
    marginTop: 15,
    paddingHorizontal: 8,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: "#7092AD",
    textAlign: "justify",
  },

  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },

  statCard: {
    width: 86,
    height: 85,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    alignItems: "center",
    paddingTop: 10,
  },

  statEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },

  statValue: {
    marginTop: 3,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: 0.25,
    color: "#4F39F6",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
    textAlign: "center",
  },

  featuresCard: {
    marginTop: 26,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    overflow: "hidden",
  },

  featuresTitleRow: {
    height: 58,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  featureRow: {
    minHeight: 82,
    paddingHorizontal: 27,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  featureIconBox: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },

  featureTextBox: {
    marginLeft: 17,
    flex: 1,
  },

  featureRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 18,
  },

  featureTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  featureDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: "#7092AD",
  },

  teamCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    overflow: "hidden",
  },

  teamTitleRow: {
    height: 58,
    paddingHorizontal: 21,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  teamRow: {
    minHeight: 71,
    paddingHorizontal: 31,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  teamRowLast: {
    borderBottomWidth: 0,
  },

  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },

  memberInitials: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: 0.25,
    color: "#FFFFFF",
  },

  memberTextBox: {
    marginLeft: 17,
    flex: 1,
  },

  memberName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  memberRole: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },

  resourcesCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    overflow: "hidden",
  },

  resourcesTitleRow: {
    height: 58,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  resourceRow: {
    minHeight: 65,
    paddingHorizontal: 31,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },

  resourceRowLast: {
    borderBottomWidth: 0,
  },

  resourceEmoji: {
    width: 34,
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
  },

  resourceTextBox: {
    marginLeft: 18,
    flex: 1,
  },

  resourceTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  resourceSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },

  footerCard: {
    marginTop: 24,
    minHeight: 207,
    borderRadius: 20,
    backgroundColor: "#732AFB",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  footerLogoBox: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },

  footerTitle: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 0.25,
    color: "#FFFFFF",
  },

  footerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#C6D2FF",
    textAlign: "center",
  },

  footerCopyright: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#C6D2FF",
    opacity: 0.8,
    textAlign: "center",
  },
});
