import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type ScanHistoryItem,
  useScanHistory,
} from "@/contexts/ScanHistoryContext";

type HistoryFilter =
  | "All"
  | "Approved"
  | "Caution"
  | "Not Approved"
  | "Unverified";

const FILTERS: HistoryFilter[] = [
  "All",
  "Approved",
  "Caution",
  "Not Approved",
  "Unverified",
];

function getStatusStyle(status: ScanHistoryItem["status"]) {
  if (status === "Approved") {
    return {
      bg: "#ECFDF5",
      color: "#009966",
      icon: "checkmark-circle" as const,
      label: "Approved",
    };
  }

  if (status === "Caution") {
    return {
      bg: "#FFFBEB",
      color: "#E17100",
      icon: "warning" as const,
      label: "Caution",
    };
  }

  if (status === "Unverified") {
    return {
      bg: "#F1F5F9",
      color: "#475569",
      icon: "help-circle" as const,
      label: "Unverified",
    };
  }

  return {
    bg: "#FEF2F2",
    color: "#E7000B",
    icon: "close-circle" as const,
    label: "Not Approved",
  };
}

function formatScanTime(dateValue: string) {
  const date = new Date(dateValue);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { scanHistory, refreshScanHistory, clearScanHistory } =
    useScanHistory();

  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>("All");

  const isNavigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void refreshScanHistory();
    }, [refreshScanHistory]),
  );

  const approvedCount = scanHistory.filter(
    (item) => item.status === "Approved",
  ).length;

  const cautionCount = scanHistory.filter(
    (item) => item.status === "Caution",
  ).length;

  const advisoryCount = scanHistory.filter(
    (item) => item.status === "FDA Advisory",
  ).length;

  const unverifiedCount = scanHistory.filter(
    (item) => item.status === "Unverified",
  ).length;

  const normalizedSearchText = searchText.trim().toLowerCase();

  const filteredScans = scanHistory.filter((item) => {
    const matchesSearch =
      normalizedSearchText.length === 0 ||
      item.name.toLowerCase().includes(normalizedSearchText) ||
      item.brand.toLowerCase().includes(normalizedSearchText) ||
      item.category.toLowerCase().includes(normalizedSearchText) ||
      item.barcode.toLowerCase().includes(normalizedSearchText) ||
      item.fdaStatusLabel.toLowerCase().includes(normalizedSearchText);

    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "Not Approved"
        ? item.status === "FDA Advisory"
        : item.status === selectedFilter);

    return matchesSearch && matchesFilter;
  });

  const navigateWithLock = (navigationAction: () => void) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    try {
      navigationAction();
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    }
  };

  const goToScanner = () => {
    navigateWithLock(() => {
      router.push("/scanner");
    });
  };

  const openProductResult = (barcode: string) => {
    navigateWithLock(() => {
      router.push({
        pathname: "/product-result/[barcode]",
        params: {
          barcode,
          from: "history",
        },
      });
    });
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Scan History",
      "Are you sure you want to remove all scanned products?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const didClearHistory = await clearScanHistory();

            if (!didClearHistory) {
              Alert.alert(
                "Clear Failed",
                "Your scan history could not be cleared from the backend. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const clearSearchAndFilter = () => {
    setSearchText("");
    setSelectedFilter("All");
  };

  const productCountText =
    scanHistory.length === 1
      ? "1 product scanned"
      : `${scanHistory.length} products scanned`;

  return (
    <View style={styles.screen}>
      <View
        style={[styles.header, scanHistory.length === 0 && styles.headerEmpty]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.title}>Scan History</Text>
            <Text style={styles.subtitle}>{productCountText}</Text>
          </View>

          {scanHistory.length > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClearHistory}>
              <Ionicons name="trash-outline" size={14} color="#FB2C36" />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {scanHistory.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.approvedCard]}>
              <Text style={[styles.summaryNumber, styles.approvedText]}>
                {approvedCount}
              </Text>
              <Text style={[styles.summaryLabel, styles.approvedText]}>
                Approved
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.cautionCard]}>
              <Text style={[styles.summaryNumber, styles.cautionText]}>
                {cautionCount}
              </Text>
              <Text style={[styles.summaryLabel, styles.cautionText]}>
                Caution
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.advisoryCard]}>
              <Text style={[styles.summaryNumber, styles.advisoryText]}>
                {advisoryCount}
              </Text>
              <Text style={[styles.summaryLabel, styles.advisoryText]}>
                Not Approved
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.unverifiedCard]}>
              <Text style={[styles.summaryNumber, styles.unverifiedText]}>
                {unverifiedCount}
              </Text>
              <Text style={[styles.summaryLabel, styles.unverifiedText]}>
                Unverified
              </Text>
            </View>
          </View>
        )}
      </View>

      {scanHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconBox}>
            <Ionicons name="scan-outline" size={48} color="#CBD5E1" />
          </View>

          <Text style={styles.emptyTitle}>No scans yet</Text>

          <Text style={styles.emptyDescription}>
            Your scan history will appear here once you start verifying products
          </Text>

          <Pressable onPress={goToScanner} style={styles.buttonWrapper}>
            <LinearGradient
              colors={["#4F39F6", "#5B4CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Scan a Product</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyContent}
        >
          <Pressable onPress={goToScanner} style={styles.scanAgainWrapper}>
            <LinearGradient
              colors={["#4F39F6", "#155DFC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanAgainButton}
            >
              <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              <Text style={styles.scanAgainText}>Scan Another Product</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#90A1B9" />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search product, brand, or barcode"
              placeholderTextColor="#90A1B9"
              style={styles.searchInput}
            />

            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#90A1B9" />
              </Pressable>
            )}
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const isSelected = selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filteredScans.length === 0 ? (
            <View style={styles.noMatchContainer}>
              <View style={styles.noMatchIconBox}>
                <Ionicons name="search-outline" size={34} color="#CBD5E1" />
              </View>

              <Text style={styles.noMatchTitle}>No matching scans found</Text>

              <Text style={styles.noMatchText}>
                Try another keyword or change the selected filter.
              </Text>

              <Pressable
                style={styles.resetFilterButton}
                onPress={clearSearchAndFilter}
              >
                <Text style={styles.resetFilterText}>Reset Search</Text>
              </Pressable>
            </View>
          ) : (
            filteredScans.map((item) => {
              const statusStyle = getStatusStyle(item.status);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.historyCard,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => openProductResult(item.barcode)}
                >
                  <View
                    style={[
                      styles.statusIconBox,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Ionicons
                      name={statusStyle.icon}
                      size={22}
                      color={statusStyle.color}
                    />
                  </View>

                  <View style={styles.historyInfo}>
                    <Text numberOfLines={1} style={styles.productName}>
                      {item.name}
                    </Text>

                    <Text numberOfLines={1} style={styles.productMeta}>
                      {item.brand} • {item.category}
                    </Text>

                    <Text style={styles.barcodeText}>{item.barcode}</Text>
                  </View>

                  <View style={styles.rightSide}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>

                    <Text style={styles.timeText}>
                      {formatScanTime(item.scannedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 191,
    backgroundColor: "#FFFFFF",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 1,
    borderBottomWidth: 1.17,
    borderBottomColor: "#F1F5F9",
  },

  headerEmpty: {
    height: 115,
  },

  headerTopRow: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1D293D",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: "#62748E",
  },

  clearButton: {
    width: 79,
    height: 32,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  clearText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#FB2C36",
  },

  summaryRow: {
    marginTop: 16,
    height: 60,
    flexDirection: "row",
    gap: 8,
  },

  summaryCard: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  approvedCard: {
    backgroundColor: "#ECFDF5",
  },

  cautionCard: {
    backgroundColor: "#FFFBEB",
  },

  advisoryCard: {
    backgroundColor: "#FEF2F2",
  },

  unverifiedCard: {
    backgroundColor: "#F1F5F9",
  },

  summaryNumber: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
  },

  summaryLabel: {
    marginTop: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    textAlign: "center",
  },

  approvedText: {
    color: "#009966",
  },

  cautionText: {
    color: "#E17100",
  },

  advisoryText: {
    color: "#E7000B",
  },

  unverifiedText: {
    color: "#475569",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 100,
  },

  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  emptyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1D293D",
    marginBottom: 14,
  },

  emptyDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#90A1B9",
    textAlign: "center",
    marginBottom: 28,
  },

  buttonWrapper: {
    width: 170,
    height: 50,
    shadowColor: "#4F39F6",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },

  button: {
    flex: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  historyContent: {
    padding: 16,
    paddingBottom: 32,
  },

  scanAgainWrapper: {
    height: 52,
    marginBottom: 14,
    shadowColor: "#C6D2FF",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },

  scanAgainButton: {
    flex: 1,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  scanAgainText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  searchContainer: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#1D293D",
    paddingVertical: 0,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  filterChip: {
    height: 36,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  filterChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  filterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#62748E",
  },

  filterTextSelected: {
    color: "#4F39F6",
  },

  noMatchContainer: {
    marginTop: 28,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  noMatchIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  noMatchTitle: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    color: "#1D293D",
  },

  noMatchText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: "#90A1B9",
    textAlign: "center",
  },

  resetFilterButton: {
    marginTop: 18,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  resetFilterText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#4F39F6",
  },

  historyCard: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  statusIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  historyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  productName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    color: "#1D293D",
  },

  productMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#62748E",
  },

  barcodeText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  rightSide: {
    alignItems: "flex-end",
  },

  statusPill: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  timeText: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 14,
    color: "#90A1B9",
  },
});
