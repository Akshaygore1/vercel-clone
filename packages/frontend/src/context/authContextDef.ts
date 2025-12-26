import { createContext } from "react";
import type { User } from "@/lib/api";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoggingOut: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
