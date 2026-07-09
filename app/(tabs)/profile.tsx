import { useClerk, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAllergenAlerts } from "@/contexts/AllergenContext";
import { useScanHistory } from "@/contexts/ScanHistoryContext";

type AlertItem = {
  id: string;
  emoji: string;
  label: string;
};

type AlertGroup = {
  title: string;
  data: AlertItem[];
};

type SettingItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
};

const ALERT_GROUPS: AlertGroup[] = [
  {
    title: "Food & Drink",
    data: [
      { id: "peanuts", emoji: "🥜", label: "Peanuts" },
      { id: "tree-nuts", emoji: "🌰", label: "Tree Nuts" },
      { id: "milk", emoji: "🥛", label: "Milk" },
      { id: "eggs", emoji: "🥚", label: "Eggs" },
      { id: "soy", emoji: "🫘", label: "Soy" },
      { id: "wheat-gluten", emoji: "🌾", label: "Wheat / Gluten" },
      { id: "fish", emoji: "🐟", label: "Fish" },
      { id: "shellfish", emoji: "🦐", label: "Shellfish" },
      { id: "sulfites", emoji: "🍷", label: "Sulfites" },
      { id: "sesame", emoji: "🌿", label: "Sesame" },
    ],
  },
  {
    title: "Common Medicines",
    data: [
      { id: "paracetamol", emoji: "💊", label: "Paracetamol" },
      { id: "ibuprofen", emoji: "🩺", label: "Ibuprofen" },
      { id: "mefenamic-acid", emoji: "💊", label: "Mefenamic Acid" },
      { id: "aspirin", emoji: "💊", label: "Aspirin" },
      { id: "antihistamines", emoji: "🤧", label: "Antihistamines" },
      { id: "decongestants", emoji: "👃", label: "Decongestants" },
      { id: "cough-syrups", emoji: "🍯", label: "Cough Syrups" },
      { id: "amoxicillin", emoji: "🧪", label: "Amoxicillin" },
      { id: "cephalosporins", emoji: "💉", label: "Cephalosporins" },
      { id: "sulfa-drugs", emoji: "💊", label: "Sulfa Drugs" },
    ],
  },
  {
    title: "Product Exposure",
    data: [
      { id: "cosmetics", emoji: "💄", label: "Cosmetics" },
      { id: "skincare-products", emoji: "🧴", label: "Skincare Products" },
      { id: "sunscreen", emoji: "☀️", label: "Sunscreen" },
      { id: "hair-dye", emoji: "💇", label: "Hair Dye" },
      { id: "perfumes", emoji: "🌸", label: "Perfumes" },
      { id: "cleaning-products", emoji: "🧼", label: "Cleaning Products" },
      { id: "laundry-detergents", emoji: "🧺", label: "Laundry Detergents" },
      { id: "dishwashing-liquids", emoji: "🫧", label: "Dishwashing Liquids" },
      { id: "latex-products", emoji: "🧤", label: "Latex Products" },
      { id: "insect-repellents", emoji: "🦟", label: "Insect Repellents" },
    ],
  },
];

const SETTINGS_ITEMS: SettingItem[] = [
  {
    id: "account-details",
    label: "Account Details",
    icon: "person-outline",
    route: "/account-details",
  },
  {
    id: "reported-products",
    label: "Reported Products",
    icon: "flag-outline",
    route: "/reported-products",
  },
  {
    id: "privacy-policy",
    label: "Privacy Policy",
    icon: "shield-outline",
    route: "/privacy-policy",
  },
  {
    id: "terms-of-service",
    label: "Terms of Service",
    icon: "alert-circle-outline",
    route: "/terms-of-service",
  },
  {
    id: "about-codify",
    label: "About Codify",
    icon: "information-circle-outline",
    route: "/about-codify",
  },
];

