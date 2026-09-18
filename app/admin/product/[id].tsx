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
  fieldErrorMap,
} from "@/components/admin/admin-common";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import {
  AdminApiError,
  adminRequest,
  type AdminNutritionRating,
  type AdminNutritionRatingInput,
  type AdminProduct,
} from "@/services/admin-api";
import {
  HSR_CATEGORIES,
  HSR_CATEGORY_LABELS,
  type HsrCategory,
} from "@/types/nutrition-rating";

const WATER_CATEGORIES: HsrCategory[] = ["PLAIN_WATER", "UNSWEETENED_FLAVOURED_WATER"];

type NutritionRatingFormState = {
  enabled: boolean;
  category: HsrCategory;
  servingQuantity: string;
  servingUnit: "g" | "mL";
  caloriesPerServing: string;
  saturatedFatGramsPerServing: string;
  totalSugarsGramsPerServing: string;
  sodiumMilligramsPerServing: string;
  proteinGramsPerServing: string;
  fibreGramsPerServing: string;
  fvnlPercent: string;
  containsFruitOrVegetable: boolean;
  containsNutsOrLegumes: boolean;
};

const emptyNutritionRatingForm: NutritionRatingFormState = {
  enabled: false,
  category: "FOOD",
  servingQuantity: "",
  servingUnit: "g",
  caloriesPerServing: "",
  saturatedFatGramsPerServing: "",
  totalSugarsGramsPerServing: "",
  sodiumMilligramsPerServing: "",
  proteinGramsPerServing: "",
  fibreGramsPerServing: "",
  fvnlPercent: "",
  containsFruitOrVegetable: false,
  containsNutsOrLegumes: false,
};

