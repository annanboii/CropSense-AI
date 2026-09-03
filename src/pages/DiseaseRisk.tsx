import React, { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Thermometer,
  Wind,
  ScanLine,
  ChevronRight,
  Filter,
  Sparkles,
  HelpCircle,
  Clock,
} from "lucide-react";

export const DiseaseRisk: React.FC = () => {
  const {
    farm,
    crops,
    weather,
    diseaseRisks,
    setActiveTab,
    openScannerWithCrop,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [filterCrop, setFilterCrop] = useState<string>("all");

  const filteredRisks = diseaseRisks.filter((risk) => {
    if (filterCrop === "all") return true;
    const target = (filterCrop || "").toLowerCase();
    return (risk.susceptibleCrops || []).some((c) =>
      (c || "").toLowerCase().includes(target)
    );
  });

  const highRiskCount = diseaseRisks.filter(
    (r) => r.riskLevel === "High" || r.riskLevel === "Severe"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("disease.title", "Microclimate Disease Risk Forecaster")}
              </h1>
              <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("disease.subtitle", "Software-only predictive epidemiology models. Calculates fungal & bacterial spore germination probability using real ambient temperature, humidity thresholds, and canopy wetness windows.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              highRiskCount > 0
                ? "bg-rose-100 text-rose-800 border border-rose-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {highRiskCount > 0
              ? `${highRiskCount} ${t("disease.elevatedRisk", "Pathogens at Elevated Risk")}`
              : t("disease.allLowRisk", "All Pathogens Low Risk")}
          </span>
        </div>
      </div>

      {/* ATMOSPHERIC RISK DRIVERS SNAPSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("disease.foliarWetnessRisk", "Foliar Wetness Risk")}</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {weather?.current.humidity || 65}% RH
            </span>
            <span className="text-xs font-semibold text-amber-700">
              {(weather?.current.humidity || 65) > 70 ? t("disease.sporeFavorable", "Spore Favorable") : t("disease.moderate", "Moderate")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("disease.humidityDesc", "High relative humidity promotes fungal spore germination")}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("disease.incubationTemp", "Incubation Temperature")}</span>
            <Thermometer className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {weather?.current.temp.toFixed(1) || "22.4"}°C
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {t("disease.withinOptimalRange", "Within Optimal Range")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("disease.tempDesc", "20–28°C provides optimal mycelial expansion rates")}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t("weather.sprayWindow", "Preventive Spray Window")}</span>
            <Wind className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {weather?.agriculturalMetrics.sprayingWindowQuality || "Good"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("disease.sprayDesc", "Calm wind allows uniform droplet canopy deposition")}
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{t("disease.filterCrop", "Filter Susceptible Crop:")}</span>
        </div>

        <select
          value={filterCrop}
          onChange={(e) => setFilterCrop(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
        >
          <option value="all">{t("crops.allCrops", "All Registered Crops")}</option>
          {crops.map((c) => (
            <option key={c.id} value={c.cropName}>
              {c.cropName}
            </option>
          ))}
          <option value="Tomato">Tomatoes</option>
          <option value="Potato">Potatoes</option>
          <option value="Corn">Corn</option>
          <option value="Wheat">Wheat</option>
        </select>
      </div>

      {/* DISEASE RISK CARDS */}
      <div className="space-y-4">
        {filteredRisks.map((item) => {
          const isSevere = item.riskLevel === "Severe";
          const isHigh = item.riskLevel === "High";
          const isMod = item.riskLevel === "Moderate";

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-6 shadow-sm transition-all space-y-4 ${
                isSevere
                  ? "border-rose-400 bg-rose-50/20"
                  : isHigh
                  ? "border-rose-200 hover:border-rose-300"
                  : isMod
                  ? "border-amber-200 hover:border-amber-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isSevere
                          ? "bg-rose-600 text-white"
                          : isHigh
                          ? "bg-rose-100 text-rose-800"
                          : isMod
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.riskLevel} {t("disease.risk", "Risk")} ({item.riskScore}%)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t("disease.pathogen", "Pathogen")}: <strong className="text-slate-700">{item.pathogenType}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.diseaseName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const matchedCrop = crops.find((c) =>
                        item.susceptibleCrops.some((sc) => c.cropName.includes(sc))
                      );
                      openScannerWithCrop(
                        matchedCrop?.cropName || item.susceptibleCrops[0] || "Roma Tomatoes",
                        matchedCrop?.growthStage || "Vegetative"
                      );
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>{t("disease.scanLeaf", "Scan Leaf for Symptoms")}</span>
                  </button>
                </div>
              </div>

              {/* Susceptible Crops & Current Triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                    {t("disease.susceptibleHosts", "Susceptible Host Plants")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.susceptibleCrops.map((c, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-500 text-[11px] pt-1">
                    {t("disease.favorable", "Favorable")}: {item.favorableConditions}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                    {t("disease.currentTrigger", "Current Atmospheric Trigger")}
                  </span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {item.currentTrigger}
                  </p>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wide">
                    {t("disease.preventiveAction", "Preventive Agronomic Action")}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {item.recommendedAction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
