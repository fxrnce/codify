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
} from "@/components/admin/admin-common";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import {
  adminRequest,
  type AdminPage,
  type AdminProductSummary,
} from "@/services/admin-api";

export default function AdminProductsScreen() {
  const router = useRouter();
  const { getToken, isOnline } = useAdminAccess();
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [pagination, setPagination] = useState<AdminPage | null>(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const deleteProduct = useCallback(
    (product: AdminProductSummary) => {
      if (!isOnline) return;
      Alert.alert(
        "Delete Product",
        `Permanently delete "${product.name}" from the catalog? Existing scan and report history will remain, but this cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setDeletingId(product.id);
              try {
                await adminRequest(getToken, `/products/${product.id}`, {
                  method: "DELETE",
                  body: JSON.stringify({ updatedAt: product.updatedAt }),
                });
                setProducts((current) =>
                  current.filter((item) => item.id !== product.id),
                );
              } catch (caughtError) {
                Alert.alert(
                  "Unable to Delete",
                  caughtError instanceof Error
                    ? caughtError.message
                    : "Unable to delete this product.",
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
          q: submittedSearch,
          page: String(page),
          limit: "20",
        });
        const response = await adminRequest<{
          products: AdminProductSummary[];
          pagination: AdminPage;
        }>(getToken, `/products?${query}`);
        setProducts((current) =>
          replace ? response.products : [...current, ...response.products],
        );
        setPagination(response.pagination);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load products.",
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
        data={products}
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
                placeholder="Search name, brand, or barcode"
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
                accessibilityLabel="Search products"
                style={adminStyles.primaryButton}
                onPress={() => setSubmittedSearch(search.trim())}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pressable
              disabled={!isOnline}
              style={[
                adminStyles.primaryButton,
                !isOnline && adminStyles.disabled,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/admin/product/[id]",
                  params: { id: "new" },
                })
              }
            >
              <Text style={adminStyles.primaryButtonText}>+ Add Product</Text>
            </Pressable>
            {error && products.length > 0 && (
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
                pathname: "/admin/product/[id]",
                params: { id: item.id },
              })
            }
          >
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: adminColors.text, fontWeight: "800", fontSize: 15 }}>
                  {item.name}
                </Text>
                <Text selectable style={{ color: adminColors.muted, fontSize: 12 }}>
                  {item.brand} · {item.barcode}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Delete ${item.name}`}
                disabled={deletingId === item.id || !isOnline}
                onPress={(event) => {
                  event.stopPropagation();
                  deleteProduct(item);
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
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <StatusPill value={item.status} />
              {item.isArchived && <StatusPill value="ARCHIVED" />}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <LoadState
            loading={loading}
            error={error}
            empty="No products match this search."
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
