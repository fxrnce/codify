import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  type: "approved" | "warning" | "danger";
  title: string;
  description: string;
};

export default function StatusItem({ type, title, description }: Props) {
  const config = {
    approved: {
      icon: "shield-checkmark-outline",
      bg: "#ECFDF5",
      border: "#D0FAE5",
      title: "#007A55",
      desc: "#009966",
      iconColor: "#00BC7D",
    },

    warning: {
      icon: "warning-outline",
      bg: "#FFFBEB",
      border: "#FEF3C6",
      title: "#BB4D00",
      desc: "#E17100",
      iconColor: "#FE9A00",
    },

    danger: {
      icon: "close-circle-outline",
      bg: "#FEF2F2",
      border: "#FFE2E2",
      title: "#C10007",
      desc: "#E7000B",
      iconColor: "#FB2C36",
    },
  }[type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={18} color={config.iconColor} />

      <View style={styles.text}>
        <Text
          style={[
            styles.title,
            {
              color: config.title,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: config.desc,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,

    borderRadius: 14,

    borderWidth: 1,

    paddingHorizontal: 12,
    paddingVertical: 12,

    flexDirection: "row",
    alignItems: "center",
  },

  text: {
    marginLeft: 12,

    flex: 1,
  },

  title: {
    fontSize: 12,
    fontWeight: "700",
  },

  description: {
    marginTop: 2,

    fontSize: 12,

    lineHeight: 16,
  },
});
