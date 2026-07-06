import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";

import Colors from "@/constants/Colors";

interface Props extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export default function PrimaryButton({
  title,
  loading = false,
  ...props
}: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.85}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignSelf: "flex-start",
  },

  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
