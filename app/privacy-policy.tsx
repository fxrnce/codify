import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type PolicySection = {
  id: string;
  title: string;
  content: string;
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content:
      "We may collect your name, email address, scan history, selected allergen alerts, and product verification activity inside the Codify app.",
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    content:
      "We use your information to provide FDA verification, ingredient analysis, allergen alerts, scan history, and account-related features.",
  },
  {
    id: "data-sharing-disclosure",
    title: "Data Sharing & Disclosure",
    content:
      "Codify does not sell your personal data. Information may only be shared when required by law or needed to provide app services.",
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content:
      "We keep your information only as long as needed for your account, app features, legal requirements, and service improvement.",
  },
  {
    id: "security",
    title: "Security",
    content:
      "We use reasonable security measures to help protect your information from unauthorized access, misuse, or disclosure.",
  },
  {
    id: "childrens-privacy",
    title: "Children’s Privacy",
    content:
      "Codify is not intended for children below the required age. We do not knowingly collect personal data from children without proper consent.",
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content:
      "You may request access, correction, deletion, or restriction of your personal information by contacting our Data Protection Officer.",
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this Policy",
    content:
      "We may update this Privacy Policy when needed. Any important changes will be shown inside the app or through proper notice.",
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections((currentSections) => {
      if (currentSections.includes(id)) {
        return currentSections.filter((sectionId) => sectionId !== id);
      }

      return [...currentSections, id];
    });
  };

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

          <Text style={styles.title}>Privacy Policy</Text>
        </View>

        <View style={styles.privacyRow}>
          <View style={styles.privacyIconBox}>
            <Ionicons name="shield-outline" size={26} color="#FFFFFF" />
          </View>

          <View>
            <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
            <Text style={styles.lastUpdated}>Last updated: April 23, 2026</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            This Privacy Policy explains how Codify (“we”, “us”, or “our”)
            collects, uses, and protects your personal information in compliance
            with the Philippine Data Privacy Act of 2012 (RA 10173).
          </Text>
        </View>

        {POLICY_SECTIONS.map((section) => {
          const isExpanded = expandedSections.includes(section.id);

          return (
            <View key={section.id} style={styles.policyItem}>
              <Pressable
                style={styles.policyHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.policyTitle}>{section.title}</Text>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#CAD5E2"
                />
              </Pressable>

              {isExpanded && (
                <Text style={styles.policyContent}>{section.content}</Text>
              )}
            </View>
          );
        })}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Contact Us</Text>

          <Text style={styles.contactDescription}>
            If you have question about this Privacy Policy or wish to exercise
            your data privacy rights, please reach out to our Data Protection
            Officer
          </Text>

          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>privacy@codify.ph</Text>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue}>Bacolor, Pampanga</Text>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+63 9195-77486</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          © 2026 Codify · All rights reserved
        </Text>
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
    height: 196,
    paddingTop: 56,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  largeCircle: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 104,
    right: -56,
    top: -56,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  smallCircle: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    right: 80,
    top: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  bottomCircle: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    left: -48,
    top: 52,
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

  title: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  privacyRow: {
    marginTop: 24,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  privacyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  privacyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  lastUpdated: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.6)",
  },

  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scrollContent: {
    paddingTop: 17,
    paddingHorizontal: 15,
    paddingBottom: 32,
  },

  introCard: {
    minHeight: 114,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    paddingHorizontal: 15,
    paddingVertical: 16,
    justifyContent: "center",
  },

  introText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#4370E8",
    opacity: 0.8,
  },

  policyItem: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    overflow: "hidden",
  },

  policyHeader: {
    minHeight: 35,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  policyTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  policyContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },

  contactCard: {
    marginTop: 8,
    minHeight: 201,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 18,
  },

  contactTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  contactDescription: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },

  contactRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  contactLabel: {
    width: 78,
    fontSize: 13,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#94A1B0",
  },

  contactValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#594EF7",
  },

  footerText: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },
});
