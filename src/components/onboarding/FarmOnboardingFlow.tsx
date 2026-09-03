import React, { useState } from "react";
import { useFarm } from "../../context/FarmContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { SoilType, GrowthStage, CropHealthStatus } from "../../types";
import { CROP_OPTIONS } from "../../data/cropProfiles";
import {
  Sprout,
  MapPin,
  Compass,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
} from "lucide-react";

interface InitialCropItem {
  id: string;
  cropName: string;
  fieldName: string;
  fieldSize: number;
  soilType: SoilType;
  growthStage: GrowthStage;
  plantingDate: string;
  lastIrrigationDate: string;
  healthStatus: CropHealthStatus;
}

export const FarmOnboardingFlow: React.FC = () => {
  const { currentUser, completeFarmSetup, addCrop } = useFarm();
  const { t, isRTL } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  // Step 1: Farm profile details
  const [farmerName, setFarmerName] = useState(currentUser?.farmerName || "");
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number>(36.6777);
  const [longitude, setLongitude] = useState<number>(-121.6555);
  const [totalArea, setTotalArea] = useState<number>(25);
  const [areaUnit, setAreaUnit] = useState<"acres" | "hectares">("acres");
  const [primarySoilType, setPrimarySoilType] = useState<SoilType>("Loam");

  // Step 2: Crop List
  const [initialCrops, setInitialCrops] = useState<InitialCropItem[]>([
    {
      id: "crop-1",
      cropName: "Tomato",
      fieldName: "North Parcel 1",
      fieldSize: 10,
      soilType: "Loam",
      growthStage: "Vegetative",
      plantingDate: new Date().toISOString().split("T")[0],
      lastIrrigationDate: new Date().toISOString().split("T")[0],
      healthStatus: "Optimal",
    },
  ]);

  // Current crop form being drafted
  const [draftCrop, setDraftCrop] = useState<{
    cropName: string;
    fieldName: string;
    fieldSize: number;
    soilType: SoilType;
    growthStage: GrowthStage;
    plantingDate: string;
    lastIrrigationDate: string;
  }>({
    cropName: "Corn (Sweet / Field)",
    fieldName: "South Block 2",
    fieldSize: 15,
    soilType: "Loam",
    growthStage: "Vegetative",
    plantingDate: new Date().toISOString().split("T")[0],
    lastIrrigationDate: new Date().toISOString().split("T")[0],
  });

  const [stepError, setStepError] = useState<string | null>(null);

  // Auto-detect browser location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage(t("settings.geoNotSupported", "Geolocation is not supported by your browser."));
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lon);
        if (!location) {
          setLocation(`Field Coordinates (${lat}, ${lon})`);
        }
        setGeoLoading(false);
        setGeoMessage(t("onboarding.gpsDetected", `Detected GPS coordinates: ${lat}° N, ${lon}° W`, { lat, lon }));
      },
      (err) => {
        setGeoLoading(false);
        setGeoMessage(t("settings.geoNotSupported", "Unable to retrieve location. Please input coordinates manually."));
      },
      { timeout: 10000 }
    );
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (!farmerName.trim() || !farmName.trim() || !location.trim()) {
      setStepError(t("onboarding.validationError", "Please complete all required fields before proceeding."));
      return;
    }

    setStep(2);
  };

  const handleAddCropToBatch = () => {
    if (!draftCrop.fieldName.trim()) {
      alert(t("onboarding.validationError", "Please specify a field or parcel name for the crop."));
      return;
    }

    const newCrop: InitialCropItem = {
      id: `crop-${Date.now()}`,
      cropName: draftCrop.cropName,
      fieldName: draftCrop.fieldName.trim(),
      fieldSize: draftCrop.fieldSize > 0 ? draftCrop.fieldSize : 5,
      soilType: draftCrop.soilType,
      growthStage: draftCrop.growthStage,
      plantingDate: draftCrop.plantingDate,
      lastIrrigationDate: draftCrop.lastIrrigationDate,
      healthStatus: "Optimal",
    };

    setInitialCrops([...initialCrops, newCrop]);
    // Reset draft
    setDraftCrop({
      cropName: "Wheat",
      fieldName: `Field Block ${initialCrops.length + 2}`,
      fieldSize: 10,
      soilType: primarySoilType,
      growthStage: "Vegetative",
      plantingDate: new Date().toISOString().split("T")[0],
      lastIrrigationDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleRemoveCrop = (id: string) => {
    setInitialCrops(initialCrops.filter((c) => c.id !== id));
  };

  const handleFinalizeOnboarding = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Farm Profile
      await completeFarmSetup({
        name: farmName.trim(),
        farmerName: farmerName.trim(),
        location: location.trim(),
        latitude,
        longitude,
        totalArea,
        areaUnit,
        primarySoilType,
        establishedYear: new Date().getFullYear(),
      });

      // 2. Add each crop to user database
      for (const crop of initialCrops) {
        await addCrop({
          cropName: crop.cropName,
          fieldName: crop.fieldName,
          fieldSize: crop.fieldSize,
          soilType: crop.soilType,
          growthStage: crop.growthStage,
          plantingDate: crop.plantingDate,
          lastIrrigationDate: crop.lastIrrigationDate,
          healthStatus: "Optimal",
        });
      }
    } catch (err: any) {
      alert("Error saving onboarding data: " + (err?.message || "Please retry."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle organic background glow accents */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher in Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="header" />
      </div>

      <div className="w-full max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Progress Header */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30 shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t("common.appName", "CropSense AI")}
                </h1>
                <p className="text-xs text-slate-400">
                  {step === 1 ? t("onboarding.step1Title", "Farm Profile & Geographic Calibration") : t("onboarding.step2Title", "Register Initial Crop Parcels")}
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === 1
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                    : "bg-emerald-800 text-emerald-200"
                }`}
              >
                1
              </span>
              <div className="w-6 h-0.5 bg-slate-700" />
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === 2
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                2
              </span>
            </div>
          </div>

          {/* STEP 1: FARM PROFILE SETUP */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 pt-2 border-t border-slate-700/60">
              {stepError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t("onboarding.farmerNameLabel", "Farmer / Manager Full Name")} *
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t("onboarding.farmNameLabel", "Farm / Ranch Name")} *
                  </label>
                  <div className="relative">
                    <Building2 className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green Valley Farm"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("onboarding.locationLabel", "Farm Region / Location Description")} *
                </label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Punjab, Pakistan / Salinas Valley, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                      isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                    }`}
                  />
                </div>
              </div>

              {/* Coordinates Section with GPS Detector */}
              <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    {t("weather.satelliteTelemetry", "Geographic Coordinates (for Real Open-Meteo Weather)")}
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={geoLoading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{geoLoading ? t("onboarding.detectingGps", "Detecting GPS...") : t("onboarding.detectLocationBtn", "Auto-Detect via GPS")}</span>
                  </button>
                </div>

                {geoMessage && (
                  <p className="text-[11px] text-emerald-400 font-medium">{geoMessage}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{t("onboarding.latitudeLabel", "Latitude (°N)")}</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      dir="ltr"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{t("onboarding.longitudeLabel", "Longitude (°W/E)")}</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      dir="ltr"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Area & Soil Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t("onboarding.totalAreaLabel", "Total Cultivated Area")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalArea}
                    onChange={(e) => setTotalArea(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">{t("settings.areaUnit", "Area Unit")}</label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as "acres" | "hectares")}
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="acres">{t("common.acres", "Acres")}</option>
                    <option value="hectares">{t("common.hectares", "Hectares")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t("onboarding.soilTypeLabel", "Primary Soil Texture")}
                  </label>
                  <select
                    value={primarySoilType}
                    onChange={(e) => setPrimarySoilType(e.target.value as SoilType)}
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Loam">{t("common.soilTypes.loam", "Loam (Balanced)")}</option>
                    <option value="Sandy Loam">{t("common.soilTypes.sandyLoam", "Sandy Loam (Fast drainage)")}</option>
                    <option value="Clay Loam">{t("common.soilTypes.clayLoam", "Clay Loam (High capacity)")}</option>
                    <option value="Silt Loam">{t("common.soilTypes.siltLoam", "Silt Loam (Fertile)")}</option>
                    <option value="Clay">{t("common.soilTypes.clay", "Clay (Heavy)")}</option>
                    <option value="Sandy">{t("common.soilTypes.sandy", "Sandy (High infiltration)")}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  id="onboarding-step1-next-btn"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t("onboarding.nextStep", "Continue to Crop Registration")}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CROPS REGISTRATION */}
          {step === 2 && (
            <div className="space-y-5 pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{t("crops.allCropsTab", "Your Registered Crop Parcels")}</h3>
                  <p className="text-xs text-slate-400">
                    {t("onboarding.step2Subtitle", "Add at least one crop to enable disease risk forecasting and FAO-56 irrigation balancing.")}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-700/60">
                  {initialCrops.length} {initialCrops.length === 1 ? t("crops.fieldCard", "Crop") : t("crops.title", "Crops")}
                </span>
              </div>

              {/* Registered Crop Cards */}
              <div className="space-y-2">
                {initialCrops.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-900/60 border border-slate-700/70 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{c.cropName}</span>
                        <span className="text-[11px] text-slate-400">
                          {c.fieldName} • {c.fieldSize} {areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")} • {c.soilType} • {c.growthStage}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={t("common.delete", "Remove crop")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Crop Panel */}
              <div className="p-4 bg-slate-900/40 border border-slate-700/60 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {t("onboarding.draftingTitle", "Add Another Crop Parcel")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">{t("onboarding.cropTypeLabel", "Crop Type")}</label>
                    <select
                      value={draftCrop.cropName}
                      onChange={(e) => setDraftCrop({ ...draftCrop, cropName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {CROP_OPTIONS.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">{t("onboarding.fieldNameLabel", "Field / Parcel Name")}</label>
                    <input
                      type="text"
                      placeholder="e.g. West Acre 3"
                      value={draftCrop.fieldName}
                      onChange={(e) => setDraftCrop({ ...draftCrop, fieldName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      {t("onboarding.fieldSizeLabel", "Field Size")} ({areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")})
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={draftCrop.fieldSize}
                      onChange={(e) => setDraftCrop({ ...draftCrop, fieldSize: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">{t("onboarding.growthStageLabel", "Growth Stage")}</label>
                    <select
                      value={draftCrop.growthStage}
                      onChange={(e) => setDraftCrop({ ...draftCrop, growthStage: e.target.value as GrowthStage })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Germination">{t("common.growthStages.germination", "Germination")}</option>
                      <option value="Vegetative">{t("common.growthStages.vegetative", "Vegetative")}</option>
                      <option value="Flowering">{t("common.growthStages.flowering", "Flowering")}</option>
                      <option value="Fruit Development">{t("common.growthStages.fruitDevelopment", "Fruit Development")}</option>
                      <option value="Ripening">{t("common.growthStages.fruitDevelopment", "Ripening")}</option>
                      <option value="Maturity / Harvest">{t("common.growthStages.harvest", "Maturity / Harvest")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">{t("onboarding.plantingDateLabel", "Planting Date")}</label>
                    <input
                      type="date"
                      value={draftCrop.plantingDate}
                      onChange={(e) => setDraftCrop({ ...draftCrop, plantingDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">{t("onboarding.lastIrrigationLabel", "Last Irrigation Date")}</label>
                    <input
                      type="date"
                      value={draftCrop.lastIrrigationDate}
                      onChange={(e) => setDraftCrop({ ...draftCrop, lastIrrigationDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddCropToBatch}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t("onboarding.addCropButton", "Add to Crop List")}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                  <span>{t("onboarding.prevStep", "Back to Farm Details")}</span>
                </button>

                <button
                  type="button"
                  id="onboarding-finish-btn"
                  onClick={handleFinalizeOnboarding}
                  disabled={isSubmitting || initialCrops.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{t("onboarding.submitting", "Configuring Farm...")}</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t("onboarding.completeButton", "Complete Setup & Enter Dashboard")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
