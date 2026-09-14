import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import {
  AdminGate,
  AdminTextField,
  ConnectionBanner,
  LoadState,
  adminColors,
  adminStyles,
} from "@/components/admin/admin-common";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import { adminRequest, type AdminProduct } from "@/services/admin-api";

const nutritionKeys = [
  "calories",
  "protein",
  "carbohydrates",
  "totalFat",
  "saturatedFat",
  "totalSugars",
  "dietaryFiber",
  "sodium",
] as const;

type ProductDraft = Omit<AdminProduct, "id" | "updatedAt" | "allergens" | "alternatives"> & {
  allergens: string[];
  alternatives: string[];
};

const emptyProduct: ProductDraft = {
  slug: "",
  barcode: "",
  name: "",
  brand: "",
  category: "",
  status: "UNVERIFIED",
  fdaStatusLabel: "FDA Verification Pending",
  registrationNumber: "Not verified",
  healthScore: null,
  servingSize: "",
  warningMessage: "",
  imageUrl: null,
  verificationUrl: "https://verification.fda.gov.ph/",
  isArchived: false,
  nutrition: Object.fromEntries(
    nutritionKeys.map((key) => [key, "N/A"]),
  ) as NonNullable<AdminProduct["nutrition"]>,
  ingredients: [],
  allergens: [],
  alternatives: [],
};

