import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "genai-chat-auth";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const value = useMemo(() => {
    function signIn(session) {
      const nextUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "",
        provider: session.user.provider,
        token: session.token,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }

    function signOut() {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }

    return { user, signIn, signOut };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
