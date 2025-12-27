import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Github, Diamond, Loader2 } from "lucide-react";

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-purple-500/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Diamond className="size-12 fill-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Deploy
            </h1>
            <p className="text-muted-foreground mt-2">
              Ship your code to production in seconds
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              to continue to Deploy
            </p>
          </div>

          <Button onClick={login} className="w-full h-11" size="lg">
            <Github className="size-5 mr-2" />
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">
                Secure authentication
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
          <div>
            <div className="font-medium text-foreground mb-1">Fast</div>
            <p>Deploy in seconds</p>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">Secure</div>
            <p>SSL by default</p>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">Global</div>
            <p>Edge network</p>
          </div>
        </div>
      </div>
    </div>
  );
}
