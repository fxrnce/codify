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
  formatAdminDate,
} from "@/components/admin/admin-common";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import { adminRequest, type AdminAdvisory } from "@/services/admin-api";

type AdvisoryDraft = Omit<AdminAdvisory, "id" | "updatedAt">;

const categories = ["FOOD", "DRUG", "COSMETIC"] as const;
const types = [
  "PUBLIC_HEALTH_WARNING",
  "RECALL",
  "QUALITY_HOLD",
  "SAFETY_ALERT",
  "LIFTING",
] as const;
const statuses = ["NOT_APPROVED", "CAUTION", "LIFTED"] as const;
const emptyAdvisory: AdvisoryDraft = {
  advisoryNumber: "",
  title: "",
  category: "FOOD",
  type: "PUBLIC_HEALTH_WARNING",
  status: "NOT_APPROVED",
  publishedAt: new Date().toISOString().slice(0, 10),
  sourceUrl: "",
  filipinoSourceUrl: null,
  isActive: true,
};

export default function AdminAdvisoryEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isOnline } = useAdminAccess();
  const isNew = id === "new";
  const [draft, setDraft] = useState<AdvisoryDraft>({ ...emptyAdvisory });
  const [updatedAt, setUpdatedAt] = useState("");
  const [history, setHistory] = useState<
    { id: string; action: string; createdAt: string }[]
  >([]);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = useMemo(
    () => Boolean(baseline) && JSON.stringify(draft) !== baseline,
    [baseline, draft],
  );

  const set = <Key extends keyof AdvisoryDraft>(
    key: Key,
    value: AdvisoryDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const load = useCallback(async () => {
    if (isNew) {
      const next = { ...emptyAdvisory };
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await adminRequest<{
        advisory: AdminAdvisory;
        history: { id: string; action: string; createdAt: string }[];
      }>(getToken, `/advisories/${id}`);
      const next: AdvisoryDraft = {
        advisoryNumber: response.advisory.advisoryNumber,
        title: response.advisory.title,
        category: response.advisory.category,
        type: response.advisory.type,
        status: response.advisory.status,
        publishedAt: response.advisory.publishedAt.slice(0, 10),
        sourceUrl: response.advisory.sourceUrl,
        filipinoSourceUrl: response.advisory.filipinoSourceUrl,
        isActive: response.advisory.isActive,
      };
      setDraft(next);
      setUpdatedAt(response.advisory.updatedAt);
      setHistory(response.history);
      setBaseline(JSON.stringify(next));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this advisory.",
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
    setSaving(true);
    setError("");
    try {
      await adminRequest(getToken, isNew ? "/advisories" : `/advisories/${id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(isNew ? draft : { advisory: draft, updatedAt }),
      });
      Alert.alert(
        isNew ? "Advisory Added" : "Advisory Updated",
        "The FDA advisory information has been saved.",
      );
      router.back();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save this advisory.",
      );
    } finally {
      setSaving(false);
    }
  };

  const choiceRow = <Value extends string>(
    values: readonly Value[],
    current: string,
    onChange: (value: Value) => void,
  ) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {values.map((value) => (
        <Pressable
          key={value}
          disabled={saving || !isOnline}
          style={[
            adminStyles.secondaryButton,
            current === value && {
              backgroundColor: adminColors.primarySoft,
              borderColor: "#F5B7C0",
            },
          ]}
          onPress={() => onChange(value)}
        >
          <Text
            style={{
              color: current === value ? adminColors.primary : adminColors.text,
              fontWeight: "800",
              fontSize: 11,
            }}
          >
            {value.replace(/_/g, " ")}
          </Text>
        </Pressable>
      ))}
    </View>
  );

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
            <Text style={adminStyles.sectionTitle}>ADVISORY IDENTITY</Text>
            <AdminTextField
              label="Advisory number (for example, 2026-001)"
              value={draft.advisoryNumber}
              onChangeText={(value) => set("advisoryNumber", value)}
              editable={!saving && isOnline}
              autoCapitalize="characters"
            />
            <AdminTextField
              label="Title"
              value={draft.title}
              onChangeText={(value) => set("title", value)}
              editable={!saving && isOnline}
              multiline
            />
            <Text style={adminStyles.sectionTitle}>CATEGORY</Text>
            {choiceRow(categories, draft.category, (value) => set("category", value))}
            <Text style={adminStyles.sectionTitle}>TYPE</Text>
            {choiceRow(types, draft.type, (value) => set("type", value))}
            <Text style={adminStyles.sectionTitle}>STATUS</Text>
            {choiceRow(statuses, draft.status, (value) => set("status", value))}
            <AdminTextField
              label="Publication date (YYYY-MM-DD)"
              value={draft.publishedAt}
              onChangeText={(value) => set("publishedAt", value)}
              editable={!saving && isOnline}
              autoCapitalize="none"
            />
            <AdminTextField
              label="Official source URL"
              value={draft.sourceUrl}
              onChangeText={(value) => set("sourceUrl", value)}
              editable={!saving && isOnline}
              keyboardType="url"
              autoCapitalize="none"
            />
            <AdminTextField
              label="Filipino source URL (optional)"
              value={draft.filipinoSourceUrl ?? ""}
              onChangeText={(value) => set("filipinoSourceUrl", value || null)}
              editable={!saving && isOnline}
              keyboardType="url"
              autoCapitalize="none"
            />
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
              onPress={() => set("isActive", !draft.isActive)}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: draft.isActive ? adminColors.primary : "#98A2B3",
                backgroundColor: draft.isActive ? adminColors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {draft.isActive && <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.text, fontWeight: "800" }}>Active advisory</Text>
                <Text style={{ color: adminColors.muted, fontSize: 11, lineHeight: 17 }}>
                  Include this notice in the active FDA advisory feed.
                </Text>
              </View>
            </Pressable>
            {error && <Text style={{ color: adminColors.danger }}>{error}</Text>}
            {error.includes("changed") && (
              <Pressable style={adminStyles.secondaryButton} onPress={() => void load()}>
                <Text style={adminStyles.secondaryButtonText}>Reload Latest Advisory</Text>
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
                {saving ? "Saving…" : isNew ? "Add Advisory" : "Save Advisory"}
              </Text>
            </Pressable>
            {!isNew && history.length > 0 && (
              <>
                <Text style={adminStyles.sectionTitle}>AUDIT HISTORY</Text>
                {history.map((entry) => (
                  <View
                    key={entry.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: adminColors.border,
                      borderRadius: 12,
                      padding: 13,
                      gap: 3,
                    }}
                  >
                    <Text style={{ color: adminColors.text, fontWeight: "800" }}>
                      {entry.action}
                    </Text>
                    <Text style={{ color: adminColors.muted, fontSize: 12 }}>
                      {formatAdminDate(entry.createdAt)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </AdminGate>
  );
}