function getInitials(name: string) {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const { selectedAllergens, toggleAllergen, isAllergenSelected } =
    useAllergenAlerts();

  const { scanHistory } = useScanHistory();

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Codify User";

  const emailAddress =
    user?.primaryEmailAddress?.emailAddress || "No email address";

  const avatarInitials = getInitials(displayName);

  const toggleGroup = (title: string) => {
    setExpandedGroups((currentGroups) => {
      if (currentGroups.includes(title)) {
        return currentGroups.filter((groupTitle) => groupTitle !== title);
      }

      return [...currentGroups, title];
    });
  };

  const openSettingsPage = (route?: string) => {
    if (!route) {
      return;
    }

    router.push(route as never);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/sign-in" as never);
          } catch (error) {
            console.log("Failed to sign out:", error);
            Alert.alert("Sign Out Failed", "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
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
          <Text style={styles.profileLabel}>MY PROFILE</Text>

          <Pressable
            style={styles.editButton}
            onPress={() => openSettingsPage("/account-details")}
          >
            <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.userRow}>
          <View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>

            <View style={styles.onlineDot} />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{emailAddress}</Text>

            <View style={styles.memberBadge}>
              <Ionicons name="star" size={13} color="#FFD230" />
              <Text style={styles.memberText}>Codify Member</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="scan-outline"
              size={14}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.statValue}>{scanHistory.length}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="notifications-outline"
              size={14}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.statValue}>
              {selectedAllergens.length === 0 ? "—" : selectedAllergens.length}
            </Text>
            <Text style={styles.statLabel}>Allergen Alerts</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="shield-outline"
              size={14}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.statValue}>PH</Text>
            <Text style={styles.statLabel}>FDA Region</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.allergenContainer}>
        <View style={styles.allergenHeaderRow}>
          <View style={styles.bellIconBox}>
            <Ionicons name="notifications-outline" size={14} color="#4F46E5" />
          </View>

          <Text style={styles.allergenTitle}>Allergen Alerts</Text>
        </View>

        <Text style={styles.allergenDescription}>
          Tap a category to open. You'll be warned when scanned products contain
          selected allergens.
        </Text>

        {ALERT_GROUPS.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);

          return (
            <View key={group.title} style={styles.alertGroup}>
              <Pressable
                style={styles.groupLabelButton}
                onPress={() => toggleGroup(group.title)}
              >
                <Text style={styles.groupLabel}>{group.title}</Text>
                <View style={styles.groupLine} />
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#90A1B9"
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.alertGrid}>
                  {group.data.map((item) => {
                    const isSelected = isAllergenSelected(item.id);

                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.alertCard,
                          isSelected && styles.alertCardSelected,
                        ]}
                        onPress={() => toggleAllergen(item.id)}
                      >
                        <Text style={styles.alertEmoji}>{item.emoji}</Text>

                        <Text
                          numberOfLines={2}
                          style={[
                            styles.alertText,
                            isSelected && styles.alertTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color="#4F46E5"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>Settings</Text>
        </View>

        {SETTINGS_ITEMS.map((item, index) => {
          const isLastItem = index === SETTINGS_ITEMS.length - 1;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.settingButton,
                isLastItem && styles.settingButtonLast,
              ]}
              onPress={() => openSettingsPage(item.route)}
            >
              <LinearGradient
                colors={["rgba(79,70,229,0.1)", "rgba(124,58,237,0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingIconBox}
              >
                <Ionicons name={item.icon} size={16} color="#4F46E5" />
              </LinearGradient>

              <Text style={styles.settingText}>{item.label}</Text>

              <Ionicons name="chevron-forward" size={16} color="#CAD5E2" />
            </Pressable>
          );
        })}
      </View>

      <LinearGradient
        colors={[
          "rgba(37,99,235,0.05)",
          "rgba(79,70,229,0.05)",
          "rgba(124,58,237,0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aboutContainer}
      >
        <View style={styles.aboutHeaderRow}>
          <Ionicons name="shield-outline" size={16} color="#4F46E5" />
          <Text style={styles.aboutTitle}>About Codify</Text>
        </View>

        <Text style={styles.aboutDescription}>
          Codify helps Filipino consumers make informed decisions by providing
          instant FDA verification and ingredient analysis through barcode
          scanning. Data is based on the Philippine FDA database.
        </Text>

        <View style={styles.aboutFooter}>
          <Text style={styles.aboutFooterText}>Version 1.0.0</Text>
          <Text style={styles.aboutFooterText}>© 2026 Codify</Text>
        </View>
      </LinearGradient>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={16} color="#FB2C36" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingBottom: 32,
  },

  header: {
    height: 325,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  profileLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.6)",
  },

  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  userRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },

  avatarText: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -1.3,
    color: "#FFFFFF",
  },

  onlineDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    right: -2,
    bottom: 0,
    backgroundColor: "#00D492",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },

  userInfo: {
    marginLeft: 16,
    flex: 1,
  },

  name: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  email: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
  },

  memberBadge: {
    marginTop: 8,
    height: 23,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,185,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,210,48,0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  memberText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#FEE685",
  },

  statsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    height: 91,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    paddingTop: 13,
  },

  statValue: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  statLabel: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  allergenContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  allergenHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bellIconBox: {
    width: 24,
    height: 24,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  allergenTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "900",
    color: "#1D293D",
  },

  allergenDescription: {
    marginTop: 12,
    marginLeft: 32,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  alertGroup: {
    marginTop: 20,
  },

  groupLabelButton: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  groupLabel: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#90A1B9",
  },

  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  alertGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
  },

  alertCard: {
    width: "48.4%",
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.17,
    borderColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  alertCardSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  alertEmoji: {
    width: 22,
    fontSize: 16,
    lineHeight: 24,
  },

  alertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    color: "#62748E",
  },

  alertTextSelected: {
    color: "#4F46E5",
  },

  settingsContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.17,
    borderColor: "rgba(241,245,249,0.8)",
    overflow: "hidden",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  settingsHeader: {
    height: 45,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1.17,
    borderBottomColor: "#F8FAFC",
  },

  settingsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: "#1D293D",
  },

  settingButton: {
    height: 65,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1.17,
    borderBottomColor: "#F8FAFC",
  },

  settingButtonLast: {
    borderBottomWidth: 0,
  },

  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  settingText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#314158",
  },

  aboutContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    minHeight: 181,
    borderRadius: 16,
    borderWidth: 1.17,
    borderColor: "#E0E7FF",
    paddingTop: 17,
    paddingHorizontal: 17,
    paddingBottom: 17,
  },

  aboutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  aboutTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#4F46E5",
  },

  aboutDescription: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 20,
    color: "#62748E",
  },

  aboutFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1.17,
    borderTopColor: "#E0E7FF",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  aboutFooterText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  signOutButton: {
    marginTop: 24,
    marginHorizontal: 16,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.17,
    borderColor: "#FFE2E2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  signOutText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#FB2C36",
  },
});
