import React, { useState, useRef, useEffect } from "react";
import { useFarm } from "../context/FarmContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ScanResult, GrowthStage } from "../types";
import { ProvenanceBadge } from "../components/common/ProvenanceBadge";
import {
  ScanLine,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Trash2,
  FileText,
  HelpCircle,
  Leaf,
  Layers,
  Clock,
  ArrowRight,
  Sun,
  Focus,
  Eye,
  Info,
  X,
  RotateCcw,
  Maximize2,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Video,
  SwitchCamera,
  UserCheck,
} from "lucide-react";

// Pre-packaged agricultural specimens for rapid instant testing across key crop types
const sampleSpecimens = [
  {
    id: "sample-tomato-blight",
    title: "Tomato Leaf with Concentric Bullseye",
    crop: "Tomato",
    stage: "Flowering" as GrowthStage,
    hint: "Early Blight (Alternaria solani)",
    svgType: "tomato-blight",
    previewColor: "from-amber-900/30 to-emerald-900/40",
  },
  {
    id: "sample-corn-blight",
    title: "Maize Leaf with Long Tan Lesions",
    crop: "Maize",
    stage: "Vegetative" as GrowthStage,
    hint: "Northern Corn Leaf Blight",
    svgType: "corn-blight",
    previewColor: "from-amber-700/30 to-emerald-800/40",
  },
  {
    id: "sample-wheat-rust",
    title: "Wheat Leaf with Orange Striped Pustules",
    crop: "Wheat",
    stage: "Ripening" as GrowthStage,
    hint: "Stripe Leaf Rust",
    svgType: "wheat-rust",
    previewColor: "from-yellow-800/30 to-emerald-900/40",
  },
  {
    id: "sample-potato-blight",
    title: "Potato Leaf with Water-Soaked Margin",
    crop: "Potato",
    stage: "Fruit Development" as GrowthStage,
    hint: "Late Blight (Phytophthora)",
    svgType: "potato-blight",
    previewColor: "from-zinc-800/40 to-emerald-900/40",
  },
  {
    id: "sample-cucumber-mildew",
    title: "Cucumber Leaf with White Powdery Patches",
    crop: "Cucumber",
    stage: "Flowering" as GrowthStage,
    hint: "Powdery Mildew",
    svgType: "cucumber-mildew",
    previewColor: "from-slate-700/30 to-emerald-800/40",
  },
  {
    id: "sample-chili-healthy",
    title: "Chili Pepper Leaf with Healthy Green Lamina",
    crop: "Chili",
    stage: "Vegetative" as GrowthStage,
    hint: "Healthy Foliage Tissue",
    svgType: "chili-healthy",
    previewColor: "from-emerald-900/40 to-emerald-700/30",
  },
];

