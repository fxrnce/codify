import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AllergenProvider } from "@/contexts/AllergenContext";
import { ScanHistoryProvider } from "@/contexts/ScanHistoryContext";

export default function RootLayout() {
  return (
    <AllergenProvider>
      <ScanHistoryProvider>
        <StatusBar style="light" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />

          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="auth/forgot-password" />

          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product-result/[barcode]" />
          <Stack.Screen name="report-product" />
          <Stack.Screen name="reported-products" />
          <Stack.Screen name="search-product" />
        </Stack>
      </ScanHistoryProvider>
    </AllergenProvider>
  );
}
