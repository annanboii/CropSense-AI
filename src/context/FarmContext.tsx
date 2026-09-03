import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  FarmProfile,
  CropRecord,
  WeatherData,
  ScanResult,
  FarmAlert,
  IrrigationAdvice,
  DiseaseRiskItem,
  UserAccount,
  IrrigationRecord,
} from "../types";
import {
  TabKey,
  normalizeTab,
  getPathForTab,
  getLabelForTab,
  getTabFromLocation,
} from "../utils/navigation";

export interface FarmContextType {
  // Authentication & Session
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoadingAuth: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signUp: (email: string, password: string, farmerName: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  logOut: () => Promise<void>;
  startDemoMode: () => void;
  completeFarmSetup: (farmData: FarmProfile) => Promise<void>;

  // Navigation
  activeTab: string;
  activeTabKey: TabKey;
  setActiveTab: (tab: string) => void;

  // Farm Management
  farm: FarmProfile;
  farms: FarmProfile[];
  createFarm: (newFarm: FarmProfile) => void;
  switchFarm: (name: string) => void;
  updateFarm: (updated: Partial<FarmProfile>) => void;
  updateFarmProfile: (updated: Partial<FarmProfile>) => void;
  deleteFarm: (name: string) => void;
  resetToDefaults: () => void;

  // Crops (CRUD & Details)
  crops: CropRecord[];
  addCrop: (crop: Omit<CropRecord, "id" | "createdAt">) => Promise<void>;
  updateCrop: (id: string, crop: Partial<CropRecord>) => Promise<void>;
  deleteCrop: (id: string) => Promise<void>;
  recordIrrigation: (id: string, date?: string) => Promise<void>;
  selectedCropForDetail: CropRecord | null;
  setSelectedCropForDetail: (crop: CropRecord | null) => void;

  // Weather (Real Live Open-Meteo)
  weather: WeatherData | null;
  isLoadingWeather: boolean;
  weatherError: string | null;
  refreshWeather: () => Promise<void>;

  // Scans
  scanHistory: ScanResult[];
  addScanResult: (scan: ScanResult) => Promise<void>;
  deleteScanResult: (id: string) => Promise<void>;

  // Alerts
  alerts: FarmAlert[];
  dismissAlert: (id: string) => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
  markAllAlertsRead: () => void;
  addAlert: (alert: Omit<FarmAlert, "id" | "timestamp" | "dismissed">) => void;
  clearResolvedAlerts: () => void;

  // Agronomic computations
  irrigationAdvice: IrrigationAdvice[];
  diseaseRisks: DiseaseRiskItem[];
  recalculateAgronomy: () => Promise<void>;

  // Settings & Units
  tempUnit: "C" | "F";
  setTempUnit: (unit: "C" | "F") => void;
  formatTemp: (celsius: number) => string;
  formatArea: (val: number) => string;
  formatWaterVolume: (liters: number) => string;

  // Irrigation Records
  irrigationRecords: IrrigationRecord[];
  logCustomIrrigation: (record: Omit<IrrigationRecord, "id" | "createdAt">) => Promise<void>;

  // Fast Navigation with Params
  openScannerWithCrop: (cropName: string, stage: string) => void;
  selectedCropForScan: { cropName: string; stage: string } | null;
  setSelectedCropForScan: (val: { cropName: string; stage: string } | null) => void;
}

// ----------------------------------------------------
// DEMO SANDBOX SAMPLE DATA (Used ONLY in explicit Demo Mode)
// ----------------------------------------------------
const demoFarm: FarmProfile = {
  name: "Verdant Valley Organic Farm",
  farmerName: "Sarah Jenkins (Demo)",
  location: "Salinas Valley, California",
  latitude: 36.6777,
  longitude: -121.6555,
  totalArea: 145,
  areaUnit: "acres",
  primarySoilType: "Loam",
  establishedYear: 2018,
};

const demoCrops: CropRecord[] = [
  {
    id: "demo-crop-1",
    cropName: "Roma Tomatoes (Processing)",
    fieldName: "South Ridge Block A",
    fieldSize: 32.5,
    soilType: "Loam",
    growthStage: "Flowering",
    plantingDate: "2026-05-10",
    lastIrrigationDate: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    targetYield: "42 tons/acre",
    healthStatus: "Optimal",
    notes: "Drip fertigation scheduled bi-weekly. Staggered trellis supports in place.",
    createdAt: "2026-05-10T08:00:00Z",
  },
  {
    id: "demo-crop-2",
    cropName: "Hard Red Winter Wheat",
    fieldName: "East Basin Field 04",
    fieldSize: 55.0,
    soilType: "Clay Loam",
    growthStage: "Ripening",
    plantingDate: "2026-03-15",
    lastIrrigationDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    targetYield: "78 bu/acre",
    healthStatus: "Attention",
    notes: "Monitoring stripe rust risk on lower foliage; grain filling phase nearing completion.",
    createdAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "demo-crop-3",
    cropName: "Sweet Corn (Jubilee)",
    fieldName: "Riverbed Plot 02",
    fieldSize: 28.0,
    soilType: "Sandy Loam",
    growthStage: "Vegetative",
    plantingDate: "2026-06-22",
    lastIrrigationDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    targetYield: "210 bu/acre",
    healthStatus: "Optimal",
    notes: "V8 growth stage with rapid canopy expansion. High nitrogen demand active.",
    createdAt: "2026-06-22T08:00:00Z",
  },
];

const demoIrrigationRecords: IrrigationRecord[] = [
  {
    id: "demo-irrig-1",
    cropId: "demo-crop-1",
    cropName: "Roma Tomatoes (Processing)",
    fieldName: "South Ridge Block A",
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    depthMm: 22,
    volumeGallons: 194000,
    volumeLiters: 734000,
    notes: "Drip fertigation with balanced NPK formula. Soil moisture restored to 78%.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "demo-irrig-2",
    cropId: "demo-crop-2",
    cropName: "Hard Red Winter Wheat",
    fieldName: "East Basin Field 04",
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    depthMm: 30,
    volumeGallons: 407000,
    volumeLiters: 1540000,
    notes: "Center pivot irrigation completed before flowering stage onset.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "demo-irrig-3",
    cropId: "demo-crop-3",
    cropName: "Sweet Corn (Jubilee)",
    fieldName: "Riverbed Plot 02",
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    depthMm: 25,
    volumeGallons: 189000,
    volumeLiters: 715000,
    notes: "Overhead sprinkler pass to support rapid vegetative expansion.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const demoScans: ScanResult[] = [
  {
    id: "demo-scan-1",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    cropType: "Roma Tomatoes (Processing)",
    cropId: "demo-crop-1",
    possibleCondition: "Early Blight (Alternaria solani)",
    diagnosis: "Possible condition: Early Blight (Alternaria solani)",
    pathogenType: "Fungal",
    severity: "Mild",
    confidence: 88,
    symptoms: [
      "Concentric circular brown spots with faint chlorotic halos",
      "Confined to lower tier leaves near soil level",
    ],
    visibleSymptoms: [
      "Concentric circular brown spots with faint chlorotic halos",
      "Confined to lower tier leaves near soil level",
    ],
    recommendedNextSteps: [
      "Prune bottom 10-12 inches of infected lower foliage to improve canopy airflow",
      "Apply protective copper soap or bio-fungicide drench during early morning hours",
      "Inspect drip irrigation lines to avoid wetting foliage",
    ],
    limitations:
      "Demo AI — preliminary assessment based on 2D photographic features. Visual symptoms can overlap with Septoria leaf spot or nutrient imbalances. Lab tissue testing or agronomist field scouting recommended.",
    urgency: "Within 48h",
    stageAssessment: "Flowering stage; early containment prevents flower drop.",
  },
];

const demoAlerts: FarmAlert[] = [
  {
    id: "demo-alert-1",
    category: "Disease",
    type: "disease",
    severity: "Critical",
    title: "Elevated Early Blight Risk",
    explanation: "High relative humidity overnight combined with warm temperatures creates optimal spore germination conditions for Solanaceae plots.",
    message: "High relative humidity overnight creates favorable conditions for fungal spore germination in Tomato plots.",
    date: "Today at 08:30",
    timestamp: "2 hours ago",
    recommendedAction: "Apply preventive bio-fungicide (Bacillus subtilis) or copper drench before midday and prune bottom leaves.",
    provenance: "ESTIMATED RECOMMENDATION",
    cropId: "demo-crop-1",
    cropName: "Roma Tomatoes (Processing)",
    actionTab: "Disease Risk",
    actionLabel: "View Risk Index",
    read: false,
    dismissed: false,
  },
  {
    id: "demo-alert-2",
    category: "Irrigation",
    type: "irrigation",
    severity: "Warning",
    title: "Soil Moisture Depletion: Roma Tomatoes",
    explanation: "Estimated root zone soil moisture has dropped to 38% after 3 days without irrigation in Loam soil during flowering stage.",
    message: "Estimated root zone soil moisture has dropped to 38% in South Ridge Block A.",
    date: "Today at 07:00",
    timestamp: "Today at 07:00",
    recommendedAction: "Schedule 22mm drip irrigation (~194,000 gallons) by tomorrow morning to avoid flower drop.",
    provenance: "ESTIMATED RECOMMENDATION",
    cropId: "demo-crop-1",
    cropName: "Roma Tomatoes (Processing)",
    actionTab: "Irrigation Advisor",
    actionLabel: "Open Irrigation Plan",
    read: false,
    dismissed: false,
  },
  {
    id: "demo-alert-3",
    category: "Scan",
    type: "scan",
    severity: "Warning",
    title: "Diagnostic Concern: Early Blight in Tomato",
    explanation: "Leaf scan analysis identified concentric circular target spots on lower foliage with 88% model confidence.",
    message: "Mild Early Blight detected on lower tier leaves near soil level.",
    date: "Yesterday",
    timestamp: "Yesterday",
    recommendedAction: "Prune bottom 10-12 inches of infected foliage and avoid overhead watering.",
    provenance: "DEMO AI ASSESSMENT",
    cropId: "demo-crop-1",
    cropName: "Roma Tomatoes (Processing)",
    actionTab: "Crop Scanner",
    actionLabel: "Review Diagnosis",
    read: false,
    dismissed: false,
  },
  {
    id: "demo-alert-4",
    category: "Weather",
    type: "weather",
    severity: "Info",
    title: "Optimal Chemical Spraying Window",
    explanation: "Live weather indicates wind speed is calm (<10 km/h) and rain probability is zero until late morning.",
    message: "Wind speed is calm and rain probability is zero until late morning.",
    date: "Today at 06:15",
    timestamp: "Today at 06:15",
    recommendedAction: "Execute scheduled foliar treatments or nutrient sprays before afternoon wind increase.",
    provenance: "LIVE WEATHER",
    actionTab: "Weather",
    actionLabel: "Check Spray Window",
    read: false,
    dismissed: false,
  },
];

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTabKey, setActiveTabKey] = useState<TabKey>(getTabFromLocation);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [selectedCropForScan, setSelectedCropForScan] = useState<{ cropName: string; stage: string } | null>(null);
  const [selectedCropForDetail, setSelectedCropForDetail] = useState<CropRecord | null>(null);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("cropsense_auth_token") || null;
  });
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("cropsense_demo_mode") === "true";
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Farm Data States
  const [farm, setFarm] = useState<FarmProfile>({
    name: "annan farm",
    farmerName: "Annan Muhammad",
    location: "Islamabad, Pakistan",
    latitude: 33.6844,
    longitude: 73.0479,
    totalArea: 25,
    areaUnit: "acres",
    primarySoilType: "Loam",
    establishedYear: new Date().getFullYear(),
  });
  const [farms, setFarms] = useState<FarmProfile[]>([
    {
      name: "annan farm",
      farmerName: "Annan Muhammad",
      location: "Islamabad, Pakistan",
      latitude: 33.6844,
      longitude: 73.0479,
      totalArea: 25,
      areaUnit: "acres",
      primarySoilType: "Loam",
      establishedYear: new Date().getFullYear(),
    },
  ]);
  const [crops, setCrops] = useState<CropRecord[]>([
    {
      id: "crop-initial-1",
      cropName: "Tomato",
      fieldName: "North Plot 01",
      fieldSize: 10.0,
      soilType: "Loam",
      growthStage: "Vegetative",
      plantingDate: new Date(Date.now() - 25 * 86400000).toISOString().split("T")[0],
      lastIrrigationDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      targetYield: "35 tons/acre",
      healthStatus: "Optimal",
      notes: "Healthy canopy development with active drip irrigation.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [irrigationRecords, setIrrigationRecords] = useState<IrrigationRecord[]>([]);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);

  // Weather state (Real Live Open-Meteo)
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Agronomic computations
  const [irrigationAdvice, setIrrigationAdvice] = useState<IrrigationAdvice[]>([]);
  const [diseaseRisks, setDiseaseRisks] = useState<DiseaseRiskItem[]>([]);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentTab = getTabFromLocation();
      setActiveTabKey(currentTab);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);

    if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "")) {
      window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const setActiveTab = (tab: string) => {
    const normalized = normalizeTab(tab);
    setActiveTabKey(normalized);
    const targetPath = getPathForTab(normalized);
    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      window.history.pushState({ tab: normalized }, "", targetPath);
    }
  };

  const activeTab = getLabelForTab(activeTabKey);

  // Load User Data or Verify Session on Mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoadingAuth(true);
      if (isDemoMode) {
        // Load Demo Sandbox
        setFarm(demoFarm);
        setFarms([demoFarm]);
        setCrops(demoCrops);
        setScanHistory(demoScans);
        setIrrigationRecords(demoIrrigationRecords);
        setAlerts(demoAlerts);
        setIsLoadingAuth(false);
        return;
      }

      if (!authToken) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          if (data.farm) {
            setFarm(data.farm);
            setFarms([data.farm]);
          } else {
            setFarm({
              name: `${data.user.farmerName}'s Farm`,
              farmerName: data.user.farmerName,
              location: "Salinas Valley, California",
              latitude: 36.6777,
              longitude: -121.6555,
              totalArea: 25,
              areaUnit: "acres",
              primarySoilType: "Loam",
              establishedYear: new Date().getFullYear(),
            });
          }
          setCrops(data.crops || []);
          setScanHistory(data.scans || []);
          setAlerts(data.alerts || []);
          setIrrigationRecords(data.irrigationRecords || []);
        } else {
          // Token expired or invalid
          setAuthToken(null);
          localStorage.removeItem("cropsense_auth_token");
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn("Unable to check auth status:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();
  }, [authToken, isDemoMode]);

  // Auth Actions
  const signUp = async (email: string, password: string, farmerName: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, farmerName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to sign up.");
    }
    setAuthToken(data.token);
    localStorage.setItem("cropsense_auth_token", data.token);
    setIsDemoMode(false);
    localStorage.removeItem("cropsense_demo_mode");
    setCurrentUser(data.user);
    // Fresh user has no crops or scans initially
    setCrops([]);
    setScanHistory([]);
    setAlerts([]);
    setFarm({
      name: `${farmerName}'s Farm`,
      farmerName: farmerName,
      location: "Farm Coordinates",
      latitude: 36.6777,
      longitude: -121.6555,
      totalArea: 25,
      areaUnit: "acres",
      primarySoilType: "Loam",
      establishedYear: new Date().getFullYear(),
    });
  };

  const logIn = async (email: string, password: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Invalid login credentials.");
    }
    setAuthToken(data.token);
    localStorage.setItem("cropsense_auth_token", data.token);
    setIsDemoMode(false);
    localStorage.removeItem("cropsense_demo_mode");
    setCurrentUser(data.user);
    if (data.farm) {
      setFarm(data.farm);
      setFarms([data.farm]);
    }
    setCrops(data.crops || []);
    setScanHistory(data.scans || []);
    setAlerts(data.alerts || []);
  };

  const signInWithGoogle = async (): Promise<void> => {
    setAuthError(null);
    const redirectUri = `${window.location.origin}/auth/callback`;

    // 1. Fetch OAuth URL from server
    const urlRes = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
    const urlData = await urlRes.json();

    if (!urlRes.ok || !urlData.configured || !urlData.url) {
      const msg =
        urlData.error ||
        "Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) are not configured. Please set them in your project environment settings.";
      setAuthError(msg);
      throw new Error(msg);
    }

    // 2. Open provider OAuth URL in popup
    const popupWidth = 560;
    const popupHeight = 680;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2.5;

    const authWindow = window.open(
      urlData.url,
      "cropsense_google_oauth",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!authWindow) {
      const msg = "Popup window was blocked by your browser. Please allow popups for this site to continue with Google.";
      setAuthError(msg);
      throw new Error(msg);
    }

    // 3. Listen for OAuth completion message
    return new Promise<void>((resolve, reject) => {
      let isCompleted = false;

      const cleanup = () => {
        window.removeEventListener("message", handleMessage);
        if (pollTimer) clearInterval(pollTimer);
      };

      const handleMessage = async (event: MessageEvent) => {
        // Security check for AI Studio runtime or current origin
        const origin = event.origin;
        if (!origin.endsWith(".run.app") && !origin.includes("localhost") && origin !== window.location.origin) {
          return;
        }

        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          isCompleted = true;
          cleanup();
          const token = event.data.token;
          if (!token) {
            const err = new Error("No authorization token received from Google.");
            setAuthError(err.message);
            reject(err);
            return;
          }

          setAuthToken(token);
          localStorage.setItem("cropsense_auth_token", token);
          setIsDemoMode(false);
          localStorage.removeItem("cropsense_demo_mode");

          try {
            // Load user data with fresh token
            const meRes = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const data = await meRes.json();
              setCurrentUser(data.user);
              if (data.farm) {
                setFarm(data.farm);
                setFarms([data.farm]);
              } else {
                setFarm({
                  name: `${data.user.farmerName}'s Farm`,
                  farmerName: data.user.farmerName,
                  location: "Farm Coordinates",
                  latitude: 36.6777,
                  longitude: -121.6555,
                  totalArea: 25,
                  areaUnit: "acres",
                  primarySoilType: "Loam",
                  establishedYear: new Date().getFullYear(),
                });
              }
              setCrops(data.crops || []);
              setScanHistory(data.scans || []);
              setAlerts(data.alerts || []);
            }
            resolve();
          } catch (err: any) {
            console.error("Failed to load user profile after Google auth:", err);
            setAuthError(err.message || "Failed to load account data.");
            reject(err);
          }
        } else if (event.data?.type === "OAUTH_AUTH_ERROR") {
          isCompleted = true;
          cleanup();
          const err = new Error(event.data.error || "Google authentication was cancelled or failed.");
          setAuthError(err.message);
          reject(err);
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed by user without message
      const pollTimer = setInterval(() => {
        if (authWindow.closed && !isCompleted) {
          cleanup();
          const err = new Error("Google sign-in popup was closed.");
          reject(err);
        }
      }, 700);
    });
  };

  const signInWithGoogleCredential = async (credential: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || "Google authentication failed.";
      setAuthError(msg);
      throw new Error(msg);
    }

    setAuthToken(data.token);
    localStorage.setItem("cropsense_auth_token", data.token);
    setIsDemoMode(false);
    localStorage.removeItem("cropsense_demo_mode");
    setCurrentUser(data.user);
    if (data.farm) {
      setFarm(data.farm);
      setFarms([data.farm]);
    } else {
      setFarm({
        name: `${data.user.farmerName}'s Farm`,
        farmerName: data.user.farmerName,
        location: "Farm Coordinates",
        latitude: 36.6777,
        longitude: -121.6555,
        totalArea: 25,
        areaUnit: "acres",
        primarySoilType: "Loam",
        establishedYear: new Date().getFullYear(),
      });
    }
    setCrops(data.crops || []);
    setScanHistory(data.scans || []);
    setAlerts(data.alerts || []);
  };

  const logOut = async () => {
    if (authToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        // silent
      }
    }
    setAuthToken(null);
    localStorage.removeItem("cropsense_auth_token");
    setIsDemoMode(false);
    localStorage.removeItem("cropsense_demo_mode");
    setCurrentUser(null);
    setCrops([]);
    setScanHistory([]);
    setIrrigationRecords([]);
    setAlerts([]);
    setActiveTab("Dashboard");
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("cropsense_demo_mode", "true");
    setAuthToken(null);
    localStorage.removeItem("cropsense_auth_token");
    setCurrentUser({
      id: "demo-user-1",
      email: "demo@cropsense.ai",
      farmerName: "Sarah Jenkins (Demo Agronomist)",
      createdAt: new Date().toISOString(),
      farmSetupCompleted: true,
    });
    setFarm(demoFarm);
    setFarms([demoFarm]);
    setCrops(demoCrops);
    setScanHistory(demoScans);
    setIrrigationRecords(demoIrrigationRecords);
    setAlerts(demoAlerts);
    setActiveTab("Dashboard");
  };

  const completeFarmSetup = async (farmData: FarmProfile) => {
    if (authToken) {
      const res = await fetch("/api/user/farm-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(farmData),
      });
      if (res.ok) {
        const data = await res.json();
        setFarm(data.farm);
        setFarms([data.farm]);
        if (currentUser) {
          setCurrentUser({
            ...currentUser,
            farmerName: data.farmerName || currentUser.farmerName,
            farmSetupCompleted: true,
          });
        }
      }
    } else {
      setFarm(farmData);
      setFarms([farmData]);
      if (currentUser) {
        setCurrentUser({ ...currentUser, farmSetupCompleted: true });
      }
    }
  };

  // Weather Refresh
  const refreshWeather = useCallback(async () => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const res = await fetch(
        `/api/weather?lat=${farm.latitude}&lon=${farm.longitude}&locationName=${encodeURIComponent(farm.location)}`
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Weather service status ${res.status}`);
      }
      const data: WeatherData = await res.json();
      if (!data || !data.current) {
        throw new Error("Invalid weather data returned from Open-Meteo API");
      }
      setWeather(data);
      setWeatherError(null);
    } catch (err: any) {
      console.error("Error refreshing live weather:", err);
      setWeather(null);
      setWeatherError(err.message || "Failed to load live weather from Open-Meteo API. Please verify farm coordinates.");
    } finally {
      setIsLoadingWeather(false);
    }
  }, [farm.latitude, farm.longitude, farm.location]);

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  // Agronomy Computations
  const recalculateAgronomy = useCallback(async () => {
    if (!weather) return;

    if (crops.length === 0) {
      setIrrigationAdvice([]);
      setDiseaseRisks([]);
      return;
    }

    try {
      const res = await fetch("/api/irrigation-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crops, weatherData: weather }),
      });
      if (res.ok) {
        const advice = await res.json();
        setIrrigationAdvice(advice);
      }
    } catch (e) {
      console.error("Agronomy calculation error:", e);
    }

    const humidity = weather.current.humidity;
    const temp = weather.current.temp;
    const rainSum = weather.daily.slice(0, 3).reduce((sum, d) => sum + (d.precipitationSum || 0), 0);

    const calculatedRisks: DiseaseRiskItem[] = [
      {
        id: "risk-early-blight",
        diseaseName: "Early Blight (Alternaria solani)",
        pathogenType: "Fungal",
        susceptibleCrops: ["Tomato", "Potato", "Pepper", "Roma Tomatoes"],
        riskScore: Math.min(100, Math.round((humidity / 90) * 45 + (temp >= 20 && temp <= 29 ? 40 : 15) + (rainSum > 2 ? 15 : 0))),
        riskLevel: humidity > 70 && temp >= 20 ? "High" : humidity > 55 ? "Moderate" : "Low",
        favorableConditions: "Warm temperatures (24–29°C) with prolonged relative humidity > 75% or leaf wetness.",
        currentTrigger: `Current humidity is ${humidity}% with ambient temperature of ${temp.toFixed(1)}°C.`,
        recommendedAction: "Apply preventive bio-fungicide (Bacillus subtilis) or copper spray. Prune bottom foliage to promote canopy aeration.",
        preventiveSprayWindow: weather.agriculturalMetrics.sprayRecommendation,
      },
      {
        id: "risk-late-blight",
        diseaseName: "Late Blight (Phytophthora infestans)",
        pathogenType: "Oomycete",
        susceptibleCrops: ["Tomato", "Potato"],
        riskScore: Math.min(100, Math.round((humidity > 80 ? 50 : 20) + (temp >= 12 && temp <= 22 ? 40 : 10) + (rainSum > 5 ? 10 : 0))),
        riskLevel: humidity > 80 && temp >= 12 && temp <= 22 ? "Severe" : humidity > 70 ? "Moderate" : "Low",
        favorableConditions: "Cool, wet conditions (12–21°C) with continuous high humidity (>90%) and rain.",
        currentTrigger: `Dew point and overnight leaf wetness index are currently ${humidity > 75 ? "elevated" : "nominal"}.`,
        recommendedAction: "Scout fields along low-lying drainage depressions. Prepare systemic protective treatment if rain continues.",
      },
      {
        id: "risk-powdery-mildew",
        diseaseName: "Powdery Mildew (Erysiphales)",
        pathogenType: "Fungal",
        susceptibleCrops: ["Corn", "Wheat", "Cucurbit", "Tomato", "Grape", "Apple"],
        riskScore: Math.min(100, Math.round((humidity >= 50 && humidity <= 75 ? 50 : 30) + (temp >= 18 && temp <= 28 ? 35 : 15))),
        riskLevel: temp >= 18 && temp <= 28 && humidity > 50 ? "Moderate" : "Low",
        favorableConditions: "Warm, dry days (20–27°C) following humid mornings. Does not require free water to germinate.",
        currentTrigger: `Warm daytime highs (${temp.toFixed(1)}°C) favor airborne spore dissemination.`,
        recommendedAction: "Apply potassium bicarbonate or sulfur dust early in vegetative growth.",
      },
      {
        id: "risk-stripe-rust",
        diseaseName: "Stripe Leaf Rust (Puccinia striiformis)",
        pathogenType: "Fungal",
        susceptibleCrops: ["Wheat", "Barley", "Oats"],
        riskScore: Math.min(100, Math.round((temp >= 10 && temp <= 18 ? 55 : 20) + (humidity > 65 ? 35 : 15))),
        riskLevel: temp >= 10 && temp <= 18 && humidity > 65 ? "High" : "Moderate",
        favorableConditions: "Cool nights (7–12°C) with heavy dew, followed by mild sunny days (15–20°C).",
        currentTrigger: `Microclimate in wheat fields is entering susceptible temperature envelope.`,
        recommendedAction: "Inspect flag leaves for bright yellow linear pustules. Apply triazole fungicide before flag leaf damage.",
      },
      {
        id: "risk-fusarium",
        diseaseName: "Fusarium Root & Stem Rot",
        pathogenType: "Fungal",
        susceptibleCrops: ["Corn", "Tomato", "Potato", "Soybean", "Cotton"],
        riskScore: Math.min(100, Math.round((temp > 27 ? 45 : 20) + (rainSum > 15 ? 40 : 15))),
        riskLevel: temp > 28 && rainSum > 10 ? "High" : "Low",
        favorableConditions: "High soil temperatures (>27°C) combined with saturated, poorly drained soil conditions.",
        currentTrigger: `Soil drainage profile is currently ${rainSum > 15 ? "saturated" : "well-aerated"}.`,
        recommendedAction: "Avoid over-irrigating heavy clay soils. Ensure good soil organic matter and beneficial microbial activity.",
      },
    ];

    setDiseaseRisks(calculatedRisks);
  }, [weather, crops]);

  useEffect(() => {
    if (weather) {
      recalculateAgronomy();
    }
  }, [weather, crops, recalculateAgronomy]);

  // Crop CRUD
  const addCrop = async (newCropData: Omit<CropRecord, "id" | "createdAt">) => {
    const tempId = `crop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCrop: CropRecord = {
      ...newCropData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    setCrops((prev) => [newCrop, ...prev]);

    if (authToken) {
      try {
        const res = await fetch("/api/user/crops", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(newCrop),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.crops) setCrops(data.crops);
        }
      } catch (err) {
        console.error("Error persisting crop to backend:", err);
      }
    }

    addAlert({
      category: "Operation",
      type: "task",
      severity: "Low",
      title: `Crop Added: ${newCrop.cropName}`,
      explanation: `Field ${newCrop.fieldName} (${newCrop.fieldSize} ${farm.areaUnit}) registered in ${newCrop.soilType} soil.`,
      message: `Field ${newCrop.fieldName} (${newCrop.fieldSize} ${farm.areaUnit}) registered in ${newCrop.soilType} soil.`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      recommendedAction: "Monitor crop emergence and establish baseline moisture.",
      provenance: "USER-PROVIDED DATA",
      cropId: newCrop.id,
      cropName: newCrop.cropName,
      actionTab: "My Crops",
      actionLabel: "View Crop",
      read: false,
    });
  };

  const updateCrop = async (id: string, updated: Partial<CropRecord>) => {
    setCrops((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    if (selectedCropForDetail && selectedCropForDetail.id === id) {
      setSelectedCropForDetail((prev) => (prev ? { ...prev, ...updated } : null));
    }

    if (authToken) {
      try {
        const res = await fetch(`/api/user/crops/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updated),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.crops) setCrops(data.crops);
        }
      } catch (err) {
        console.error("Error updating crop on backend:", err);
      }
    }
  };

  const deleteCrop = async (id: string) => {
    const target = crops.find((c) => c.id === id);
    setCrops((prev) => prev.filter((c) => c.id !== id));
    if (selectedCropForDetail && selectedCropForDetail.id === id) {
      setSelectedCropForDetail(null);
    }

    if (authToken) {
      try {
        await fetch(`/api/user/crops/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (err) {
        console.error("Error deleting crop on backend:", err);
      }
    }

    if (target) {
      addAlert({
        category: "Operation",
        type: "task",
        severity: "Low",
        title: `Crop Removed`,
        explanation: `${target.cropName} in ${target.fieldName} was removed from active crops.`,
        message: `${target.cropName} in ${target.fieldName} was removed from active crops.`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        recommendedAction: "Review remaining crop acreage and update rotation schedules.",
        provenance: "USER-PROVIDED DATA",
        read: false,
      });
    }
  };

  const recordIrrigation = async (id: string, date?: string) => {
    const irrigationDate = date || new Date().toISOString().split("T")[0];
    await updateCrop(id, { lastIrrigationDate: irrigationDate });

    const targetCrop = crops.find((c) => c.id === id);
    if (targetCrop) {
      const newRecord: IrrigationRecord = {
        id: `irrig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cropId: targetCrop.id,
        cropName: targetCrop.cropName,
        fieldName: targetCrop.fieldName,
        date: irrigationDate,
        depthMm: 25,
        volumeGallons: Math.round(targetCrop.fieldSize * 27154 * 0.98),
        volumeLiters: Math.round(targetCrop.fieldSize * 25 * 4046.86 * 0.1),
        notes: `Recorded on ${irrigationDate} via Irrigation Advisor.`,
        createdAt: new Date().toISOString(),
      };
      setIrrigationRecords((prev) => [newRecord, ...prev]);

      if (authToken) {
        try {
          await fetch("/api/user/irrigation/log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(newRecord),
          });
        } catch (e) {
          console.warn("Irrigation log error:", e);
        }
      }

      addAlert({
        category: "Irrigation",
        type: "irrigation",
        severity: "Info",
        title: `Irrigation Logged: ${targetCrop.cropName}`,
        explanation: `Water application of 25mm recorded for ${targetCrop.fieldName}. Soil moisture index recalculated.`,
        message: `Irrigation recorded for ${targetCrop.cropName} on ${irrigationDate}. Water balance updated.`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        recommendedAction: "Monitor soil tensiometer and schedule next cycle in accordance with evapotranspiration rates.",
        provenance: "USER-PROVIDED DATA",
        cropId: targetCrop.id,
        cropName: targetCrop.cropName,
        actionTab: "Irrigation Advisor",
        actionLabel: "Check Status",
        read: false,
      });
    }
  };

  const logCustomIrrigation = async (recordData: Omit<IrrigationRecord, "id" | "createdAt">) => {
    const newRecord: IrrigationRecord = {
      ...recordData,
      id: `irrig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setIrrigationRecords((prev) => [newRecord, ...prev]);

    if (recordData.cropId) {
      await updateCrop(recordData.cropId, { lastIrrigationDate: recordData.date });
    }

    if (authToken) {
      try {
        await fetch("/api/user/irrigation/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(newRecord),
        });
      } catch (e) {
        console.warn("Irrigation custom log error:", e);
      }
    }

    addAlert({
      category: "Irrigation",
      type: "irrigation",
      severity: "Info",
      title: `Irrigation Applied: ${recordData.cropName || recordData.fieldName}`,
      explanation: `${recordData.depthMm}mm water applied to ${recordData.fieldName}. Notes: ${recordData.notes || "Standard cycle"}.`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      recommendedAction: "Verify field drainage channels and assess canopy response over next 24-48 hours.",
      provenance: "USER-PROVIDED DATA",
      cropId: recordData.cropId,
      cropName: recordData.cropName,
      actionTab: "Irrigation Advisor",
      actionLabel: "View Water Balance",
      read: false,
    });
  };

  // Scans
  const addScanResult = async (scan: ScanResult) => {
    setScanHistory((prev) => [scan, ...prev]);

    if (authToken) {
      try {
        const res = await fetch("/api/user/scans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(scan),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.scans) setScanHistory(data.scans);
        }
      } catch (err) {
        console.error("Error saving scan to backend:", err);
      }
    }

    const scanDate = new Date(scan.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Alert for Crop Scan Diagnostic Concerns
    if (scan.severity === "Severe" || scan.severity === "Moderate" || (scan.diagnosis && !scan.diagnosis.toLowerCase().includes("healthy"))) {
      addAlert({
        category: "Scan",
        type: "scan",
        severity: scan.severity === "Severe" ? "Critical" : "Warning",
        title: `Crop Scan Concern: ${scan.possibleCondition || scan.diagnosis} in ${scan.cropType}`,
        explanation: `Visual leaf assessment identified symptoms: ${scan.visibleSymptoms?.join("; ") || scan.symptoms?.join("; ") || "tissue lesions"}. Urgency: ${scan.urgency || "Review promptly"}.`,
        message: `${scan.severity} severity detected in ${scan.cropType}. Action urgency: ${scan.urgency}.`,
        date: scanDate,
        recommendedAction: scan.recommendedNextSteps?.[0] || "Prune symptomatic leaves and isolate section to prevent pathogen spread.",
        provenance: "DEMO AI ASSESSMENT",
        cropId: scan.cropId,
        cropName: scan.cropType,
        actionTab: "Crop Scanner",
        actionLabel: "Review Diagnosis",
        read: false,
      });
    }

    // 2. Alert for Low-Confidence Assessments (< 75%)
    if (scan.confidence < 75) {
      addAlert({
        category: "Scan",
        type: "scan",
        severity: "Info",
        title: `Low-Confidence Diagnosis: ${scan.cropType} (${scan.confidence}% Confidence)`,
        explanation: `Visual symptoms are ambiguous or overlap across multiple agronomic conditions. Limitations: ${scan.limitations || "2D image resolution constraints"}.`,
        message: `Low model confidence (${scan.confidence}%) for ${scan.cropType}. Field verification advised.`,
        date: scanDate,
        recommendedAction: "Inspect physical foliage in field, perform soil nutrient/pH test, or consult a local agricultural extension specialist before applying chemicals.",
        provenance: "DEMO AI ASSESSMENT",
        cropId: scan.cropId,
        cropName: scan.cropType,
        actionTab: "Crop Scanner",
        actionLabel: "Inspect Diagnostic",
        read: false,
      });
    }
  };

  const deleteScanResult = async (id: string) => {
    setScanHistory((prev) => prev.filter((s) => s.id !== id));
    if (authToken) {
      try {
        await fetch(`/api/user/scans/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (err) {
        console.error("Error deleting scan from backend:", err);
      }
    }
  };

  // Alerts
  const addAlert = (newAlert: Omit<FarmAlert, "id" | "timestamp" | "dismissed">) => {
    const alert: FarmAlert = {
      ...newAlert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: "Just now",
      dismissed: false,
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const dismissAlert = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
    if (authToken) {
      try {
        await fetch("/api/user/alerts/dismiss", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ alertId: id }),
        });
      } catch (e) {}
    }
  };

  const markAlertRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    if (authToken) {
      try {
        await fetch("/api/user/alerts/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ alertId: id }),
        });
      } catch (e) {}
    }
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearResolvedAlerts = () => {
    setAlerts((prev) => prev.filter((a) => !a.dismissed));
  };

  // Farm Management
  const createFarm = (newFarm: FarmProfile) => {
    setFarms((prev) => [newFarm, ...prev]);
    setFarm(newFarm);
    if (authToken) {
      fetch("/api/user/farm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newFarm),
      }).catch(() => {});
    }
  };

  const switchFarm = (name: string) => {
    const found = farms.find((f) => f.name === name);
    if (found) setFarm(found);
  };

  const deleteFarm = (name: string) => {
    setFarms((prev) => prev.filter((f) => f.name !== name));
  };

  const updateFarm = (updated: Partial<FarmProfile>) => {
    const next = { ...farm, ...updated };
    setFarm(next);
    setFarms((prev) => prev.map((f) => (f.name === farm.name ? next : f)));
    if (authToken) {
      fetch("/api/user/farm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(next),
      }).catch(() => {});
    }
  };

  const updateFarmProfile = (updated: Partial<FarmProfile>) => {
    updateFarm(updated);
  };

  const resetToDefaults = () => {
    if (isDemoMode) {
      setFarm(demoFarm);
      setFarms([demoFarm]);
      setCrops(demoCrops);
      setScanHistory(demoScans);
      setAlerts(demoAlerts);
    }
  };

  const openScannerWithCrop = (cropName: string, stage: string) => {
    setSelectedCropForScan({ cropName, stage });
    setActiveTab("Crop Scanner");
  };

  // Formatting helpers
  const formatTemp = (celsius: number) => {
    if (tempUnit === "F") {
      const f = Math.round((celsius * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(celsius * 10) / 10}°C`;
  };

  const formatArea = (val: number) => {
    return `${val.toLocaleString()} ${farm.areaUnit}`;
  };

  const formatWaterVolume = (liters: number) => {
    if (farm.areaUnit === "acres") {
      const gallons = Math.round(liters * 0.264172);
      if (gallons > 1000000) return `${(gallons / 1000000).toFixed(2)}M gal`;
      if (gallons > 1000) return `${(gallons / 1000).toFixed(0)}k gal`;
      return `${gallons.toLocaleString()} gal`;
    }
    if (liters > 1000000) return `${(liters / 1000000).toFixed(2)}M L`;
    if (liters > 1000) return `${(liters / 1000).toFixed(0)}k L`;
    return `${liters.toLocaleString()} L`;
  };

  const isAuthenticated = Boolean(currentUser || isDemoMode);

  return (
    <FarmContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isDemoMode,
        isLoadingAuth,
        authError,
        setAuthError,
        signUp,
        logIn,
        signInWithGoogle,
        signInWithGoogleCredential,
        logOut,
        startDemoMode,
        completeFarmSetup,
        activeTab,
        activeTabKey,
        setActiveTab,
        farm,
        farms,
        createFarm,
        switchFarm,
        updateFarm,
        updateFarmProfile,
        deleteFarm,
        resetToDefaults,
        crops,
        addCrop,
        updateCrop,
        deleteCrop,
        recordIrrigation,
        irrigationRecords,
        logCustomIrrigation,
        selectedCropForDetail,
        setSelectedCropForDetail,
        weather,
        isLoadingWeather,
        weatherError,
        refreshWeather,
        scanHistory,
        addScanResult,
        deleteScanResult,
        alerts,
        dismissAlert,
        markAlertRead,
        markAllAlertsRead,
        addAlert,
        clearResolvedAlerts,
        irrigationAdvice,
        diseaseRisks,
        recalculateAgronomy,
        tempUnit,
        setTempUnit,
        formatTemp,
        formatArea,
        formatWaterVolume,
        openScannerWithCrop,
        selectedCropForScan,
        setSelectedCropForScan,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
};
