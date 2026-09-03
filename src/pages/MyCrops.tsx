import React, { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { CropRecord, SoilType, GrowthStage, CropHealthStatus } from "../types";
import { CROP_OPTIONS, CROP_PROFILES, getCropAgronomicProfile } from "../data/cropProfiles";
import { CropDetailModal } from "../components/crops/CropDetailModal";
import {
  Sprout,
  Plus,
  Search,
  Calendar,
  Layers,
  Droplets,
  Edit2,
  Trash2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Info,
  ChevronRight,
  ChevronDown,
  Filter,
  BookOpen,
  TrendingUp,
  Sparkles,
  Thermometer,
  ShieldAlert,
  ArrowUpRight,
  Check,
} from "lucide-react";

type CropTab = "parcels" | "encyclopedia" | "stages" | "soil";

export const MyCrops: React.FC = () => {
  const {
    farm,
    crops,
    addCrop,
    updateCrop,
    deleteCrop,
    recordIrrigation,
    openScannerWithCrop,
    formatArea,
    selectedCropForDetail,
    setSelectedCropForDetail,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<CropTab>("parcels");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("All");
  const [filterStage, setFilterStage] = useState<string>("all");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropRecord | null>(null);
  const [cropToDelete, setCropToDelete] = useState<CropRecord | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    cropName: string;
    fieldName: string;
    fieldSize: number;
    soilType: SoilType;
    growthStage: GrowthStage;
    plantingDate: string;
    lastIrrigationDate: string;
    targetYield: string;
    healthStatus: CropHealthStatus;
    notes: string;
  }>({
    cropName: "Tomato",
    fieldName: "",
    fieldSize: 10,
    soilType: farm.primarySoilType || "Loam",
    growthStage: "Vegetative",
    plantingDate: new Date().toISOString().split("T")[0],
    lastIrrigationDate: new Date().toISOString().split("T")[0],
    targetYield: "",
    healthStatus: "Optimal",
    notes: "",
  });

  const handleOpenAddModal = (presetCropName?: string) => {
    setEditingCrop(null);
    setShowAdvancedFields(false);
    setFormData({
      cropName: presetCropName || "Tomato",
      fieldName: "",
      fieldSize: 10,
      soilType: farm.primarySoilType || "Loam",
      growthStage: "Vegetative",
      plantingDate: new Date().toISOString().split("T")[0],
      lastIrrigationDate: new Date().toISOString().split("T")[0],
      targetYield: "",
      healthStatus: "Optimal",
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (crop: CropRecord) => {
    setEditingCrop(crop);
    setShowAdvancedFields(Boolean(crop.targetYield || crop.notes));
    setFormData({
      cropName: crop.cropName,
      fieldName: crop.fieldName,
      fieldSize: crop.fieldSize,
      soilType: crop.soilType,
      growthStage: crop.growthStage,
      plantingDate: crop.plantingDate,
      lastIrrigationDate: crop.lastIrrigationDate,
      targetYield: crop.targetYield || "",
      healthStatus: crop.healthStatus,
      notes: crop.notes || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropName.trim() || !formData.fieldName.trim()) return;

    if (editingCrop) {
      updateCrop(editingCrop.id, formData);
    } else {
      addCrop(formData);
    }
    setIsAddModalOpen(false);
  };

  // Filter crops by search and selected preset chip
  const filteredCrops = crops.filter((crop) => {
    const sTerm = (searchTerm || "").toLowerCase();
    const cName = (crop?.cropName || "").toLowerCase();
    const fName = (crop?.fieldName || "").toLowerCase();
    const matchesSearch =
      cName.includes(sTerm) ||
      fName.includes(sTerm);
    const matchesPreset =
      selectedCropFilter === "All" ||
      cName.includes((selectedCropFilter || "").toLowerCase());
    const matchesStage = filterStage === "all" || crop.growthStage === filterStage;
    return matchesSearch && matchesPreset && matchesStage;
  });

  const totalRegisteredArea = crops.reduce((acc, c) => acc + (c?.fieldSize || 0), 0);

  // Helper to count crops of a certain type
  const getCropCount = (type: string) => {
    const tLower = (type || "").toLowerCase();
    return crops.filter((c) => (c?.cropName || "").toLowerCase().includes(tLower)).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Card: Icon, Title, Acreage Subtitle, and Add Crop Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-emerald-600 flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t("crops.title", "My Crops & Fields")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {crops.length} {crops.length === 1 ? "active crop parcel" : "active crop parcels"} across{" "}
              {totalRegisteredArea.toFixed(1)}{" "}
              {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "acres")}
            </p>
          </div>
        </div>

        <button
          id="add-crop-btn"
          onClick={() => handleOpenAddModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t("crops.addCrop", "Add Crop")}</span>
        </button>
      </div>

      {/* 2. Main Content Card with Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center px-6 pt-5 gap-8 border-b border-slate-100 overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab("parcels")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3.5 border-b-2 transition-colors shrink-0 ${
              activeSubTab === "parcels"
                ? "border-[#059669] text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sprout className={`w-4 h-4 ${activeSubTab === "parcels" ? "text-emerald-600" : "text-slate-400"}`} />
            <span>All Crop Parcels ({crops.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("encyclopedia")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3.5 border-b-2 transition-colors shrink-0 ${
              activeSubTab === "encyclopedia"
                ? "border-[#059669] text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeSubTab === "encyclopedia" ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Crop Encyclopedia ({CROP_OPTIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("stages")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3.5 border-b-2 transition-colors shrink-0 ${
              activeSubTab === "stages"
                ? "border-[#059669] text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeSubTab === "stages" ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Growth Stages</span>
          </button>

          <button
            onClick={() => setActiveSubTab("soil")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold pb-3.5 border-b-2 transition-colors shrink-0 ${
              activeSubTab === "soil"
                ? "border-[#059669] text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className={`w-4 h-4 ${activeSubTab === "soil" ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Soil & Irrigation</span>
          </button>
        </div>

        {/* Tab 1: All Crop Parcels */}
        {activeSubTab === "parcels" && (
          <div className="p-6 space-y-5">
            {/* Header: Presets Label and Search Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>SUPPORTED CROP PRESETS</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  placeholder="Search crops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* Presets Chips Filter / Quick Add */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                onClick={() => setSelectedCropFilter("All")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCropFilter === "All"
                    ? "bg-[#059669] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All ({crops.length})
              </button>

              {CROP_OPTIONS.map((cropName) => {
                const count = getCropCount(cropName);
                const isSelected = selectedCropFilter === cropName;

                if (count > 0) {
                  return (
                    <button
                      key={cropName}
                      onClick={() => setSelectedCropFilter(isSelected ? "All" : cropName)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                          : "bg-slate-100/90 text-slate-800 border-slate-200/80 hover:bg-slate-200"
                      }`}
                    >
                      {cropName} ({count})
                    </button>
                  );
                }

                return (
                  <button
                    key={cropName}
                    onClick={() => handleOpenAddModal(cropName)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                    title={`Add ${cropName} parcel`}
                  >
                    <span>{cropName}</span>
                    <Plus className="w-3 h-3 text-slate-400" />
                  </button>
                );
              })}
            </div>

            {/* Crop Parcels Grid */}
            {filteredCrops.length === 0 ? (
              <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Sprout className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {searchTerm || selectedCropFilter !== "All"
                    ? "No crops match your filter"
                    : "No crop parcels registered yet"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm || selectedCropFilter !== "All"
                    ? "Try clearing your search query or clicking 'All' to see all active fields."
                    : "Add your first crop parcel to begin AI-powered moisture monitoring and yield forecasting."}
                </p>
                {searchTerm || selectedCropFilter !== "All" ? (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCropFilter("All");
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="px-4 py-2 rounded-lg bg-[#059669] text-white text-xs font-semibold shadow-xs hover:bg-emerald-700"
                  >
                    Add First Crop
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {filteredCrops.map((crop) => {
                  const lastIrr = new Date(crop.lastIrrigationDate);
                  const daysSinceIrr = Math.max(0, Math.floor((Date.now() - lastIrr.getTime()) / 86400000));

                  return (
                    <div
                      key={crop.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                      onClick={() => setSelectedCropForDetail(crop)}
                    >
                      <div className="space-y-3">
                        {/* Top row: Crop Name, Health Badge, Action Icons */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                {crop.cropName}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  crop.healthStatus === "Optimal"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : crop.healthStatus === "Attention"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {crop.healthStatus}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                              Field: <strong className="text-slate-700">{crop.fieldName}</strong> • {crop.fieldSize}{" "}
                              {farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")}
                            </p>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditModal(crop)}
                              title="Edit Crop"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              aria-label="Edit crop"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCropToDelete(crop)}
                              title="Delete Crop"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              aria-label="Delete crop"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Attributes Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {t("crops.soilType", "Soil Type")}
                            </span>
                            <span className="font-semibold text-slate-800 truncate block">{crop.soilType}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {t("crops.growthStage", "Growth Stage")}
                            </span>
                            <span className="font-semibold text-emerald-800 truncate block">{crop.growthStage}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {t("crops.plantingDate", "Planting Date")}
                            </span>
                            <span className="font-semibold text-slate-800 truncate block">{crop.plantingDate}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              {t("crops.lastIrrigation", "Last Irrigation")}
                            </span>
                            <span className="font-semibold text-cyan-800 truncate block">
                              {daysSinceIrr === 0 ? "Today" : `${daysSinceIrr}d ago`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div
                        className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => recordIrrigation(crop.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Record watering for today"
                          >
                            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                            <span>{t("crops.logWater", "Log Water")}</span>
                          </button>

                          <button
                            onClick={() => setSelectedCropForDetail(crop)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("crops.viewDetails", "Details")}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => openScannerWithCrop(crop.cropName, crop.growthStage)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Analyze crop with AI Vision"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>{t("crops.scanLeaf", "Scan")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Crop Encyclopedia */}
        {activeSubTab === "encyclopedia" && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Agronomic Crop Encyclopedia</h3>
              <p className="text-xs text-slate-500">
                Detailed optimal thresholds, daily water requirement models, and disease vulnerabilities for major crops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CROP_OPTIONS.map((cName) => {
                const profile = CROP_PROFILES[cName];
                if (!profile) return null;

                return (
                  <div
                    key={cName}
                    className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{profile.name}</h4>
                        <p className="text-xs italic text-slate-500">{profile.scientificName}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                        {profile.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Optimal Temp</span>
                        <span className="font-semibold text-slate-800">
                          {profile.optimalTempRange.min}–{profile.optimalTempRange.max}
                          {profile.optimalTempRange.unit}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Water / Day</span>
                        <span className="font-semibold text-cyan-800">
                          {profile.waterRequirementMmPerDay.min}–{profile.waterRequirementMmPerDay.max} mm
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cycle Duration</span>
                        <span className="font-semibold text-slate-800">
                          {profile.growthDurationDays.min}–{profile.growthDurationDays.max} days
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Soil pH Range</span>
                        <span className="font-semibold text-emerald-800">
                          {profile.soilPhRange.min}–{profile.soilPhRange.max}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                      <strong>Agronomist Tip:</strong> {profile.tips}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleOpenAddModal(profile.name)}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        <span>Plant {profile.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Growth Stages */}
        {activeSubTab === "stages" && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Growth Stage Management Roadmap</h3>
              <p className="text-xs text-slate-500">
                Phase-by-phase development timeline and critical agronomic interventions.
              </p>
            </div>

            <div className="space-y-6">
              {CROP_OPTIONS.slice(0, 3).map((cName) => {
                const profile = CROP_PROFILES[cName];
                if (!profile) return null;

                return (
                  <div key={cName} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span>{profile.name} Growth Phases</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        Total {profile.growthDurationDays.min}–{profile.growthDurationDays.max} days
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {profile.keyGrowthStages.map((stage, sIdx) => (
                        <div
                          key={stage.stage}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                              {sIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-800 truncate">{stage.stage}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{stage.description}</p>
                          <div className="pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] font-bold text-emerald-700 block uppercase">Key Action:</span>
                            <span className="text-[11px] text-slate-700">{stage.criticalAction}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Soil & Irrigation */}
        {activeSubTab === "soil" && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Soil & Irrigation Suitability Matrix</h3>
              <p className="text-xs text-slate-500">
                Match crop water demand with soil retention capacity and current farm soil ({farm.primarySoilType}).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm">Farm Soil: {farm.primarySoilType}</h4>
                <p className="text-xs text-emerald-800">
                  Ideal balance of moisture holding capacity and root aeration. Well suited for Solanaceous and Cereal crops.
                </p>
                <div className="pt-2 text-[11px] text-emerald-700">
                  • Available Water Capacity: 1.5–2.0 in/ft<br />
                  • Drainage Rate: Moderate (0.6–2.0 in/hr)
                </div>
              </div>

              <div className="p-5 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                <h4 className="font-bold text-cyan-900 text-sm">Irrigation Efficiency Guidelines</h4>
                <p className="text-xs text-cyan-800">
                  Drip fertigation delivers 90–95% water efficiency. Water early mornings (05:00–08:30) to eliminate foliage fungal risk.
                </p>
                <div className="pt-2 text-[11px] text-cyan-700">
                  • Avoid mid-day spray evaporation<br />
                  • Monitor tensiometer before next cycle
                </div>
              </div>

              <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <h4 className="font-bold text-amber-900 text-sm">Soil Moisture Buffer</h4>
                <p className="text-xs text-amber-800">
                  Keep root zone moisture above 50% field capacity during flowering and fruit setting stages to prevent yield reduction.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Add / Edit Crop Modal Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingCrop ? t("crops.editCrop", "Edit Crop") : t("crops.addCrop", "Add New Crop")}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCrop} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Preset Crop Quick Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("crops.cropName", "Crop Type")} *
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {CROP_OPTIONS.map((cOpt) => (
                    <button
                      key={cOpt}
                      type="button"
                      onClick={() => setFormData({ ...formData, cropName: cOpt })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        (formData.cropName || "").toLowerCase() === (cOpt || "").toLowerCase()
                          ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                          : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {cOpt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Or enter crop type..."
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* Field Name and Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.fieldName", "Field / Parcel Name")} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Plot 01"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.fieldSize", "Field Size")} ({farm.areaUnit === "hectares" ? t("common.hectares", "ha") : t("common.acres", "ac")}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.fieldSize}
                    onChange={(e) =>
                      setFormData({ ...formData, fieldSize: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Growth Stage and Soil Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.growthStage", "Growth Stage")} *
                  </label>
                  <select
                    value={formData.growthStage}
                    onChange={(e) =>
                      setFormData({ ...formData, growthStage: e.target.value as GrowthStage })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruit Development">Fruit Development</option>
                    <option value="Ripening">Ripening</option>
                    <option value="Maturity / Harvest">Maturity / Harvest</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.soilType", "Soil Type")} *
                  </label>
                  <select
                    value={formData.soilType}
                    onChange={(e) =>
                      setFormData({ ...formData, soilType: e.target.value as SoilType })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  >
                    <option value="Loam">Loam (Optimal)</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Clay">Clay</option>
                    <option value="Sand">Sand</option>
                    <option value="Silt">Silt</option>
                    <option value="Peat">Peat</option>
                    <option value="Chalk">Chalk</option>
                  </select>
                </div>
              </div>

              {/* Planting Date and Last Irrigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.plantingDate", "Planting Date")} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.plantingDate}
                    onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("crops.lastIrrigation", "Last Irrigation Date")} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.lastIrrigationDate}
                    onChange={(e) =>
                      setFormData({ ...formData, lastIrrigationDate: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Advanced fields toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>{showAdvancedFields ? "Hide Advanced Agronomic Fields" : "+ Add Yield Targets & Field Notes"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showAdvancedFields ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {showAdvancedFields && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Target Yield</label>
                      <input
                        type="text"
                        placeholder="e.g. 40 tons/acre or 80 bu/acre"
                        value={formData.targetYield}
                        onChange={(e) => setFormData({ ...formData, targetYield: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Current Health Status</label>
                      <select
                        value={formData.healthStatus}
                        onChange={(e) =>
                          setFormData({ ...formData, healthStatus: e.target.value as CropHealthStatus })
                        }
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Optimal">Optimal</option>
                        <option value="Attention">Attention (Monitoring)</option>
                        <option value="Critical">Critical (Action Required)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Agronomic Notes & Variety Details</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Drip irrigation line spacing, hybrid seed batch ID..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingCrop ? t("common.saveChanges", "Save Changes") : t("crops.addCrop", "Add Crop")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      {cropToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remove Crop Parcel?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{cropToDelete.cropName}</strong> (
                {cropToDelete.fieldName})? Associated irrigation records and scans will remain in your farm history.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCropToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={() => {
                  deleteCrop(cropToDelete.id);
                  setCropToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-2xs"
              >
                Delete Parcel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Crop Detail Modal */}
      {selectedCropForDetail && (
        <CropDetailModal
          crop={selectedCropForDetail}
          onClose={() => setSelectedCropForDetail(null)}
          onEdit={() => {
            const c = selectedCropForDetail;
            setSelectedCropForDetail(null);
            handleOpenEditModal(c);
          }}
          onDelete={() => {
            const c = selectedCropForDetail;
            setSelectedCropForDetail(null);
            setCropToDelete(c);
          }}
        />
      )}
    </div>
  );
};
