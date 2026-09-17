import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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
  type AdminReportEvidence,
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
  const { getToken, isOnline } = useAdminAccess();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [history, setHistory] = useState<
    { id: string; createdAt: string; action: string; after: unknown }[]
  >([]);
  const [status, setStatus] = useState<AdminReportStatus>("PENDING");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<AdminReportEvidence | null>(
    null,
  );
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
    () => new Set(),
  );

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

  const remove = () => {
    if (!report || deleting || !isOnline) return;
    Alert.alert(
      "Delete Report",
      `Permanently delete the report for "${report.productName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            setError("");
            try {
              await adminRequest(getToken, `/reports/${report.id}`, {
                method: "DELETE",
                body: JSON.stringify({ updatedAt: report.updatedAt }),
              });
              router.back();
            } catch (caughtError) {
              setError(
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unable to delete this report.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
            <Text style={adminStyles.sectionTitle}>PHOTO EVIDENCE</Text>
            {report.evidence.length === 0 ? (
              <Text style={adminStyles.body}>
                No photo evidence was submitted with this report.
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {[...report.evidence]
                  .sort((a, b) => a.position - b.position)
                  .map((item) => {
                    const failed = failedImageIds.has(item.id);

                    return (
                      <Pressable
                        key={item.id}
                        disabled={!item.url || failed}
                        onPress={() => setPreviewImage(item)}
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 12,
                          overflow: "hidden",
                          backgroundColor: "#F1F5F9",
                          borderWidth: 1,
                          borderColor: adminColors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!item.url || failed ? (
                          <>
                            <Ionicons
                              name={failed ? "alert-circle-outline" : "cloud-offline-outline"}
                              size={20}
                              color={adminColors.muted}
                            />
                            <Text style={{ fontSize: 10, color: adminColors.muted, marginTop: 4, textAlign: "center", paddingHorizontal: 4 }}>
                              {failed ? "Image failed" : "Unavailable"}
                            </Text>
                          </>
                        ) : (
                          <Image
                            source={{ uri: item.url }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            onError={() =>
                              setFailedImageIds((current) => new Set(current).add(item.id))
                            }
                          />
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            )}
            <Modal
              visible={previewImage !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setPreviewImage(null)}
            >
              <Pressable
                style={{ flex: 1, backgroundColor: "rgba(15,23,43,0.92)", alignItems: "center", justifyContent: "center", padding: 20 }}
                onPress={() => setPreviewImage(null)}
              >
                {previewImage?.url ? (
                  <Image
                    source={{ uri: previewImage.url }}
                    style={{ width: "100%", height: "70%" }}
                    contentFit="contain"
                  />
                ) : (
                  <ActivityIndicator color="#FFFFFF" />
                )}
                <Pressable
                  onPress={() => setPreviewImage(null)}
                  style={{ position: "absolute", top: 48, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </Pressable>
            </Modal>
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
            <Pressable
              disabled={deleting || !isOnline}
              style={[
                adminStyles.secondaryButton,
                { borderColor: adminColors.danger },
                (deleting || !isOnline) && adminStyles.disabled,
              ]}
              onPress={remove}
            >
              <Text style={{ color: adminColors.danger, fontWeight: "700" }}>
                {deleting ? "Deleting…" : "Delete Report"}
              </Text>
            </Pressable>
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
