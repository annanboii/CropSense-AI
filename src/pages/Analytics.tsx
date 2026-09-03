import React, { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  BarChart3,
  TrendingUp,
  Droplets,
  Sprout,
  ShieldAlert,
  Calendar,
  CloudRain,
  ScanLine,
  Activity,
  Award,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Eye,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const PIE_COLORS = ["#059669", "#06b6d4", "#f59e0b", "#e11d48", "#8b5cf6", "#10b981"];

export const Analytics: React.FC = () => {
  const {
    farm,
    crops,
    irrigationAdvice,
    diseaseRisks,
    scanHistory,
    irrigationRecords,
    weather,
    isLoadingWeather,
    weatherError,
    refreshWeather,
    setActiveTab,
    formatTemp,
    formatArea,
    formatWaterVolume,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // 1. Crop Health Distribution
  const healthDistribution = [
    { name: t("common.optimal", "Optimal"), count: crops.filter((c) => c.healthStatus === "Optimal").length, color: "#059669" },
    { name: t("common.stressed", "Attention"), count: crops.filter((c) => c.healthStatus === "Attention").length, color: "#f59e0b" },
    { name: t("common.infected", "At Risk"), count: crops.filter((c) => c.healthStatus === "At Risk").length, color: "#e11d48" },
    { name: t("common.inactive", "Dormant"), count: crops.filter((c) => c.healthStatus === "Dormant").length, color: "#64748b" },
  ].filter((h) => h.count > 0);

  // 2. Soil Texture Distribution
  const soilCounts: Record<string, number> = {};
  crops.forEach((c) => {
    soilCounts[c.soilType] = (soilCounts[c.soilType] || 0) + c.fieldSize;
  });
  const soilData = Object.entries(soilCounts).map(([soil, size]) => ({
    name: soil,
    value: Math.round(size * 10) / 10,
  }));

  // 3. Disease Risk Index Trend
  const diseaseChartData = diseaseRisks.map((d) => ({
    name: d.diseaseName.split(" (")[0].slice(0, 14),
    fullName: d.diseaseName,
    risk: d.riskScore,
    level: d.riskLevel,
    type: d.pathogenType,
  }));

  // 4. Irrigation Moisture & Demand Balance
  const irrigationBalanceData = irrigationAdvice.map((a) => ({
    crop: a.cropName.split(" ")[0],
    fullName: a.cropName,
    moisture: a.soilMoistureEstimatePercent,
    recommendedVolume: Math.round(a.recommendedVolumeGallons / 1000), // k Gal
    threshold: 50, // Permanent wilting / trigger threshold line
  }));

  // 5. 7-Day Weather Trends from Open-Meteo
  const weatherTrendsData = (weather?.daily || []).map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
    maxTemp: day.tempMax,
    minTemp: day.tempMin,
    rain: day.precipitationSum || 0,
    et0: day.et0 || 0,
    rainProb: day.precipitationProbabilityMax || 0,
  }));

  const totalFarmArea = crops.reduce((acc, c) => acc + c.fieldSize, 0);
  const avgConfidence = scanHistory.length
    ? Math.round(scanHistory.reduce((acc, s) => acc + s.confidence, 0) / scanHistory.length)
    : 0;

  const selectedScan = scanHistory.find((s) => s.id === selectedScanId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" role="region" aria-label="Farm Analytics Dashboard">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t("analytics.title", "Farm Telemetry & Agronomic Analytics")}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {farm.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("analytics.subtitle", "Multi-factor data aggregation across scan diagnostics, soil moisture depletion, pathogen risk, and live Open-Meteo weather trends.")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => refreshWeather()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
            title="Refresh live weather telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? "animate-spin text-emerald-600" : ""}`} />
            <span>{t("weather.refreshWeather", "Sync Telemetry")}</span>
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoadingWeather && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>{t("analytics.loadingWeather", "Refreshing meteorological forecasts and recalculating soil water balance...")}</span>
        </div>
      )}

      {/* Error state indicator */}
      {weatherError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{t("alerts.weatherWarning", "Live Weather Sync Issue")}</p>
            <p className="mt-0.5 text-rose-700">{weatherError}</p>
          </div>
        </div>
      )}

      {/* 4 HIGH-LEVEL KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Crops & Health */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("analytics.kpiAcreage", "Cultivated Crops")}
            </span>
            <ProvenanceBadge source="USER-PROVIDED DATA" size="sm" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{crops.length} {t("dashboard.fields", "Fields")}</span>
            <span className="text-xs text-slate-500 font-medium">({totalFarmArea.toFixed(1)} {farm.areaUnit})</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <Sprout className="w-3.5 h-3.5" />
            <span>{crops.filter((c) => c.healthStatus === "Optimal").length} / {crops.length || 0} {t("dashboard.healthyFields", "in optimal vigor")}</span>
          </div>
        </div>

        {/* Metric 2: Scan Diagnostics */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("scanner.title", "AI Leaf Scans")}
            </span>
            <ProvenanceBadge source="DEMO AI ASSESSMENT" size="sm" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{scanHistory.length} {t("nav.scan", "Scans")}</span>
            {scanHistory.length > 0 && (
              <span className="text-xs text-slate-500 font-medium font-mono">avg {avgConfidence}% {t("scanner.confidence", "conf")}</span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {scanHistory.filter((s) => s.severity === "Severe" || s.severity === "Moderate").length} {t("alerts.tabScans", "concerns flagged")}
            </span>
          </div>
        </div>

        {/* Metric 3: Irrigation Volume Demand */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("irrigation.summaryTitle", "Irrigation Load")}
            </span>
            <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-cyan-700">
              {formatWaterVolume(irrigationAdvice.reduce((sum, a) => sum + a.recommendedVolumeLiters, 0))}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cyan-800 font-medium">
            <Droplets className="w-3.5 h-3.5" />
            <span>{irrigationAdvice.filter((a) => a.recommendedAction === "Irrigate Now").length} {t("irrigation.fieldsRequiringWater", "parcels need water now")}</span>
          </div>
        </div>

        {/* Metric 4: Peak Pathogen Exposure */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("analytics.kpiMaxRisk", "Max Pathogen Risk")}
            </span>
            <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            {diseaseRisks.length > 0 ? (
              <>
                <span className="text-2xl font-bold text-rose-600">
                  {Math.max(...diseaseRisks.map((d) => d.riskScore))}%
                </span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  ({diseaseRisks.reduce((max, d) => (d.riskScore > max.riskScore ? d : max), diseaseRisks[0]).diseaseName.split(" ")[0]})
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-slate-400">0%</span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>{t("disease.threatLevel", "Live microclimate index")}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: CROP SCAN HISTORY & HEALTH TREND */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">{t("analytics.chartScanHistory", "Crop Scan History & Visual Health Diagnostic Log")}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("analytics.scanHistoryDesc", "Historical photo assessments generated via AI leaf analysis. Includes identified conditions, confidence levels, and symptom profiles.")}
            </p>
          </div>
          <ProvenanceBadge source="DEMO AI ASSESSMENT" size="sm" />
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <ScanLine className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">{t("dashboard.noScansYet", "No Crop Scans Recorded Yet")}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t("dashboard.noScansDesc", "Scan a crop leaf or choose from the agronomy demo library in the Crop Scanner to record diagnostic health assessments and monitor disease progression over time.")}
            </p>
            <button
              onClick={() => setActiveTab("Crop Scanner")}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t("scanner.scanButton", "Perform Leaf Scan")}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">{t("common.date", "Date & Time")}</th>
                    <th className="py-2.5 px-3">{t("crops.cropType", "Crop / Variety")}</th>
                    <th className="py-2.5 px-3">{t("scanner.diagnosisResult", "Diagnostic Condition")}</th>
                    <th className="py-2.5 px-3">{t("scanner.pathogenType", "Pathogen")}</th>
                    <th className="py-2.5 px-3">{t("scanner.severityLevel", "Severity")}</th>
                    <th className="py-2.5 px-3">{t("scanner.confidence", "Model Confidence")}</th>
                    <th className="py-2.5 px-3 text-right">{t("common.details", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanHistory.map((scan) => {
                    const isSevere = scan.severity === "Severe";
                    const isModerate = scan.severity === "Moderate";
                    const dateFormatted = new Date(scan.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {scan.cropType}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {scan.possibleCondition || scan.diagnosis}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
                            {scan.pathogenType || "Physiological"}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isSevere
                                ? "bg-rose-100 text-rose-800"
                                : isModerate
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {scan.severity || "Nominal"}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  scan.confidence >= 80
                                    ? "bg-emerald-500"
                                    : scan.confidence >= 60
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${scan.confidence}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-700 font-semibold">{scan.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedScanId(selectedScanId === scan.id ? null : scan.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{selectedScanId === scan.id ? t("common.close", "Hide Details") : t("common.view", "View")}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Scan Accordion / Detail Card */}
            {selectedScan && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {t("scanner.diagnosisResult", "Scan Inspection")}: {selectedScan.cropType}
                    </span>
                    <ProvenanceBadge source="DEMO AI ASSESSMENT" size="sm" />
                  </div>
                  <button
                    onClick={() => setSelectedScanId(null)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    {t("common.close", "Close")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                      {t("scanner.symptomsObserved", "Identified Symptoms")}
                    </span>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {(selectedScan.visibleSymptoms || selectedScan.symptoms || ["Chlorotic lesions detected"]).map((sym, idx) => (
                        <li key={idx}>{sym}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                      {t("scanner.treatmentPlan", "Recommended Agronomic Action")}
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedScan.recommendedNextSteps?.[0] || "Prune lower infected foliage and apply protective copper or bio-fungicide treatment."}
                    </p>
                    {selectedScan.limitations && (
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        Limitations: {selectedScan.limitations}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: CROP HEALTH TREND & SOIL TEXTURE COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Health Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t("analytics.chartHealthDistribution", "Crop Health Status Breakdown")}</h2>
              <p className="text-xs text-slate-500">{t("crops.cropHealth", "Vigor classification across registered fields")}</p>
            </div>
            <ProvenanceBadge source="USER-PROVIDED DATA" size="sm" />
          </div>

          {crops.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <Sprout className="w-8 h-8 mb-2 opacity-50" />
              <span>{t("crops.noCropsYet", "No crops registered yet.")}</span>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={healthDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} ${t("dashboard.fields", "Fields")}`, t("common.all", "Count")]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]}>
                    {healthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Soil Composition Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t("analytics.chartSoilMatrix", "Soil Texture Allocation")} ({farm.areaUnit})</h2>
              <p className="text-xs text-slate-500">{t("crops.soilTexture", "Acreage composition across soil physical textures")}</p>
            </div>
            <ProvenanceBadge source="USER-PROVIDED DATA" size="sm" />
          </div>

          {soilData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span>{t("analytics.noDataYet", "No soil data available.")}</span>
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={soilData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {soilData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} ${farm.areaUnit}`, t("crops.totalAcreage", "Area")]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PATHOGEN DISEASE RISK TREND */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">{t("analytics.chartPathogenThreat", "Pathogen Exposure & Microclimate Disease Risk Index")}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("disease.subtitle", "Calculated using continuous relative humidity, ambient temperature, leaf wetness duration, and susceptible crop species match.")}
            </p>
          </div>
          <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diseaseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [`${val}% ${t("disease.risk", "Risk")} (${item.payload.level} Severity)`, item.payload.fullName]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="risk" name="Risk Index (%)" radius={[4, 4, 0, 0]}>
                {diseaseChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.risk >= 70 ? "#e11d48" : entry.risk >= 45 ? "#f59e0b" : "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 4: IRRIGATION HISTORY & MOISTURE BALANCE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-900">{t("irrigation.soilMoistureStatus", "Irrigation History & Root-Zone Moisture Balance")}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("irrigation.subtitle", "Historical water application log combined with FAO-56 Penman-Monteith soil moisture depletion modeling.")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProvenanceBadge source="USER-PROVIDED DATA" size="sm" />
            <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
          </div>
        </div>

        {/* Moisture Depletion Chart */}
        {irrigationBalanceData.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t("irrigation.depletionLevel", "Estimated Root-Zone Moisture (%) vs Depletion Trigger (50%)")}
            </span>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={irrigationBalanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="crop" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [`${val}% Estimated Moisture`, item.payload.fullName]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="moisture" name="Soil Moisture (%)" radius={[4, 4, 0, 0]}>
                    {irrigationBalanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.moisture < 40 ? "#e11d48" : entry.moisture < 55 ? "#f59e0b" : "#06b6d4"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Irrigation History Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("irrigation.irrigationLogHistory", "Irrigation Application Log")} ({irrigationRecords.length} {t("common.details", "Entries")})
            </h3>
            <button
              onClick={() => setActiveTab("Irrigation Advisor")}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>{t("irrigation.scheduleWatering", "Record Irrigation in Advisor")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {irrigationRecords.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              {t("irrigation.noIrrigationLogs", "No irrigation events logged yet. Log water applications in the Irrigation Advisor to maintain soil depletion balance history.")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">{t("common.date", "Date")}</th>
                    <th className="py-2.5 px-3">{t("crops.cropType", "Crop Name")}</th>
                    <th className="py-2.5 px-3">{t("crops.fieldCard", "Field Parcel")}</th>
                    <th className="py-2.5 px-3">{t("irrigation.amountMm", "Depth (mm)")}</th>
                    <th className="py-2.5 px-3">{t("irrigation.waterApplied", "Volume")}</th>
                    <th className="py-2.5 px-3">{t("common.details", "Operation Notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {irrigationRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{rec.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{rec.cropName}</td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{rec.fieldName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">{rec.depthMm} mm</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {rec.volumeGallons ? `${rec.volumeGallons.toLocaleString()} gal` : `${rec.volumeLiters?.toLocaleString()} L`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{rec.notes || "Standard scheduled cycle"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: WEATHER TRENDS & EVAPOTRANSPIRATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900">{t("weather.forecast7Day", "7-Day Meteorological Trends & Evapotranspiration")}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("weather.subtitle", "Live temperature range, precipitation sum, and reference evapotranspiration (ET0) from Open-Meteo telemetry for")} {farm.location}.
            </p>
          </div>
          <ProvenanceBadge source="LIVE WEATHER" size="sm" />
        </div>

        {weatherTrendsData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
            <RefreshCw className="w-8 h-8 mb-2 animate-spin text-emerald-600" />
            <span>{t("common.loading", "Fetching live weather trends from Open-Meteo API...")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature Range Trend */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {t("weather.currentTemp", "7-Day Temperature Range")} (°C)
              </span>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weatherTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${formatTemp(Number(val))}`, name === "maxTemp" ? "Max Temp" : "Min Temp"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="maxTemp" name="Max Temp" stroke="#f59e0b" fill="#fef3c7" fillOpacity={0.5} strokeWidth={2} />
                    <Area type="monotone" dataKey="minTemp" name="Min Temp" stroke="#0284c7" fill="#e0f2fe" fillOpacity={0.5} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Precipitation & ET0 Trend */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {t("weather.precipitation", "Precipitation (mm)")} vs {t("weather.et0Rate", "Evapotranspiration ET0 (mm/day)")}
              </span>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weatherTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} mm`, name === "rain" ? t("weather.precipitation", "Precipitation") : "Evapotranspiration (ET0)"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="rain" name="Rain (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="et0" name="ET0 (mm)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
