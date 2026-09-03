import React, { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  Droplets,
  Calendar,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Calculator,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const IrrigationAdvisor: React.FC = () => {
  const {
    farm,
    crops,
    weather,
    irrigationAdvice,
    recordIrrigation,
    recalculateAgronomy,
    formatWaterVolume,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [selectedCropId, setSelectedCropId] = useState<string>(crops[0]?.id || "");
  const [calculatorEfficiency, setCalculatorEfficiency] = useState<number>(85); // 85% drip efficiency

  const selectedAdvice =
    irrigationAdvice.find((a) => a.cropId === selectedCropId) || irrigationAdvice[0];

  // Prepare 7-day soil water depletion vs forecasted rain
  const balanceChartData = (weather?.daily || []).map((day, idx) => {
    const et0 = day.et0 || 4.2;
    const cropWaterDemand = Math.round(et0 * 0.85 * 10) / 10;
    const rain = day.precipitationSum || 0;
    const netDeficit = Math.max(0, Math.round((cropWaterDemand - rain) * 10) / 10);

    return {
      date: idx === 0 ? t("common.today", "Today") : idx === 1 ? t("weather.tomorrow", "Tomorrow") : new Date(day.date).toLocaleDateString([], { weekday: "short" }),
      evapotranspiration: cropWaterDemand,
      rain: rain,
      netDeficit: netDeficit,
    };
  });

  const totalWaterRequiredGallons = irrigationAdvice.reduce(
    (sum, a) => sum + (a.recommendedAction.includes("Irrigate") ? a.recommendedVolumeGallons : 0),
    0
  );

  const totalWaterSavedRain = irrigationAdvice.reduce((sum, a) => {
    if (a.recommendedAction.includes("Delay")) {
      return sum + a.recommendedVolumeGallons;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("irrigation.title", "Software-Only Irrigation Advisor")}
              </h1>
              <ProvenanceBadge source="ESTIMATED RECOMMENDATION" size="sm" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("irrigation.subtitle", "Calculated via FAO-56 Penman-Monteith water balance using soil texture, crop Kc coefficient, and live Open-Meteo evapotranspiration data. Zero physical soil probes required.")}
          </p>
        </div>

        <button
          onClick={recalculateAgronomy}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("irrigation.recalculate", "Recalculate Balance")}</span>
        </button>
      </div>

      {/* SUMMARY STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("irrigation.et0Demand", "Today's Evapotranspiration (ET₀)")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">
              {weather?.current.et0 || "4.2"} mm/day
            </span>
            <span className="text-xs font-medium text-cyan-700">{t("irrigation.atmosphericDemand", "Atmospheric Demand")}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {farm.name} {t("irrigation.referenceCropTranspiration", "reference crop transpiration rate")}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("irrigation.immediateVolume", "Immediate Irrigation Volume")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-cyan-700">
              {formatWaterVolume(
                irrigationAdvice.reduce(
                  (sum, a) =>
                    sum +
                    (a.recommendedAction.includes("Irrigate") ? a.recommendedVolumeLiters : 0),
                  0
                )
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("irrigation.targetVolumePending", "Target volume for pending fields")}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("irrigation.rainfallOffset", "Rainfall Conservation Offset")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700">
              {weather?.daily
                .slice(0, 3)
                .reduce((s, d) => s + (d.precipitationSum || 0), 0)
                .toFixed(1)}{" "}
              mm {t("weather.rain", "Rain")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("irrigation.rainfallSavingDesc", "3-day forecasted rainfall saving irrigation cycles")}
          </p>
        </div>
      </div>

      {/* PER CROP IRRIGATION STATUS CARDS */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {t("irrigation.fieldByField", "Field-by-Field Soil Water Status")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {irrigationAdvice.map((advice) => {
            const isUrgent = advice.recommendedAction === "Irrigate Now";
            const isSoon = advice.recommendedAction === "Irrigate Soon";
            const isRainDelay = advice.recommendedAction.includes("Delay");

            return (
              <div
                key={advice.cropId}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all space-y-4 flex flex-col justify-between ${
                  isUrgent
                    ? "border-rose-300 bg-rose-50/10"
                    : isSoon
                    ? "border-amber-300 bg-amber-50/10"
                    : isRainDelay
                    ? "border-emerald-300 bg-emerald-50/10"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Top line */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {advice.cropName}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isUrgent
                              ? "bg-rose-100 text-rose-800"
                              : isSoon
                              ? "bg-amber-100 text-amber-800"
                              : isRainDelay
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {advice.recommendedAction}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {t("crops.fieldName", "Field")}: <strong className="text-slate-700">{advice.fieldName}</strong> ({advice.fieldSize} {farm.areaUnit}) • {advice.soilType}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        {t("irrigation.estimatedMoisture", "Estimated Moisture")}
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {advice.soilMoistureEstimatePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Stress meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{t("irrigation.rootZoneDepletion", "Soil Root-Zone Depletion")}</span>
                      <span className="font-mono">{advice.waterStressIndex}% {t("irrigation.stress", "Stress")}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          advice.waterStressIndex > 75
                            ? "bg-rose-500"
                            : advice.waterStressIndex > 45
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${advice.waterStressIndex}%` }}
                      />
                    </div>
                  </div>

                  {/* Water Volume Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        {t("irrigation.recommendedDepth", "Recommended Depth")}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {advice.recommendedVolumeMm} mm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        {t("irrigation.totalVolume", "Total Water Volume")}
                      </span>
                      <span className="font-bold text-cyan-800 text-sm">
                        {formatWaterVolume(advice.recommendedVolumeLiters)}
                      </span>
                    </div>
                  </div>

                  {/* Agronomic Reasoning */}
                  <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                    <strong>{t("irrigation.rationale", "Agronomic Rationale")}:</strong> {advice.reasoning}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {t("irrigation.nextCycle", "Next cycle")}: <strong className="text-slate-800">{advice.nextIrrigationDate}</strong>
                  </span>

                  <button
                    onClick={() => recordIrrigation(advice.cropId)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("irrigation.logWatered", "Log Irrigated")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-DAY EVAPOTRANSPIRATION VS RAINFALL CHART */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("irrigation.chartTitle", "7-Day Crop Water Demand vs. Natural Rainfall")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("irrigation.chartSubtitle", "Daily evapotranspiration losses (ETc) offset by forecasted precipitation (mm)")}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-sm bg-slate-400" />
              <span>{t("irrigation.cropDemand", "Crop Demand (ETc)")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-700">
              <span className="w-3 h-3 rounded-sm bg-cyan-400" />
              <span>{t("irrigation.rainOffset", "Rainfall Offset (mm)")}</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="evapotranspiration" name={t("irrigation.cropDemand", "Crop Water Demand (mm)")} fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rain" name={t("irrigation.rainOffset", "Forecasted Rain (mm)")} fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
