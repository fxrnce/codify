import { useAuth } from "@clerk/expo";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import {
  AdminGate,
  AdminTextField,
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
  type AdminReport,
  type AdminReportStatus,
} from "@/services/admin-api";

const statuses: AdminReportStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
];

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const { isOnline } = useAdminAccess();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [history, setHistory] = useState<
    { id: string; createdAt: string; action: string; after: unknown }[]
  >([]);
  const [status, setStatus] = useState<AdminReportStatus>("PENDING");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const response = await adminRequest<{
        report: AdminReport;
        history: typeof history;
      }>(getToken, `/reports/${id}`);
      setReport(response.report);
      setHistory(response.history);
      setStatus(response.report.status);
      setNote(response.report.resolutionNote);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load this report.",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    if (!report || saving || !isOnline) return;
    if ((status === "RESOLVED" || status === "REJECTED") && !note.trim()) {
      Alert.alert("Response Required", "Explain the decision to the reporting user.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminRequest(getToken, `/reports/${report.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          resolutionNote: note,
          updatedAt: report.updatedAt,
        }),
      });
      Alert.alert("Review Saved", "The reporting user can now see this update.");
      await load();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the review.",
      );
    } finally {
      setSaving(false);
    }
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
        {!report ? (
          <LoadState
            loading={loading}
            error={error}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text style={adminStyles.heading} selectable>
                {report.productName}
              </Text>
              <Text style={adminStyles.body} selectable>
                {report.brand} · {report.category}
              </Text>
              <StatusPill value={report.status} />
            </View>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: adminColors.border,
                borderRadius: 15,
                padding: 16,
                gap: 9,
              }}
            >
              <Text style={adminStyles.sectionTitle}>REPORT DETAILS</Text>
              <Text selectable>Barcode: {report.barcode || "Not supplied"}</Text>
              <Text selectable>Concern: {report.reason}</Text>
              <Text selectable>Submitted: {formatAdminDate(report.submittedAt)}</Text>
              <Text style={{ color: adminColors.muted, lineHeight: 21 }} selectable>
                {report.notes || "No additional user notes."}
              </Text>
              {report.productId && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/admin/product/[id]",
                      params: { id: report.productId! },
                    })
                  }
                >
                  <Text style={{ color: adminColors.primary, fontWeight: "800" }}>
                    Open linked product →
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={adminStyles.sectionTitle}>REVIEW DECISION</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {statuses.map((item) => (
                <Pressable
                  key={item}
                  disabled={saving || !isOnline}
                  style={[
                    adminStyles.secondaryButton,
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
                          : adminColors.text,
                      fontWeight: "800",
                      fontSize: 11,
                    }}
                  >
                    {item.replace(/_/g, " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AdminTextField
              label="Response to the user"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
              editable={!saving && isOnline}
              placeholder="Explain what you checked and what action was taken."
            />
            {error && <Text style={{ color: adminColors.danger }}>{error}</Text>}
            <Pressable
              disabled={
                saving ||
                !isOnline ||
                (status === report.status && note === report.resolutionNote)
              }
              style={[
                adminStyles.primaryButton,
                (saving || !isOnline) && adminStyles.disabled,
              ]}
              onPress={() => void save()}
            >
              <Text style={adminStyles.primaryButtonText}>
                {saving ? "Saving…" : "Save Review"}
              </Text>
            </Pressable>
            {error.includes("changed") && (
              <Pressable style={adminStyles.secondaryButton} onPress={() => void load()}>
                <Text style={adminStyles.secondaryButtonText}>Reload Latest Review</Text>
              </Pressable>
            )}
            <Text style={adminStyles.sectionTitle}>AUDIT HISTORY</Text>
            {history.length === 0 ? (
              <Text style={adminStyles.body}>No previous reviews.</Text>
            ) : (
              history.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: "#D0D5DD",
                    paddingLeft: 13,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: adminColors.text, fontWeight: "700" }}>
                    {entry.action.replace(/_/g, " ")}
                  </Text>
                  <Text style={{ color: adminColors.muted, fontSize: 11 }}>
                    {formatAdminDate(entry.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </AdminGate>
  );
}
