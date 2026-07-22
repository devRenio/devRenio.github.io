import { useCallback, useEffect, useState } from "react";
import { AUTH_CHOICE_KEY } from "../constants/auth";
import { isJbchConfigured } from "../lib/jbchConfig";
import {
  jbchFetchMember,
  jbchLogin,
  jbchLogout,
  mapJbchUser,
} from "../lib/jbchApi";

/**
 * authMode
 * - null: 아직 선택/세션 확인 전
 * - guest: 게스트 (로컬 전용)
 * - user: 깨사모 로그인 (세션 hash는 HttpOnly 쿠키, BFF 전용)
 */
export function useAuth() {
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const jbchEnabled = isJbchConfigured();

  const applyMemberSession = useCallback(async () => {
    const profile = await jbchFetchMember();
    const mappedUser = mapJbchUser(profile);
    if (!mappedUser) {
      throw new Error("회원 정보를 불러오지 못했습니다.");
    }

    localStorage.removeItem(AUTH_CHOICE_KEY);
    setUserProfile(profile);
    setUser(mappedUser);
    setAuthMode("user");
    setShowAuthModal(false);
    return profile;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const choice = localStorage.getItem(AUTH_CHOICE_KEY);

      if (!jbchEnabled) {
        if (choice !== "guest") {
          localStorage.setItem(AUTH_CHOICE_KEY, "guest");
        }
        if (!cancelled) {
          setAuthMode("guest");
          setShowAuthModal(false);
          setReady(true);
        }
        return;
      }

      if (choice === "guest") {
        if (!cancelled) {
          setAuthMode("guest");
          setShowAuthModal(false);
          setReady(true);
        }
        return;
      }

      try {
        await applyMemberSession();
        if (!cancelled) setReady(true);
        return;
      } catch {
        /* 쿠키 세션 없음 */
      }

      if (!cancelled) {
        setAuthMode(null);
        setShowAuthModal(jbchEnabled);
        setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyMemberSession, jbchEnabled]);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(AUTH_CHOICE_KEY, "guest");
    setUser(null);
    setUserProfile(null);
    setAuthMode("guest");
    setShowAuthModal(false);
    setError("");
  }, []);

  const login = useCallback(
    async (userid, password) => {
      if (!jbchEnabled) {
        setError("깨사모 API 설정이 없습니다. 게스트 모드를 이용하세요.");
        return false;
      }

      const trimmedUserid = userid.trim();
      if (!trimmedUserid) {
        setError("깨사모 아이디를 입력하세요.");
        return false;
      }
      if (!password) {
        setError("비밀번호를 입력하세요.");
        return false;
      }

      setBusy(true);
      setError("");
      try {
        await jbchLogin(trimmedUserid, password);
        await applyMemberSession();
        return true;
      } catch (err) {
        setError(err.message || "로그인에 실패했습니다.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [applyMemberSession, jbchEnabled],
  );

  const logout = useCallback(async () => {
    setError("");
    await jbchLogout();
    localStorage.removeItem(AUTH_CHOICE_KEY);
    setUser(null);
    setUserProfile(null);
    setAuthMode(null);
    if (jbchEnabled) {
      setShowAuthModal(true);
    } else {
      localStorage.setItem(AUTH_CHOICE_KEY, "guest");
      setAuthMode("guest");
      setShowAuthModal(false);
    }
  }, [jbchEnabled]);

  const openAuthModal = useCallback(() => {
    setError("");
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setError("");
    if (authMode === null) {
      enterGuestMode();
      return;
    }
    setShowAuthModal(false);
  }, [authMode, enterGuestMode]);

  const isLoggedIn = authMode === "user" && user != null;
  const isGuest = authMode === "guest";
  const authModalVariant = authMode === null ? "welcome" : "switch";
  const onboardingBlocked =
    !ready || (showAuthModal && authModalVariant === "welcome");

  return {
    ready,
    authMode,
    user,
    userProfile,
    isLoggedIn,
    isGuest,
    jbchEnabled,
    showAuthModal,
    authModalVariant,
    onboardingBlocked,
    busy,
    error,
    setError,
    login,
    logout,
    openAuthModal,
    closeAuthModal,
  };
}
