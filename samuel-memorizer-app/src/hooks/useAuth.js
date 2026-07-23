import { useCallback, useEffect, useState } from "react";
import { AUTH_CHOICE_KEY } from "../constants/auth";
import { isJbchConfigured } from "../lib/jbchConfig";
import {
  jbchAcceptConsent,
  jbchFetchMember,
  jbchLogin,
  jbchLogout,
  mapJbchMemberProfile,
  mapJbchUser,
} from "../lib/jbchApi";

/**
 * authMode
 * - null: 미로그인 (세션 확인 전·후)
 * - user: 깨사모 로그인 (세션 hash는 HttpOnly 쿠키, BFF 전용)
 */
export function useAuth() {
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consentError, setConsentError] = useState("");

  const jbchEnabled = isJbchConfigured();

  const applyMemberSession = useCallback(async (loginSession) => {
    let profile;
    let isAdmin;
    let pendingConsent;

    if (loginSession?.result) {
      profile = mapJbchMemberProfile(loginSession.result);
      isAdmin = Boolean(loginSession.isAdmin);
      pendingConsent = Boolean(loginSession.needsConsent);
    } else {
      const member = await jbchFetchMember();
      profile = member.profile;
      isAdmin = member.isAdmin;
      pendingConsent = member.needsConsent;
    }

    const mappedUser = mapJbchUser(profile, isAdmin);
    if (!mappedUser) {
      throw new Error("회원 정보를 불러오지 못했습니다.");
    }

    localStorage.removeItem(AUTH_CHOICE_KEY);
    setUserProfile(profile);
    setUser(mappedUser);
    setAuthMode("user");
    setNeedsConsent(pendingConsent);
    setConsentError("");
    return profile;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      localStorage.removeItem(AUTH_CHOICE_KEY);

      if (!jbchEnabled) {
        if (!cancelled) {
          setAuthMode(null);
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
        setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyMemberSession, jbchEnabled]);

  const login = useCallback(
    async (userid, password) => {
      if (!jbchEnabled) {
        setError("깨사모 API 설정이 없어 로그인할 수 없습니다.");
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
        const session = await jbchLogin(trimmedUserid, password);
        await applyMemberSession(session);
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
    setConsentError("");
    await jbchLogout();
    localStorage.removeItem(AUTH_CHOICE_KEY);
    setUser(null);
    setUserProfile(null);
    setAuthMode(null);
    setNeedsConsent(false);
  }, []);

  const acceptConsent = useCallback(async () => {
    setBusy(true);
    setConsentError("");
    try {
      await jbchAcceptConsent();
      setNeedsConsent(false);
      return true;
    } catch (err) {
      setConsentError(err.message || "동의 처리에 실패했습니다.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const isLoggedIn = authMode === "user" && user != null;
  const showAuthModal = ready && !isLoggedIn;
  const onboardingBlocked = !ready || !isLoggedIn || needsConsent;

  return {
    ready,
    authMode,
    user,
    userProfile,
    isLoggedIn,
    jbchEnabled,
    showAuthModal,
    onboardingBlocked,
    needsConsent,
    busy,
    error,
    consentError,
    setError,
    login,
    logout,
    acceptConsent,
  };
}
