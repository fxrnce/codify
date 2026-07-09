import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import CodifyLogoSvg from "@/assets/icons/images/codify-logo.svg";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const sendResetLink = () => {
    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    Alert.alert(
      "Reset Link Sent",
      "A password reset link has been sent. Backend email service will be connected later.",
      [
        {
          text: "Back to Sign In",
          onPress: () => router.replace("/auth/sign-in" as never),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1D293D" />
        </Pressable>

        <View style={styles.logoWrapper}>
          <View style={styles.logoCard}>
            <CodifyLogoSvg width={46} height={40} />
          </View>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>

        <Text style={styles.subtitle}>
          Enter your email address and we&apos;ll send instructions to reset
          your password.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>

            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#90A1B9" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#90A1B9"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable style={styles.resetButtonWrapper} onPress={sendResetLink}>
            <LinearGradient
              colors={["#2563EB", "#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Send Reset Link</Text>
              <Ionicons name="send-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable
          style={styles.signInButton}
          onPress={() => router.replace("/auth/sign-in" as never)}
        >
          <Text style={styles.signInText}>Back to Sign In</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    flexGrow: 1,
    paddingTop: 58,
    paddingHorizontal: 22,
    paddingBottom: 34,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  logoWrapper: {
    marginTop: 70,
    alignItems: "center",
  },

  logoCard: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },

  title: {
    marginTop: 32,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    color: "#1D293D",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    alignSelf: "center",
    maxWidth: 310,
    fontSize: 15,
    lineHeight: 24,
    color: "#90A1B9",
    textAlign: "center",
  },

  formCard: {
    marginTop: 34,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 18,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },

  inputGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#45556C",
  },

  inputBox: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#1D293D",
    paddingVertical: 0,
  },

  resetButtonWrapper: {
    height: 56,
    borderRadius: 18,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },

  resetButton: {
    flex: 1,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  resetText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  signInButton: {
    marginTop: 22,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  signInText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#4F39F6",
  },
});
