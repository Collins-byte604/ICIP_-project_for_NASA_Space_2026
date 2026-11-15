import { useState } from "react";
import {
  AppLanguage,
  AstronautDatabase,
  AstronautIdentity,
  DailyScanRecord,
  EmergencyLevel,
  EmergencyLogEntry,
  MedicalBaseline,
  MissionStage,
} from "./types/icip";
import {
  appendEmergencyRecord,
  appendScanRecord,
  clearDatabase,
  loadDatabase,
  resolveEmergencyRecord,
  saveBaseline,
  saveDatabase,
  saveIdentity,
} from "./utils/storage";
import { soundEngine } from "./utils/soundEngine";
import { WelcomeEntrance } from "./components/WelcomeEntrance";
import { TopNavBar } from "./components/TopNavBar";
import { Stage1Login } from "./components/Stage1Login";
import { Stage2Onboarding } from "./components/Stage2Onboarding";
import { Stage3CabinScanner } from "./components/Stage3CabinScanner";
import { Stage4SuitEmergency } from "./components/Stage4SuitEmergency";

export default function App() {
  const [lang, setLang] = useState<AppLanguage>("en");
  const [db, setDb] = useState<AstronautDatabase>(() => loadDatabase());
  const [showWelcome, setShowWelcome] = useState(true);
  const [stage, setStage] = useState<MissionStage>(() => {
    const initial = loadDatabase();
    if (!initial.identity) return "login";
    if (!initial.baseline) return "onboarding";
    return initial.lastStage === "login" ? "cabin" : initial.lastStage;
  });

  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>(1);
  const [emergencySymptom, setEmergencySymptom] = useState<string>("");

  const handleEnterFromWelcome = () => {
    soundEngine.playStartupChime();
    setShowWelcome(false);
    setStage("login");
  };

  const handleResumeFromWelcome = () => {
    soundEngine.playStartupChime();
    setShowWelcome(false);
    const nextStage: MissionStage = db.baseline ? "cabin" : "onboarding";
    setStage(nextStage);
  };

  const handleSelectStage = (nextStage: MissionStage) => {
    if (nextStage !== "suit" && nextStage !== "cabin" && emergencyActive) {
      soundEngine.stopEmergencyAlarm();
      soundEngine.stopSpeech();
      setEmergencyActive(false);
    }
    setStage(nextStage);
    const updated = { ...db, lastStage: nextStage };
    setDb(updated);
    saveDatabase(updated);
  };

  const handleAuthenticate = (identity: AstronautIdentity) => {
    soundEngine.playSuccessTone();
    const nextStage: MissionStage = db.baseline ? "cabin" : "onboarding";
    const updated = saveIdentity(db, identity, nextStage);
    setDb(updated);
    setStage(nextStage);
  };

  const handleResumeExisting = () => {
    soundEngine.playStartupChime();
    const nextStage: MissionStage = db.baseline ? "cabin" : "onboarding";
    handleSelectStage(nextStage);
  };

  const handleSaveBaseline = (baseline: MedicalBaseline) => {
    soundEngine.playSuccessTone();
    const updated = saveBaseline(db, baseline, "cabin");
    setDb(updated);
    setStage("cabin");
  };

  const handleSaveScan = (record: DailyScanRecord) => {
    const updated = appendScanRecord(db, record);
    setDb(updated);
  };

  const handleTriggerScanEmergency = (level: EmergencyLevel, reason: string) => {
    setEmergencyLevel(level);
    setEmergencySymptom(reason);
    setEmergencyActive(true);
  };

  const handleSilenceScanEmergency = () => {
    soundEngine.stopEmergencyAlarm();
    soundEngine.stopSpeech();
    setEmergencyActive(false);
  };

  const handleLogEmergency = (entry: EmergencyLogEntry) => {
    const updated = appendEmergencyRecord(db, entry);
    setDb(updated);
  };

  const handleResolveEmergency = (entryId: string) => {
    soundEngine.stopEmergencyAlarm();
    soundEngine.stopSpeech();
    soundEngine.playSuccessTone();
    setEmergencyActive(false);
    const updated = resolveEmergencyRecord(db, entryId);
    setDb(updated);
  };

  const handleResetSession = () => {
    soundEngine.stopEmergencyAlarm();
    soundEngine.stopSpeech();
    setEmergencyActive(false);
    const fresh = clearDatabase();
    setDb(fresh);
    setStage("login");
    setShowWelcome(true);
  };

  const handleFillDemo = () => {
    soundEngine.playSuccessTone();
    const demoIdentity: AstronautIdentity = {
      firstName: "Elena",
      lastName: "Vásquez",
      nasaId: "NASA-AST-408",
      passwordAssigned: "ORION-2026-XP",
      authenticatedAt: new Date().toISOString(),
    };
    const updated = saveIdentity(db, demoIdentity, "onboarding");
    setDb(updated);
    setStage("onboarding");
  };

  if (showWelcome) {
    return (
      <WelcomeEntrance
        lang={lang}
        onChangeLang={setLang}
        hasSavedSession={Boolean(db.identity)}
        savedAstronautName={
          db.identity ? `${db.identity.firstName} ${db.identity.lastName}` : undefined
        }
        onEnter={handleEnterFromWelcome}
        onResumeSaved={db.identity ? handleResumeFromWelcome : undefined}
      />
    );
  }

  const pageBg = emergencyActive
    ? emergencyLevel === 3
      ? "bg-[#0E0507]"
      : emergencyLevel === 2
      ? "bg-[#0D0A04]"
      : "bg-[#050A12]"
    : "bg-[#07090E]";

  const isEs = lang === "es";

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${pageBg} text-slate-100`}>
      <TopNavBar
        lang={lang}
        currentStage={stage}
        identity={db.identity}
        baseline={db.baseline}
        emergencyActive={emergencyActive}
        emergencyLevel={emergencyLevel}
        onSelectStage={handleSelectStage}
        onResetSession={handleResetSession}
        onFillDemo={handleFillDemo}
      />

      <main className="flex-1">
        {stage === "login" && (
          <Stage1Login
            lang={lang}
            existingIdentity={db.identity}
            onAuthenticate={handleAuthenticate}
            onResumeExisting={handleResumeExisting}
          />
        )}

        {stage === "onboarding" && db.identity && (
          <Stage2Onboarding
            lang={lang}
            identity={db.identity}
            existingBaseline={db.baseline}
            onSaveBaseline={handleSaveBaseline}
          />
        )}

        {stage === "cabin" && db.identity && db.baseline && (
          <Stage3CabinScanner
            lang={lang}
            identity={db.identity}
            baseline={db.baseline}
            scanHistory={db.scanHistory}
            emergencyActive={emergencyActive}
            emergencyLevel={emergencyLevel}
            onSaveScan={handleSaveScan}
            onTriggerScanEmergency={handleTriggerScanEmergency}
            onSilenceScanEmergency={handleSilenceScanEmergency}
            onProceedToSuit={() => handleSelectStage("suit")}
          />
        )}

        {stage === "suit" && db.identity && db.baseline && (
          <Stage4SuitEmergency
            lang={lang}
            identity={db.identity}
            baseline={db.baseline}
            latestScan={db.scanHistory[0] ?? null}
            emergencyHistory={db.emergencyHistory}
            emergencyActive={emergencyActive}
            emergencyLevel={emergencyLevel}
            initialSymptom={emergencySymptom}
            onEmergencyStateChange={(active, level) => {
              setEmergencyActive(active);
              if (level) setEmergencyLevel(level);
            }}
            onLogEmergency={handleLogEmergency}
            onResolveEmergency={handleResolveEmergency}
            onBackToCabin={() => handleSelectStage("cabin")}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#07090E] py-4 px-6">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            ICIP · Instant Care (Innovative Protection) ICIP · Universal monitoring of
            astronauts caring for and protecting lives
          </span>
          <div className="flex items-center gap-4">
            <span>
              {isEs
                ? "Equipo JPD Astro ladera · NASA Space Apps Challenge · Fuentes oficiales de la NASA"
                : "Team JPD Astro ladera · NASA Space Apps Challenge · Official NASA Sources"}
            </span>
            <div
              role="group"
              aria-label={isEs ? "Idioma" : "Language"}
              className="inline-flex rounded border border-slate-800 bg-[#0D121B] p-0.5 font-mono text-[11px]"
            >
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded px-2 py-0.5 transition-colors ${
                  lang === "en"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`rounded px-2 py-0.5 transition-colors ${
                  lang === "es"
                    ? "bg-cyan-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
