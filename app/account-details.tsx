import { useClerk, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

function getInitials(name: string) {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatMemberSince(date?: Date | string | number | null) {
  if (!date) {
    return "Member since recently";
  }

  const memberDate = new Date(date);

  if (Number.isNaN(memberDate.getTime())) {
    return "Member since recently";
  }

  return `Member since ${memberDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

function getErrorMessage(error: any) {
  return (
    error?.errors?.[0]?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function isExternalAccountProvider(account: any, provider: string) {
  return (
    account?.provider === provider || account?.provider === `oauth_${provider}`
  );
}

function isExternalAccountVerified(account: any) {
  return (
    account?.verification?.status === "verified" ||
    account?.status === "verified" ||
    account?.verified === true
  );
}

function getConnectedExternalAccount(user: any, provider: string) {
  return user?.externalAccounts?.find((account: any) => {
    return (
      isExternalAccountProvider(account, provider) &&
      isExternalAccountVerified(account)
    );
  });
}

function getPendingExternalAccount(user: any, provider: string) {
  return user?.externalAccounts?.find((account: any) => {
    return (
      isExternalAccountProvider(account, provider) &&
      !isExternalAccountVerified(account)
    );
  });
}

function getExternalAccountLabel(account: any) {
  if (!account) {
    return "Not connected";
  }

  try {
    if (typeof account.accountIdentifier === "function") {
      const identifier = account.accountIdentifier();

      if (identifier) {
        return identifier;
      }
    }
  } catch (error) {
    console.log("Failed to read external account identifier:", error);
  }

  const fullName = [account.firstName, account.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    account.emailAddress ||
    account.email ||
    account.username ||
    account.label ||
    fullName ||
    "Connected"
  );
}

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const isNavigatingRef = useRef(false);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setIsConfirmNewPasswordVisible] =
    useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [newEmailAddress, setNewEmailAddress] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [pendingEmailAddress, setPendingEmailAddress] = useState<any>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingProfileImage, setIsSavingProfileImage] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Codify User";

  const emailAddress =
    user?.primaryEmailAddress?.emailAddress || "No email address";

  const avatarInitials = getInitials(displayName);
  const memberSince = formatMemberSince(user?.createdAt);
  const profileImageUrl = user?.hasImage ? user.imageUrl : "";

  const accountUser = user as any;

  const googleAccount = getConnectedExternalAccount(accountUser, "google");
  const facebookAccount = getConnectedExternalAccount(accountUser, "facebook");

  const googleAccountLabel = getExternalAccountLabel(googleAccount);
  const facebookAccountLabel = getExternalAccountLabel(facebookAccount);

  const passwordStatus = accountUser?.passwordEnabled
    ? "Protected by Clerk"
    : "No password set";

  const twoFactorStatus = accountUser?.twoFactorEnabled
    ? "Enabled"
    : "Not enabled";

  const navigateWithLock = (navigationAction: () => void) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    try {
      navigationAction();
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    }
  };

  const goBack = () => {
    navigateWithLock(() => {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/profile" as never);
    });
  };

  const uploadProfileImage = async () => {
    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Needed",
          "Please allow photo access to update your profile picture.",
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (pickerResult.canceled) {
        return;
      }

      const selectedImage = pickerResult.assets[0];

      if (!selectedImage?.base64) {
        Alert.alert(
          "Image Error",
          "The selected image could not be converted. Please try another photo.",
        );
        return;
      }

      const mimeType = selectedImage.mimeType || "image/jpeg";
      const base64Image = `data:${mimeType};base64,${selectedImage.base64}`;

      setIsSavingProfileImage(true);

      await user.setProfileImage({
        file: base64Image,
      });

      await user.reload();

      Alert.alert(
        "Profile Photo Updated",
        "Your profile picture has been saved.",
      );
    } catch (error) {
      console.log("Failed to update profile image:", error);
      Alert.alert("Upload Failed", getErrorMessage(error));
    } finally {
      setIsSavingProfileImage(false);
    }
  };

  const removeProfileImage = async () => {
    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      setIsSavingProfileImage(true);

      await user.setProfileImage({
        file: null,
      });

      await user.reload();

      Alert.alert(
        "Profile Photo Removed",
        "Your initials will be shown again.",
      );
    } catch (error) {
      console.log("Failed to remove profile image:", error);
      Alert.alert("Remove Failed", getErrorMessage(error));
    } finally {
      setIsSavingProfileImage(false);
    }
  };

  const openProfileImageOptions = () => {
    Alert.alert("Profile Photo", "Choose what you want to do.", [
      {
        text: "Choose Photo",
        onPress: uploadProfileImage,
      },
      {
        text: "Remove Photo",
        style: "destructive",
        onPress: removeProfileImage,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const openEditNameModal = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setIsEditNameOpen(true);
  };

  const saveNameChanges = async () => {
    const cleanedFirstName = firstName.trim();
    const cleanedLastName = lastName.trim();

    if (!cleanedFirstName && !cleanedLastName) {
      Alert.alert("Missing Name", "Please enter your first name or last name.");
      return;
    }

    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      setIsSavingName(true);

      await user.update({
        firstName: cleanedFirstName,
        lastName: cleanedLastName,
      });

      await user.reload();

      setIsEditNameOpen(false);
      Alert.alert("Saved", "Your profile name has been updated.");
    } catch (error) {
      console.log("Failed to update name:", error);
      Alert.alert("Update Failed", getErrorMessage(error));
    } finally {
      setIsSavingName(false);
    }
  };

  const openChangePasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsCurrentPasswordVisible(false);
    setIsNewPasswordVisible(false);
    setIsConfirmNewPasswordVisible(false);
    setIsChangePasswordOpen(true);
  };

  const savePasswordChanges = async () => {
    const cleanedCurrentPassword = currentPassword.trim();
    const cleanedNewPassword = newPassword.trim();
    const cleanedConfirmNewPassword = confirmNewPassword.trim();

    if (
      !cleanedCurrentPassword ||
      !cleanedNewPassword ||
      !cleanedConfirmNewPassword
    ) {
      Alert.alert(
        "Missing Password",
        "Please enter your current password, new password, and confirm password.",
      );
      return;
    }

    if (cleanedNewPassword !== cleanedConfirmNewPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match.",
      );
      return;
    }

    if (cleanedCurrentPassword === cleanedNewPassword) {
      Alert.alert(
        "Same Password",
        "Your new password must be different from your current password.",
      );
      return;
    }

    if (cleanedNewPassword.length < 8) {
      Alert.alert(
        "Weak Password",
        "New password should be at least 8 characters.",
      );
      return;
    }

    if (!/[A-Z]/.test(cleanedNewPassword)) {
      Alert.alert(
        "Weak Password",
        "New password should include at least one uppercase letter.",
      );
      return;
    }

    if (!/[a-z]/.test(cleanedNewPassword)) {
      Alert.alert(
        "Weak Password",
        "New password should include at least one lowercase letter.",
      );
      return;
    }

    if (!/[0-9]/.test(cleanedNewPassword)) {
      Alert.alert(
        "Weak Password",
        "New password should include at least one number.",
      );
      return;
    }

    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      setIsSavingPassword(true);

      await user.updatePassword({
        currentPassword: cleanedCurrentPassword,
        newPassword: cleanedNewPassword,
        signOutOfOtherSessions: true,
      });

      setIsChangePasswordOpen(false);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsCurrentPasswordVisible(false);
      setIsNewPasswordVisible(false);
      setIsConfirmNewPasswordVisible(false);

      Alert.alert("Password Updated", "Your password has been changed.");
    } catch (error) {
      console.log("Failed to update password:", error);
      Alert.alert("Update Failed", getErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const resetEmailModalFields = () => {
    setNewEmailAddress("");
    setEmailVerificationCode("");
    setIsVerifyingEmail(false);
    setPendingEmailAddress(null);
  };

  const destroyPendingEmailAddress = async () => {
    if (!pendingEmailAddress) {
      return;
    }

    try {
      const destroyEmailAddress = pendingEmailAddress.destroy;

      if (typeof destroyEmailAddress === "function") {
        await destroyEmailAddress.call(pendingEmailAddress);
        await user?.reload();
      }
    } catch (error) {
      console.log("Failed to remove pending email:", error);
    }
  };

  const openEditEmailModal = () => {
    resetEmailModalFields();
    setIsEditEmailOpen(true);
  };

  const closeEditEmailModal = async () => {
    await destroyPendingEmailAddress();
    resetEmailModalFields();
    setIsEditEmailOpen(false);
  };

  const startEmailUpdateOver = async () => {
    await destroyPendingEmailAddress();
    resetEmailModalFields();
  };

  const sendEmailVerificationCode = async () => {
    const cleanedEmail = newEmailAddress.trim().toLowerCase();

    if (!cleanedEmail) {
      Alert.alert("Missing Email", "Please enter your new email address.");
      return;
    }

    if (cleanedEmail === emailAddress.toLowerCase()) {
      Alert.alert("Same Email", "Please enter a different email address.");
      return;
    }

    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      setIsSavingEmail(true);

      const existingEmailAddress = user.emailAddresses?.find(
        (emailItem) => emailItem.emailAddress.toLowerCase() === cleanedEmail,
      );

      if (existingEmailAddress) {
        if (existingEmailAddress.verification?.status === "verified") {
          await user.update({
            primaryEmailAddressId: existingEmailAddress.id,
          });

          await user.reload();

          setIsEditEmailOpen(false);
          resetEmailModalFields();

          Alert.alert("Email Updated", "Your email address has been updated.");
          return;
        }

        const destroyExistingEmailAddress = existingEmailAddress.destroy;

        if (typeof destroyExistingEmailAddress === "function") {
          await destroyExistingEmailAddress.call(existingEmailAddress);
          await user.reload();
        }
      }

      const createdEmailAddress = await user.createEmailAddress({
        email: cleanedEmail,
      });

      await createdEmailAddress.prepareVerification({
        strategy: "email_code",
      });

      setPendingEmailAddress(createdEmailAddress);
      setIsVerifyingEmail(true);

      Alert.alert("Code Sent", "Please check your new email for the code.");
    } catch (error) {
      console.log("Failed to send email verification code:", error);
      Alert.alert("Email Update Failed", getErrorMessage(error));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const resendEmailVerificationCode = async () => {
    if (!pendingEmailAddress) {
      await sendEmailVerificationCode();
      return;
    }

    try {
      setIsSavingEmail(true);

      await pendingEmailAddress.prepareVerification({
        strategy: "email_code",
      });

      Alert.alert("Code Sent", "A new verification code was sent.");
    } catch (error) {
      console.log("Failed to resend email verification code:", error);
      Alert.alert("Email Update Failed", getErrorMessage(error));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const verifyNewEmailAddress = async () => {
    const cleanedCode = emailVerificationCode.trim();

    if (!cleanedCode) {
      Alert.alert("Missing Code", "Please enter your verification code.");
      return;
    }

    if (!user || !pendingEmailAddress) {
      Alert.alert("Account Error", "Email verification is not ready yet.");
      return;
    }

    try {
      setIsSavingEmail(true);

      const verificationResult = await pendingEmailAddress.attemptVerification({
        code: cleanedCode,
      });

      if (verificationResult?.verification?.status !== "verified") {
        Alert.alert(
          "Verification Failed",
          "Please check the code and try again.",
        );
        return;
      }

      await user.update({
        primaryEmailAddressId: verificationResult.id || pendingEmailAddress.id,
      });

      await user.reload();

      setIsEditEmailOpen(false);
      resetEmailModalFields();

      Alert.alert("Email Updated", "Your email address has been updated.");
    } catch (error) {
      console.log("Failed to verify new email:", error);
      Alert.alert("Verification Failed", getErrorMessage(error));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const openDeleteAccountModal = () => {
    setDeleteConfirmationText("");
    setIsDeleteAccountOpen(true);
  };

  const deleteAccount = async () => {
    if (deleteConfirmationText.trim() !== "DELETE") {
      Alert.alert(
        "Confirmation Required",
        "Please type DELETE to confirm account deletion.",
      );
      return;
    }

    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    try {
      setIsDeletingAccount(true);

      const deleteUser = (user as any).delete;

      if (typeof deleteUser !== "function") {
        Alert.alert(
          "Delete Not Available",
          "This Clerk SDK version needs a backend delete endpoint. We can add that next.",
        );
        return;
      }

      await deleteUser.call(user);
      await signOut();

      setIsDeleteAccountOpen(false);
      router.replace("/auth/sign-in" as never);
    } catch (error) {
      console.log("Failed to delete account:", error);
      Alert.alert("Delete Failed", getErrorMessage(error));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const showComingSoon = (title: string) => {
    Alert.alert(title, "This feature will be added next.");
  };

  const connectGoogleAccount = async () => {
    if (!user) {
      Alert.alert("Account Error", "User account is not loaded yet.");
      return;
    }

    if (googleAccount) {
      Alert.alert(
        "Google Connected",
        `This account is connected as ${googleAccountLabel}.`,
      );
      return;
    }

    try {
      setIsConnectingGoogle(true);

      const oldPendingGoogleAccount = getPendingExternalAccount(user, "google");

      if (oldPendingGoogleAccount?.destroy) {
        await oldPendingGoogleAccount.destroy();
        await user.reload();
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "codify",
        path: "/account-details",
      });

      const externalAccount = await user.createExternalAccount({
        strategy: "oauth_google",
        redirectUrl,
      });

      const verificationUrl =
        externalAccount?.verification?.externalVerificationRedirectURL?.href;

      if (!verificationUrl) {
        Alert.alert(
          "Google Connect Failed",
          "Google verification did not start. Please try again.",
        );
        return;
      }

      const authResult = await WebBrowser.openAuthSessionAsync(
        verificationUrl,
        redirectUrl,
      );

      if (authResult.type !== "success") {
        if (externalAccount?.destroy) {
          await externalAccount.destroy();
        }

        await user.reload();

        Alert.alert(
          "Google Connect Cancelled",
          "Google was not connected because the sign-in was not completed.",
        );
        return;
      }

      await user.reload();

      const connectedGoogleAccount = getConnectedExternalAccount(
        user,
        "google",
      );

      if (!connectedGoogleAccount) {
        Alert.alert(
          "Google Connect Pending",
          "Google verification did not finish. Please try again.",
        );
        return;
      }

      Alert.alert("Google Connected", "Your Google account has been linked.");
    } catch (error) {
      console.log("Failed to connect Google account:", error);
      Alert.alert("Google Connect Failed", getErrorMessage(error));
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleLinkedAccountPress = (
    providerName: "Google" | "Facebook",
    isConnected: boolean,
    accountLabel: string,
  ) => {
    if (isConnected) {
      Alert.alert(
        `${providerName} Connected`,
        `This account is connected as ${accountLabel}. Unlink account can be added later.`,
      );
      return;
    }

    Alert.alert(
      `${providerName} Not Connected`,
      `${providerName} linking needs OAuth setup in Clerk Dashboard first. We will add the real connect flow next.`,
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#2563EB", "#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.largeCircle} />
          <View style={styles.smallCircle} />
          <View style={styles.bottomCircle} />

          <View style={styles.topRow}>
            <Pressable style={styles.backButton} onPress={goBack}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.title}>Account Details</Text>
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                {profileImageUrl ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                )}
              </View>

              <Pressable
                style={styles.cameraButton}
                onPress={openProfileImageOptions}
                disabled={isSavingProfileImage}
              >
                {isSavingProfileImage ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Ionicons name="camera-outline" size={14} color="#4F46E5" />
                )}
              </Pressable>
            </View>

            <Text style={styles.memberSince}>{memberSince}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={22} color="#6F6EFF" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.uppercaseLabel}>FULL NAME</Text>
              <Text style={styles.mainValue}>{displayName}</Text>
            </View>

            <Pressable style={styles.editButton} onPress={openEditNameModal}>
              <Ionicons name="pencil-outline" size={24} color="#635BFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.uppercaseLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.mainValue}>{emailAddress}</Text>
            </View>

            <Pressable style={styles.editButton} onPress={openEditEmailModal}>
              <Ionicons name="pencil-outline" size={24} color="#635BFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#6F6EFF"
            />
            <Text style={styles.sectionTitle}>Account Security</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.rowTitle}>Password</Text>
              <Text style={styles.mutedValue}>{passwordStatus}</Text>
            </View>

            <Pressable
              style={styles.pillButton}
              onPress={() => {
                if (!accountUser?.passwordEnabled) {
                  Alert.alert(
                    "No Password Set",
                    "This account does not have a password yet. For this prototype, please create an account using email and password.",
                  );
                  return;
                }

                openChangePasswordModal();
              }}
            >
              <Text style={styles.pillButtonText}>
                {accountUser?.passwordEnabled ? "Change" : "Info"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.rowTitle}>Two-Factor Authenticator</Text>
              <Text style={styles.mutedValue}>{twoFactorStatus}</Text>
            </View>

            <Pressable
              style={styles.pillButton}
              onPress={() => showComingSoon("Two-Factor Authenticator")}
            >
              <Text style={styles.pillButtonText}>
                {accountUser?.twoFactorEnabled ? "Manage" : "Enable"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="mail-outline" size={22} color="#6F6EFF" />
            <Text style={styles.sectionTitle}>Linked Accounts</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.rowTitle}>Google</Text>
              <Text style={styles.mutedValue}>{googleAccountLabel}</Text>
            </View>

            <Pressable
              style={[styles.pillButton, isConnectingGoogle && styles.disabled]}
              onPress={connectGoogleAccount}
              disabled={isConnectingGoogle}
            >
              <Text style={styles.pillButtonText}>
                {isConnectingGoogle
                  ? "Opening..."
                  : googleAccount
                    ? "View"
                    : "Connect"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailTextBox}>
              <Text style={styles.rowTitle}>Facebook</Text>
              <Text style={styles.mutedValue}>{facebookAccountLabel}</Text>
            </View>

            <Pressable
              style={styles.pillButton}
              onPress={() =>
                handleLinkedAccountPress(
                  "Facebook",
                  Boolean(facebookAccount),
                  facebookAccountLabel,
                )
              }
            >
              <Text style={styles.pillButtonText}>
                {facebookAccount ? "View" : "Connect"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>

          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data.
          </Text>

          <Pressable
            style={styles.deleteButton}
            onPress={openDeleteAccountModal}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isEditNameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditNameOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setIsEditNameOpen(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>

              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#90A1B9" />

                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#90A1B9"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>

              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#90A1B9" />

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#90A1B9"
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.saveButtonWrapper,
                isSavingName && styles.disabled,
              ]}
              onPress={saveNameChanges}
              disabled={isSavingName}
            >
              <LinearGradient
                colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingName ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isChangePasswordOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChangePasswordOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setIsChangePasswordOpen(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#90A1B9"
                />

                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#90A1B9"
                  secureTextEntry={!isCurrentPasswordVisible}
                  style={styles.input}
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() =>
                    setIsCurrentPasswordVisible((current) => !current)
                  }
                >
                  <Ionicons
                    name={
                      isCurrentPasswordVisible
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#90A1B9"
                  />
                </Pressable>
              </View>
            </View>

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
                  onPress={() => setIsNewPasswordVisible((current) => !current)}
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
              <Text style={styles.inputLabel}>Confirm New Password</Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#90A1B9"
                />

                <TextInput
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#90A1B9"
                  secureTextEntry={!isConfirmNewPasswordVisible}
                  style={styles.input}
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() =>
                    setIsConfirmNewPasswordVisible((current) => !current)
                  }
                >
                  <Ionicons
                    name={
                      isConfirmNewPasswordVisible
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
                styles.saveButtonWrapper,
                isSavingPassword && styles.disabled,
              ]}
              onPress={savePasswordChanges}
              disabled={isSavingPassword}
            >
              <LinearGradient
                colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {isSavingPassword ? "Saving..." : "Update Password"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditEmailOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          void closeEditEmailModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isVerifyingEmail ? "Verify Email" : "Edit Email"}
              </Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  void closeEditEmailModal();
                }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            {!isVerifyingEmail ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Email Address</Text>

                  <View style={styles.inputBox}>
                    <Ionicons name="mail-outline" size={20} color="#90A1B9" />

                    <TextInput
                      value={newEmailAddress}
                      onChangeText={setNewEmailAddress}
                      placeholder="Enter new email"
                      placeholderTextColor="#90A1B9"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                    />
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.saveButtonWrapper,
                    isSavingEmail && styles.disabled,
                  ]}
                  onPress={sendEmailVerificationCode}
                  disabled={isSavingEmail}
                >
                  <LinearGradient
                    colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSavingEmail ? "Sending..." : "Send Verification Code"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Code</Text>

                  <View style={styles.inputBox}>
                    <Ionicons name="keypad-outline" size={20} color="#90A1B9" />

                    <TextInput
                      value={emailVerificationCode}
                      onChangeText={setEmailVerificationCode}
                      placeholder="Enter code"
                      placeholderTextColor="#90A1B9"
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.saveButtonWrapper,
                    isSavingEmail && styles.disabled,
                  ]}
                  onPress={verifyNewEmailAddress}
                  disabled={isSavingEmail}
                >
                  <LinearGradient
                    colors={["#2563EB", "#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSavingEmail ? "Verifying..." : "Verify"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={resendEmailVerificationCode}
                  disabled={isSavingEmail}
                >
                  <Text style={styles.secondaryText}>Send new code</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    void startEmailUpdateOver();
                  }}
                  disabled={isSavingEmail}
                >
                  <Text style={styles.secondaryText}>Start over</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteAccountOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteAccountOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.deleteModalTitle}>Delete Account</Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setIsDeleteAccountOpen(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.deleteModalDescription}>
              This action is permanent. Your Codify account will be deleted and
              you will be signed out.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type DELETE to confirm</Text>

              <View style={styles.inputBox}>
                <Ionicons name="warning-outline" size={20} color="#FB2C36" />

                <TextInput
                  value={deleteConfirmationText}
                  onChangeText={setDeleteConfirmationText}
                  placeholder="DELETE"
                  placeholderTextColor="#90A1B9"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.deleteConfirmButton,
                isDeletingAccount && styles.disabled,
              ]}
              onPress={deleteAccount}
              disabled={isDeletingAccount}
            >
              <Text style={styles.deleteConfirmButtonText}>
                {isDeletingAccount ? "Deleting..." : "Delete My Account"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setIsDeleteAccountOpen(false)}
              disabled={isDeletingAccount}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingBottom: 32,
  },

  header: {
    height: 256,
    paddingTop: 56,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  largeCircle: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 104,
    right: -56,
    top: -56,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  smallCircle: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    right: 80,
    top: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  bottomCircle: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    left: -48,
    top: 112,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  topRow: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  avatarSection: {
    marginTop: 24,
    alignItems: "center",
  },

  avatarWrapper: {
    width: 84,
    height: 84,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.17,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -1.4,
    color: "#FFFFFF",
  },

  cameraButton: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  memberSince: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.6)",
  },

  sectionCard: {
    marginTop: 16,
    marginHorizontal: 14,
    height: 191,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F2",
    borderRadius: 20,
    overflow: "hidden",
  },

  sectionTitleRow: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1D293D",
  },

  detailRow: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  detailTextBox: {
    flex: 1,
  },

  uppercaseLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#90A1B9",
  },

  mainValue: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#1D293D",
  },

  rowTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#1D293D",
  },

  mutedValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#94A1B0",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  editButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#635BFF",
  },

  pillButton: {
    minWidth: 84,
    height: 28,
    borderRadius: 1000,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  pillButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#615FFF",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  dangerCard: {
    marginTop: 20,
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FFE2E2",
  },

  dangerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#C10007",
  },

  dangerDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#F43F5E",
  },

  deleteButton: {
    marginTop: 18,
    height: 38,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FFA2A2",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  deleteButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#E7000B",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },

  modalHeader: {
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  modalTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: "#1D293D",
  },

  deleteModalTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: "#C10007",
  },

  deleteModalDescription: {
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#F43F5E",
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
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

  saveButtonWrapper: {
    height: 54,
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

  saveButton: {
    flex: 1,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FFFFFF",
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

  deleteConfirmButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteConfirmButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  disabled: {
    opacity: 0.6,
  },
});
