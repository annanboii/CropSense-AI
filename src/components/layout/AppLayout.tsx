import React, { useState, useRef, useEffect } from "react";
import { useFarm } from "../../context/FarmContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { normalizeTab } from "../../utils/navigation";
import {
  LayoutDashboard,
  ScanLine,
  CloudSun,
  Sun,
  Sprout,
  Droplets,
  ShieldAlert,
  BotMessageSquare,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  MapPin,
  Sparkles,
  User,
  ExternalLink,
  ChevronRight,
  Globe,
} from "lucide-react";

interface NavItem {
  id: string;
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    farm,
    farms,
    switchFarm,
    weather,
    alerts,
    formatTemp,
    currentUser,
    isDemoMode,
    logOut,
  } = useFarm();
  const { t, isRTL, language, setLanguage } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.dismissed && !a.read).length;

  const displayName = currentUser?.farmerName || farm.farmerName || "Farm Operator";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "OP";

  // 1. Primary Navigation Items - Ordered to match reference layout
  const primaryNavItems: NavItem[] = [
    { id: "My Crops", key: "crops", label: t("nav.crops", "My Crops"), icon: Sprout },
    { id: "Dashboard", key: "dashboard", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { id: "Crop Scanner", key: "scanner", label: t("nav.scanner", "Crop Scanner"), icon: ScanLine },
    { id: "Weather", key: "weather", label: t("nav.weather", "Weather"), icon: CloudSun },
    { id: "Irrigation Advisor", key: "irrigation", label: t("nav.irrigation", "Irrigation Advisor"), icon: Droplets },
    { id: "Disease Risk", key: "disease", label: t("nav.disease", "Disease Risk"), icon: ShieldAlert },
    {
      id: "Alerts",
      key: "alerts",
      label: t("nav.alerts", "Alerts"),
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    { id: "Settings", key: "settings", label: t("nav.settings", "Settings"), icon: SettingsIcon },
  ];

  // 2. Secondary / More Tools Items
  const secondaryNavItems: NavItem[] = [
    { id: "Farm Advisor", key: "advisor", label: t("nav.advisor", "Farm Advisor"), icon: BotMessageSquare },
    { id: "Analytics", key: "analytics", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const getActiveTabTitle = () => {
    const item = allNavItems.find((n) => normalizeTab(n.id) === normalizeTab(activeTab));
    return item ? item.label : activeTab;
  };

  const isSecondaryActive = secondaryNavItems.some(
    (item) => normalizeTab(item.id) === normalizeTab(activeTab)
  );

  return (
    <div className={`min-h-screen bg-[#f8faf9] flex flex-col md:flex-row text-slate-800 font-sans ${isRTL ? "rtl" : "ltr"}`}>
      {/* DESKTOP SIDEBAR */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 z-30 select-none"
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0">
            <Sprout className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-lg tracking-tight text-emerald-900 block leading-tight truncate">
              {t("common.appName", "CropSense AI")}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {t("common.tagline", "Smart Agronomy")}
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = normalizeTab(activeTab) === normalizeTab(item.id);
            return (
              <button
                key={item.id}
                id={`nav-link-${String(item.id || "").toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
                      isActive
                        ? "bg-emerald-200/70 text-emerald-900"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Tools Section */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <div className="px-3 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("nav.moreTools", "More Tools")}
              </span>
            </div>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = normalizeTab(activeTab) === normalizeTab(item.id);
              return (
                <button
                  key={item.id}
                  id={`nav-link-${String(item.id || "").toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${
                        isActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Clean Sidebar Footer: Language selector & Dark Green Current Farm Card */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          {/* Language selector row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("common.language", "LANGUAGE")}
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "ur" : "en")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === "ur" ? "اردو" : "English"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Dark Green Current Farm Card */}
          <div
            onClick={() => setActiveTab("Settings")}
            className="bg-[#054432] hover:bg-[#043829] rounded-2xl p-4 text-white shadow-xs cursor-pointer transition-all block text-left"
            title="Manage Farm Settings"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 tracking-wider uppercase">
                {t("nav.currentFarm", "CURRENT FARM")}
              </span>
              <span className="bg-emerald-900/90 text-emerald-200 border border-emerald-700/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {farm.totalArea} {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white tracking-tight mt-1 truncate">
              {farm.name}
            </p>
            <p className="text-xs text-emerald-200/80 mt-0.5 truncate">
              {Math.abs(farm.latitude).toFixed(1)}° {farm.latitude >= 0 ? "N" : "S"},{" "}
              {Math.abs(farm.longitude).toFixed(1)}° {farm.longitude >= 0 ? "W" : "E"}
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header
        id="mobile-header"
        className="md:hidden sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-40"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base truncate">
            {getActiveTabTitle()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Weather pill */}
          <button
            onClick={() => setActiveTab("Weather")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
          >
            <CloudSun className="w-3.5 h-3.5 text-emerald-600" />
            <span>{weather ? formatTemp(weather.current.temp) : "--"}</span>
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setActiveTab("Alerts")}
            className="relative p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            title={t("nav.alerts", "Alerts")}
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Avatar button */}
          <button
            onClick={() => setActiveTab("Settings")}
            className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-200"
          >
            {userInitials}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER FULL MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-start">
          <div className="w-72 bg-white h-full p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block leading-tight">
                    {t("common.appName", "CropSense AI")}
                  </span>
                  <span className="text-[10px] text-slate-400">{farm.name}</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector in Drawer */}
            <div className="py-2.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {language === "ur" ? "زبان منتخب کریں" : "Language"}
              </span>
              <LanguageSwitcher variant="toggle" />
            </div>

            <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                {t("common.menu", "Main Menu")}
              </div>
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = normalizeTab(activeTab) === normalizeTab(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">
                {t("nav.moreTools", "More Tools")}
              </div>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = normalizeTab(activeTab) === normalizeTab(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">{displayName}</p>
                <p className="text-[11px] text-slate-500">
                  {isDemoMode ? t("common.demoMode", "Demo Sandbox") : farm.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logOut();
                }}
                className="flex items-center gap-1 text-xs text-rose-600 font-semibold px-2.5 py-1 bg-rose-50 rounded-lg hover:bg-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("common.logOut", "Log Out")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* SIMPLIFIED DESKTOP TOP HEADER */}
        <header className="h-18 bg-white border-b border-slate-200 px-6 sm:px-8 hidden md:flex items-center justify-between sticky top-0 z-20">
          {/* Left: Current Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {getActiveTabTitle()}
            </h1>
          </div>

          {/* Right: Small Weather Summary, Notification Bell, User Profile Menu */}
          <div className="flex items-center gap-6">
            {/* 1. Small Weather Summary */}
            <button
              onClick={() => setActiveTab("Weather")}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity cursor-pointer"
              title="View Weather Telemetry"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">
                  {weather ? formatTemp(weather.current.temp) : "32.8°C"}
                </p>
                <p className="text-xs text-slate-500">
                  {weather?.current.weatherDescription || "Clear sky"}
                </p>
              </div>
            </button>

            {/* 2. Notification Icon with unread badge */}
            <button
              onClick={() => setActiveTab("Alerts")}
              className="relative p-2 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              title={t("nav.alerts", "Farm Alerts")}
              aria-label="Alerts"
            >
              <div className="relative flex items-center justify-center">
                <Bell className="w-5 h-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                )}
              </div>
              {unreadAlertsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-600 rounded-full shadow-2xs">
                  {unreadAlertsCount > 99 ? "99+" : unreadAlertsCount}
                </span>
              )}
            </button>

            {/* 3. User Profile Dropdown Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-right"
                aria-label="User Profile Menu"
              >
                <div className="text-right hidden lg:block leading-tight">
                  <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight truncate max-w-[140px]">
                    {isDemoMode ? t("common.demoMode", "Demo Sandbox") : "Farm Operator"}
                  </p>
                </div>

                <img
                  src={
                    currentUser?.avatarUrl ||
                    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&auto=format&fit=crop&q=80"
                  }
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Profile Dropdown Content */}
              {profileDropdownOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isDemoMode ? t("common.demoMode", "Demo Sandbox") : "Farm Operator"}
                      </span>
                    </div>
                  </div>

                  {/* Current Farm Info */}
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">{t("nav.currentFarm", "Current Farm")}</span>
                      <button
                        onClick={() => {
                          setActiveTab("Settings");
                          setProfileDropdownOpen(false);
                        }}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline"
                      >
                        {t("common.edit", "Change")}
                      </button>
                    </div>
                    <p className="font-semibold text-xs text-slate-800 mt-0.5 truncate">{farm.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {farm.totalArea} {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")} • {farm.primarySoilType}
                    </p>
                  </div>

                  {/* Language Selector inside Profile Menu */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {language === "ur" ? "زبان" : "Language"}
                    </span>
                    <LanguageSwitcher variant="toggle" />
                  </div>

                  {/* Menu Links */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab("Settings");
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left rtl:text-right text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("nav.settings", "Farm & System Settings")}</span>
                    </button>
                  </div>

                  {/* Log Out */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logOut();
                      }}
                      className="w-full px-4 py-2 text-left rtl:text-right text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t("common.logOut", "Log Out")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DEMO MODE NOTICE BANNER */}
        {isDemoMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider">
                {t("common.demoMode", "Demo Mode")}
              </span>
              <span>{t("common.demoModeNotice", "You are viewing a sample farm sandbox. Scans and modifications will not affect your real farm account.")}</span>
            </div>
            <button
              onClick={() => logOut()}
              className="font-bold underline text-amber-800 hover:text-amber-950 text-xs shrink-0"
            >
              {t("common.signUpOrLogin", "Sign Up or Log In")}
            </button>
          </div>
        )}

        {/* Page Children Container */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg"
      >
        <button
          onClick={() => setActiveTab("Dashboard")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            normalizeTab(activeTab) === "dashboard" ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${normalizeTab(activeTab) === "dashboard" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>{t("nav.overview", "Overview")}</span>
        </button>

        <button
          onClick={() => setActiveTab("My Crops")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            normalizeTab(activeTab) === "crops" ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout className={`w-5 h-5 mb-0.5 ${normalizeTab(activeTab) === "crops" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>{t("nav.crops", "Crops")}</span>
        </button>

        {/* Elevated Scan Floating Action Button in Center */}
        <button
          onClick={() => setActiveTab("Crop Scanner")}
          className="flex flex-col items-center -mt-5 relative"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 border-4 border-white transition-transform active:scale-95">
            <ScanLine className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-emerald-800 mt-0.5">{t("nav.scan", "Scan")}</span>
        </button>

        <button
          onClick={() => setActiveTab("Weather")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            normalizeTab(activeTab) === "weather" ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CloudSun className={`w-5 h-5 mb-0.5 ${normalizeTab(activeTab) === "weather" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>{t("nav.weather", "Weather")}</span>
        </button>

        <button
          onClick={() => setActiveTab("Irrigation Advisor")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            normalizeTab(activeTab) === "irrigation" ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Droplets className={`w-5 h-5 mb-0.5 ${normalizeTab(activeTab) === "irrigation" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>{t("nav.irrigation", "Irrigation")}</span>
        </button>
      </div>
    </div>
  );
};
