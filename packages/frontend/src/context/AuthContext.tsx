import { type ReactNode } from "react";
import { api } from "@/lib/api";
import { AuthContext } from "./authContextDef";
import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuthQuery";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: authData, isLoading } = useAuthQuery();
  const logoutMutation = useLogoutMutation();

  const user = authData?.user ?? null;
  const isAuthenticated = authData?.authenticated ?? false;

  const login = () => {
    window.location.href = api.getLoginUrl();
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
