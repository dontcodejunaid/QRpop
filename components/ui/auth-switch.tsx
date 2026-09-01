'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  X
} from "lucide-react";
import { AssistedPasswordConfirmation } from "./assisted-password-confirmation";

export interface AuthSwitchProps {
  initialMode?: "login" | "signup";
  onLogin?: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onSignUp?: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onClose?: () => void;
  className?: string;
}

export function AuthSwitch({
  initialMode = "login",
  onLogin,
  onSignUp,
  onClose,
  className
}: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      if (onLogin) {
        const res = await onLogin(email, password);
        if (!res.success) setErrorMessage(res.message || "Login failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isPasswordConfirmed) {
      setErrorMessage("Passwords do not match. Please verify your password confirmation.");
      return;
    }

    setLoading(true);
    try {
      if (onSignUp) {
        const res = await onSignUp(name, email, password);
        if (!res.success) setErrorMessage(res.message || "Sign up failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex min-h-[580px] w-full max-w-[920px] overflow-hidden rounded-[28px] bg-white text-[#333] shadow-2xl transition-all duration-300",
        className
      )}
    >
      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#666] transition-colors hover:bg-rose-500/15 hover:text-rose-500"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Forms Area */}
      <div className="absolute inset-0 flex h-full w-full">
        {/* Sign In Form Panel */}
        <div
          className={cn(
            "absolute right-0 top-0 flex h-full w-1/2 items-center justify-center p-12 transition-all duration-700 ease-in-out",
            isSignUp
              ? "pointer-events-none translate-x-full opacity-0"
              : "z-10 translate-x-0 opacity-100"
          )}
        >
          <form onSubmit={handleLoginSubmit} className="flex w-full max-w-[320px] flex-col items-center text-center">
            <h2 className="font-['Outfit',sans-serif] text-3xl font-bold text-[#2e384d] mb-6">Sign in</h2>

            {errorMessage && !isSignUp && (
              <div className="mb-4 w-full rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-200">
                {errorMessage}
              </div>
            )}

            <div className="relative mb-3.5 flex h-12 w-full items-center rounded-full bg-[#f0f2f5] px-4">
              <Mail className="mr-3 h-4 w-4 text-[#a4b0be]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent text-sm text-[#2f3542] placeholder-[#a4b0be] outline-none"
              />
            </div>

            <div className="relative mb-4 flex h-12 w-full items-center rounded-full bg-[#f0f2f5] px-4">
              <Lock className="mr-3 h-4 w-4 text-[#a4b0be]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent pr-8 text-sm text-[#2f3542] placeholder-[#a4b0be] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-[#a4b0be] hover:text-[#57606f]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-36 rounded-full bg-[#5c72e8] text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#5c72e8]/40 transition-all hover:bg-[#4b61d6] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Loading..." : "LOGIN"}
            </button>
          </form>
        </div>

        {/* Sign Up Form Panel with Assisted Password Confirmation */}
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full w-1/2 items-center justify-center p-10 transition-all duration-700 ease-in-out",
            isSignUp
              ? "z-10 translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-full opacity-0"
          )}
        >
          <form onSubmit={handleSignUpSubmit} className="flex w-full max-w-[320px] flex-col items-center text-center">
            <h2 className="font-['Outfit',sans-serif] text-3xl font-bold text-[#2e384d] mb-4">Sign up</h2>

            {errorMessage && isSignUp && (
              <div className="mb-3 w-full rounded-xl bg-rose-50 p-2 text-xs text-rose-600 border border-rose-200">
                {errorMessage}
              </div>
            )}

            <div className="relative mb-2.5 flex h-11 w-full items-center rounded-full bg-[#f0f2f5] px-4">
              <User className="mr-3 h-4 w-4 text-[#a4b0be]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-transparent text-sm text-[#2f3542] placeholder-[#a4b0be] outline-none"
              />
            </div>

            <div className="relative mb-2.5 flex h-11 w-full items-center rounded-full bg-[#f0f2f5] px-4">
              <Mail className="mr-3 h-4 w-4 text-[#a4b0be]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent text-sm text-[#2f3542] placeholder-[#a4b0be] outline-none"
              />
            </div>

            <div className="relative mb-2.5 flex h-11 w-full items-center rounded-full bg-[#f0f2f5] px-4">
              <Lock className="mr-3 h-4 w-4 text-[#a4b0be]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent pr-8 text-sm text-[#2f3542] placeholder-[#a4b0be] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-[#a4b0be] hover:text-[#57606f]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Assisted Password Confirmation Component */}
            <div className="mb-3 w-full text-left">
              <AssistedPasswordConfirmation 
                password={password}
                onConfirmChange={(_, isValid) => setIsPasswordConfirmed(isValid)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-36 rounded-full bg-[#5c72e8] text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#5c72e8]/40 transition-all hover:bg-[#4b61d6] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Loading..." : "SIGN UP"}
            </button>
          </form>
        </div>
      </div>

      {/* Sliding Curved Overlay Panels */}
      <div className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-hidden">
        {/* Left Curved Panel (Shown in Login mode, invites to Sign Up) */}
        <div
          className={cn(
            "absolute left-0 top-0 flex h-full w-1/2 flex-col items-center justify-center rounded-r-[120px] bg-gradient-to-br from-[#6c79e0] to-[#5364d9] p-12 text-center text-white transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            isSignUp
              ? "pointer-events-none -translate-x-full opacity-0 z-10"
              : "pointer-events-auto translate-x-0 opacity-100 z-20"
          )}
        >
          <div className="max-w-[280px]">
            <h3 className="font-['Outfit',sans-serif] text-3xl font-bold mb-3">New here?</h3>
            <p className="text-sm leading-relaxed text-white/90 mb-6">
              Join us today and discover a world of possibilities. Create your account in seconds!
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage("");
              }}
              className="h-11 w-36 rounded-full border-2 border-white bg-transparent text-sm font-semibold tracking-wider text-white transition-all hover:bg-white hover:text-[#5c72e8] active:scale-95 shadow-md cursor-pointer"
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* Right Curved Panel (Shown in Sign Up mode, invites to Sign In) */}
        <div
          className={cn(
            "absolute left-1/2 top-0 flex h-full w-1/2 flex-col items-center justify-center rounded-l-[120px] bg-gradient-to-br from-[#6c79e0] to-[#5364d9] p-12 text-center text-white transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
            isSignUp
              ? "pointer-events-auto translate-x-0 opacity-100 z-20"
              : "pointer-events-none translate-x-full opacity-0 z-10"
          )}
        >
          <div className="max-w-[280px]">
            <h3 className="font-['Outfit',sans-serif] text-3xl font-bold mb-3">One of us?</h3>
            <p className="text-sm leading-relaxed text-white/90 mb-6">
              If you already have an account, just sign in. We've missed you!
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage("");
              }}
              className="h-11 w-36 rounded-full border-2 border-white bg-transparent text-sm font-semibold tracking-wider text-white transition-all hover:bg-white hover:text-[#5c72e8] active:scale-95 shadow-md cursor-pointer"
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthSwitch;
