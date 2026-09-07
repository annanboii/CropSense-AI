import React, { useState } from "react";
import { CropRecord } from "../../types";
import { useFarm } from "../../context/FarmContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { getCropAgronomicProfile } from "../../data/cropProfiles";
import {
  Sprout,
  X,
  Calendar,
  Layers,
  Droplets,
  Thermometer,
  ShieldAlert,
  Edit3,
  Trash2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";

interface CropDetailModalProps {
  crop: CropRecord;
  onClose: () => void;
  onEdit: (crop: CropRecord) => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  onClose,
  onEdit,
}) => {
  const {
    farm,
    formatArea,
    recordIrrigation,
    deleteCrop,
    openScannerWithCrop,
    weather,
    formatTemp,
    scanHistory,
  } = useFarm();
  const { t, translateText, isRTL } = useTranslation();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [justWatered, setJustWatered] = useState(false);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const agronomicProfile = getCropAgronomicProfile(crop.cropName);

  // Filter scans related to this crop
  const cropScans = scanHistory.filter(
    (s) =>
      (s.cropId && s.cropId === crop.id) ||
      (s.cropType && crop?.cropName && s.cropType.toLowerCase().includes(crop.cropName.toLowerCase())) ||
      (crop?.cropName && s.cropType && crop.cropName.toLowerCase().includes(s.cropType.toLowerCase()))
  );

  // Compute days since planting
  const plantingTime = new Date(crop.plantingDate).getTime();
  const now = Date.now();
  const daysSincePlanting = isNaN(plantingTime)
    ? 0
    : Math.max(0, Math.floor((now - plantingTime) / (1000 * 60 * 60 * 24)));

  // Compute days since last irrigation
  const lastIrrigationTime = new Date(crop.lastIrrigationDate).getTime();
  const daysSinceIrrigation = isNaN(lastIrrigationTime)
    ? 0
    : Math.max(0, Math.floor((now - lastIrrigationTime) / (1000 * 60 * 60 * 24)));

  const handleIrrigateNow = () => {
    recordIrrigation(crop.id);
    setJustWatered(true);
    setTimeout(() => setJustWatered(false), 3000);
  };

  const handleDelete = () => {
    deleteCrop(crop.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {translateText(crop.cropName)}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    crop.healthStatus === "Optimal"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : crop.healthStatus === "Attention"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {translateText(crop.healthStatus)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {translateText(crop.fieldName)} • {crop.fieldSize} {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")} ({translateText(crop.soilType)})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-slate-400">{t("crops.growthStage", "Growth Stage")}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{translateText(crop.growthStage)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {isRTL ? `زمین میں ${daysSincePlanting} دن` : `Day ${daysSincePlanting} in ground`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-slate-400">{t("crops.lastIrrigation", "Last Irrigated")}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {daysSinceIrrigation === 0 ? t("common.today", "Today") : isRTL ? `${daysSinceIrrigation} دن پہلے` : `${daysSinceIrrigation}d ago`}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">{crop.lastIrrigationDate}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-slate-400">{t("crops.plantingDate", "Planted On")}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{crop.plantingDate}</p>
              <p className="text-[10px] text-slate-500 mt-1">{translateText(crop.soilType)} {t("crops.soilType", "soil")}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] uppercase font-semibold text-slate-400">{t("crops.targetYield", "Target Yield")}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{crop.targetYield || t("crops.standardYield", "Standard")}</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-medium">{t("crops.yieldTracked", "Yield Tracked")}</p>
            </div>
          </div>

          {/* Just Watered Banner */}
          {justWatered && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t("crops.waterRecordedMsg", "Irrigation cycle recorded for today! Soil moisture balance updated.")}</span>
            </div>
          )}

          {/* Agronomic Profile (If Recognized Crop Option) */}
          {agronomicProfile ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-xs text-emerald-900 uppercase tracking-wider">
                    {t("crops.agronomicIntelligence", "Agronomic Intelligence")}: {translateText(agronomicProfile.name)} ({agronomicProfile.scientificName})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-medium">
                  {translateText(agronomicProfile.category)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block">{t("crops.optimalTemp", "Optimal Temperature")}</span>
                  <span className="font-semibold text-slate-800">
                    {agronomicProfile.optimalTempRange.min}°C – {agronomicProfile.optimalTempRange.max}°C
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block">{t("crops.dailyWaterDemand", "Daily Water Demand")}</span>
                  <span className="font-semibold text-slate-800">
                    {agronomicProfile.waterRequirementMmPerDay.min} – {agronomicProfile.waterRequirementMmPerDay.max} mm/{t("crops.day", "day")}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block">{t("crops.soilPhTarget", "Soil pH Target")}</span>
                  <span className="font-semibold text-slate-800">
                    pH {agronomicProfile.soilPhRange.min} – {agronomicProfile.soilPhRange.max}
                  </span>
                </div>
              </div>

              {/* Major Disease Threats */}
              <div className="pt-2 border-t border-emerald-100">
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">
                  {t("crops.keyPathogenVulnerabilities", "Key Pathogen Vulnerabilities")}:
                </p>
                <div className="space-y-1.5">
                  {agronomicProfile.commonDiseases.map((d, i) => (
                    <div key={i} className="text-[11px] bg-white p-2 rounded border border-emerald-100">
                      <span className="font-semibold text-slate-900">{translateText(d.name)}</span>{" "}
                      <span className="text-slate-500">({translateText(d.type)})</span>
                      <p className="text-slate-600 mt-0.5">{translateText(d.riskTrigger)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Harvesting Signs */}
              <div className="pt-2 border-t border-emerald-100">
                <p className="text-[11px] font-semibold text-slate-700 mb-1">
                  {t("crops.harvestIndicators", "Harvest Readiness Indicators")}:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  {agronomicProfile.harvestingSigns.map((sign, i) => (
                    <li key={i}>{translateText(sign)}</li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-emerald-800 italic bg-emerald-100/50 p-2.5 rounded-lg border border-emerald-200/60">
                💡 <span className="font-semibold">{t("crops.agronomicAdvisory", "Agronomic Advisory")}:</span> {translateText(agronomicProfile.tips)}
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">{t("crops.customVariety", "Custom Crop Variety")}</p>
              <p>
                {t("crops.customVarietyDesc", "Standard agronomic models for this parcel are calibrated using soil texture and local ET₀ weather data.")}
              </p>
            </div>
          )}

          {/* Crop Diagnostic Scan History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("crops.scanHistoryTitle", "Diagnostic Scan History")} ({cropScans.length})</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openScannerWithCrop(crop.cropName, crop.growthStage);
                }}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
              >
                <span>+ {t("crops.newScan", "New Scan")}</span>
              </button>
            </div>

            {cropScans.length === 0 ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center space-y-1">
                <p className="font-medium text-slate-700">{t("crops.noScansRecorded", "No scans recorded for this crop yet.")}</p>
                <p className="text-[11px]">{t("crops.useScannerHint", "Use the Crop Scanner to assess foliage for potential disease symptoms.")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cropScans.map((scan) => {
                  const isExpanded = expandedScanId === scan.id;
                  return (
                    <div
                      key={scan.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              scan.severity === "Healthy"
                                ? "bg-emerald-100 text-emerald-800"
                                : scan.severity === "Mild"
                                ? "bg-blue-100 text-blue-800"
                                : scan.severity === "Moderate"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {translateText(scan.severity)}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {translateText(scan.possibleCondition || scan.diagnosis)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(scan.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="text-slate-500">
                          {t("crops.confidence", "Confidence")}: <strong className="text-slate-700">{scan.confidence}%</strong>
                        </span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-medium">
                          {t("crops.preliminaryAssessment", "Demo AI — preliminary assessment")}
                        </span>
                      </div>

                      {scan.visibleSymptoms && scan.visibleSymptoms.length > 0 && (
                        <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                          <p className="font-medium text-slate-700 mb-0.5">{t("crops.visibleSymptoms", "Visible Symptoms")}:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {scan.visibleSymptoms.slice(0, isExpanded ? undefined : 2).map((sym, i) => (
                              <li key={i}>{translateText(sym)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scan.recommendedNextSteps && scan.recommendedNextSteps.length > 0 && isExpanded && (
                        <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1 animate-in fade-in">
                          <p className="font-medium text-slate-700">{t("crops.recommendedNextSteps", "Recommended Next Steps")}:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {scan.recommendedNextSteps.map((step, i) => (
                              <li key={i}>{translateText(step)}</li>
                            ))}
                          </ul>
                          {scan.limitations && (
                            <p className="text-[10px] text-slate-500 italic pt-1">
                              <strong>{t("crops.limitations", "Limitations")}:</strong> {translateText(scan.limitations)}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedScanId(isExpanded ? null : scan.id)}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline block pt-0.5"
                      >
                        {isExpanded ? t("crops.showLess", "Show Less") : t("crops.viewAssessmentDetails", "View Assessment Details & Next Steps")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes Section */}
          {crop.notes && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t("crops.notesTitle", "Farmer Notes & Management History")}
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                {translateText(crop.notes)}
              </div>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {confirmDelete && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{t("crops.removeCropConfirmTitle", "Are you sure you want to remove this crop?")}</span>
              </div>
              <p className="text-xs text-rose-700">
                {t("crops.removeCropConfirmDesc", "This will delete this parcel and its associated agronomic tracking records from active fields.")}
              </p>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  {t("crops.confirmDelete", "Confirm Delete")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleIrrigateNow}
              className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{t("crops.logWaterToday", "Log Water Today")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                openScannerWithCrop(crop.cropName, crop.growthStage);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>{t("crops.scanLeafTissue", "Scan Leaf Tissue")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={t("crops.deleteCrop", "Delete Crop")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(crop);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t("crops.editCrop", "Edit Crop")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
