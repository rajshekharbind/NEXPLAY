"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  country_code: string;
  preferred_language: string;
}

export interface Wallet {
  balance_credits: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface User {
  id: string;
  email: string;
  role: "USER" | "PREMIUM_USER" | "ADMIN" | "SUPER_ADMIN";
  is_active: boolean;
  is_verified: boolean;
  profile?: UserProfile;
  wallet?: Wallet;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (payload: {
    email: string;
    password: string;
    full_name?: string;
    country_code?: string;
    preferred_language?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: "" }),
  register: async () => ({ success: false, message: "" }),
  logout: () => {},
  refreshUser: async () => {},
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        // Token expired or invalid
        localStorage.removeItem("nexplay_token");
        localStorage.removeItem("nexplay_refresh");
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Auth me error:", err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("nexplay_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || data.message || "Invalid credentials" };
      }

      const tokenData = data.data;
      localStorage.setItem("nexplay_token", tokenData.access_token);
      localStorage.setItem("nexplay_refresh", tokenData.refresh_token);
      setToken(tokenData.access_token);
      setUser(tokenData.user);
      return { success: true, message: "Login successful" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name?: string;
    country_code?: string;
    preferred_language?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || data.message || "Registration failed" };
      }

      const tokenData = data.data;
      localStorage.setItem("nexplay_token", tokenData.access_token);
      localStorage.setItem("nexplay_refresh", tokenData.refresh_token);
      setToken(tokenData.access_token);
      setUser(tokenData.user);
      return { success: true, message: "Account created successfully" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("nexplay_token");
    localStorage.removeItem("nexplay_refresh");
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
