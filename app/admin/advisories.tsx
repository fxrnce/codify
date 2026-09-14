import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AdminGate,
  ConnectionBanner,
  LoadState,
  StatusPill,
  adminColors,
  adminStyles,
  formatAdminDate,
} from "@/components/admin/admin-common";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import {
  adminRequest,
  type AdminAdvisory,
  type AdminPage,
} from "@/services/admin-api";

export default function AdminAdvisoriesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isOnline } = useAdminAccess();
  const [advisories, setAdvisories] = useState<AdminAdvisory[]>([]);
  const [pagination, setPagination] = useState<AdminPage | null>(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (page = 1, replace = true) => {
      if (replace) {
        setLoading(true);
        setRefreshing(true);
      }
      setError("");
      try {
        const query = new URLSearchParams({
          q: submittedSearch,
          page: String(page),
          limit: "20",
        });
        const response = await adminRequest<{
          advisories: AdminAdvisory[];
          pagination: AdminPage;
        }>(getToken, `/advisories?${query}`);
        setAdvisories((current) =>
          replace ? response.advisories : [...current, ...response.advisories],
        );
        setPagination(response.pagination);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load advisories.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, submittedSearch],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <AdminGate>
      <FlatList
        style={adminStyles.screen}
        contentContainerStyle={{ padding: 18, paddingBottom: 36, gap: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        data={advisories}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load()} />
        }
        ListHeaderComponent={
          <View style={{ gap: 13 }}>
            <ConnectionBanner />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={() => setSubmittedSearch(search.trim())}
                placeholder="Search advisory number or title"
                placeholderTextColor="#98A2B3"
                returnKeyType="search"
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderWidth: 1,
                  borderColor: adminColors.border,
                  borderRadius: 12,
                  paddingHorizontal: 13,
                  backgroundColor: "#FFFFFF",
                  color: adminColors.text,
                }}
              />
              <Pressable
                accessibilityLabel="Search advisories"
                style={adminStyles.primaryButton}
                onPress={() => setSubmittedSearch(search.trim())}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              disabled={!isOnline}
              style={[adminStyles.primaryButton, !isOnline && adminStyles.disabled]}
              onPress={() =>
                router.push({
                  pathname: "/admin/advisory/[id]",
                  params: { id: "new" },
                })
              }
            >
              <Text style={adminStyles.primaryButtonText}>+ Add Advisory</Text>
            </Pressable>
            {error && advisories.length > 0 && (
              <Text style={{ color: adminColors.danger }}>{error}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: adminColors.border,
                borderRadius: 15,
                padding: 16,
                gap: 9,
              },
              pressed && { opacity: 0.75 },
            ]}
            onPress={() =>
              router.push({
                pathname: "/admin/advisory/[id]",
                params: { id: item.id },
              })
            }
          >
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: adminColors.primary, fontSize: 12, fontWeight: "800" }}>
                  FDA {item.advisoryNumber}
                </Text>
                <Text style={{ color: adminColors.text, fontWeight: "800", fontSize: 15 }} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={{ color: adminColors.muted, fontSize: 12 }}>
                  {item.category} · {formatAdminDate(item.publishedAt)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <StatusPill value={item.status} />
              {!item.isActive && <StatusPill value="INACTIVE" />}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <LoadState
            loading={loading}
            error={error}
            empty="No advisories match this search."
            onRetry={() => void load()}
          />
        }
        ListFooterComponent={
          pagination && pagination.page < pagination.totalPages ? (
            <Pressable
              style={adminStyles.secondaryButton}
              onPress={() => void load(pagination.page + 1, false)}
            >
              <Text style={adminStyles.secondaryButtonText}>Load more</Text>
            </Pressable>
          ) : null
        }
      />
    </AdminGate>
  );
}
