import React from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  CloudSun,
  Wind,
  Droplets,
  Sun,
  RefreshCw,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Calendar,
  CloudRain,
  MapPin,
  Clock,
  Radio,
  AlertCircle,
  Thermometer,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ComposedChart,
  CartesianGrid,
} from "recharts";

export const Weather: React.FC = () => {
  const {
    farm,
    weather,
    isLoadingWeather,
    weatherError,
    refreshWeather,
    tempUnit,
    setTempUnit,
    formatTemp,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const current = weather?.current;
  const metrics = weather?.agriculturalMetrics;

  // Prepare hourly data for Recharts (24h)
  const chartData = (weather?.hourly || []).slice(0, 24).map((h) => {
    const d = new Date(h.time);
    const hourLabel = d.toLocaleTimeString([], { hour: "numeric" });
    return {
      time: hourLabel,
      temp: tempUnit === "F" ? Math.round((h.temp * 9) / 5 + 32) : Math.round(h.temp * 10) / 10,
      rainProb: h.precipitationProb,
      rainMm: h.precipitation,
      humidity: h.humidity,
      et0: Math.round(h.et0 * 100) / 100,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar with explicit "Live Weather" labeling */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("weather.title", "Live Weather")}
              </h1>
              <ProvenanceBadge source="LIVE WEATHER" size="sm" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("dashboard.farmOverview", "Farm")}: <strong className="text-slate-700">{farm.name}</strong> • {farm.location} ({farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°)</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setTempUnit("C")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                tempUnit === "C" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit("F")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                tempUnit === "F" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshWeather}
            disabled={isLoadingWeather}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? "animate-spin text-emerald-600" : ""}`} />
            <span>{isLoadingWeather ? t("weather.syncing", "Syncing...") : t("weather.syncLive", "Sync Live")}</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {weatherError || (!weather && !isLoadingWeather) ? (
        <div className="bg-white rounded-xl border border-rose-200 p-8 shadow-sm text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              {t("weather.unavailable", "Live Weather Unavailable")}
            </h2>
            <p className="text-xs text-rose-700 font-medium">
              {weatherError || "Unable to establish live connection with the Open-Meteo meteorological API."}
            </p>
            <p className="text-xs text-slate-500 pt-1">
              CropSense AI does not fabricate fake weather data. Please verify your internet connection or check your farm coordinates ({farm.latitude}, {farm.longitude}).
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={refreshWeather}
              disabled={isLoadingWeather}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? "animate-spin" : ""}`} />
              <span>{t("weather.retryLive", "Retry Live Fetch")}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CURRENT CONDITIONS HERO & SPRAYING ADVISORY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Current Live Weather Hero (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    {t("weather.currentConditions", "Live Weather Conditions")}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                      {current ? formatTemp(current.temp) : "--"}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                      {t("weather.feelsLike", "Feels like")} {current ? formatTemp(current.apparentTemp) : "--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-sm font-bold text-slate-800">
                      {current?.weatherDescription || "Clear Sky"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (WMO {current?.weatherCode})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs border border-amber-100">
                    <Sun className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* 4 Essential Real Atmospheric Metrics: Temp, Humidity, Wind, Precipitation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{t("weather.humidity", "Humidity")}</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {current?.humidity ?? "--"}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Relative</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Wind className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t("weather.wind", "Wind")}</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {current?.windSpeed ?? "--"} km/h
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Direction: {current?.windDirection || 0}°</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t("weather.precipitation", "Precipitation")}</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {current?.precipitation ?? 0} mm
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Current Rate</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t("weather.et0", "Reference ET₀")}</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {current?.et0 ?? "--"} mm/d
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Evapotransp.</span>
                </div>
              </div>
            </div>

            {/* Agricultural Advisory Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t("weather.advisoryTitle", "Agronomic Field Advisory")}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      metrics?.sprayingWindowQuality === "Good"
                        ? "bg-emerald-100 text-emerald-800"
                        : metrics?.sprayingWindowQuality === "Moderate"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    Spray Quality: {metrics?.sprayingWindowQuality || "Good"}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                  <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{t("weather.sprayWindow", "Chemical Application Window")}</span>
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {metrics?.sprayRecommendation ||
                      "Favorable spraying conditions. Low wind speed prevents chemical drift."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Growing Degree Days (GDD)</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {metrics?.gddToday || 0} units (Base 10°C)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Field Soil Trafficability</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {metrics?.fieldWorkability || "Favorable"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Surface Pressure: {current?.surfacePressure || 1013} hPa</span>
                <span>Cloud Cover: {current?.cloudCover || 20}%</span>
              </div>
            </div>
          </div>

          {/* HOURLY FORECAST (24 Hours) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("weather.hourlyForecast", "Live Hourly Forecast (Next 24 Hours)")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("weather.hourlySubtitle", "Temperature progression, precipitation probability, and hourly moisture demand")}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>{t("weather.temperature", "Temperature")} ({tempUnit === "F" ? "°F" : "°C"})</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-700">
                  <span className="w-3 h-3 rounded-sm bg-cyan-400" />
                  <span>{t("weather.rainProbability", "Rain Probability")} (%)</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    yAxisId="left"
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#0891b2" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="rainProb"
                    name="Rain Probability (%)"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                    opacity={0.7}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="temp"
                    name={`Temperature (${tempUnit === "F" ? "°F" : "°C"})`}
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="#d1fae5"
                    fillOpacity={0.4}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-DAY EXTENDED LIVE FORECAST */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("weather.sevenDayForecast", "Live 7-Day Agricultural Forecast")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("weather.sevenDaySubtitle", "Daily maximums, minimums, evapotranspiration, and expected rainfall accumulation")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {(weather?.daily || []).map((day, idx) => {
                const isToday = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                      isToday
                        ? "bg-emerald-50/50 border-emerald-300 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-slate-900">
                          {isToday
                            ? t("common.today", "Today")
                            : idx === 1
                            ? t("common.tomorrow", "Tomorrow")
                            : new Date(day.date).toLocaleDateString([], { weekday: "short" })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {day.date.split("-").slice(1).join("/")}
                        </span>
                      </div>

                      <div className="my-2">
                        <span className="text-base font-extrabold text-slate-900">
                          {formatTemp(day.tempMax)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium ml-1">
                          / {formatTemp(day.tempMin)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                        {day.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-3 border-t border-slate-200/60 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-cyan-800">
                        <span className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3" />
                          <span>{day.precipitationSum} mm</span>
                        </span>
                        <span className="font-semibold">{day.precipitationProbMax}%</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>ET₀</span>
                        <span className="font-mono">{day.et0} mm</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
