import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isClientTrustVerificationOpen, setIsClientTrustVerificationOpen] =
    useState(false);

  const isLoading = fetchStatus === "fetching";

  useEffect(() => {
    if (signIn.status === "needs_client_trust") {
      signIn.reset();
    }
  }, []);

  const goHome = async () => {
    await signIn.finalize({
      navigate: () => {
        router.replace("/(tabs)" as never);
      },
    });
  };

  const signInUser = async () => {
    const cleanedEmail = emailAddress.trim();
    const cleanedPassword = password.trim();

    if (!cleanedEmail || !cleanedPassword) {
      Alert.alert("Missing Details", "Please enter your email and password.");
      return;
    }

    try {
      const { error } = await signIn.password({
        emailAddress: cleanedEmail,
        password: cleanedPassword,
      });

      if (error) {
        Alert.alert("Sign In Failed", getErrorMessage(error));
        return;
      }

      if (signIn.status === "complete") {
        await goHome();
        return;
      }

      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
          setIsClientTrustVerificationOpen(true);
          Alert.alert("Verification Code Sent", "Please check your email.");
          return;
        }
      }

      Alert.alert(
        "Sign In Not Complete",
        "Please complete the required verification step.",
      );
    } catch (error) {
      console.log("Failed to sign in:", error);
      Alert.alert("Sign In Failed", getErrorMessage(error));
    }
  };

  const verifyCode = async () => {
    const cleanedCode = code.trim();

    if (!cleanedCode) {
      Alert.alert("Code Required", "Please enter your verification code.");
      return;
    }

    try {
      await signIn.mfa.verifyEmailCode({
        code: cleanedCode,
      });

      if (signIn.status === "complete") {
        await goHome();
        return;
      }

      Alert.alert(
        "Verification Failed",
        "Please check the code and try again.",
      );
    } catch (error) {
      console.log("Failed to verify code:", error);
      Alert.alert("Verification Failed", getErrorMessage(error));
    }
  };

  const resendCode = async () => {
    try {
      await signIn.mfa.sendEmailCode();
      Alert.alert("Code Sent", "A new verification code was sent.");
    } catch (error) {
      console.log("Failed to resend code:", error);
      Alert.alert("Failed to Send Code", getErrorMessage(error));
    }
  };

  const startOver = () => {
    signIn.reset();
    setCode("");
    setPassword("");
    setIsPasswordVisible(false);
    setIsClientTrustVerificationOpen(false);
  };

  if (isClientTrustVerificationOpen) {
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
                styles.signInButtonWrapper,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={verifyCode}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                <Text style={styles.signInText}>
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
        <View style={styles.logoWrapper}>
          <View style={styles.logoCard}>
            <CodifyLogoSvg width={46} height={40} />
          </View>
        </View>

        <Text style={styles.title}>Start with Codify</Text>

        <Text style={styles.subtitle}>
          Sign in or create an account to start verifying products safely.
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
                placeholder="Enter your password"
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

          <Pressable
            style={styles.forgotButton}
            onPress={() => router.push("/auth/forgot-password" as never)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[
              styles.signInButtonWrapper,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={signInUser}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#2563EB", "#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInButton}
            >
              <Text style={styles.signInText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>

              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don't have an account?</Text>

          <Pressable onPress={() => router.push("/auth/sign-up" as never)}>
            <Text style={styles.linkText}> Sign Up</Text>
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
    paddingTop: 74,
    paddingHorizontal: 22,
    paddingBottom: 34,
  },

  logoWrapper: {
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
    maxWidth: 300,
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

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 18,
  },

  forgotText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#4F39F6",
  },

  signInButtonWrapper: {
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

  signInButton: {
    flex: 1,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  signInText: {
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