function numberToFieldText(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function nutritionRatingToForm(
  rating: AdminNutritionRating | null,
): NutritionRatingFormState {
  if (!rating) return emptyNutritionRatingForm;

  return {
    enabled: true,
    category: rating.category,
    servingQuantity: numberToFieldText(rating.servingQuantity),
    servingUnit: rating.servingUnit === "mL" ? "mL" : "g",
    caloriesPerServing: numberToFieldText(rating.caloriesPerServing),
    saturatedFatGramsPerServing: numberToFieldText(rating.saturatedFatGramsPerServing),
    totalSugarsGramsPerServing: numberToFieldText(rating.totalSugarsGramsPerServing),
    sodiumMilligramsPerServing: numberToFieldText(rating.sodiumMilligramsPerServing),
    proteinGramsPerServing: numberToFieldText(rating.proteinGramsPerServing),
    fibreGramsPerServing: numberToFieldText(rating.fibreGramsPerServing),
    fvnlPercent: numberToFieldText(rating.fvnlPercent),
    containsFruitOrVegetable: rating.containsFruitOrVegetable,
    containsNutsOrLegumes: rating.containsNutsOrLegumes,
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// The backend always (re)computes the star rating, confidence, and point
// breakdown from these verified inputs — there is no field here to submit a
// rating, score, or point total directly.
function nutritionRatingFormToInput(
  form: NutritionRatingFormState,
): AdminNutritionRatingInput | null {
  if (!form.enabled) return null;

  if (WATER_CATEGORIES.includes(form.category)) {
    return { category: form.category };
  }

  return {
    category: form.category,
    servingQuantity: parseOptionalNumber(form.servingQuantity),
    servingUnit: form.servingUnit,
    caloriesPerServing: parseOptionalNumber(form.caloriesPerServing),
    saturatedFatGramsPerServing: parseOptionalNumber(form.saturatedFatGramsPerServing),
    totalSugarsGramsPerServing: parseOptionalNumber(form.totalSugarsGramsPerServing),
    sodiumMilligramsPerServing: parseOptionalNumber(form.sodiumMilligramsPerServing),
    proteinGramsPerServing: parseOptionalNumber(form.proteinGramsPerServing),
    fibreGramsPerServing: parseOptionalNumber(form.fibreGramsPerServing),
    fvnlPercent: parseOptionalNumber(form.fvnlPercent),
    containsFruitOrVegetable: form.containsFruitOrVegetable,
    containsNutsOrLegumes: form.containsNutsOrLegumes,
  };
}

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

type ProductDraft = Omit<
  AdminProduct,
  "id" | "updatedAt" | "allergens" | "alternatives" | "nutritionRating"
> & {
  allergens: string[];
  alternatives: string[];
  nutritionRating: NutritionRatingFormState;
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
  nutritionRating: emptyNutritionRatingForm,
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
  const { getToken, isOnline } = useAdminAccess();
  const isNew = id === "new";
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [updatedAt, setUpdatedAt] = useState("");
  const [ingredientLines, setIngredientLines] = useState("");
  const [allergenLines, setAllergenLines] = useState("");
  const [alternativeLines, setAlternativeLines] = useState("");
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        nutritionRating: nutritionRatingToForm(product.nutritionRating),
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
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [load]);

  const save = async () => {
    if (saving || deleting || !isOnline) return;
    const product = {
      ...draft,
      nutritionRating: nutritionRatingFormToInput(draft.nutritionRating),
      ingredients: fromLines(ingredientLines).map((line) => ({
        name: line.replace(/^\*\s*/, ""),
        isAllergen: line.startsWith("*"),
      })),
      allergens: fromLines(allergenLines),
      alternatives: fromLines(alternativeLines),
    };

    setSaving(true);
    setError("");
    setFieldErrors({});
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
      if (caughtError instanceof AdminApiError && caughtError.fieldErrors?.length) {
        setFieldErrors(fieldErrorMap(caughtError.fieldErrors));
        setError("Check the highlighted fields below.");
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save this product.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (isNew || saving || deleting || !isOnline) return;
    Alert.alert(
      "Delete Product",
      `Permanently delete "${draft.name}" from the catalog? Existing scan and report history will remain, but this cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setError("");
            try {
              await adminRequest(getToken, `/products/${id}`, {
                method: "DELETE",
                body: JSON.stringify({ updatedAt }),
              });
              router.back();
            } catch (caughtError) {
              setError(
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unable to delete this product.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const set = <Key extends keyof ProductDraft>(
    key: Key,
    value: ProductDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key as string]) return current;
      const { [key as string]: _removed, ...rest } = current;
      return rest;
    });
  };

  const setNutritionRating = <Key extends keyof NutritionRatingFormState>(
    key: Key,
    value: NutritionRatingFormState[Key],
  ) => {
    setDraft((current) => ({
      ...current,
      nutritionRating: { ...current.nutritionRating, [key]: value },
    }));
    setFieldErrors((current) => {
      if (!current.nutritionRating) return current;
      const { nutritionRating: _removed, ...rest } = current;
      return rest;
    });
  };

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
            <AdminTextField label="Product name, including size" placeholder="Coca-Cola Original Taste 320 mL" value={draft.name} onChangeText={(value) => set("name", value)} editable={!saving && isOnline} error={fieldErrors.name} />
            <AdminTextField label="Brand" placeholder="Coca-Cola" value={draft.brand} onChangeText={(value) => set("brand", value)} editable={!saving && isOnline} error={fieldErrors.brand} />
            <AdminTextField label="Product barcode" placeholder="Enter the UPC or EAN printed on the package" value={draft.barcode} onChangeText={(value) => set("barcode", value)} editable={!saving && isOnline} autoCapitalize="none" error={fieldErrors.barcode} />
            <AdminTextField label="Catalog ID (lowercase-with-hyphens)" placeholder="coca-cola-original-320ml" value={draft.slug} onChangeText={(value) => set("slug", value)} editable={isNew && !saving && isOnline} autoCapitalize="none" error={fieldErrors.slug} />
            <AdminTextField label="Category" placeholder="Carbonated Drink" value={draft.category} onChangeText={(value) => set("category", value)} editable={!saving && isOnline} error={fieldErrors.category} />
            <AdminTextField label="Serving size" placeholder="320 mL" value={draft.servingSize} onChangeText={(value) => set("servingSize", value)} editable={!saving && isOnline} error={fieldErrors.servingSize} />

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
            {fieldErrors.status && <Text style={{ color: adminColors.danger, fontSize: 12 }}>{fieldErrors.status}</Text>}
            <AdminTextField label="FDA status label" value={draft.fdaStatusLabel} onChangeText={(value) => set("fdaStatusLabel", value)} editable={!saving && isOnline} error={fieldErrors.fdaStatusLabel} />
            <AdminTextField label="Registration or notification number" placeholder="FR-4000000000000 or Not verified" value={draft.registrationNumber} onChangeText={(value) => set("registrationNumber", value)} editable={!saving && isOnline} autoCapitalize="characters" error={fieldErrors.registrationNumber} />
            <AdminTextField label="Verification source URL" placeholder="https://verification.fda.gov.ph/" value={draft.verificationUrl ?? ""} onChangeText={(value) => set("verificationUrl", value || null)} editable={!saving && isOnline} keyboardType="url" autoCapitalize="none" error={fieldErrors.verificationUrl} />
            <AdminTextField label="Product guidance" value={draft.warningMessage} onChangeText={(value) => set("warningMessage", value)} editable={!saving && isOnline} multiline maxLength={8000} error={fieldErrors.warningMessage} />

            <Text style={adminStyles.sectionTitle}>NUTRITION PER SERVING</Text>
            {fieldErrors.nutrition && <Text style={{ color: adminColors.danger, fontSize: 12 }}>{fieldErrors.nutrition}</Text>}
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
            <Text style={adminStyles.sectionTitle}>NUTRITION RATING (HSR ESTIMATE)</Text>
            <Text style={{ color: adminColors.muted, fontSize: 11, lineHeight: 16 }}>
              The backend always calculates the star rating, confidence, and point breakdown from these verified values using the Health Star Rating method — there is no field to enter a rating or score directly.
            </Text>
            {fieldErrors.nutritionRating && <Text style={{ color: adminColors.danger, fontSize: 12 }}>{fieldErrors.nutritionRating}</Text>}
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
                marginTop: 8,
              }}
              onPress={() => setNutritionRating("enabled", !draft.nutritionRating.enabled)}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: draft.nutritionRating.enabled ? adminColors.primary : "#98A2B3", backgroundColor: draft.nutritionRating.enabled ? adminColors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                {draft.nutritionRating.enabled && <Text style={{ color: "white", fontWeight: "900" }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.text, fontWeight: "800" }}>Eligible for a nutrition rating</Text>
                <Text style={{ color: adminColors.muted, fontSize: 11, lineHeight: 17 }}>
                  Turn off for cosmetics, medicines, and other non-food products — the rating card is hidden entirely.
                </Text>
              </View>
            </Pressable>

            {draft.nutritionRating.enabled && (
              <>
                <Text style={[adminStyles.sectionTitle, { marginTop: 12 }]}>CALCULATION CATEGORY</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {HSR_CATEGORIES.map((category) => (
                    <Pressable
                      key={category}
                      disabled={saving || !isOnline}
                      style={[
                        adminStyles.secondaryButton,
                        draft.nutritionRating.category === category && {
                          backgroundColor: adminColors.primarySoft,
                          borderColor: "#F5B7C0",
                        },
                      ]}
                      onPress={() => setNutritionRating("category", category)}
                    >
                      <Text style={{ color: draft.nutritionRating.category === category ? adminColors.primary : adminColors.text, fontWeight: "800", fontSize: 11 }}>
                        {HSR_CATEGORY_LABELS[category]}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {!WATER_CATEGORIES.includes(draft.nutritionRating.category) && (
                  <>
                    <AdminTextField
                      label="Serving quantity, as printed on the label"
                      value={draft.nutritionRating.servingQuantity}
                      onChangeText={(value) => setNutritionRating("servingQuantity", value)}
                      editable={!saving && isOnline}
                      keyboardType="decimal-pad"
                    />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {(["g", "mL"] as const).map((unit) => (
                        <Pressable
                          key={unit}
                          disabled={saving || !isOnline}
                          style={[
                            adminStyles.secondaryButton,
                            draft.nutritionRating.servingUnit === unit && {
                              backgroundColor: adminColors.primarySoft,
                              borderColor: "#F5B7C0",
                            },
                          ]}
                          onPress={() => setNutritionRating("servingUnit", unit)}
                        >
                          <Text style={{ color: draft.nutritionRating.servingUnit === unit ? adminColors.primary : adminColors.text, fontWeight: "800", fontSize: 11 }}>
                            {unit}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <AdminTextField label="Calories per serving (kcal)" value={draft.nutritionRating.caloriesPerServing} onChangeText={(value) => setNutritionRating("caloriesPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    {draft.nutritionRating.category !== "NON_DAIRY_BEVERAGE" && (
                      <AdminTextField label="Saturated fat per serving (g)" value={draft.nutritionRating.saturatedFatGramsPerServing} onChangeText={(value) => setNutritionRating("saturatedFatGramsPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    )}
                    <AdminTextField label="Total sugars per serving (g)" value={draft.nutritionRating.totalSugarsGramsPerServing} onChangeText={(value) => setNutritionRating("totalSugarsGramsPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    {draft.nutritionRating.category !== "NON_DAIRY_BEVERAGE" && (
                      <AdminTextField label="Sodium per serving (mg)" value={draft.nutritionRating.sodiumMilligramsPerServing} onChangeText={(value) => setNutritionRating("sodiumMilligramsPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    )}
                    <AdminTextField label="Protein per serving (g) — optional, leave blank if not verified" value={draft.nutritionRating.proteinGramsPerServing} onChangeText={(value) => setNutritionRating("proteinGramsPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    <AdminTextField label="Dietary fibre per serving (g) — optional, leave blank if not verified" value={draft.nutritionRating.fibreGramsPerServing} onChangeText={(value) => setNutritionRating("fibreGramsPerServing", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    <AdminTextField label="Fruit / vegetable / nut / legume % — optional, leave blank if not verified" value={draft.nutritionRating.fvnlPercent} onChangeText={(value) => setNutritionRating("fvnlPercent", value)} editable={!saving && isOnline} keyboardType="decimal-pad" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      <Pressable
                        disabled={saving || !isOnline}
                        style={[
                          adminStyles.secondaryButton,
                          draft.nutritionRating.containsFruitOrVegetable && { backgroundColor: adminColors.primarySoft, borderColor: "#F5B7C0" },
                        ]}
                        onPress={() => setNutritionRating("containsFruitOrVegetable", !draft.nutritionRating.containsFruitOrVegetable)}
                      >
                        <Text style={{ color: draft.nutritionRating.containsFruitOrVegetable ? adminColors.primary : adminColors.text, fontWeight: "800", fontSize: 11 }}>
                          Contains fruit/vegetable
                        </Text>
                      </Pressable>
                      <Pressable
                        disabled={saving || !isOnline}
                        style={[
                          adminStyles.secondaryButton,
                          draft.nutritionRating.containsNutsOrLegumes && { backgroundColor: adminColors.primarySoft, borderColor: "#F5B7C0" },
                        ]}
                        onPress={() => setNutritionRating("containsNutsOrLegumes", !draft.nutritionRating.containsNutsOrLegumes)}
                      >
                        <Text style={{ color: draft.nutritionRating.containsNutsOrLegumes ? adminColors.primary : adminColors.text, fontWeight: "800", fontSize: 11 }}>
                          Contains nuts/legumes
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </>
            )}

            <Text style={adminStyles.sectionTitle}>INGREDIENTS AND ALLERGENS</Text>
            <AdminTextField label="Ingredients — one per line; prefix an allergenic ingredient with *" value={ingredientLines} onChangeText={(value) => { setIngredientLines(value); setFieldErrors((current) => { const { ingredients: _removed, ...rest } = current; return rest; }); }} editable={!saving && isOnline} multiline error={fieldErrors.ingredients} />
            <AdminTextField label="Declared allergens — one per line" value={allergenLines} onChangeText={(value) => { setAllergenLines(value); setFieldErrors((current) => { const { allergens: _removed, ...rest } = current; return rest; }); }} editable={!saving && isOnline} multiline error={fieldErrors.allergens} />
            <AdminTextField label="Alternatives — one per line" value={alternativeLines} onChangeText={(value) => { setAlternativeLines(value); setFieldErrors((current) => { const { alternatives: _removed, ...rest } = current; return rest; }); }} editable={!saving && isOnline} multiline error={fieldErrors.alternatives} />
            <AdminTextField label="Product image URL (optional)" value={draft.imageUrl ?? ""} onChangeText={(value) => set("imageUrl", value || null)} editable={!saving && isOnline} keyboardType="url" autoCapitalize="none" error={fieldErrors.imageUrl} />

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
              disabled={!dirty || saving || deleting || !isOnline}
              style={[
                adminStyles.primaryButton,
                (!dirty || saving || deleting || !isOnline) && adminStyles.disabled,
              ]}
              onPress={() => void save()}
            >
              <Text style={adminStyles.primaryButtonText}>
                {saving ? "Saving…" : isNew ? "Add Product" : "Save Product"}
              </Text>
            </Pressable>
            {!isNew && (
              <Pressable
                disabled={saving || deleting || !isOnline}
                style={[
                  adminStyles.secondaryButton,
                  { borderColor: adminColors.danger },
                  (saving || deleting || !isOnline) && adminStyles.disabled,
                ]}
                onPress={remove}
              >
                <Text style={{ color: adminColors.danger, fontWeight: "700" }}>
                  {deleting ? "Deleting…" : "Delete Product"}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </AdminGate>
  );
}
