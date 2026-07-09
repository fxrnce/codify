import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const AUTH_STORAGE_KEY = "codify_mock_is_signed_in";

export default function SignUpScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signUp = async () => {
    const cleanedName = fullName.trim();
    const cleanedEmail = email.trim();

    if (!cleanedName || !cleanedEmail || !password || !confirmPassword) {
      Alert.alert("Missing Details", "Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, "true");
      router.replace("/(tabs)" as never);
    } catch (error) {
      console.log("Failed to create account:", error);
      Alert.alert("Sign Up Failed", "Please try again.");
    }
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

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Set up your Codify account to save scans, reports, and safety
          preferences.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>

            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#90A1B9" />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#90A1B9"
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#90A1B9" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                placeholderTextColor="#90A1B9"
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>

            <View style={styles.inputBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#90A1B9"
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#90A1B9"
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <Pressable style={styles.signUpButtonWrapper} onPress={signUp}>
            <LinearGradient
              colors={["#2563EB", "#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account?</Text>

          <Pressable onPress={() => router.push("/auth/sign-in" as never)}>
            <Text style={styles.linkText}> Sign In</Text>
          </Pressable>
        </View>
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
    marginTop: 18,
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
    marginTop: 28,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    color: "#1D293D",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 10,
    alignSelf: "center",
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 24,
    color: "#90A1B9",
    textAlign: "center",
  },

  formCard: {
    marginTop: 30,
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
    marginBottom: 16,
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

  signUpButtonWrapper: {
    height: 56,
    borderRadius: 18,
    marginTop: 4,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },

  signUpButton: {
    flex: 1,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  signUpText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  bottomRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },

  linkText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: "#4F39F6",
  },
});
