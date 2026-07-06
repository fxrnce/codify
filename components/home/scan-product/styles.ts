import Colors from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    flexDirection: "row",

    alignItems: "center",

    height: 180,

    paddingHorizontal: 26,
    paddingVertical: 22,
  },

  left: {
    width: "58%",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  description: {
    marginTop: 12,

    fontSize: 14,
    lineHeight: 20,

    color: Colors.gray,
  },

  button: {
    marginTop: 18,

    width: 150,
  },

  right: {
    width: "42%",

    alignItems: "center",
    justifyContent: "center",
  },
});
