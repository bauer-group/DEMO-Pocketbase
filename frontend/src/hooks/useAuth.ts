import { useCallback, useEffect, useState } from "react";
import { pb, currentUser } from "@/lib/pb";
import type { UserRecord } from "@/lib/types";

// ----------------------------------------------------------------------------
// Reaktiver Auth-State. PocketBase persistiert Token/Record selbst im
// localStorage; wir spiegeln nur Änderungen (Login/Logout/Refresh) in React.
// ----------------------------------------------------------------------------

export interface AuthState {
  user: UserRecord | null;
  isLoggedIn: boolean;
}

function read(): AuthState {
  return { user: currentUser(), isLoggedIn: pb.authStore.isValid };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(read);

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => setState(read()));
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name,
        emailVisibility: true,
      });
      await pb.collection("users").authWithPassword(email, password);
    },
    []
  );

  const logout = useCallback(() => pb.authStore.clear(), []);

  return { ...state, login, register, logout };
}
