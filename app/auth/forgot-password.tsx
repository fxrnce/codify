import { useSignIn } from "@clerk/expo";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const isLoading = fetchStatus === "fetching";

  const sendResetCode = async () => {
    const cleanedEmail = emailAddress.trim();

    if (!cleanedEmail) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    try {
      const { error: createError } = await signIn.create({
        identifier: cleanedEmail,
      });

      if (createError) {
        Alert.alert("Reset Failed", getErrorMessage(createError));
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendCodeError) {
        Alert.alert("Reset Failed", getErrorMessage(sendCodeError));
        return;
      }

      setCodeSent(true);
      Alert.alert("Code Sent", "Please check your email for the reset code.");
    } catch (error) {
      console.log("Failed to send reset code:", error);
      Alert.alert("Reset Failed", getErrorMessage(error));
    }
  };

  const verifyCode = async () => {
    const cleanedCode = code.trim();

    if (!cleanedCode) {
      Alert.alert("Code Required", "Please enter your reset code.");
      return;
    }

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code: cleanedCode,
      });

      if (error) {
        Alert.alert("Verification Failed", getErrorMessage(error));
        return;
      }

      setCodeVerified(true);
      Alert.alert("Code Verified", "Now create your new password.");
    } catch (error) {
      console.log("Failed to verify reset code:", error);
      Alert.alert("Verification Failed", getErrorMessage(error));
    }
  };

  const submitNewPassword = async () => {
    const cleanedNewPassword = newPassword.trim();
    const cleanedConfirmPassword = confirmPassword.trim();

    if (!cleanedNewPassword || !cleanedConfirmPassword) {
      Alert.alert(
        "Missing Password",
        "Please enter and confirm your new password.",
      );
      return;
    }

    if (cleanedNewPassword.length < 6) {
      Alert.alert("Weak Password", "Password should be at least 6 characters.");
      return;
    }

    if (cleanedNewPassword !== cleanedConfirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match.",
      );
      return;
    }

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: cleanedNewPassword,
        signOutOfOtherSessions: true,
      });

      if (error) {
        Alert.alert("Password Reset Failed", getErrorMessage(error));
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.replace("/(tabs)" as never);
          },
        });

        return;
      }

      if (signIn.status === "needs_second_factor") {
        Alert.alert(
          "Extra Verification Needed",
          "This account needs another verification step.",
        );
        return;
      }

      router.replace("/auth/sign-in" as never);
    } catch (error) {
      console.log("Failed to reset password:", error);
      Alert.alert("Password Reset Failed", getErrorMessage(error));
    }
  };

  const startOver = () => {
    signIn.reset();
    setEmailAddress("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCodeSent(false);
    setCodeVerified(false);
    setIsNewPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
  };

  const showPasswordStep =
    codeVerified || signIn.status === "needs_new_password";

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

        <Text style={styles.title}>
          {showPasswordStep
            ? "Create New Password"
            : codeSent
              ? "Verify Reset Code"
              : "Forgot Password?"}
        </Text>

        <Text style={styles.subtitle}>
          {showPasswordStep
            ? "Enter your new password to recover your Codify account."
            : codeSent
              ? "Enter the reset code sent to your email."
              : "Enter your email and we will send a password reset code."}
        </Text>

        <View style={styles.formCard}>
          {!codeSent && (
            <>
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

              <Pressable
                style={[
                  styles.mainButtonWrapper,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={sendResetCode}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainButton}
                >
                  <Text style={styles.mainButtonText}>
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Text>

                  <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </>
          )}

          {codeSent && !showPasswordStep && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reset Code</Text>

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
                  styles.mainButtonWrapper,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={verifyCode}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainButton}
                >
                  <Text style={styles.mainButtonText}>
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={sendResetCode}>
                <Text style={styles.secondaryText}>Send new code</Text>
              </Pressable>
            </>
          )}

          {showPasswordStep && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#90A1B9"
                  />

                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#90A1B9"
                    secureTextEntry={!isNewPasswordVisible}
                    style={styles.input}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    onPress={() =>
                      setIsNewPasswordVisible((current) => !current)
                    }
                  >
                    <Ionicons
                      name={
                        isNewPasswordVisible ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#90A1B9"
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#90A1B9"
                  />

                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
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
                        isConfirmPasswordVisible
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#90A1B9"
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[
                  styles.mainButtonWrapper,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={submitNewPassword}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainButton}
                >
                  <Text style={styles.mainButtonText}>
                    {isLoading ? "Saving..." : "Reset Password"}
                  </Text>

                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </>
          )}

          {(codeSent || showPasswordStep) && (
            <Pressable style={styles.secondaryButton} onPress={startOver}>
              <Text style={styles.secondaryText}>Start over</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Remembered your password?</Text>

          <Pressable onPress={() => router.replace("/auth/sign-in" as never)}>
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

  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  mainButtonWrapper: {
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

  mainButton: {
    flex: 1,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  mainButtonText: {
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
