import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AllergenProvider } from "@/contexts/AllergenContext";
import { AdminAccessProvider } from "@/contexts/AdminAccessContext";
import { ProductReportsProvider } from "@/contexts/ProductReportsContext";
import { ScanHistoryProvider } from "@/contexts/ScanHistoryContext";
import { refreshFdaAdvisoryCache } from "@/services/fda-advisories";
import { refreshProductCatalog } from "@/services/products";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it inside your .env file.",
  );
}

function OfflineCatalogSync() {
  useEffect(() => {
    const syncCatalogs = async () => {
      const results = await Promise.allSettled([
        refreshProductCatalog(),
        refreshFdaAdvisoryCache(),
      ]);

      for (const result of results) {
        if (result.status === "rejected") {
          console.log("Offline catalog background sync unavailable:", result.reason);
        }
      }
    };

    void syncCatalogs();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <OfflineCatalogSync />
      <AdminAccessProvider>
        <AllergenProvider>
          <ScanHistoryProvider>
            <ProductReportsProvider>
              <StatusBar style="light" />

              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />

                <Stack.Screen name="auth" />

                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="product-result/[barcode]" />
                <Stack.Screen name="report-product" />
                <Stack.Screen name="reported-products" />
                <Stack.Screen name="search-product" />
                <Stack.Screen name="fda-advisories" />
                <Stack.Screen name="admin" />
              </Stack>
            </ProductReportsProvider>
          </ScanHistoryProvider>
        </AllergenProvider>
      </AdminAccessProvider>
    </ClerkProvider>
  );
}
