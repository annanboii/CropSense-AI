import React, { useState } from "react";
import { useFarm } from "../../context/FarmContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import {
  Sprout,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CloudSun,
  Droplets,
  Activity,
  Compass,
  Loader2,
} from "lucide-react";

export const AuthPage: React.FC = () => {
  const { logIn, signUp, signInWithGoogle, startDemoMode, authError, setAuthError } = useFarm();
  const { t, isRTL } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setFormError(err?.message || t("auth.googleFailed", "Google sign-in could not be completed."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAuthError(null);

    if (!email || !password) {
      setFormError(t("auth.provideEmailPass", "Please provide both email and password."));
      return;
    }

    if (mode === "signup" && !farmerName.trim()) {
      setFormError(t("auth.enterFarmerName", "Please enter your name or farm operator name."));
      return;
    }

    if (password.length < 6) {
      setFormError(t("auth.passwordMin", "Password must be at least 6 characters."));
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, farmerName);
      } else {
        await logIn(email, password);
      }
    } catch (err: any) {
      setFormError(err?.message || t("auth.authFailed", "Authentication failed. Please check credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle organic background glow accents */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Pill in Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="header" />
      </div>

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-900/40 text-white mb-1">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t("common.appName", "CropSense AI")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t("auth.taglineSubtitle", "Software-only agronomic intelligence, microclimate disease forecasting, and smart irrigation.")}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          {/* Tab Switcher: Login / Signup */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-700/60 mb-6">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => {
                setMode("login");
                setFormError(null);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("auth.loginTab", "Log In")}
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => {
                setMode("signup");
                setFormError(null);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("auth.signupTab", "Sign Up (New Farm)")}
            </button>
          </div>

          {(formError || authError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{formError || authError}</span>
              </div>
            </div>
          )}

          {/* GOOGLE AUTH BUTTON */}
          <button
            type="button"
            id="google-auth-btn"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-950 text-slate-100 hover:text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-slate-600 shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isGoogleLoading
                ? t("auth.connectingGoogle", "Connecting to Google...")
                : t("auth.continueWithGoogle", "Continue with Google")}
            </span>
          </button>

          {/* OR DIVIDER */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/80" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-slate-800 px-3 text-slate-400 font-medium">
                {t("auth.orEmailDivider", "or continue with email")}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("auth.farmerName", "Farmer / Operator Name")}
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                  <input
                    type="text"
                    id="input-farmer-name"
                    required
                    placeholder={t("auth.farmerNamePlaceholder", "e.g. John Miller")}
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t("auth.email", "Email Address")}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                <input
                  type="email"
                  id="input-email"
                  required
                  placeholder={t("auth.emailPlaceholder", "farmer@example.com")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t("auth.password", "Password")}
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                <input
                  type="password"
                  id="input-password"
                  required
                  placeholder={t("auth.passwordPlaceholder", "••••••••")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>{t("common.loading", "Processing...")}</span>
              ) : (
                <>
                  <span>
                    {mode === "signup"
                      ? t("auth.createAndSetup", "Create Account & Setup Farm")
                      : t("auth.loginToDashboard", "Log In to Farm Dashboard")}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sandbox Option */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400 mb-3">
              {t("auth.previewWithSample", "Want to preview features with sample agronomic data?")}
            </p>
            <button
              type="button"
              id="demo-sandbox-btn"
              onClick={startDemoMode}
              className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs rounded-xl border border-slate-600/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("auth.exploreDemoSandbox", "Explore Demo Sandbox Mode")}</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400 px-2">
          <div className="flex flex-col items-center gap-1">
            <CloudSun className="w-4 h-4 text-emerald-400" />
            <span>{t("auth.liveMicroclimate", "Live Microclimate")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>{t("auth.fao56Irrigation", "FAO-56 Irrigation")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{t("auth.diseaseForecast", "Disease Forecast")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
