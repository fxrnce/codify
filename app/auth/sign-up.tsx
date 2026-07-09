import { useSignUp } from "@clerk/expo";
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

function getErrorMessage(error: any) {
  return (
    error?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const isLoading = fetchStatus === "fetching";

  const goHome = async () => {
    await signUp.finalize({
      navigate: () => {
        router.replace("/(tabs)" as never);
      },
    });
  };

  const createAccount = async () => {
    const cleanedEmail = emailAddress.trim();
    const cleanedPassword = password.trim();
    const cleanedConfirmPassword = confirmPassword.trim();

    if (!cleanedEmail || !cleanedPassword || !cleanedConfirmPassword) {
      Alert.alert(
        "Missing Details",
        "Please enter your email, password, and confirm password.",
      );
      return;
    }

    if (cleanedPassword !== cleanedConfirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Password and confirm password do not match.",
      );
      return;
    }

    if (cleanedPassword.length < 8) {
      Alert.alert("Weak Password", "Password should be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(cleanedPassword)) {
      Alert.alert(
        "Weak Password",
        "Password should include at least one uppercase letter.",
      );
      return;
    }

    if (!/[a-z]/.test(cleanedPassword)) {
      Alert.alert(
        "Weak Password",
        "Password should include at least one lowercase letter.",
      );
      return;
    }

    if (!/[0-9]/.test(cleanedPassword)) {
      Alert.alert(
        "Weak Password",
        "Password should include at least one number.",
      );
      return;
    }

    try {
      const { error } = await signUp.password({
        emailAddress: cleanedEmail,
        password: cleanedPassword,
      });

      if (error) {
        Alert.alert("Sign Up Failed", getErrorMessage(error));
        return;
      }

      await signUp.verifications.sendEmailCode();

      setIsVerifying(true);
      Alert.alert("Verification Code Sent", "Please check your email.");
    } catch (error) {
      console.log("Failed to create account:", error);
      Alert.alert("Sign Up Failed", getErrorMessage(error));
    }
  };

  const verifyAccount = async () => {
    const cleanedCode = code.trim();

    if (!cleanedCode) {
      Alert.alert("Code Required", "Please enter your verification code.");
      return;
    }

    try {
      await signUp.verifications.verifyEmailCode({
        code: cleanedCode,
      });

      if (signUp.status === "complete") {
        await goHome();
        return;
      }

      Alert.alert(
        "Verification Not Complete",
        "Please check the code and try again.",
      );
    } catch (error) {
      console.log("Failed to verify account:", error);
      Alert.alert("Verification Failed", getErrorMessage(error));
    }
  };

  const resendCode = async () => {
    try {
      await signUp.verifications.sendEmailCode();
      Alert.alert("Code Sent", "A new verification code was sent.");
    } catch (error) {
      console.log("Failed to resend code:", error);
      Alert.alert("Failed to Send Code", getErrorMessage(error));
    }
  };

  const startOver = () => {
    signUp.reset();
    setIsVerifying(false);
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
  };

  if (isVerifying) {
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
          <Pressable style={styles.backButton} onPress={startOver}>
            <Ionicons name="arrow-back" size={20} color="#1D293D" />
          </Pressable>

          <View style={styles.logoWrapper}>
            <View style={styles.logoCard}>
              <CodifyLogoSvg width={46} height={40} />
            </View>
          </View>

          <Text style={styles.title}>Verify your account</Text>

          <Text style={styles.subtitle}>
            Enter the verification code sent to your email.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Verification Code</Text>

              <View style={styles.inputBox}>
                <Ionicons name="keypad-outline" size={20} color="#90A1B9" />

                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter code"
                  placeholderTextColor="#90A1B9"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.signUpButtonWrapper,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={verifyAccount}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.signUpButton, styles.verifyButton]}
              >
                <Text style={[styles.signUpText, styles.verifyButtonText]}>
                  {isLoading ? "Verifying..." : "Verify"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={resendCode}>
              <Text style={styles.secondaryText}>Send new code</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={startOver}>
              <Text style={styles.secondaryText}>Start over</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          Create your Codify account to save scans, reports, and safety
          preferences.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>

            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#90A1B9" />

              <TextInput
                value={emailAddress}
                onChangeText={setEmailAddress}
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
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() => setIsPasswordVisible((current) => !current)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#90A1B9"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#90A1B9" />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#90A1B9"
                secureTextEntry={!isConfirmPasswordVisible}
                style={styles.input}
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() =>
                  setIsConfirmPasswordVisible((current) => !current)
                }
              >
                <Ionicons
                  name={
                    isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                  }
                  size={20}
                  color="#90A1B9"
                />
              </Pressable>
            </View>
          </View>

          <View nativeID="clerk-captcha" />

          <Pressable
            style={[
              styles.signUpButtonWrapper,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={createAccount}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#2563EB", "#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpText}>
                {isLoading ? "Creating..." : "Create Account"}
              </Text>

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
  verifyButton: {
    justifyContent: "center",
    alignItems: "center",
  },

  verifyButtonText: {
    flex: 0,
    width: "100%",
    textAlign: "center",
  },

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

  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
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

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#4F39F6",
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
