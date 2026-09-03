export type AreaUnit = 'acres' | 'hectares';
export type SoilType = 'Sandy' | 'Loam' | 'Clay' | 'Sandy Loam' | 'Clay Loam' | 'Silt Loam' | 'Peat' | 'Chalky';
export type GrowthStage = 'Germination' | 'Vegetative' | 'Flowering' | 'Fruit Development' | 'Ripening' | 'Maturity / Harvest';
export type CropHealthStatus = 'Optimal' | 'Attention' | 'At Risk' | 'Dormant';

export interface UserAccount {
  id: string;
  email: string;
  farmerName: string;
  createdAt: string;
  farmSetupCompleted: boolean;
  authProvider?: 'local' | 'google';
  avatarUrl?: string;
}

export interface FarmProfile {
  id?: string;
  userId?: string;
  name: string;
  farmerName?: string;
  location: string;
  latitude: number;
  longitude: number;
  totalArea: number;
  areaUnit: AreaUnit;
  primarySoilType: SoilType;
  establishedYear: number;
}

export interface IrrigationRecord {
  id: string;
  cropId: string;
  cropName: string;
  fieldName?: string;
  date: string;
  volumeGallons?: number;
  volumeLiters?: number;
  depthMm?: number;
  notes?: string;
  createdAt: string;
}

export interface CropRecord {
  id: string;
  cropName: string;
  fieldName: string;
  fieldSize: number; // in acres or ha
  soilType: SoilType;
  growthStage: GrowthStage;
  plantingDate: string; // YYYY-MM-DD
  lastIrrigationDate: string; // YYYY-MM-DD
  targetYield?: string;
  healthStatus: CropHealthStatus;
  notes?: string;
  createdAt: string;
}

export interface WeatherCurrent {
  temp: number;
  apparentTemp: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  surfacePressure: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  et0: number; // evapotranspiration mm/day
  uvIndex: number;
}

export interface WeatherHourly {
  time: string;
  temp: number;
  humidity: number;
  precipitationProb: number;
  precipitation: number;
  weatherCode: number;
  et0: number;
  windSpeed: number;
}

export interface WeatherDaily {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbMax: number;
  et0: number;
  uvIndexMax: number;
  weatherCode: number;
  windSpeedMax: number;
  description: string;
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  agriculturalMetrics: {
    sprayingWindowQuality: 'Good' | 'Moderate' | 'Poor';
    sprayRecommendation: string;
    gddToday: number; // Growing Degree Days
    frostRisk: boolean;
    heatStressRisk: boolean;
    fieldWorkability: 'Favorable' | 'Caution' | 'Wet / Impassable';
  };
  locationName: string;
  coordinates: { latitude: number; longitude: number };
  isLive: boolean;
  fetchedAt: string;
}

export interface ScanResult {
  id: string;
  timestamp: string;
  cropType: string;
  crop_type?: string;
  cropId?: string;
  farmId?: string;
  userId?: string;
  image_quality?: 'good' | 'acceptable' | 'poor';
  possibleCondition: string;
  possible_condition?: string;
  diagnosis: string;
  diseaseDetected?: string;
  pathogenType?: string;
  confidenceLevel?: 'low' | 'medium' | 'high';
  confidence: number; // percentage 0 - 100
  confidenceScore?: number;
  severity: 'Healthy' | 'Mild' | 'Moderate' | 'Severe' | 'low' | 'moderate' | 'high';
  severityLevel?: 'low' | 'moderate' | 'high';
  visible_observations?: string[];
  visibleSymptoms: string[];
  symptoms?: string[];
  causes?: string[];
  recommended_actions?: string[];
  recommendedNextSteps: string[];
  when_to_seek_expert_help?: string;
  limitations: string;
  organicTreatments?: string[];
  conventionalTreatments?: string[];
  preventiveMeasures?: string[];
  urgency: 'Immediate' | 'Within 48h' | 'Routine' | 'None';
  imageUrl?: string;
  stageAssessment?: string;
}

export interface DiseaseRiskItem {
  id: string;
  diseaseName: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Oomycete' | 'Pest' | 'Physiological';
  susceptibleCrops: string[];
  riskScore: number; // 0 - 100
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  favorableConditions: string;
  currentTrigger: string;
  recommendedAction: string;
  preventiveSprayWindow?: string;
}

export interface IrrigationAdvice {
  cropId: string;
  cropName: string;
  fieldName: string;
  fieldSize: number;
  soilType: SoilType;
  growthStage: GrowthStage;
  daysSinceIrrigated: number;
  soilMoistureEstimatePercent: number;
  cropWaterRequirementMm: number;
  forecastRainNext3DaysMm: number;
  recommendedAction: 'Irrigate Now' | 'Irrigate Soon' | 'Delay - Rain Forecasted' | 'Adequate Moisture';
  recommendedVolumeMm: number;
  recommendedVolumeLiters: number;
  recommendedVolumeGallons: number;
  waterStressIndex: number; // 0 - 100
  nextIrrigationDate: string;
  reasoning: string;
}

export interface FarmAlert {
  id: string;
  category: 'Irrigation' | 'Disease' | 'Weather' | 'Scan' | 'Operation';
  type?: 'weather' | 'disease' | 'irrigation' | 'task' | 'scan';
  severity: 'Critical' | 'Warning' | 'Info' | 'High' | 'Medium' | 'Low' | 'critical' | 'warning' | 'info';
  title: string;
  explanation: string;
  message?: string; // backwards compatibility
  date: string;
  timestamp?: string; // backwards compatibility
  recommendedAction: string;
  provenance?: 'LIVE WEATHER' | 'USER-PROVIDED DATA' | 'ESTIMATED RECOMMENDATION' | 'DEMO AI ASSESSMENT';
  cropId?: string;
  cropName?: string;
  actionTab?: string;
  actionLabel?: string;
  read?: boolean;
  dismissed?: boolean;
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tags?: string[];
}
