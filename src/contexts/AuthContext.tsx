"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/org";
import { mapFirebaseError } from "@/lib/firebase-errors";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  orgId: string | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (firebaseUser: User) => {
    try {
      const p = await ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? "",
        firebaseUser.displayName ?? undefined
      );
      setProfile(p);
      setProfileError(null);
    } catch (e) {
      setProfile(null);
      setProfileError(mapFirebaseError(e));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const u = getFirebaseAuth().currentUser;
    if (!u) return;
    setLoading(true);
    await loadProfile(u);
    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setProfileError(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      orgId: profile?.defaultOrgId ?? null,
      loading,
      profileError,
      refreshProfile,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      logout: async () => {
        await signOut(getFirebaseAuth());
      },
    }),
    [user, profile, loading, profileError, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
