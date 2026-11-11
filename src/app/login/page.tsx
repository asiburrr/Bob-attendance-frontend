"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/feedback/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState("admin@battlesofbiology.org");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign In | BOB Attendance";
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      toast.success("Welcome back!", "Authentication Successful");
    } catch (err: any) {
      const msg = err?.message || "Invalid credentials or account locked";
      setError(msg);
      toast.error(msg, "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative">
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm p-6 sm:p-9 glass-dropdown rounded-3xl space-y-5 sm:space-y-6 shadow-2xl z-10 border border-white/60 dark:border-white/10">
        <div className="space-y-1.5 text-center flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex items-center justify-center mb-1.5">
            <Image
              src="/bob-logo.svg"
              alt="BOB Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            BOB Attendance
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Internal Administration &amp; Attendance Console
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <Input
            label="Email or Identifier"
            type="text"
            placeholder="admin@edutimebd.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} className="w-full mt-2 py-3 rounded-2xl">
            Sign In
          </Button>
        </form>

        <div className="pt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          Protected by Hardware Telemetry &amp; Access Control
        </div>
      </div>
    </div>
  );
}
