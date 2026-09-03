import React, { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageSwitcher } from "../components/common/LanguageSwitcher";
import { FarmProfile, SoilType } from "../types";
import {
  Settings as SettingsIcon,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  Download,
  Compass,
  Layers,
  Plus,
  Trash2,
  Check,
  Building2,
  AlertCircle,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
  Globe,
} from "lucide-react";

const agriculturalBasinPresets = [
  {
    name: "Salinas Valley, CA (Salad Bowl of the World)",
    location: "Salinas Valley, California",
    lat: 36.6777,
    lon: -121.6555,
    soil: "Loam" as SoilType,
  },
  {
    name: "Central Valley (Fresno), CA",
    location: "Fresno, California",
    lat: 36.7468,
    lon: -119.7726,
    soil: "Sandy Loam" as SoilType,
  },
  {
    name: "Corn Belt (Des Moines, Iowa)",
    location: "Des Moines, Iowa",
    lat: 41.5868,
    lon: -93.625,
    soil: "Silt Loam" as SoilType,
  },
  {
    name: "Yakima Valley (Apples & Hops), WA",
    location: "Yakima, Washington",
    lat: 46.6021,
    lon: -120.5059,
    soil: "Sandy Loam" as SoilType,
  },
  {
    name: "Willamette Valley (Berries & Wine), OR",
    location: "Willamette Valley, Oregon",
    lat: 44.9429,
    lon: -123.0351,
    soil: "Clay Loam" as SoilType,
  },
  {
    name: "Mediterranean Citrus Basin (Valencia, Spain)",
    location: "Valencia, Spain",
    lat: 39.4699,
    lon: -0.3763,
    soil: "Loam" as SoilType,
  },
  {
    name: "Indus Basin (Punjab / Sindh, Pakistan)",
    location: "Punjab, Pakistan",
    lat: 31.5204,
    lon: 74.3587,
    soil: "Loam" as SoilType,
  },
];

