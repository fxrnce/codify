import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AccountDetailsScreen() {
  const router = useRouter();

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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.title}>Account Details</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>DU</Text>
            </View>

            <Pressable style={styles.cameraButton}>
              <Ionicons name="camera-outline" size={14} color="#4F46E5" />
            </Pressable>
          </View>

          <Text style={styles.memberSince}>Member since May 2026</Text>
        </View>
      </LinearGradient>

      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="person-outline" size={22} color="#6F6EFF" />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.uppercaseLabel}>FULL NAME</Text>
            <Text style={styles.mainValue}>Demo User</Text>
          </View>

          <Pressable style={styles.editButton}>
            <Ionicons name="pencil-outline" size={24} color="#635BFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.uppercaseLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.mainValue}>demo@codify.ph</Text>
          </View>

          <Pressable style={styles.editButton}>
            <Ionicons name="pencil-outline" size={24} color="#635BFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#6F6EFF" />
          <Text style={styles.sectionTitle}>Account Security</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.rowTitle}>Password</Text>
            <Text style={styles.mutedValue}>Demo User</Text>
          </View>

          <Pressable style={styles.pillButton}>
            <Text style={styles.pillButtonText}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.rowTitle}>Two-Factor Authenticator</Text>
            <Text style={styles.mutedValue}>Not enabled</Text>
          </View>

          <Pressable style={styles.pillButton}>
            <Text style={styles.pillButtonText}>Enable</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="mail-outline" size={22} color="#6F6EFF" />
          <Text style={styles.sectionTitle}>Linked Accounts</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.rowTitle}>Google</Text>
            <Text style={styles.mutedValue}>Not connected</Text>
          </View>

          <Pressable style={styles.pillButton}>
            <Text style={styles.pillButtonText}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailTextBox}>
            <Text style={styles.rowTitle}>Facebook</Text>
            <Text style={styles.mutedValue}>Not connected</Text>
          </View>

          <Pressable style={styles.pillButton}>
            <Text style={styles.pillButtonText}>Enable</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>

        <Text style={styles.dangerDescription}>
          Permanently delete your account and all associated data.
        </Text>

        <Pressable style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </Pressable>
      </View>
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
    height: 256,
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
    top: 112,
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

  avatarSection: {
    marginTop: 24,
    alignItems: "center",
  },

  avatarWrapper: {
    width: 84,
    height: 84,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
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
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -1.4,
    color: "#FFFFFF",
  },

  cameraButton: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  memberSince: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.6)",
  },

  sectionCard: {
    marginTop: 16,
    marginHorizontal: 14,
    height: 191,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    borderRadius: 20,
    overflow: "hidden",
  },

  sectionTitleRow: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1D293D",
  },

  detailRow: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  detailTextBox: {
    flex: 1,
  },

  uppercaseLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#90A1B9",
  },

  mainValue: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#1D293D",
  },

  rowTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#1D293D",
  },

  mutedValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#94A1B0",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  editButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#635BFF",
  },

  pillButton: {
    minWidth: 84,
    height: 28,
    borderRadius: 1000,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  pillButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#615FFF",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  dangerCard: {
    marginTop: 20,
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FFE2E2",
  },

  dangerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#C10007",
  },

  dangerDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#F43F5E",
  },

  deleteButton: {
    marginTop: 18,
    height: 38,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FFA2A2",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#E7000B",
  },
});
