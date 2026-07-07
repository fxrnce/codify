import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import Card from "@/components/common/Card";
import PrimaryButton from "@/components/common/PrimaryButton";

import ScanIllustration from "./scan-product/ScanIllustration";
import { styles } from "./scan-product/styles";

export default function ScanProductCard() {
  const router = useRouter();

  const goToScanner = () => {
    router.push("/scanner");
  };

  return (
    <Card
      style={{
        marginHorizontal: 16,
        marginTop: 16,
      }}
    >
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.title}>Scan a Product</Text>

          <Text style={styles.description}>
            Verify authenticity instantly by scanning the product barcode or QR
            code.
          </Text>

          <View style={styles.button}>
            <PrimaryButton title="Scan Now" onPress={goToScanner} />
          </View>
        </View>

        <View style={styles.right}>
          <ScanIllustration />
        </View>
      </View>
    </Card>
  );
}
