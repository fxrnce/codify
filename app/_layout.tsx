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
        />
      </ScanHistoryProvider>
    </AllergenProvider>
  );
}
