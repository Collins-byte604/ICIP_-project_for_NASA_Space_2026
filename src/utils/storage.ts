import {
  AstronautDatabase,
  AstronautIdentity,
  DailyScanRecord,
  EmergencyLogEntry,
  MedicalBaseline,
  MissionStage,
} from "../types/icip";

const STORAGE_KEY = "icip_astronaut_db_v1";

export const EMPTY_DB: AstronautDatabase = {
  identity: null,
  baseline: null,
  scanHistory: [],
  emergencyHistory: [],
  lastStage: "login",
};

export function loadDatabase(): AstronautDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_DB };
    const parsed = JSON.parse(raw) as Partial<AstronautDatabase>;
    return {
      identity: parsed.identity ?? null,
      baseline: parsed.baseline ?? null,
      scanHistory: Array.isArray(parsed.scanHistory) ? parsed.scanHistory : [],
      emergencyHistory: Array.isArray(parsed.emergencyHistory)
        ? parsed.emergencyHistory
        : [],
      lastStage: parsed.lastStage ?? "login",
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

export function saveDatabase(db: AstronautDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function saveIdentity(
  current: AstronautDatabase,
  identity: AstronautIdentity,
  nextStage: MissionStage
): AstronautDatabase {
  const updated: AstronautDatabase = {
    ...current,
    identity,
    lastStage: nextStage,
  };
  saveDatabase(updated);
  return updated;
}

export function saveBaseline(
  current: AstronautDatabase,
  baseline: MedicalBaseline,
  nextStage: MissionStage
): AstronautDatabase {
  const updated: AstronautDatabase = {
    ...current,
    baseline,
    lastStage: nextStage,
  };
  saveDatabase(updated);
  return updated;
}

export function appendScanRecord(
  current: AstronautDatabase,
  record: DailyScanRecord
): AstronautDatabase {
  const updated: AstronautDatabase = {
    ...current,
    scanHistory: [record, ...current.scanHistory].slice(0, 40),
  };
  saveDatabase(updated);
  return updated;
}

export function appendEmergencyRecord(
  current: AstronautDatabase,
  entry: EmergencyLogEntry
): AstronautDatabase {
  const updated: AstronautDatabase = {
    ...current,
    emergencyHistory: [entry, ...current.emergencyHistory].slice(0, 20),
  };
  saveDatabase(updated);
  return updated;
}

export function resolveEmergencyRecord(
  current: AstronautDatabase,
  entryId: string
): AstronautDatabase {
  const updated: AstronautDatabase = {
    ...current,
    emergencyHistory: current.emergencyHistory.map((item) =>
      item.id === entryId
        ? { ...item, resolvedAt: new Date().toISOString() }
        : item
    ),
  };
  saveDatabase(updated);
  return updated;
}

export function clearDatabase(): AstronautDatabase {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return { ...EMPTY_DB };
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}
