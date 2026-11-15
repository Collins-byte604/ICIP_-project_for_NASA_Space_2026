export type AppLanguage = "en" | "es";

export type MissionStage = "login" | "onboarding" | "cabin" | "suit";

export type EmergencyLevel = 1 | 2 | 3;

export type BodyZoneId =
  | "cranium"
  | "thorax"
  | "abdomen"
  | "upperLimbs"
  | "lowerLimbs";

export type ClinicalStatus = "nominal" | "observacion" | "alerta";

export interface AstronautIdentity {
  firstName: string;
  lastName: string;
  nasaId: string;
  passwordAssigned: string;
  authenticatedAt: string;
}

export interface MedicalBaseline {
  generalCondition: "Optima" | "Acondicionada" | "En observacion" | "Recuperacion";
  weightKg: number;
  heightCm: number;
  diseaseHistory: string;
  knownComplications: string;
  allergies: string;
  baselineGlucoseMgDl: number;
  restingHeartRateBpm: number;
  nutritionPreferences: string;
  hydrationTargetLiters: number;
  updatedAt: string;
}

export interface DailySubjectiveCheckIn {
  physicalFeeling: string;
  physicalScore: number;
  mentalState: string;
  mentalScore: number;
  emotionalState: string;
  emotionalScore: number;
  notes: string;
}

export interface CabinSensorMetrics {
  heartRateBpm: number;
  systolicMmHg: number;
  diastolicMmHg: number;
  spo2Percent: number;
  bodyTempC: number;
  glucoseMgDl: number;
  hydrationPercent: number;
  radiationMsv: number;
  muscleIndex: number;
  stressHrvMs: number;
}

export interface ZoneAnalysis {
  zoneId: BodyZoneId;
  label: string;
  status: ClinicalStatus;
  keyMetric: string;
  summary: string;
  recommendation: string;
}

export interface DailyScanRecord {
  id: string;
  timestamp: string;
  subjective: DailySubjectiveCheckIn;
  metrics: CabinSensorMetrics;
  overallSummary: string;
  zoneReports: ZoneAnalysis[];
  emergencyLevel: EmergencyLevel;
  emergencyReason: string;
  aiGenerated: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SuitTelemetry {
  o2Percent: number;
  suitPressureKpa: number;
  batteryPercent: number;
  suitTempC: number;
  heartRateBpm: number;
  spo2Percent: number;
  glucoseMgDl: number;
  co2MmHg: number;
}

export interface EmergencyStep {
  order: number;
  title: string;
  instruction: string;
  timeframe: string;
}

export interface EmergencyProtocolResponse {
  level?: EmergencyLevel;
  severity: "critica" | "urgente" | "moderada";
  headline: string;
  contraindicationAlert: string;
  steps: EmergencyStep[];
  aiGenerated?: boolean;
}

export interface DistressPacket {
  id: string;
  timestamp: string;
  target:
    | "Cabina Central"
    | "Tierra (Houston MCC)"
    | "Central Cabin"
    | "Earth (Houston MCC)";
  orbitalCoords: string;
  latencyMs: number;
  acknowledged: boolean;
  payloadSummary: string;
}

export interface EmergencyLogEntry {
  id: string;
  timestamp: string;
  level: EmergencyLevel;
  symptom: string;
  details: string;
  protocol: EmergencyProtocolResponse;
  packets: DistressPacket[];
  resolvedAt?: string;
}

export interface AstronautDatabase {
  identity: AstronautIdentity | null;
  baseline: MedicalBaseline | null;
  scanHistory: DailyScanRecord[];
  emergencyHistory: EmergencyLogEntry[];
  lastStage: MissionStage;
}