export const CropScanner: React.FC = () => {
  const {
    crops,
    scanHistory,
    addScanResult,
    deleteScanResult,
    selectedCropForScan,
    setSelectedCropForScan,
    farm,
  } = useFarm();
  const { t, isRTL } = useTranslation();

  const [selectedCropName, setSelectedCropName] = useState<string>(
    selectedCropForScan?.cropName || (crops[0] ? crops[0].cropName : "Tomato")
  );
  const [selectedStage, setSelectedStage] = useState<GrowthStage>(
    (selectedCropForScan?.stage as GrowthStage) || "Vegetative"
  );
  const [associatedCropId, setAssociatedCropId] = useState<string | undefined>(
    crops[0]?.id
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Live Camera Modal states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStreamError, setCameraStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCropForScan) {
      setSelectedCropName(selectedCropForScan.cropName);
      setSelectedStage(selectedCropForScan.stage as GrowthStage);
      const match = crops.find((c) => c.cropName === selectedCropForScan.cropName);
      if (match) {
        setAssociatedCropId(match.id);
      }
    }
  }, [selectedCropForScan, crops]);

  // Sync crop selection
  const handleCropSelectChange = (cropNameValue: string) => {
    setSelectedCropName(cropNameValue);
    const foundCrop = crops.find((c) => c.cropName === cropNameValue);
    if (foundCrop) {
      setAssociatedCropId(foundCrop.id);
      setSelectedStage(foundCrop.growthStage as GrowthStage);
    } else {
      setAssociatedCropId(undefined);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setScanError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
      setCurrentResult(null);
      setScanError(null);
    };
    reader.onerror = () => {
      setScanError("Failed to read image file. Please try another photo.");
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Live Camera stream management
  const startLiveCamera = async () => {
    setIsLiveCameraOpen(true);
    setCameraStreamError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Live camera stream error, falling back to native capture input:", err);
      setCameraStreamError(
        "Camera stream not directly accessible in this environment. You can use the standard photo capture button instead."
      );
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setCameraStreamError(null);
  };

  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl);
    setImageFileName(`photo_capture_${Date.now()}.jpg`);
    setCurrentResult(null);
    setScanError(null);
    stopLiveCamera();
  };

  const toggleCameraFacingMode = () => {
    setCameraFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    if (isLiveCameraOpen) {
      startLiveCamera();
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraFacingMode]);

  // Remove current image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageFileName(null);
    setCurrentResult(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Convert SVG preview or sample into a specimen for API
  const handleSelectSample = (sample: (typeof sampleSpecimens)[0]) => {
    setSelectedCropName(sample.crop);
    setSelectedStage(sample.stage);
    const sampleCrop = sample?.crop || "Crop";
    setImageFileName(`${sampleCrop.toLowerCase()}_specimen_sample.svg`);

    // Match crop if user has it
    const match = crops.find((c) => (c?.cropName || "").toLowerCase().includes(sampleCrop.toLowerCase()));
    if (match) {
      setAssociatedCropId(match.id);
    }

    const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%231e3a1e"/>
          <stop offset="100%" stop-color="%230f2513"/>
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%238d6e63"/>
          <stop offset="60%" stop-color="%235d4037"/>
          <stop offset="100%" stop-color="%23d4e157" stop-opacity="0.8"/>
        </radialGradient>
      </defs>
      <rect width="600" height="450" fill="url(%23bg)"/>
      <path d="M80,225 Q300,30 520,225 Q300,420 80,225" fill="%232e7d32" stroke="%2343a047" stroke-width="4"/>
      <path d="M80,225 L520,225" stroke="%2381c784" stroke-width="3" stroke-dasharray="4,4"/>
      <circle cx="280" cy="180" r="28" fill="url(%23spot)"/>
      <circle cx="370" cy="230" r="22" fill="url(%23spot)"/>
      <circle cx="210" cy="260" r="18" fill="url(%23spot)"/>
      <rect x="20" y="380" width="560" height="45" rx="8" fill="rgba(0,0,0,0.6)"/>
      <text x="40" y="408" fill="%23ffffff" font-size="16" font-family="sans-serif" font-weight="bold">${sample.title}</text>
      <text x="40" y="420" fill="%23a5d6a7" font-size="11" font-family="sans-serif">CropSense Demo Specimen: ${sample.hint}</text>
    </svg>`;

    setImagePreview(svgData);
    setImageBase64(svgData);
    setCurrentResult(null);
    setScanError(null);
  };

  // Helper to normalize and optimize any image (camera, file upload, or specimen) for Gemini vision model
  const ensureJpegBase64 = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const MAX_DIM = 1280;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width || 640;
        canvas.height = height || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(dataUri);
        }
      };
      img.onerror = () => {
        resolve(dataUri);
      };
      img.src = dataUri;
    });
  };

  // Execute scan with real multimodal AI vision
  const handleRunScan = async () => {
    if (!imageBase64 && !imagePreview) {
      setScanError("Please take a photo or select an image to analyze.");
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const sourceImage = imageBase64 || imagePreview || "";
      const processedImage = await ensureJpegBase64(sourceImage);

      const res = await fetch("/api/scan-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: processedImage,
          cropHint: selectedCropName,
          stageHint: selectedStage,
          cropId: associatedCropId,
          language: isRTL ? "ur" : "en",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || "AI image analysis service returned an error."
        );
      }

      const data: ScanResult = await res.json();
      const enrichedResult: ScanResult = {
        ...data,
        cropType: data.crop_type || data.cropType || selectedCropName,
        cropId: associatedCropId,
        imageUrl: imagePreview || processedImage,
        farmId: farm?.id,
      };

      setCurrentResult(enrichedResult);
      addScanResult(enrichedResult);
    } catch (err: any) {
      console.error("Scan error:", err);
      setScanError(
        err.message || "Failed to complete AI crop image analysis. Please verify your photo and connection and try again."
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <ScanLine className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("scanner.title", "Crop Scanner")}
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {t("scanner.subtitle", "Capture or upload high-resolution crop foliage photos for preliminary pathogen and leaf symptom assessments.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge source="REAL AI VISION ASSESSMENT" size="md" />
          </div>
        </div>
      </div>

      {/* Hidden File / Camera Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Live Camera Modal (if triggered and supported) */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Live Camera Viewfinder</span>
              </div>
              <button
                onClick={stopLiveCamera}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraStreamError ? (
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Direct Viewfinder Note</span>
                </div>
                <p>{cameraStreamError}</p>
                <button
                  type="button"
                  onClick={() => {
                    stopLiveCamera();
                    cameraInputRef.current?.click();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg text-white"
                >
                  Use Smartphone Camera App
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-4/3 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshairs overlay */}
                  <div className="absolute inset-8 border border-emerald-400/40 rounded-lg pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-400/80 rounded-full animate-ping opacity-30" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                    <span>Flip</span>
                  </button>

                  <button
                    type="button"
                    onClick={capturePhotoFromLiveStream}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/50 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: UPLOAD, PHOTO CAPTURE & TIPS (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Photo Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                1. {t("crops.cropName", "Target Crop Context")}
              </h2>
              {associatedCropId && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded border border-emerald-200">
                  {t("scanner.linkedToCrop", "Linked to Field Crop")}
                </span>
              )}
            </div>

            {/* Target Crop Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t("crops.cropName", "Crop Type")}</label>
              <select
                value={selectedCropName}
                onChange={(e) => handleCropSelectChange(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <optgroup label={t("nav.myCrops", "My Farm Crops")}>
                  {crops.map((c) => (
                    <option key={c.id} value={c.cropName}>
                      {c.cropName} ({c.fieldName})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Standard Crop Options">
                  <option value="Tomato">Tomato</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Maize">Maize (Corn)</option>
                  <option value="Potato">Potato</option>
                  <option value="Cucumber">Cucumber</option>
                  <option value="Chili">Chili (Pepper)</option>
                </optgroup>
              </select>
            </div>

            {/* Growth Stage Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t("crops.stage", "Observed Growth Stage")}</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as GrowthStage)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Germination">Germination / Seedling</option>
                <option value="Vegetative">Vegetative (Active Foliage)</option>
                <option value="Flowering">Flowering / Tasseling</option>
                <option value="Fruit Development">Fruit / Grain Development</option>
                <option value="Ripening">Ripening / Maturing</option>
                <option value="Maturity / Harvest">Maturity / Harvest Ready</option>
              </select>
            </div>

            {/* Step 2: Photo Capture / Upload Box */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  2. {t("scanner.photoCapture", "Leaf Photo Capture")}
                </h2>
                {imagePreview && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {imageFileName || "Photo loaded"}
                  </span>
                )}
              </div>

              {/* Upload Dropzone / Image Preview */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full min-h-[220px] border-2 rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-50"
                    : imagePreview
                    ? "border-emerald-400 bg-slate-900/95"
                    : "border-dashed border-slate-300 bg-slate-50/80 hover:bg-slate-100/70 hover:border-slate-400"
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-3 w-full">
                    {/* Visual Preview Frame */}
                    <div className="relative max-h-56 w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
                      <img
                        src={imagePreview}
                        alt="Crop leaf preview"
                        className="max-h-56 object-contain rounded-lg shadow-sm"
                      />

                      {/* Scanning Animated Line Beam when analyzing */}
                      {isScanning && (
                        <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                          <div className="w-10 h-10 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin" />
                          <span className="text-xs font-bold tracking-wider uppercase animate-pulse text-emerald-300">
                            {isRTL ? "جیمنی اے آئی جائزہ لے رہا ہے..." : "Analyzing with Gemini AI..."}
                          </span>
                          <span className="text-[10px] text-slate-300">
                            {isRTL ? "پودے کی علامات کا تجزیہ" : "Evaluating foliar symptoms"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preview action buttons: Remove / Retake */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isScanning}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t("common.delete", "Remove")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isScanning}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t("scanner.retake", "Retake Photo")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t("scanner.changeFile", "Change File")}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                      <Camera className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        {t("scanner.takePhotoOrUpload", "Take a photo or upload an existing crop image")}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        {t("scanner.dragAndDrop", "Drag and drop image here, or select one of the capture options below")}
                      </p>
                    </div>

                    {/* Dual Action Buttons: Smartphone Camera vs Upload Image */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.mediaDevices && window.innerWidth > 768) {
                            startLiveCamera();
                          } else {
                            cameraInputRef.current?.click();
                          }
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t("scanner.takePhoto", "Take Photo")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t("scanner.uploadImage", "Upload Image")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message if any */}
            {scanError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Run Diagnostic Button: Press Analyze */}
            <button
              id="run-analyze-button"
              onClick={handleRunScan}
              disabled={isScanning || !imagePreview}
              className={`w-full py-3 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all ${
                !imagePreview || isScanning
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-99 shadow-emerald-600/20"
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRTL ? "جیمنی اے آئی تجزیہ کر رہا ہے..." : "Analyzing with Gemini AI..."}</span>
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  <span>{t("scanner.analyzeButton", "Analyze Crop Specimen")}</span>
                </>
              )}
            </button>
          </div>

          {/* Photo Scouting Tips Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t("scanner.photoTips", "Photo Tips")}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                <Sun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">{t("scanner.lightingTip", "Use good lighting")}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Natural daylight; avoid harsh shadows or dark backlighting.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                <Focus className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">{t("scanner.focusTip", "Keep the crop in focus")}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Hold camera 15–30 cm away and tap screen on the leaf blade.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">{t("scanner.blurTip", "Avoid blur")}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Hold phone steady and keep wind from moving foliage.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">{t("scanner.symptomTip", "Clearly show visible symptoms")}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Capture discolored margins, pustules, or wilting spots.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Test Specimens */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("scanner.demoLibrary", "Demo Specimen Library")}
              </span>
              <span className="text-[10px] text-slate-400">Click to preview</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sampleSpecimens.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="p-2 rounded-lg border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50/40 text-left transition-all text-xs group"
                >
                  <p className="font-semibold text-slate-800 group-hover:text-emerald-800 truncate text-[11px]">
                    {s.crop}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {s.hint}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ASSESSMENT RESULTS & SCAN HISTORY (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {currentResult ? (
            <div
              id="ai-crop-assessment-card"
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* AI Crop Assessment Banner & Mandatory Safety Notice */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-950">
                      {isRTL ? "اے آئی فصل کی صحت کا جائزہ" : "AI Crop Health Assessment"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentResult.image_quality && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          currentResult.image_quality === "good"
                            ? "bg-emerald-100/70 text-emerald-800 border-emerald-300"
                            : currentResult.image_quality === "acceptable"
                            ? "bg-blue-100/70 text-blue-800 border-blue-300"
                            : "bg-amber-100/80 text-amber-900 border-amber-300"
                        }`}
                      >
                        {isRTL
                          ? `تصویر کا معیار: ${currentResult.image_quality}`
                          : `Quality: ${currentResult.image_quality}`}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      {isRTL ? "ابتدائی اسکریننگ" : "Preliminary Screening"}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-850 leading-relaxed font-medium">
                  {isRTL
                    ? "یہ ایک AI پر مبنی ابتدائی جائزہ ہے اور اسے تصدیق شدہ زرعی تشخیص نہیں سمجھا جانا چاہیے۔"
                    : "This is an AI-based preliminary assessment and should not be considered a confirmed agricultural diagnosis."}
                </p>
              </div>

              {/* Assessment Core Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        currentResult.severity === "Healthy" || currentResult.severity === "low"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : currentResult.severity === "Mild"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : currentResult.severity === "Moderate" || currentResult.severity === "moderate"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {currentResult.severity} {t("common.severity", "Severity")}
                    </span>

                    {/* Confidence Badge */}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {isRTL ? "اعتماد" : "Confidence"}:{" "}
                      <strong className="text-slate-900 capitalize">
                        {currentResult.confidenceLevel
                          ? `${currentResult.confidenceLevel} (${currentResult.confidence}%)`
                          : `${currentResult.confidence}%`}
                      </strong>
                    </span>
                  </div>

                  {/* Possible Condition Name */}
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {currentResult.possible_condition ||
                      currentResult.possibleCondition ||
                      currentResult.diagnosis}
                  </h2>

                  <p className="text-xs text-slate-600">
                    {t("crops.cropName", "Crop")}:{" "}
                    <strong className="text-slate-900">
                      {currentResult.crop_type || currentResult.cropType}
                    </strong>
                    {currentResult.pathogenType && (
                      <span> • {currentResult.pathogenType}</span>
                    )}
                  </p>
                </div>

                <div className="sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Action Urgency
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      currentResult.urgency === "Immediate"
                        ? "text-rose-700"
                        : currentResult.urgency === "Within 48h"
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {currentResult.urgency || "Routine"}
                  </span>
                </div>
              </div>

              {/* Poor Image Quality Notice (if applicable) */}
              {currentResult.image_quality === "poor" && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isRTL
                        ? "تصویر کا معیار کم ہے — براہ کرم دوبارہ واضح تصویر لیں"
                        : "Low Image Clarity — Retake Recommended"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isRTL
                      ? "دھندلی، کم روشنی یا دور سے لی گئی تصاویر پر درست جائزہ لینا مشکل ہوتا ہے۔ بہتر نتائج کے لیے پودے کے متاثرہ حصے کی قریب اور صاف تصویر لیں۔"
                      : "The uploaded photo is blurry, dark, or out of focus. For the most accurate assessment, take a well-lit, close-up photo of the single leaf lamina."}
                  </p>
                </div>
              )}

              {/* Stage Assessment Context */}
              {currentResult.stageAssessment && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Canopy Status: </span>
                    <span>{currentResult.stageAssessment}</span>
                  </div>
                </div>
              )}

              {/* Visible Observations Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isRTL ? "نمایاں علامات و مشاہدات" : "Visible Observations & Leaf Symptoms"}
                  </span>
                </h3>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  {(
                    currentResult.visible_observations ||
                    currentResult.visibleSymptoms ||
                    currentResult.symptoms ||
                    []
                  ).map((s, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isRTL ? "تجویز کردہ اقدامات" : "Recommended Actions & Field Management"}
                  </span>
                </h3>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                  {(
                    currentResult.recommended_actions ||
                    currentResult.recommendedNextSteps ||
                    currentResult.organicTreatments || [
                      "Scout adjacent rows to establish infection boundary",
                      "Verify canopy moisture and airflow before applying treatments",
                      "Seek agronomist confirmation if symptoms persist",
                    ]
                  ).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* When to Seek Expert Help (if provided) */}
              {currentResult.when_to_seek_expert_help && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>
                      {isRTL ? "ماہر سے کب رابطہ کریں" : "When to Seek Expert Agronomist Help"}
                    </span>
                  </h3>
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                    <p className="leading-relaxed">{currentResult.when_to_seek_expert_help}</p>
                  </div>
                </div>
              )}

              {/* Limitations Section */}
              <div className="space-y-2">
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{t("scanner.limitationsTitle", "Assessment Limitations & Scope")}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/90">
                    {currentResult.limitations ||
                      "This visual assessment is an AI-based preliminary evaluation based on photographic features. Photographic analysis cannot verify microscopic fungal spores, latent bacterial vascular infections, or sub-surface root nematodes. Always confirm with laboratory assays or field agronomist inspection before applying extensive chemical interventions."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center space-y-3 min-h-[340px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <ScanLine className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {t("scanner.readyTitle", "Ready for Crop Pathology Assessment")}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("scanner.readyDesc", "Select a crop, take or upload a clear leaf photo, and click 'Analyze Crop Specimen' to generate a preliminary Demo AI assessment with symptoms, severity, and next steps.")}
                </p>
              </div>
            </div>
          )}

          {/* Scan History Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("scanner.scanHistory", "Scan History")} ({scanHistory.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Saved assessments</span>
            </div>

            {scanHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {t("scanner.noHistory", "No scans saved yet. Completed scans will appear here.")}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scanHistory.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="space-y-0.5 truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {s.cropType}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                            s.severity === "Healthy"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.severity === "Mild"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : s.severity === "Moderate"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(s.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium truncate text-[11px]">
                        {s.possibleCondition
                          ? `Possible condition: ${s.possibleCondition}`
                          : s.diagnosis}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrentResult(s)}
                        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 hover:text-emerald-700 text-xs shadow-2xs hover:bg-slate-50"
                      >
                        {t("scanner.inspect", "Inspect")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScanResult(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Delete scan record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
