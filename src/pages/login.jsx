import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/Card";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Login failed");
      }

      if (data?.token) {
        localStorage.setItem("authToken", data.token);
      }
      if (data?.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      setLocation("/dashboard");
      return;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" data-testid="status-app" />
              Billing Manager • Prototype
            </div>

            <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl" data-testid="text-title">
              Login to manage your billing users
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground" data-testid="text-subtitle">
              Admin can create Clients and Agents, assign work types, and control access.
            </p>

            <div className="mt-7 grid max-w-md grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="glass-card rounded-xl p-4" data-testid="card-feature-1">
                <div className="mb-2 font-medium text-foreground">Admin-only changes</div>
                Only you can add data & create users.
              </div>
              <div className="glass-card rounded-xl p-4" data-testid="card-feature-2">
                <div className="mb-2 font-medium text-foreground">Agent work types</div>
                Assign Claimer / Depositer work.
              </div>
            </div>
          </div>

          <Card className="glass-card rounded-2xl p-6 md:p-7">
            <form onSubmit={onSubmit} className="space-y-5" data-testid="form-login">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="email" className="text-sm" data-testid="label-email">
                    Email
                  </Label>
                </div>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="soft-ring h-11 pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm" data-testid="label-password">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-black/5"
                    data-testid="button-toggle-password"
                  >
                    {showPass ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Show
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="soft-ring h-11 pl-10 pr-10"
                    data-testid="input-password"
                  />
                </div>
              </div>

              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  data-testid="status-login-error"
                >
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={!canSubmit || isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
