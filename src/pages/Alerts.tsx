import React, { useState, useMemo } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { FarmAlert } from "../types";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Droplets,
  ShieldAlert,
  Calendar,
  X,
  Filter,
  Check,
  ArrowRight,
  Sparkles,
  Search,
  ScanLine,
  Activity,
  Lightbulb,
  RefreshCw,
  Info,
} from "lucide-react";

export const Alerts: React.FC = () => {
  const {
    alerts,
    dismissAlert,
    markAlertRead,
    markAllAlertsRead,
    setActiveTab,
    diseaseRisks,
    irrigationAdvice,
    weather,
    scanHistory,
    crops,
    isLoadingWeather,
    weatherError,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Synthesize dynamic live alerts from active data models so the farmer always has fresh alerts
  const allAlerts = useMemo<FarmAlert[]>(() => {
    const list: FarmAlert[] = [...alerts];

    // 1. Dynamic trigger from elevated disease risks if not already present
    diseaseRisks.forEach((risk) => {
      if ((risk.riskScore >= 60 || risk.riskLevel === "High" || risk.riskLevel === "Severe") && crops.length > 0) {
        const id = `dyn-disease-${risk.id}`;
        if (!list.some((a) => a.id === id || a.title.includes(risk.diseaseName))) {
          list.push({
            id,
            category: "Disease",
            type: "disease",
            severity: risk.riskLevel === "Severe" || risk.riskScore >= 75 ? "Critical" : "Warning",
            title: `Elevated Disease Risk: ${risk.diseaseName}`,
            explanation: `Microclimate analysis indicates high favorability (${risk.riskScore}% risk index). ${risk.currentTrigger} ${risk.favorableConditions}`,
            date: "Live Microclimate",
            recommendedAction: risk.recommendedAction,
            provenance: "ESTIMATED RECOMMENDATION",
            actionTab: "Disease Risk",
            actionLabel: "Inspect Pathogen Index",
            read: false,
            dismissed: false,
          });
        }
      }
    });

    // 2. Dynamic trigger from irrigation advice if urgent
    irrigationAdvice.forEach((advice) => {
      if ((advice.recommendedAction === "Irrigate Now" || advice.soilMoistureEstimatePercent < 45)) {
        const id = `dyn-irrig-${advice.cropId}`;
        if (!list.some((a) => a.id === id || (a.category === "Irrigation" && a.cropId === advice.cropId))) {
          list.push({
            id,
            category: "Irrigation",
            type: "irrigation",
            severity: advice.recommendedAction === "Irrigate Now" ? "Critical" : "Warning",
            title: `Irrigation Required: ${advice.cropName} (${advice.fieldName})`,
            explanation: `Root-zone soil moisture is depleted to ~${advice.soilMoistureEstimatePercent}%. ${advice.reasoning} Days since last watered: ${advice.daysSinceIrrigated}.`,
            date: `Scheduled for ${advice.nextIrrigationDate || "Today"}`,
            recommendedAction: `Apply ${advice.recommendedVolumeMm} mm (${advice.recommendedVolumeGallons.toLocaleString()} gal) across ${advice.fieldSize} acre parcel to restore soil holding capacity.`,
            provenance: "ESTIMATED RECOMMENDATION",
            cropId: advice.cropId,
            cropName: advice.cropName,
            actionTab: "Irrigation Advisor",
            actionLabel: "Open Irrigation Plan",
            read: false,
            dismissed: false,
          });
        }
      }
    });

    // 3. Dynamic trigger from significant rainfall forecast
    if (weather?.daily) {
      const next3DaysRain = weather.daily.slice(0, 3).reduce((sum, d) => sum + (d.precipitationSum || 0), 0);
      const maxRainProb = Math.max(...weather.daily.slice(0, 3).map((d) => d.precipitationProbabilityMax || 0));
      if (next3DaysRain >= 8 || maxRainProb >= 70) {
        const id = "dyn-weather-heavy-rain";
        if (!list.some((a) => a.id === id || a.title.includes("Rain"))) {
          list.push({
            id,
            category: "Weather",
            type: "weather",
            severity: next3DaysRain >= 20 ? "Critical" : "Warning",
            title: `Significant Rainfall Forecast: ${next3DaysRain.toFixed(1)} mm Expected`,
            explanation: `Upcoming 72-hour forecast predicts elevated precipitation with up to ${maxRainProb}% rain probability. Elevated soil saturation and runoff potential.`,
            date: "Next 3 Days",
            recommendedAction: "Pause automated irrigation cycles, check drainage ditches, and delay scheduled chemical applications to prevent nutrient runoff.",
            provenance: "LIVE WEATHER",
            actionTab: "Weather",
            actionLabel: "View Radar & Forecast",
            read: false,
            dismissed: false,
          });
        }
      }
    }

    // 4 & 5. Crop scan concerns and low-confidence scans from scanHistory
    scanHistory.forEach((scan) => {
      const scanDate = new Date(scan.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (scan.severity === "Severe" || scan.severity === "Moderate" || (scan.diagnosis && !scan.diagnosis.toLowerCase().includes("healthy"))) {
        const id = `dyn-scan-concern-${scan.id}`;
        if (!list.some((a) => a.id === id || a.id === `alert-${scan.id}`)) {
          list.push({
            id,
            category: "Scan",
            type: "scan",
            severity: scan.severity === "Severe" ? "Critical" : "Warning",
            title: `Crop Scan Concern: ${scan.possibleCondition || scan.diagnosis}`,
            explanation: `Visual diagnostic on ${scan.cropType} identified: ${scan.visibleSymptoms?.join(", ") || scan.symptoms?.join(", ") || "pathogen lesion patterns"}. ${scan.stageAssessment || ""}`,
            date: scanDate,
            recommendedAction: scan.recommendedNextSteps?.[0] || "Prune infected tissue and isolate area to prevent cross-canopy spore transmission.",
            provenance: "DEMO AI ASSESSMENT",
            cropId: scan.cropId,
            cropName: scan.cropType,
            actionTab: "Crop Scanner",
            actionLabel: "Review Diagnosis",
            read: false,
            dismissed: false,
          });
        }
      }

      if (scan.confidence < 75) {
        const id = `dyn-scan-lowconf-${scan.id}`;
        if (!list.some((a) => a.id === id)) {
          list.push({
            id,
            category: "Scan",
            type: "scan",
            severity: "Info",
            title: `Low-Confidence Diagnosis: ${scan.cropType} (${scan.confidence}%)`,
            explanation: `Visual symptoms are ambiguous or overlap with other physiological stressors (${scan.possibleCondition}). Model confidence is below 75%. Limitations: ${scan.limitations || "2D image resolution constraints"}.`,
            date: scanDate,
            recommendedAction: "Perform physical leaf inspection, test soil pH/EC, or submit tissue sample to local university extension before applying treatment.",
            provenance: "DEMO AI ASSESSMENT",
            cropId: scan.cropId,
            cropName: scan.cropType,
            actionTab: "Crop Scanner",
            actionLabel: "Re-scan Foliage",
            read: false,
            dismissed: false,
          });
        }
      }
    });

    return list.filter((a) => !a.dismissed);
  }, [alerts, diseaseRisks, irrigationAdvice, weather, scanHistory, crops]);

  // Filtering
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      const matchesCategory = filterCategory === "all" || a.category === filterCategory;
      const normalizedSeverity = (a.severity || "").toLowerCase();
      let matchesSeverity = true;
      if (filterSeverity === "Critical") {
        matchesSeverity = normalizedSeverity === "critical" || normalizedSeverity === "high";
      } else if (filterSeverity === "Warning") {
        matchesSeverity = normalizedSeverity === "warning" || normalizedSeverity === "medium";
      } else if (filterSeverity === "Info") {
        matchesSeverity = normalizedSeverity === "info" || normalizedSeverity === "low";
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === "" ||
        ((a.title || "").toLowerCase().includes(q)) ||
        (a.explanation && a.explanation.toLowerCase().includes(q)) ||
        (a.message && a.message.toLowerCase().includes(q)) ||
        (a.recommendedAction && a.recommendedAction.toLowerCase().includes(q));

      return matchesCategory && matchesSeverity && matchesSearch;
    });
  }, [allAlerts, filterCategory, filterSeverity, searchQuery]);

  const unreadCount = allAlerts.filter((a) => !a.read).length;

  const handleActionClick = (alert: FarmAlert) => {
    markAlertRead(alert.id);
    if (alert.actionTab) {
      setActiveTab(alert.actionTab);
    } else if (alert.category === "Irrigation") {
      setActiveTab("Irrigation Advisor");
    } else if (alert.category === "Disease") {
      setActiveTab("Disease Risk");
    } else if (alert.category === "Weather") {
      setActiveTab("Weather");
    } else if (alert.category === "Scan") {
      setActiveTab("Crop Scanner");
    }
  };

  const getSeverityBadge = (sev: string) => {
    const s = (sev || "").toLowerCase();
    if (s === "critical" || s === "high") {
      return {
        label: t("common.critical", "Critical"),
        bg: "bg-rose-50 border-rose-200 text-rose-800",
        dot: "bg-rose-500",
        iconBg: "bg-rose-100 text-rose-700",
        borderAccent: "border-l-rose-500",
      };
    }
    if (s === "warning" || s === "medium") {
      return {
        label: t("common.warning", "Warning"),
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        dot: "bg-amber-500",
        iconBg: "bg-amber-100 text-amber-700",
        borderAccent: "border-l-amber-500",
      };
    }
    return {
      label: t("common.info", "Info"),
      bg: "bg-sky-50 border-sky-200 text-sky-800",
      dot: "bg-sky-500",
      iconBg: "bg-sky-100 text-sky-700",
      borderAccent: "border-l-sky-500",
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Irrigation":
        return <Droplets className="w-5 h-5" />;
      case "Disease":
        return <ShieldAlert className="w-5 h-5" />;
      case "Weather":
        return <CloudRain className="w-5 h-5" />;
      case "Scan":
        return <ScanLine className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" role="region" aria-label="Farm Alerts & Advisories">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t("alerts.title", "Farm Alerts & Agronomic Warnings")}
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                    {unreadCount} {t("alerts.unread", "Unread")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("alerts.subtitle", "Automated agronomic advisories generated from live Open-Meteo microclimate telemetry, root-zone moisture models, and AI diagnostic scans.")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={markAllAlertsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
              aria-label="Mark all alerts as read"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t("alerts.markAllAsRead", "Mark All as Read")} ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoadingWeather && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>{t("alerts.loadingMeteo", "Synchronizing latest microclimate telemetry with Open-Meteo API...")}</span>
        </div>
      )}

      {/* Error state indicator */}
      {weatherError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{t("alerts.weatherWarning", "Weather Telemetry Synchronization Warning")}</p>
            <p className="mt-0.5 text-rose-700">{weatherError}</p>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("alerts.searchPlaceholder", "Search alerts by crop, disease, or recommendation...")}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            aria-label="Search alerts"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t("common.filter", "Category")}:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-emerald-500"
            aria-label="Filter by category"
          >
            <option value="all">{t("alerts.tabAll", "All Categories")} ({allAlerts.length})</option>
            <option value="Disease">{t("alerts.tabDisease", "Disease Risk")} ({allAlerts.filter((a) => a.category === "Disease").length})</option>
            <option value="Irrigation">{t("alerts.tabIrrigation", "Irrigation")} ({allAlerts.filter((a) => a.category === "Irrigation").length})</option>
            <option value="Weather">{t("alerts.tabWeather", "Weather")} ({allAlerts.filter((a) => a.category === "Weather").length})</option>
            <option value="Scan">{t("alerts.tabScans", "Crop Scans")} ({allAlerts.filter((a) => a.category === "Scan").length})</option>
            <option value="Operation">{t("alerts.tabOperations", "Operations")} ({allAlerts.filter((a) => a.category === "Operation").length})</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-emerald-500"
            aria-label="Filter by severity"
          >
            <option value="all">{t("alerts.allSeverities", "All Severities")}</option>
            <option value="Critical">{t("common.critical", "Critical")}</option>
            <option value="Warning">{t("common.warning", "Warning")}</option>
            <option value="Info">{t("common.info", "Info")}</option>
          </select>

          {(filterCategory !== "all" || filterSeverity !== "all" || searchQuery !== "") && (
            <button
              onClick={() => {
                setFilterCategory("all");
                setFilterSeverity("all");
                setSearchQuery("");
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-1 underline shrink-0"
            >
              {t("settings.resetDefaults", "Reset")}
            </button>
          )}
        </div>
      </div>

      {/* ALERTS FEED */}
      <div className="space-y-3.5" role="list" aria-label="Alerts list">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">{t("alerts.noAlertsFound", "No Active Alerts in Current Filter")}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {t("alerts.allCaughtUp", "All field microclimate metrics, disease risk thresholds, and root-zone water balances are within optimal agronomic parameters.")}
            </p>
            {(filterCategory !== "all" || filterSeverity !== "all" || searchQuery !== "") && (
              <button
                onClick={() => {
                  setFilterCategory("all");
                  setFilterSeverity("all");
                  setSearchQuery("");
                }}
                className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                {t("common.filter", "Clear Filters")}
              </button>
            )}
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const explanationText = alert.explanation || alert.message || "";
            const displayDate = alert.date || alert.timestamp || t("common.active", "Active");

            return (
              <div
                key={alert.id}
                role="listitem"
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all border-l-4 ${badge.borderAccent} ${
                  !alert.read ? "bg-slate-50/40" : ""
                } border-slate-200 hover:border-slate-300`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Icon + Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${badge.iconBg}`}
                      aria-hidden="true"
                    >
                      {getCategoryIcon(alert.category)}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Top row badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {alert.category}
                        </span>

                        {alert.provenance && <ProvenanceBadge source={alert.provenance} size="sm" />}

                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 ml-auto">
                          <Calendar className="w-3 h-3" />
                          <span>{displayDate}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h2
                        className={`text-sm md:text-base font-bold ${
                          !alert.read ? "text-slate-950 font-bold" : "text-slate-800 font-semibold"
                        }`}
                      >
                        {alert.title}
                      </h2>

                      {/* Explanation */}
                      {explanationText && (
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <p>{explanationText}</p>
                        </div>
                      )}

                      {/* Recommended Action Callout */}
                      {alert.recommendedAction && (
                        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                              {t("alerts.recommendedAction", "Recommended Agronomic Action:")}
                            </span>
                            <p className="text-slate-700 leading-normal">{alert.recommendedAction}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => handleActionClick(alert)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      aria-label={`Take action: ${alert.actionLabel || t("alerts.viewAction", "View Details")}`}
                    >
                      <span>{alert.actionLabel || t("alerts.viewAction", "View Action")}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>

                    <button
                      onClick={() => dismissAlert(alert.id)}
                      title={t("alerts.dismiss", "Dismiss alert")}
                      aria-label="Dismiss alert"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
