import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLanguage } from "@/lib/i18n";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · DiaMonitor Copilot" },
      { name: "description", content: "Sign in to save your glucose readings, logs and care plan to your DiaMonitor account." },
      { property: "og:title", content: "Sign in · DiaMonitor Copilot" },
      { property: "og:description", content: "Save your diabetes records securely to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t: tr } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) { toast.success(tr("Check your email to confirm your account.")); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(String(result.error.message ?? result.error)); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <BrandMark />
          <CardTitle>{tr(mode === "in" ? "Sign in" : "Create account")}</CardTitle>
          <p className="text-sm text-muted-foreground">{tr("Your readings, logs and care plan will be saved to your account and available on any device.")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" className="h-11 w-full" onClick={google}>{tr("Continue with Google")}</Button>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">{tr("Email")}</Label>
              <Input id="email" type="email" required autoComplete="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{tr("Password")}</Label>
              <Input id="password" type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>{tr(mode === "in" ? "Sign in" : "Create account")}</Button>
          </form>
          <button type="button" className="min-h-11 w-full text-sm text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {tr(mode === "in" ? "Need an account? Create one" : "Already have an account? Sign in")}
          </button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:underline">{tr("Back to the app")}</Link>
        </CardContent>
      </Card>
    </div>
  );
}
