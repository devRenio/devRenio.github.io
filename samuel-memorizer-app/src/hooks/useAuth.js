import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  AUTH_CHOICE_KEY,
  RESEND_VERIFICATION_COOLDOWN_MS,
  VERIFY_EMAIL_NEXT_STEP,
  VERIFY_EMAIL_SPAM_HINT,
  verifyResendStorageKey,
} from "../constants/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { formatAuthError } from "../utils/authErrors";
import {
  isValidEmail,
  PROFILE_CHURCH_MAX,
  PROFILE_NAME_MAX,
  sanitizeProfileText,
  validatePassword,
} from "../utils/authValidation";
import {
  readResendCooldownMs,
  recordResendTime,
  reloadAuthUser,
  refreshAuthSession,
  sendVerificationEmail,
} from "../utils/emailVerification";
import {
  deleteUserProfile,
  loadUserProfile,
  saveUserProfile,
} from "../utils/userProfile";
import { formatCooldownRemaining } from "../utils/syncCooldown";

/**
 * authMode
 * - null: 아직 선택/세션 확인 전
 * - guest: 게스트 (로컬 전용, 서버 연동 없음)
 * - user: Firebase 로그인
 */
export function useAuth() {
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendCooldownMs, setResendCooldownMs] = useState(0);
  const postSignupVerifyRef = useRef(false);

  const firebaseEnabled = isFirebaseConfigured();

  const refreshResendCooldown = useCallback(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setResendCooldownMs(0);
      return;
    }
    setResendCooldownMs(
      readResendCooldownMs(uid, RESEND_VERIFICATION_COOLDOWN_MS),
    );
  }, []);

  useEffect(() => {
    refreshResendCooldown();
    if (!auth?.currentUser?.uid) return undefined;
    const timer = window.setInterval(refreshResendCooldown, 1000);
    return () => window.clearInterval(timer);
  }, [user?.uid, refreshResendCooldown]);

  useEffect(() => {
    if (!firebaseEnabled) {
      const choice = localStorage.getItem(AUTH_CHOICE_KEY);
      if (choice === "guest") {
        setAuthMode("guest");
        setShowAuthModal(false);
      } else {
        setAuthMode(null);
        setShowAuthModal(true);
      }
      setReady(true);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const choice = localStorage.getItem(AUTH_CHOICE_KEY);

      if (firebaseUser) {
        try {
          await firebaseUser.reload();
        } catch {
          /* 네트워크 오류 시 기존 상태 유지 */
        }
        const current = auth.currentUser ?? firebaseUser;
        setUser(current);
        setEmailVerified(current.emailVerified);
        setAuthMode("user");
        if (postSignupVerifyRef.current && !current.emailVerified) {
          setShowAuthModal(true);
          setAuthView("verify");
          setPendingVerifyEmail(current.email ?? "");
        } else {
          setShowAuthModal(false);
        }
        localStorage.removeItem(AUTH_CHOICE_KEY);
        try {
          const profile = await loadUserProfile(current.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else if (choice === "guest") {
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
        setAuthMode("guest");
        setShowAuthModal(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
        setAuthMode(null);
        setShowAuthModal(true);
      }
      setReady(true);
    });

    return unsub;
  }, [firebaseEnabled]);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(AUTH_CHOICE_KEY, "guest");
    setUser(null);
    setAuthMode("guest");
    setShowAuthModal(false);
    setError("");
    setVerificationMessage("");
    setPendingVerifyEmail("");
  }, []);

  const login = useCallback(async (email, password) => {
    if (!firebaseEnabled) {
      setError("Firebase 설정이 필요합니다. 게스트 모드를 이용하세요.");
      return false;
    }

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("올바른 이메일 주소를 입력하세요.");
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    setBusy(true);
    setError("");
    setVerificationMessage("");
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const current = await reloadAuthUser();
      setUser(current);
      setEmailVerified(current?.emailVerified ?? false);
      if (current && !current.emailVerified) {
        setVerificationMessage(
          `이메일 인증이 필요합니다. ${VERIFY_EMAIL_SPAM_HINT}`,
        );
      }
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [firebaseEnabled]);

  const signup = useCallback(async (email, password, name, church) => {
    if (!firebaseEnabled) {
      setError("Firebase 설정이 필요합니다. 게스트 모드를 이용하세요.");
      return false;
    }

    const trimmedEmail = email.trim();
    const trimmedName = sanitizeProfileText(name, PROFILE_NAME_MAX);
    const trimmedChurch = sanitizeProfileText(church, PROFILE_CHURCH_MAX);

    if (!isValidEmail(trimmedEmail)) {
      setError("올바른 이메일 주소를 입력하세요.");
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    if (!trimmedName) {
      setError("이름을 입력하세요.");
      return false;
    }
    if (!trimmedChurch) {
      setError("교회명을 입력하세요.");
      return false;
    }

    setBusy(true);
    setError("");
    setVerificationMessage("");
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );
      await updateProfile(cred.user, { displayName: trimmedName });
      await saveUserProfile({
        name: trimmedName,
        church: trimmedChurch,
        email: cred.user.email ?? trimmedEmail,
      });
      await sendVerificationEmail(cred.user);
      recordResendTime(cred.user.uid);
      refreshResendCooldown();

      postSignupVerifyRef.current = true;
      setUserProfile({
        name: trimmedName,
        church: trimmedChurch,
        email: cred.user.email ?? trimmedEmail,
      });
      setEmailVerified(false);
      setPendingVerifyEmail(cred.user.email ?? trimmedEmail);
      setAuthView("verify");
      setVerificationMessage(
        `${trimmedEmail}(으)로 인증 메일을 보냈습니다. ${VERIFY_EMAIL_SPAM_HINT} ${VERIFY_EMAIL_NEXT_STEP}`,
      );
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [firebaseEnabled, refreshResendCooldown]);

  const resendVerificationEmail = useCallback(async () => {
    if (!firebaseEnabled || !auth.currentUser) {
      setError("로그인 후 이용할 수 있습니다.");
      return false;
    }
    if (auth.currentUser.emailVerified) {
      setVerificationMessage("이미 이메일 인증이 완료되었습니다.");
      return true;
    }

    const remaining = readResendCooldownMs(
      auth.currentUser.uid,
      RESEND_VERIFICATION_COOLDOWN_MS,
    );
    if (remaining > 0) {
      setError(
        `${formatCooldownRemaining(remaining)} 후에 인증 메일을 다시 보낼 수 있습니다.`,
      );
      setResendCooldownMs(remaining);
      return false;
    }

    setBusy(true);
    setError("");
    try {
      await sendVerificationEmail(auth.currentUser);
      recordResendTime(auth.currentUser.uid);
      refreshResendCooldown();
      setVerificationMessage(
        `${auth.currentUser.email}(으)로 인증 메일을 다시 보냈습니다. ${VERIFY_EMAIL_SPAM_HINT}`,
      );
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [firebaseEnabled, refreshResendCooldown]);

  const refreshEmailVerification = useCallback(async () => {
    if (!firebaseEnabled || !auth.currentUser) {
      setError("로그인 후 이용할 수 있습니다.");
      return false;
    }

    setBusy(true);
    setError("");
    try {
      const current = await refreshAuthSession();
      if (!current) return false;

      setUser(current);
      setEmailVerified(current.emailVerified);

      if (current.emailVerified) {
        setVerificationMessage("이메일 인증이 확인되었습니다.");
        setPendingVerifyEmail("");
        postSignupVerifyRef.current = false;
        if (authView === "verify") {
          setAuthView("login");
          setShowAuthModal(false);
        }
        return true;
      }

      setVerificationMessage(
        `아직 인증이 완료되지 않았습니다. ${VERIFY_EMAIL_SPAM_HINT}`,
      );
      return false;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [firebaseEnabled, authView]);

  const logout = useCallback(async () => {
    localStorage.removeItem(AUTH_CHOICE_KEY);
    setError("");
    setVerificationMessage("");
    setPendingVerifyEmail("");
    postSignupVerifyRef.current = false;
    if (firebaseEnabled && auth.currentUser) {
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
    setEmailVerified(false);
    setAuthMode(null);
    if (firebaseEnabled) {
      setShowAuthModal(true);
      setAuthView("login");
    } else {
      localStorage.setItem(AUTH_CHOICE_KEY, "guest");
      setAuthMode("guest");
      setShowAuthModal(false);
    }
  }, [firebaseEnabled]);

  const withdrawAccount = useCallback(async (password) => {
    if (!firebaseEnabled || !auth.currentUser) {
      setError("로그인 상태가 아닙니다.");
      return false;
    }
    const currentUser = auth.currentUser;
    if (!currentUser.email) {
      setError("이메일 계정만 탈퇴할 수 있습니다.");
      return false;
    }

    setBusy(true);
    setError("");
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await deleteUserProfile();
      await deleteUser(currentUser);
      localStorage.removeItem(AUTH_CHOICE_KEY);
      localStorage.removeItem(verifyResendStorageKey(currentUser.uid));
      setUser(null);
      setUserProfile(null);
      setEmailVerified(false);
      setPendingVerifyEmail("");
      setAuthMode(null);
      setShowAuthModal(true);
      setAuthView("login");
      return true;
    } catch (err) {
      setError(formatAuthError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [firebaseEnabled]);

  const openAuthModal = useCallback((view = "login") => {
    setError("");
    setVerificationMessage("");
    setAuthView(view);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setError("");
    setVerificationMessage("");
    postSignupVerifyRef.current = false;
    if (authMode === null) {
      enterGuestMode();
      return;
    }
    setShowAuthModal(false);
    if (authView === "verify") {
      setAuthView("login");
    }
  }, [authMode, authView, enterGuestMode]);

  const isLoggedIn = authMode === "user" && user != null;
  const isGuest = authMode === "guest";
  /** 첫 접속(선택 전) vs 게스트/로그아웃 후 재진입 */
  const authModalVariant = authMode === null ? "welcome" : "switch";
  const onboardingBlocked = !ready || (showAuthModal && authModalVariant === "welcome");

  return {
    ready,
    authMode,
    user,
    userProfile,
    emailVerified,
    isLoggedIn,
    isGuest,
    firebaseEnabled,
    showAuthModal,
    authView,
    setAuthView,
    pendingVerifyEmail,
    authModalVariant,
    onboardingBlocked,
    busy,
    error,
    setError,
    verificationMessage,
    setVerificationMessage,
    resendCooldownMs,
    login,
    signup,
    logout,
    withdrawAccount,
    resendVerificationEmail,
    refreshEmailVerification,
    openAuthModal,
    closeAuthModal,
  };
}
