import { ScrollView, View } from "react-native";

import BarcodeSamples from "@/components/home/BarcodeSamples";
import FdaAdvisoriesCard from "@/components/home/fda-advisories-card";
import Header from "@/components/home/Header";
import RecentScans from "@/components/home/RecentScans";
import ScanProductCard from "@/components/home/ScanProductCard";
import StatusGuide from "@/components/home/StatusGuide";
import SyncStatusCard from "@/components/home/SyncStatusCard";
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

        <SyncStatusCard />

        <ScanProductCard />

        <FdaAdvisoriesCard />

        <StatusGuide />

        <RecentScans />

        <TipCard />

        <BarcodeSamples />
      </ScrollView>
    </View>
  );
}
