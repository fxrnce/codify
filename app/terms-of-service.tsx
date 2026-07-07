import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type TermsSection = {
  id: string;
  title: string;
  content: string;
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "acceptance-of-terms",
    title: "1. Acceptance of Terms",
    content:
      "By using Codify, you agree to follow these Terms of Service. If you do not agree, please stop using the app.",
  },
  {
    id: "description-of-services",
    title: "2. Description of Services",
    content:
      "Codify provides barcode scanning, FDA product verification, ingredient analysis, allergen alerts, and scan history features.",
  },
  {
    id: "user-accounts",
    title: "3. User Accounts",
    content:
      "You are responsible for keeping your account information accurate and for protecting your login credentials.",
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    content:
      "You agree not to misuse Codify, attempt unauthorized access, interfere with app services, or use the app for illegal activity.",
  },
  {
    id: "data-accuracy-disclaimer",
    title: "5. Data Accuracy & Disclaimer",
    content:
      "Codify provides product information for guidance only. Always verify health-critical information from labels, official sources, or professionals.",
  },
  {
    id: "allergen-warnings",
    title: "6. Allergen Warnings",
    content:
      "Allergen alerts are only a guide. You should still read product labels carefully before buying or consuming any product.",
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content:
      "Codify’s design, branding, features, and app content belong to Codify unless otherwise stated.",
  },
  {
    id: "limitation-of-liability",
    title: "8. Limitation of Liability",
    content:
      "Codify is not responsible for losses, damages, or health issues caused by relying only on app results without checking official labels or sources.",
  },
  {
    id: "governing-law",
    title: "9. Governing Law",
    content:
      "These Terms are governed by the laws of the Republic of the Philippines.",
  },
  {
    id: "contact",
    title: "10. Contact",
    content:
      "For questions about these Terms of Service, you may contact Codify support through the contact details provided in the app.",
  },
];

const SUMMARY_ITEMS = [
  "Codify provides FDA product data for informational use only.",
  "You are responsible for verifying health-critical information.",
  "Allergen alerts are a guide, not a substitute for label reading.",
  "Philippine law governs this agreement.",
];

export default function TermsOfServiceScreen() {
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

          <Text style={styles.title}>Terms of Service</Text>
        </View>

        <View style={styles.termsRow}>
          <View style={styles.termsIconBox}>
            <Ionicons name="document-text-outline" size={26} color="#FFFFFF" />
          </View>

          <View>
            <Text style={styles.termsTitle}>Legal Agreement</Text>
            <Text style={styles.effectiveText}>
              Effective: April 23, 2026 · v1.0
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={22} color="#FE9A00" />

          <Text style={styles.warningText}>
            Please read these terms carefully before using Codify. By using the
            app you agree to be legally bound by these terms.
          </Text>
        </View>

        {TERMS_SECTIONS.map((section) => {
          const isExpanded = expandedSections.includes(section.id);

          return (
            <View key={section.id} style={styles.termsItem}>
              <Pressable
                style={styles.termsHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.termsItemTitle}>{section.title}</Text>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#CAD5E2"
                />
              </Pressable>

              {isExpanded && (
                <Text style={styles.termsContent}>{section.content}</Text>
              )}
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Agreement Summary</Text>

          {SUMMARY_ITEMS.map((item, index) => (
            <View key={item} style={styles.summaryRow}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>{index + 1}</Text>
              </View>

              <Text style={styles.summaryText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footerText}>
          © 2026 Codify Technologies, Inc. · Philippines
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

  termsRow: {
    marginTop: 24,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  termsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  termsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  effectiveText: {
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
    paddingTop: 20,
    paddingHorizontal: 19,
    paddingBottom: 32,
  },

  warningCard: {
    minHeight: 114,
    borderRadius: 20,
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FEE685",
    paddingHorizontal: 15,
    paddingVertical: 25,
    flexDirection: "row",
    gap: 14,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#DE8A00",
    opacity: 0.8,
  },

  termsItem: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    overflow: "hidden",
  },

  termsHeader: {
    minHeight: 35,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  termsItemTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  termsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
  },

  summaryCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 18,
  },

  summaryTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.25,
    color: "#1D293D",
  },

  summaryRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  summaryNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryNumberText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#5848F6",
  },

  summaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#7092AD",
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
