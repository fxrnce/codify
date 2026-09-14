import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import {
  AdminCard,
  AdminGate,
  ConnectionBanner,
  adminColors,
  adminStyles,
} from "@/components/admin/admin-common";

export default function AdminHomeScreen() {
  const router = useRouter();

  return (
    <AdminGate>
      <ScrollView
        style={adminStyles.screen}
        contentContainerStyle={adminStyles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ paddingTop: 34, gap: 8 }}>
          <Text style={adminStyles.sectionTitle}>CODIFY ADMIN</Text>
          <Text style={adminStyles.heading}>Catalog operations</Text>
          <Text style={adminStyles.body}>
            Review community reports and maintain the product information shown
            to Codify users.
          </Text>
        </View>
        <ConnectionBanner />
        <Text style={adminStyles.sectionTitle}>MANAGE</Text>
        <AdminCard
          icon="flag-outline"
          title="Product reports"
          description="Review concerns, update status, and reply to the reporting user."
          onPress={() => router.push("/admin/reports" as never)}
        />
        <AdminCard
          icon="cube-outline"
          title="Product catalog"
          description="Add products, correct details, and archive old entries."
          onPress={() => router.push("/admin/products" as never)}
        />
        <AdminCard
          icon="warning-outline"
          title="FDA advisories"
          description="Create and maintain notices with official source links."
          onPress={() => router.push("/admin/advisories" as never)}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            backgroundColor: adminColors.primarySoft,
            borderRadius: 14,
            padding: 15,
          }}
        >
          <Ionicons name="shield-checkmark" size={20} color={adminColors.primary} />
          <Text style={{ flex: 1, color: adminColors.muted, lineHeight: 19 }}>
            Every saved change is checked by the server and recorded in the audit
            trail.
          </Text>
        </View>
      </ScrollView>
    </AdminGate>
  );
}
