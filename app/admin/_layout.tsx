import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#202733",
        headerShadowVisible: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: "#F7F8FA" },
      }}
    >
      <Stack.Screen name="reports" options={{ title: "Product Reports" }} />
      <Stack.Screen name="report/[id]" options={{ title: "Review Report" }} />
      <Stack.Screen name="products" options={{ title: "Product Catalog" }} />
      <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
      <Stack.Screen name="advisories" options={{ title: "FDA Advisories" }} />
      <Stack.Screen name="advisory/[id]" options={{ title: "Advisory Details" }} />
    </Stack>
  );
}
