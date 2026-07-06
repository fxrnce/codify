import { StyleSheet, View } from "react-native";

export default function Card({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",

    shadowColor: "#4F46E5",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },
});
