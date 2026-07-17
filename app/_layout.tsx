import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AllergenProvider } from "@/contexts/AllergenContext";
import { ProductReportsProvider } from "@/contexts/ProductReportsContext";
import { ScanHistoryProvider } from "@/contexts/ScanHistoryContext";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it inside your .env file.",
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
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
            </Stack>
          </ProductReportsProvider>
        </ScanHistoryProvider>
      </AllergenProvider>
    </ClerkProvider>
  );
}