const toLines = (values: string[]) => values.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function AdminProductEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isOnline } = useAdminAccess();
  const isNew = id === "new";
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [updatedAt, setUpdatedAt] = useState("");
  const [ingredientLines, setIngredientLines] = useState("");
  const [allergenLines, setAllergenLines] = useState("");
  const [alternativeLines, setAlternativeLines] = useState("");
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const snapshot = useMemo(
    () =>
      JSON.stringify([
        draft,
        ingredientLines,
        allergenLines,
        alternativeLines,
      ]),
    [alternativeLines, allergenLines, draft, ingredientLines],
  );
  const dirty = baseline ? snapshot !== baseline : isNew;

  const load = useCallback(async () => {
    if (isNew) {
      const next = { ...emptyProduct };
      setDraft(next);
      setBaseline(JSON.stringify([next, "", "", ""]));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { product } = await adminRequest<{ product: AdminProduct }>(
        getToken,
        `/products/${id}`,
      );
      const next: ProductDraft = {
        slug: product.slug,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        fdaStatusLabel: product.fdaStatusLabel,
        registrationNumber: product.registrationNumber,
        healthScore: product.healthScore,
        servingSize: product.servingSize,
        warningMessage: product.warningMessage,
        imageUrl: product.imageUrl,
        verificationUrl: product.verificationUrl,
        isArchived: product.isArchived,
        nutrition: Object.fromEntries(
          nutritionKeys.map((key) => [
            key,
            product.nutrition?.[key] ?? "N/A",
          ]),
        ) as NonNullable<AdminProduct["nutrition"]>,
        ingredients: product.ingredients.map(({ name, isAllergen }) => ({
          name,
          isAllergen,
        })),
        allergens: product.allergens.map((item) => item.name),
        alternatives: product.alternatives.map((item) => item.name),
      };
      const ingredients = product.ingredients
        .map((item) => `${item.isAllergen ? "* " : ""}${item.name}`)
        .join("\n");
      const allergens = toLines(next.allergens);
      const alternatives = toLines(next.alternatives);
      setDraft(next);
      setUpdatedAt(product.updatedAt);
      setIngredientLines(ingredients);
      setAllergenLines(allergens);
      setAlternativeLines(alternatives);
      setBaseline(JSON.stringify([next, ingredients, allergens, alternatives]));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this product.",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, id, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (saving || !isOnline) return;
    const product = {
      ...draft,
      ingredients: fromLines(ingredientLines).map((line) => ({
        name: line.replace(/^\*\s*/, ""),
        isAllergen: line.startsWith("*"),
      })),
      allergens: fromLines(allergenLines),
      alternatives: fromLines(alternativeLines),
    };

    setSaving(true);
    setError("");
    try {
      await adminRequest(getToken, isNew ? "/products" : `/products/${id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(isNew ? product : { product, updatedAt }),
      });
      Alert.alert(
        isNew ? "Product Added" : "Product Updated",
        "The saved catalog details are now available to users.",
      );
      router.back();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save this product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const set = <Key extends keyof ProductDraft>(
    key: Key,
    value: ProductDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <AdminGate>
      <ScrollView
        style={adminStyles.screen}
        contentContainerStyle={adminStyles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ConnectionBanner />
        {loading || (!isNew && !updatedAt) ? (
          <LoadState loading={loading} error={error} onRetry={() => void load()} />
        ) : (
          <>
            <Text style={adminStyles.sectionTitle}>PRODUCT IDENTITY</Text>
            <AdminTextField label="Product name, including size" value={draft.name} onChangeText={(value) => set("name", value)} editable={!saving && isOnline} />
            <AdminTextField label="Brand" value={draft.brand} onChangeText={(value) => set("brand", value)} editable={!saving && isOnline} />
            <AdminTextField label="Barcode or QR value" value={draft.barcode} onChangeText={(value) => set("barcode", value)} editable={!saving && isOnline} autoCapitalize="none" />
            <AdminTextField label="Catalog ID (lowercase-with-hyphens)" value={draft.slug} onChangeText={(value) => set("slug", value)} editable={isNew && !saving && isOnline} autoCapitalize="none" />
            <AdminTextField label="Category" value={draft.category} onChangeText={(value) => set("category", value)} editable={!saving && isOnline} />
            <AdminTextField label="Serving size" value={draft.servingSize} onChangeText={(value) => set("servingSize", value)} editable={!saving && isOnline} />

            <Text style={adminStyles.sectionTitle}>FDA STATUS</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {["APPROVED", "CAUTION", "FDA_ADVISORY", "UNVERIFIED"].map((item) => (
                <Pressable
                  key={item}
                  disabled={saving || !isOnline}
                  style={[
                    adminStyles.secondaryButton,
                    draft.status === item && {
                      backgroundColor: adminColors.primarySoft,
                      borderColor: "#F5B7C0",
                    },
                  ]}
                  onPress={() => set("status", item)}
                >
                  <Text style={{ color: draft.status === item ? adminColors.primary : adminColors.text, fontWeight: "800", fontSize: 11 }}>
                    {item.replace(/_/g, " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AdminTextField label="FDA status label" value={draft.fdaStatusLabel} onChangeText={(value) => set("fdaStatusLabel", value)} editable={!saving && isOnline} />
            <AdminTextField label="Registration or notification number" value={draft.registrationNumber} onChangeText={(value) => set("registrationNumber", value)} editable={!saving && isOnline} autoCapitalize="characters" />
            <AdminTextField label="Verification source URL" value={draft.verificationUrl ?? ""} onChangeText={(value) => set("verificationUrl", value || null)} editable={!saving && isOnline} keyboardType="url" autoCapitalize="none" />
            <AdminTextField label="Product guidance" value={draft.warningMessage} onChangeText={(value) => set("warningMessage", value)} editable={!saving && isOnline} multiline maxLength={8000} />

            <Text style={adminStyles.sectionTitle}>NUTRITION PER SERVING</Text>
            {nutritionKeys.map((key) => (
              <AdminTextField
                key={key}
                label={key.replace(/([A-Z])/g, " $1")}
                value={draft.nutrition?.[key] ?? "N/A"}
                onChangeText={(value) =>
                  set("nutrition", { ...draft.nutrition!, [key]: value })
                }
                editable={!saving && isOnline}
              />
            ))}
            <AdminTextField
              label="Reviewed health score (0–100, optional)"
              value={draft.healthScore?.toString() ?? ""}
              onChangeText={(value) =>
                set("healthScore", value ? Number(value) : null)
              }
              editable={!saving && isOnline}
              keyboardType="number-pad"
            />

            <Text style={adminStyles.sectionTitle}>INGREDIENTS AND ALLERGENS</Text>
            <AdminTextField label="Ingredients — one per line; prefix an allergenic ingredient with *" value={ingredientLines} onChangeText={setIngredientLines} editable={!saving && isOnline} multiline />
            <AdminTextField label="Declared allergens — one per line" value={allergenLines} onChangeText={setAllergenLines} editable={!saving && isOnline} multiline />
            <AdminTextField label="Alternatives — one per line" value={alternativeLines} onChangeText={setAlternativeLines} editable={!saving && isOnline} multiline />
            <AdminTextField label="Product image URL (optional)" value={draft.imageUrl ?? ""} onChangeText={(value) => set("imageUrl", value || null)} editable={!saving && isOnline} keyboardType="url" autoCapitalize="none" />

            <Pressable
              disabled={saving || !isOnline}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: adminColors.border,
                borderRadius: 13,
                padding: 14,
                backgroundColor: "#FFFFFF",
              }}
              onPress={() => set("isArchived", !draft.isArchived)}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: draft.isArchived ? adminColors.primary : "#98A2B3", backgroundColor: draft.isArchived ? adminColors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                {draft.isArchived && <Text style={{ color: "white", fontWeight: "900" }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.text, fontWeight: "800" }}>Archive product</Text>
                <Text style={{ color: adminColors.muted, fontSize: 11, lineHeight: 17 }}>Hide it from public search while retaining history and reports.</Text>
              </View>
            </Pressable>
            {error && <Text style={{ color: adminColors.danger }}>{error}</Text>}
            {error.includes("changed") && (
              <Pressable style={adminStyles.secondaryButton} onPress={() => void load()}>
                <Text style={adminStyles.secondaryButtonText}>Reload Latest Product</Text>
              </Pressable>
            )}
            <Pressable
              disabled={!dirty || saving || !isOnline}
              style={[
                adminStyles.primaryButton,
                (!dirty || saving || !isOnline) && adminStyles.disabled,
              ]}
              onPress={() => void save()}
            >
              <Text style={adminStyles.primaryButtonText}>
                {saving ? "Saving…" : isNew ? "Add Product" : "Save Product"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </AdminGate>
  );
}
