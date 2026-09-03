import React from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import {
  Sprout,
  ScanLine,
  CloudSun,
  Droplets,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  Activity,
  ListTodo,
  ChevronRight,
  Eye,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const {
    farm,
    crops,
    weather,
    alerts,
    scanHistory,
    irrigationAdvice,
    diseaseRisks,
    setActiveTab,
    openScannerWithCrop,
    formatTemp,
    formatArea,
    setSelectedCropForDetail,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const unreadAlerts = alerts.filter((a) => !a.dismissed);
  const totalAcreage = crops.reduce((acc, c) => acc + c.fieldSize, 0);

  // Calculate health breakdown
  const optimalCount = crops.filter((c) => c.healthStatus === "Optimal").length;
  const healthPercentage = crops.length > 0 ? Math.round((optimalCount / crops.length) * 100) : 100;

  // Immediate irrigation needed
  const irrigationNeededCount = irrigationAdvice.filter(
    (a) => a.recommendedAction === "Irrigate Now" || a.recommendedAction === "Irrigate Soon"
  ).length;

  // Highest disease risk
  const highestRisk = diseaseRisks.reduce(
    (prev, current) => (prev.riskScore > current.riskScore ? prev : current),
    diseaseRisks[0] || { diseaseName: "Early Blight", riskScore: 78, riskLevel: "High" }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Crop Status */}
        <div
          id="kpi-crop-status"
          onClick={() => setActiveTab("My Crops")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t("dashboard.cropStatus", "Crop Status")}</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{crops.length} {t("dashboard.fieldsCount", "Fields")}</h3>
          </div>
          <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{healthPercentage}% {t("common.optimal", "Healthy")} ({totalAcreage.toFixed(1)} {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")})</span>
          </p>
        </div>

        {/* Card 2: Weather (Today) */}
        <div
          id="kpi-weather-today"
          onClick={() => setActiveTab("Weather")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t("dashboard.weatherToday", "Weather (Today)")}</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {weather ? formatTemp(weather.current.temp) : "--"}
            </h3>
          </div>
          <p className="text-slate-500 text-xs mt-2 truncate">
            {weather?.current.weatherDescription || "Sunny"} • {t("weather.humidity", "Humidity")} {weather?.current.humidity || 45}%
          </p>
        </div>

        {/* Card 3: Disease Risk */}
        <div
          id="kpi-disease-risk"
          onClick={() => setActiveTab("Disease Risk")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t("dashboard.diseaseRisk", "Disease Threat")}</p>
            </div>
            <h3 className={`text-2xl font-bold ${
              highestRisk.riskLevel === "High" ? "text-rose-600" : highestRisk.riskLevel === "Moderate" ? "text-amber-600" : "text-emerald-600"
            }`}>
              {highestRisk.riskLevel === "High" ? t("common.high", "High") : highestRisk.riskLevel === "Moderate" ? t("common.moderate", "Moderate") : t("common.low", "Low")}
            </h3>
          </div>
          <p className="text-slate-500 text-xs mt-2 truncate">
            {highestRisk.diseaseName} ({highestRisk.riskScore}% {t("common.risk", "risk")})
          </p>
        </div>

        {/* Card 4: Irrigation Need */}
        <div
          id="kpi-irrigation-need"
          onClick={() => setActiveTab("Irrigation Advisor")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t("dashboard.irrigationNeed", "Irrigation Need")}</p>
            </div>
            <h3 className="text-2xl font-bold text-sky-600">
              {irrigationNeededCount > 0 ? `${irrigationNeededCount} ${t("dashboard.fieldsCount", "Fields")}` : t("common.optimal", "Optimal")}
            </h3>
          </div>
          <p className="text-slate-500 text-xs mt-2 truncate">
            ET₀: {weather?.current.et0 || "4.2"} mm/day • {t("irrigation.soilBuffered", "Soil buffered")}
          </p>
        </div>
      </div>

      {/* 2. PRIORITY ALERTS SECTION */}
      {unreadAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base">
                {t("alerts.title", "Active Agronomic Alerts")} ({unreadAlerts.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("Alerts")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>{t("dashboard.manageAlerts", "Manage Alerts")}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {unreadAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                  alert.severity === "High" || alert.severity === "critical"
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : alert.severity === "Medium" || alert.severity === "warning"
                    ? "bg-amber-50/70 border-amber-200 text-amber-950"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900">{alert.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
                {alert.actionTab && (
                  <button
                    onClick={() => setActiveTab(alert.actionTab!)}
                    className="mt-3 text-xs font-medium text-emerald-700 hover:text-emerald-800 self-start flex items-center gap-1"
                  >
                    <span>{alert.actionLabel || t("common.viewDetails", "View Details")}</span>
                    <ArrowUpRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MIDDLE DUAL SECTION: YIELD/GROWTH PROGRESSION + RECENT LEAF SCANS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Yield Projection vs Soil Moisture Progression */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800">{t("dashboard.growthProgression", "Growth Vigor & Moisture Index")}</h2>
              <p className="text-xs text-slate-500">{t("dashboard.growthProgressionDesc", "Weekly field canopy density vs. target threshold")}</p>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400">Canopy Vigor</span>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">88% NDVI</p>
                <span className="text-[10px] text-emerald-600 font-medium">+4% from last week</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400">Soil Moisture Avg</span>
                <p className="text-lg font-bold text-cyan-800 mt-0.5">72% Field Cap.</p>
                <span className="text-[10px] text-slate-500">Root zone buffered</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400">Est. Biomass</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">3.8 t/ha</p>
                <span className="text-[10px] text-emerald-600 font-medium">On track</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400">Disease Threat</span>
                <p className="text-lg font-bold text-amber-700 mt-0.5">Moderate</p>
                <span className="text-[10px] text-slate-500">High humidity risk</span>
              </div>
            </div>

            {/* Visual Bar Distribution for Fields */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">
                Field Health & Moisture Distribution
              </span>
              <div className="space-y-2">
                {crops.slice(0, 4).map((crop) => {
                  const healthColor =
                    crop.healthStatus === "Optimal"
                      ? "bg-emerald-500"
                      : crop.healthStatus === "Attention"
                      ? "bg-amber-500"
                      : "bg-rose-500";
                  const widthPercent =
                    crop.healthStatus === "Optimal" ? 92 : crop.healthStatus === "Attention" ? 70 : 45;

                  return (
                    <div key={crop.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 font-semibold">{crop.cropName} ({crop.fieldName})</span>
                        <span className="text-slate-500">{crop.growthStage} • {crop.soilType}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${healthColor} rounded-full transition-all duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Leaf Diagnostics / Quick Scan Action */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">{t("dashboard.recentScans", "Recent AI Scans")}</h2>
            <button
              onClick={() => setActiveTab("Crop Scanner")}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {t("nav.scan", "New Scan")}
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <ScanLine className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">{t("dashboard.noScans", "No AI scans performed yet")}</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Take a photo of crop leaves to detect diseases and nutrient deficiencies.
                </p>
                <button
                  onClick={() => setActiveTab("Crop Scanner")}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  {t("nav.quickScan", "Scan Crop")}
                </button>
              </div>
            ) : (
              scanHistory.slice(0, 4).map((scan) => {
                const conditionName =
                  scan.diseaseDetected ||
                  scan.possibleCondition ||
                  scan.diagnosis ||
                  "Vegetative Foliage";
                const isHealthy =
                  conditionName.toLowerCase().includes("healthy") ||
                  scan.severity === "Healthy";
                const confidencePct =
                  typeof scan.confidence === "number"
                    ? scan.confidence <= 1
                      ? Math.round(scan.confidence * 100)
                      : Math.round(scan.confidence)
                    : typeof scan.confidenceScore === "number"
                    ? Math.round(scan.confidenceScore * 100)
                    : 88;

                return (
                  <div
                    key={scan.id}
                    onClick={() => setActiveTab("Crop Scanner")}
                    className="p-3 rounded-lg border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {scan.cropType}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isHealthy ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isHealthy ? "Healthy" : "Infection"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conditionName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-700 block">
                        {confidencePct}%
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {scan.timestamp ? scan.timestamp.split(" ")[0] : "Recent"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. REGISTERED CROPS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">{t("dashboard.inventoryTitle", "Crop Inventory & Field Parcels")}</h2>
            <p className="text-xs text-slate-500">{t("dashboard.inventoryDesc", "Live health monitoring, growth stages, and irrigation cycles")}</p>
          </div>
          <button
            onClick={() => setActiveTab("My Crops")}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {t("dashboard.manageAll", "Manage All")} ({crops.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs">{t("crops.cropName", "Crop Name")}</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs">{t("crops.fieldName", "Field")}</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs">{t("crops.stage", "Growth Stage")}</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs">{t("crops.soil", "Soil Type")}</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs">{t("crops.lastWatered", "Last Watered")}</th>
                <th className="px-6 py-3 font-semibold text-slate-600 text-xs text-right">{t("common.action", "Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Sprout className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700">{t("crops.noCrops", "No crops registered yet")}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {t("crops.noCropsDesc", "Add your active farm crops to calculate customized irrigation recommendations and disease threat alerts.")}
                    </p>
                    <button
                      onClick={() => setActiveTab("My Crops")}
                      className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      + {t("crops.addFirstCrop", "Add Your First Crop")}
                    </button>
                  </td>
                </tr>
              ) : (
                crops.map((crop) => (
                  <tr key={crop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>{crop.cropName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {crop.fieldName} ({crop.fieldSize} {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")})
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium border border-emerald-100">
                        {crop.growthStage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{crop.soilType}</td>
                    <td className="px-6 py-4 text-slate-500">{crop.lastIrrigationDate || t("crops.notRecorded", "Not recorded")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openScannerWithCrop(crop.cropName, crop.growthStage)}
                          className="text-emerald-600 font-medium hover:underline text-xs"
                        >
                          {t("nav.scan", "Scan")}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => {
                            setSelectedCropForDetail(crop);
                            setActiveTab("My Crops");
                          }}
                          className="text-slate-500 font-medium hover:text-slate-800 text-xs"
                        >
                          {t("common.viewDetails", "Details")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DAILY AGRONOMIC SCHEDULE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">{t("dashboard.dailySchedule", "Today's Field Schedule & Operations")}</h2>
          </div>
          <span className="text-xs text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{t("dashboard.morningIrrigation", "Morning Irrigation Cycle")}</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold text-[10px]">06:00 - 08:30 AM</span>
            </div>
            <p className="text-xs text-slate-600">
              {t("dashboard.irrigationScheduleDesc", "Drip lines scheduled for Tomato Parcels (Field North 1 & 2) at 4.2mm depth.")}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{t("dashboard.canopyScouting", "Canopy Scouting & Leaf Scan")}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">10:00 AM</span>
            </div>
            <p className="text-xs text-slate-600">
              {t("dashboard.scoutingDesc", "Check lower leaves for early blight and mildew lesions using Crop Scanner.")}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{t("dashboard.sprayingWindow", "Spraying Window Evaluation")}</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[10px]">04:00 - 06:30 PM</span>
            </div>
            <p className="text-xs text-slate-600">
              {t("dashboard.sprayingDesc", "Wind speed forecast <10 km/h: Favorable window for organic copper foliar application.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
