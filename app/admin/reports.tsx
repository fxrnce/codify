import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
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
  type AdminPage,
  type AdminReport,
  type AdminReportStatus,
} from "@/services/admin-api";

const filters: (AdminReportStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
];

export default function AdminReportsScreen() {
  const router = useRouter();
  const { getToken, isOnline } = useAdminAccess();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [pagination, setPagination] = useState<AdminPage | null>(null);
  const [status, setStatus] = useState<(typeof filters)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteReport = useCallback(
    (report: AdminReport) => {
      if (!isOnline) return;
      Alert.alert(
        "Delete Report",
        `Permanently delete the report for "${report.productName}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setDeletingId(report.id);
              try {
                await adminRequest(getToken, `/reports/${report.id}`, {
                  method: "DELETE",
                  body: JSON.stringify({ updatedAt: report.updatedAt }),
                });
                setReports((current) => current.filter((item) => item.id !== report.id));
              } catch (caughtError) {
                Alert.alert(
                  "Unable to Delete",
                  caughtError instanceof Error
                    ? caughtError.message
                    : "Unable to delete this report.",
                );
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [getToken, isOnline],
  );

  const load = useCallback(
    async (page = 1, replace = true) => {
      if (replace) {
        setLoading(true);
        setRefreshing(true);
      }
      setError("");

      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: "20",
          q: submittedSearch,
          ...(status !== "ALL" ? { status } : {}),
        });
        const response = await adminRequest<{
          reports: AdminReport[];
          pagination: AdminPage;
        }>(getToken, `/reports?${query}`);
        setReports((current) =>
          replace ? response.reports : [...current, ...response.reports],
        );
        setPagination(response.pagination);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load reports.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, status, submittedSearch],
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
        data={reports}
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
                placeholder="Search product, brand, or barcode"
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
                accessibilityLabel="Search reports"
                style={adminStyles.primaryButton}
                onPress={() => setSubmittedSearch(search.trim())}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={filters}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: adminColors.border,
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: "#FFFFFF",
                    },
                    status === item && {
                      backgroundColor: adminColors.primarySoft,
                      borderColor: "#F5B7C0",
                    },
                  ]}
                  onPress={() => setStatus(item)}
                >
                  <Text
                    style={{
                      color:
                        status === item
                          ? adminColors.primary
                          : adminColors.muted,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    {item.replace(/_/g, " ")}
                  </Text>
                </Pressable>
              )}
            />
            {error && reports.length > 0 && (
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
                gap: 10,
              },
              pressed && { opacity: 0.75 },
            ]}
            onPress={() =>
              router.push({
                pathname: "/admin/report/[id]",
                params: { id: item.id },
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  numberOfLines={2}
                  style={{ color: adminColors.text, fontSize: 15, fontWeight: "800" }}
                >
                  {item.productName}
                </Text>
                <Text style={{ color: adminColors.muted, fontSize: 12 }}>
                  {item.brand} · {item.barcode || "No barcode"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Delete report"
                disabled={deletingId === item.id || !isOnline}
                onPress={(event) => {
                  event.stopPropagation();
                  deleteReport(item);
                }}
                style={{
                  padding: 6,
                  opacity: deletingId === item.id || !isOnline ? 0.4 : 1,
                }}
              >
                <Ionicons name="trash-outline" size={18} color={adminColors.danger} />
              </Pressable>
              <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
            </View>
            <StatusPill value={item.status} />
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#F0F2F5",
                paddingTop: 10,
                gap: 4,
              }}
            >
              <Text style={{ color: adminColors.text, fontWeight: "700" }}>
                {item.reason}
              </Text>
              <Text style={{ color: adminColors.muted, fontSize: 11 }}>
                {formatAdminDate(item.submittedAt)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <LoadState
            loading={loading}
            error={error}
            empty="No reports match this search and status."
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
