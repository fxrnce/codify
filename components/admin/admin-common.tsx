import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useAdminAccess } from "@/contexts/AdminAccessContext";

export const adminColors = {
  primary: "#B4233A",
  primarySoft: "#FFF0F2",
  background: "#F7F8FA",
  card: "#FFFFFF",
  text: "#202733",
  muted: "#6F7987",
  border: "#E4E7EC",
  success: "#20805D",
  warning: "#A16812",
  danger: "#B4233A",
};

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAdmin, isChecking, error, refresh } = useAdminAccess();

  if (isChecking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={adminColors.primary} />
        <Text style={styles.muted}>Checking administrator access…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={28} color={adminColors.primary} />
        </View>
        <Text style={styles.title}>Administrator access required</Text>
        <Text style={styles.centerText}>
          {error || "This account does not have permission to manage Codify."}
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => void refresh()}>
          <Text style={styles.primaryButtonText}>Check access again</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)/profile" as never)}>
          <Text style={styles.linkText}>Return to profile</Text>
        </Pressable>
      </View>
    );
  }

  return children;
}

export function ConnectionBanner() {
  const { isOnline } = useAdminAccess();

  return (
    <View style={[styles.connection, !isOnline && styles.connectionOffline]}>
      <View
        style={[styles.connectionDot, !isOnline && styles.connectionDotOffline]}
      />
      <Text style={[styles.connectionText, !isOnline && styles.offlineText]}>
        {isOnline
          ? "Online · Admin changes save immediately"
          : "Offline · Admin viewing and editing are unavailable"}
      </Text>
    </View>
  );
}

export function AdminCard({
  icon,
  title,
  description,
  onPress,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={21} color={adminColors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
      )}
    </Pressable>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const isGood = normalized === "resolved" || normalized === "approved";
  const isBad = normalized === "rejected" || normalized === "fda_advisory";

  return (
    <View
      style={[
        styles.pill,
        isGood && styles.pillGood,
        isBad && styles.pillBad,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          isGood && styles.pillGoodText,
          isBad && styles.pillBadText,
        ]}
      >
        {value.replace(/_/g, " ")}
      </Text>
    </View>
  );
}

export function AdminTextField({
  label,
  multiline,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#98A2B3"
        style={[styles.input, multiline && styles.textarea, props.style]}
      />
    </View>
  );
}

export function LoadState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error: string;
  empty?: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={adminColors.primary} />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" size={30} color={adminColors.danger} />
        <Text style={styles.centerText}>{error}</Text>
        <Pressable style={styles.secondaryButton} onPress={onRetry}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return empty ? (
    <View style={styles.stateBox}>
      <Ionicons name="file-tray-outline" size={30} color="#98A2B3" />
      <Text style={styles.centerText}>{empty}</Text>
    </View>
  ) : null;
}

export function formatAdminDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const adminStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: adminColors.background },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  sectionTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2, color: "#667085", marginTop: 8 },
  heading: { fontSize: 25, fontWeight: "800", color: adminColors.text },
  body: { fontSize: 14, lineHeight: 21, color: adminColors.muted },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  primaryButton: { backgroundColor: adminColors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  secondaryButton: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: adminColors.border, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: adminColors.text, fontWeight: "700" },
  disabled: { opacity: 0.48 },
});

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: adminColors.background, padding: 28, justifyContent: "center", alignItems: "center", gap: 14 },
  lockIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: adminColors.primarySoft, alignItems: "center", justifyContent: "center" },
  title: { color: adminColors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
  centerText: { color: adminColors.muted, lineHeight: 21, textAlign: "center" },
  muted: { color: adminColors.muted },
  primaryButton: adminStyles.primaryButton,
  primaryButtonText: adminStyles.primaryButtonText,
  secondaryButton: adminStyles.secondaryButton,
  secondaryButtonText: adminStyles.secondaryButtonText,
  linkText: { color: adminColors.primary, fontWeight: "700", padding: 8 },
  connection: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#ECFDF3" },
  connectionOffline: { backgroundColor: "#FFF4E5" },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: adminColors.success },
  connectionDotOffline: { backgroundColor: adminColors.warning },
  connectionText: { color: adminColors.success, fontSize: 12, fontWeight: "700" },
  offlineText: { color: adminColors.warning },
  card: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: adminColors.card, borderRadius: 16, borderWidth: 1, borderColor: adminColors.border, padding: 16 },
  pressed: { opacity: 0.75 },
  cardIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: adminColors.primarySoft, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: adminColors.text, fontSize: 16, fontWeight: "800" },
  cardDescription: { color: adminColors.muted, fontSize: 12, lineHeight: 18 },
  pill: { alignSelf: "flex-start", backgroundColor: "#FFF6E5", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  pillGood: { backgroundColor: "#ECFDF3" },
  pillBad: { backgroundColor: "#FFF0F2" },
  pillText: { color: adminColors.warning, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  pillGoodText: { color: adminColors.success },
  pillBadText: { color: adminColors.danger },
  field: { gap: 7 },
  fieldLabel: { color: "#475467", fontSize: 12, fontWeight: "700" },
  input: { minHeight: 46, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 11, backgroundColor: "#FFFFFF", color: adminColors.text, fontSize: 14 },
  textarea: { minHeight: 105, textAlignVertical: "top" },
  stateBox: { minHeight: 190, alignItems: "center", justifyContent: "center", padding: 24, gap: 13 },
});
