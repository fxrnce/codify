import { ScrollView, View } from "react-native";

import BarcodeSamples from "@/components/home/BarcodeSamples";
import Header from "@/components/home/Header";
import RecentScans from "@/components/home/RecentScans";
import ScanProductCard from "@/components/home/ScanProductCard";
import StatusGuide from "@/components/home/StatusGuide";
import TipCard from "@/components/home/TipCard";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F8FAFC",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 12,
        }}
      >
        <Header />

        <ScanProductCard />

        <StatusGuide />

        <RecentScans />

        <TipCard />

        <BarcodeSamples />
      </ScrollView>
    </View>
  );
}
