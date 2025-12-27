import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuthQuery";
import { Button } from "@/components/ui/button";
import { LogOut, Diamond } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();
  const { data: authData } = useAuthQuery();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Diamond className="size-5 fill-foreground" />
            <span className="text-base font-semibold">Dploy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            >
              Overview
            </Link>
            <Link
              to="/new"
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            >
              New Project
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {authData?.user && (
            <div className="flex items-center gap-3">
              {authData?.user.avatarUrl && (
                <img
                  src={authData?.user.avatarUrl}
                  alt={authData?.user.username}
                  className="size-7 rounded-full ring-1 ring-border"
                />
              )}
              <span className="text-sm text-muted-foreground hidden sm:block">
                {authData?.user.username}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