export const Settings: React.FC = () => {
  const {
    farm,
    farms,
    createFarm,
    switchFarm,
    deleteFarm,
    updateFarmProfile,
    resetToDefaults,
    tempUnit,
    setTempUnit,
    crops,
    scanHistory,
    currentUser,
    isDemoMode,
    logOut,
  } = useFarm();
  const { t, language, setLanguage, isRTL } = useTranslation();

  const [formData, setFormData] = useState<FarmProfile>({ ...farm });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // New Farm Modal / State
  const [isCreatingNewFarm, setIsCreatingNewFarm] = useState(false);
  const [newFarmData, setNewFarmData] = useState<FarmProfile>({
    name: "",
    location: "",
    latitude: 36.6777,
    longitude: -121.6555,
    primarySoilType: "Loam",
    totalAcreage: 120,
    areaUnit: "acres",
  });

  // Keep form data synced when active farm changes
  React.useEffect(() => {
    setFormData({ ...farm });
  }, [farm]);

  const handlePresetSelect = (preset: (typeof agriculturalBasinPresets)[0]) => {
    setFormData((prev) => ({
      ...prev,
      location: preset.location,
      latitude: preset.lat,
      longitude: preset.lon,
      primarySoilType: preset.soil,
    }));
  };

  const handleUseBrowserLocation = (target: "edit" | "new" = "edit") => {
    if (!navigator.geolocation) {
      setGeoStatus(t("settings.geoNotSupported", "Geolocation is not supported by your browser."));
      return;
    }
    setGeoStatus(t("settings.geoRequesting", "Requesting browser location permission..."));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        if (target === "edit") {
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            location: `Browser Coordinates (${lat}, ${lon})`,
          }));
        } else {
          setNewFarmData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            location: `Browser Coordinates (${lat}, ${lon})`,
          }));
        }
        setGeoStatus(`${t("settings.geoSuccess", "Acquired GPS location")}: ${lat}°, ${lon}°`);
        setTimeout(() => setGeoStatus(null), 4000);
      },
      (err) => {
        console.warn("Geolocation denied:", err);
        setGeoStatus(`${t("settings.geoError", "Geolocation error")}: ${err.message}.`);
        setTimeout(() => setGeoStatus(null), 5000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleCreateNewFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmData.name.trim() || !newFarmData.location.trim()) return;
    createFarm(newFarmData);
    setIsCreatingNewFarm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleExportData = () => {
    const exportPayload = {
      farm: formData,
      farms,
      crops,
      scanHistory,
      exportedAt: new Date().toISOString(),
      app: "CropSense AI",
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cropsense-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t("settings.title", "Farm & Account Management")}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("settings.subtitle", "Create and switch farms, calibrate latitude/longitude coordinates, and set soil taxonomy.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("settings.savedNotice", "Saved & Live Weather Synced!")}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingNewFarm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("settings.createNewFarm", "Create New Farm")}</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE & REGIONAL SETTINGS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{t("settings.languageSection", "Language & Regional Localization")}</span>
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            {isRTL ? "اردو (دائیں سے بائیں)" : "English (LTR)"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setLanguage("en")}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              language === "en"
                ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">English</h3>
                <p className="text-xs text-slate-500">Standard Left-to-Right layout</p>
              </div>
            </div>
            {language === "en" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>

          <div
            onClick={() => setLanguage("ur")}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              language === "ur"
                ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇵🇰</span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-urdu">اردو (Urdu)</h3>
                <p className="text-xs text-slate-500">مکمل دائیں سے بائیں (RTL) سپورٹ</p>
              </div>
            </div>
            {language === "ur" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </div>
        </div>
      </div>

      {/* ACCOUNT & SESSION PROFILE CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser?.farmerName || "Farmer"}
              className="w-12 h-12 rounded-full object-cover border border-emerald-200 shadow-2xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-2xs">
              {(currentUser?.farmerName || farm.farmerName || "Farmer")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {currentUser?.farmerName || farm.farmerName || "Farm Operator"}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDemoMode
                  ? "bg-amber-100 text-amber-800"
                  : currentUser?.authProvider === "google"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {isDemoMode ? t("common.demoMode", "Demo Mode") : currentUser?.authProvider === "google" ? "Google Connected" : t("auth.verifiedAccount", "Verified Account")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.email || (isDemoMode ? "demo@cropsense.ai" : "Local session")} • {t("nav.currentFarm", "Farm")}: {farm.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => logOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isDemoMode ? t("auth.exitDemo", "Exit Demo Sandbox") : t("common.logOut", "Log Out")}</span>
          </button>
        </div>
      </div>

      {/* MULTI-FARM SWITCHER LIST */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{t("settings.registeredFarms", "Your Registered Farms & Locations")}</span>
          </h2>
          <span className="text-xs text-slate-400">
            {farms.length} {farms.length === 1 ? t("settings.farmSingular", "farm") : t("settings.farmPlural", "farms")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {farms.map((fItem) => {
            const isActive = fItem.name === farm.name;
            return (
              <div
                key={fItem.name}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isActive
                    ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {fItem.name}
                    </h3>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t("common.active", "Active")}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchFarm(fItem.name)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        {t("settings.switchTo", "Switch To")}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{fItem.location}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    {fItem.latitude.toFixed(4)}°, {fItem.longitude.toFixed(4)}° • {fItem.primarySoilType}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {fItem.totalAcreage} {fItem.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")}
                  </span>
                  {farms.length > 1 && !isActive && (
                    <button
                      type="button"
                      onClick={() => deleteFarm(fItem.name)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title={t("common.delete", "Delete Farm")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT ACTIVE FARM FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ACTIVE FARM PROFILE SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{t("settings.activeFarmConfig", "Active Farm Configuration")}: {farm.name}</span>
            </h2>
            <button
              type="button"
              onClick={() => handleUseBrowserLocation("edit")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>{t("settings.useBrowserLocation", "Use Browser Location")}</span>
            </button>
          </div>

          {geoStatus && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{geoStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.farmName", "Farm Operation Name")} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                {t("settings.locationLabel", "Region / Valley Description")} *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.latitude", "Latitude Coordinate (°N)")} *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.longitude", "Longitude Coordinate (°W)")} *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Quick Basin Presets */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {t("settings.presetHeader", "Or Select an Agricultural Basin Preset")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {agriculturalBasinPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/40 text-left transition-all"
                >
                  <p className="text-xs font-semibold text-slate-800 truncate">{preset.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {preset.lat.toFixed(2)}°N, {preset.lon.toFixed(2)}°W • {preset.soil}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SOIL & UNIT PREFERENCES */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>{t("settings.soilAndUnits", "Soil Taxonomy & Agronomic Units")}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.soilType", "Primary Soil Texture")}</label>
              <select
                value={formData.primarySoilType}
                onChange={(e) =>
                  setFormData({ ...formData, primarySoilType: e.target.value as SoilType })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 outline-none"
              >
                <option value="Loam">Loam (Balanced / متوازن)</option>
                <option value="Sandy Loam">Sandy Loam (ریتلی دوماٹ)</option>
                <option value="Clay Loam">Clay Loam (چکنی دوماٹ)</option>
                <option value="Silt Loam">Silt Loam (سلٹ دوماٹ)</option>
                <option value="Clay">Clay (چکنی مٹی)</option>
                <option value="Sandy">Sandy (ریتلی مٹی)</option>
                <option value="Peat">Peat</option>
                <option value="Chalky">Chalky</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.areaUnit", "Area Measurement Unit")}</label>
              <select
                value={formData.areaUnit}
                onChange={(e) =>
                  setFormData({ ...formData, areaUnit: e.target.value as "acres" | "hectares" })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 outline-none"
              >
                <option value="acres">{t("common.acres", "Acres")} (ac / ایکڑ)</option>
                <option value="hectares">{t("common.hectares", "Hectares")} (ha / ہیکٹر)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">{t("settings.tempUnit", "Temperature Unit")}</label>
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value as "C" | "F")}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 outline-none"
              >
                <option value="C">Celsius (°C / سینٹی گریڈ)</option>
                <option value="F">Fahrenheit (°F / فارن ہائیٹ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA BACKUP & ACTIONS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t("settings.exportJson", "Export Farm JSON")}</span>
            </button>

            <button
              type="button"
              onClick={resetToDefaults}
              className="px-4 py-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("settings.resetDefaults", "Reset to Defaults")}</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{t("settings.saveConfig", "Save Configuration")}</span>
          </button>
        </div>
      </form>

      {/* CREATE NEW FARM MODAL */}
      {isCreatingNewFarm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">{t("settings.registerNewFarm", "Register New Farm")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNewFarm(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewFarmSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t("settings.farmName", "Farm Name")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Farm"
                  value={newFarmData.name}
                  onChange={(e) => setNewFarmData({ ...newFarmData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">{t("settings.locationLabel", "Location / Region")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monterey County, CA"
                  value={newFarmData.location}
                  onChange={(e) => setNewFarmData({ ...newFarmData, location: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t("settings.latitude", "Latitude")} *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newFarmData.latitude}
                    onChange={(e) =>
                      setNewFarmData({ ...newFarmData, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t("settings.longitude", "Longitude")} *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newFarmData.longitude}
                    onChange={(e) =>
                      setNewFarmData({ ...newFarmData, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleUseBrowserLocation("new")}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t("settings.useBrowserLocation", "Use Current Browser GPS")}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t("settings.soilType", "Soil Type")}</label>
                  <select
                    value={newFarmData.primarySoilType}
                    onChange={(e) =>
                      setNewFarmData({
                        ...newFarmData,
                        primarySoilType: e.target.value as SoilType,
                      })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    <option value="Loam">Loam</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Silt Loam">Silt Loam</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t("crops.area", "Total Area")} ({newFarmData.areaUnit})</label>
                  <input
                    type="number"
                    min="1"
                    value={newFarmData.totalAcreage}
                    onChange={(e) =>
                      setNewFarmData({
                        ...newFarmData,
                        totalAcreage: parseFloat(e.target.value) || 10,
                      })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewFarm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {t("settings.createAndActivate", "Create & Activate Farm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

