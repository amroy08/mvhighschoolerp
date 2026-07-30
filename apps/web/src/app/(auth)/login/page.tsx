"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, School, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Login failed. Please try again.");
        return;
      }

      if (data.data?.accessToken) {
        sessionStorage.setItem("access_token", data.data.accessToken);
        localStorage.setItem("mvhs_user_email", data.data.user.email);
        localStorage.setItem("mvhs_user_name", data.data.user.name);
        localStorage.setItem("mvhs_user_role", data.data.user.roles?.[0] || "Admin");
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-blue-600/30">
            <School className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            MVHS School ERP
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Marwari Vidyalaya High School
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@mvhighschool.edu.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Secure access · Session expires after inactivity
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Academic Year 2026-27
          </p>
        </div>
      </div>
    </div>
  );
}
