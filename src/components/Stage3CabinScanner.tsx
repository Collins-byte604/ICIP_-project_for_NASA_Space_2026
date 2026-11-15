import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ScanLine,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  AppLanguage,
  AstronautIdentity,
  BodyZoneId,
  ChatMessage,
  DailyScanRecord,
  DailySubjectiveCheckIn,
  EmergencyLevel,
  MedicalBaseline,
} from "../types/icip";
import {
  buildLocalFallbackScanAnalysis,
  classifyEmergencyFromScan,
  getEmergencyLevelMeta,
  ScanSimulationMode,
  simulateCabinSensors,
} from "../utils/medicalEngine";
import { soundEngine } from "../utils/soundEngine";
import { BodyHologram } from "./BodyHologram";
import { ScanHistoryPanel } from "./ScanHistoryPanel";

interface Stage3CabinScannerProps {
  lang?: AppLanguage;
  identity: AstronautIdentity;
  baseline: MedicalBaseline;
  scanHistory: DailyScanRecord[];
  emergencyActive: boolean;
  emergencyLevel: EmergencyLevel;
  onSaveScan: (record: DailyScanRecord) => void;
  onTriggerScanEmergency: (level: EmergencyLevel, reason: string) => void;
  onSilenceScanEmergency: () => void;
  onProceedToSuit: () => void;
}

const PHYSICAL_OPTIONS: Record<AppLanguage, string[]> = {
  en: [
    "Energetic and symptom-free",
    "Mild muscular fatigue",
    "Cephalic fluid heaviness (microgravity)",
    "Lumbar or joint stiffness",
    "Mild discomfort or nausea",
  ],
  es: [
    "Energético y sin molestias",
    "Fatiga muscular leve",
    "Pesadez cefálica (microgravedad)",
    "Rigidez lumbar o articular",
    "Malestar o náusea leve",
  ],
};

const MENTAL_OPTIONS: Record<AppLanguage, string[]> = {
  en: [
    "Optimal focus and clarity",
    "Moderate cognitive load",
    "Drowsiness or mental fatigue",
    "Difficulty concentrating",
  ],
  es: [
    "Enfoque óptimo y lúcido",
    "Carga cognitiva moderada",
    "Somnolencia o fatiga mental",
    "Dificultad de concentración",
  ],
};

const EMOTIONAL_OPTIONS: Record<AppLanguage, string[]> = {
  en: [
    "Calm and emotionally stable",
    "Motivated / positive alertness",
    "Mild operational tension",
    "Elevated stress or irritability",
  ],
  es: [
    "Calma y estabilidad",
    "Motivado / alerta positiva",
    "Tensión operacional leve",
    "Estrés o irritabilidad",
  ],
};

export const Stage3CabinScanner: React.FC<Stage3CabinScannerProps> = ({
  lang = "en",
  identity,
  baseline,
  scanHistory,
  emergencyActive,
  emergencyLevel,
  onSaveScan,
  onTriggerScanEmergency,
  onSilenceScanEmergency,
  onProceedToSuit,
}) => {
  const isEs = lang === "es";
  const levelMetaMap = getEmergencyLevelMeta(lang);

  const [subjective, setSubjective] = useState<DailySubjectiveCheckIn>({
    physicalFeeling: PHYSICAL_OPTIONS[lang][0],
    physicalScore: 8,
    mentalState: MENTAL_OPTIONS[lang][0],
    mentalScore: 8,
    emotionalState: EMOTIONAL_OPTIONS[lang][0],
    emotionalScore: 8,
    notes: "",
  });

  useEffect(() => {
    setSubjective((prev) => ({
      ...prev,
      physicalFeeling: PHYSICAL_OPTIONS[lang].includes(prev.physicalFeeling)
        ? prev.physicalFeeling
        : PHYSICAL_OPTIONS[lang][0],
      mentalState: MENTAL_OPTIONS[lang].includes(prev.mentalState)
        ? prev.mentalState
        : MENTAL_OPTIONS[lang][0],
      emotionalState: EMOTIONAL_OPTIONS[lang].includes(prev.emotionalState)
        ? prev.emotionalState
        : EMOTIONAL_OPTIONS[lang][0],
    }));
  }, [lang]);

  const [simMode, setSimMode] = useState<ScanSimulationMode>("auto");
  const [activeScan, setActiveScan] = useState<DailyScanRecord | null>(
    scanHistory[0] ?? null
  );
  const [selectedZone, setSelectedZone] = useState<BodyZoneId>("thorax");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    if (activeScan && chatMessages.length === 0) {
      setChatMessages([
        {
          id: `init-${activeScan.id}`,
          role: "assistant",
          content: activeScan.overallSummary,
          timestamp: activeScan.timestamp,
        },
      ]);
    }
  }, [activeScan, chatMessages.length]);

  const handleRunScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(12);
    setAiNotice(null);
    soundEngine.playScanPulse();

    const timer = window.setInterval(() => {
      setScanProgress((prev) => (prev >= 88 ? 88 : prev + 14));
    }, 220);

    const metrics = simulateCabinSensors(baseline, subjective, simMode);

    let overallSummary: string;
    let zoneReports;
    let aiGenerated = false;

    try {
      const response = await fetch("/api/ai/scan-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity,
          baseline,
          subjective,
          metrics,
          lang,
        }),
      });

      window.clearInterval(timer);
      setScanProgress(100);

      if (response.ok) {
        const data = await response.json();
        overallSummary = data.overallSummary;
        zoneReports = data.zoneReports;
        aiGenerated = Boolean(data.aiGenerated);
      } else {
        const errBody = await response.json().catch(() => ({}));
        setAiNotice(
          isEs
            ? errBody.error
              ? `Análisis ejecutado con protocolo clínico local (${errBody.error}).`
              : "Análisis ejecutado con protocolo clínico local."
            : errBody.error
            ? `Analysis executed using local clinical protocol (${errBody.error}).`
            : "Analysis executed using local clinical protocol."
        );
        const fallback = buildLocalFallbackScanAnalysis(
          identity,
          baseline,
          subjective,
          metrics,
          lang
        );
        overallSummary = fallback.overallSummary;
        zoneReports = fallback.zoneReports;
      }
    } catch {
      window.clearInterval(timer);
      setScanProgress(100);
      setAiNotice(
        isEs
          ? "Conexión con motor IA no disponible; evaluación local completada."
          : "AI engine link unavailable; local clinical evaluation completed."
      );
      const fallback = buildLocalFallbackScanAnalysis(
        identity,
        baseline,
        subjective,
        metrics,
        lang
      );
      overallSummary = fallback.overallSummary;
      zoneReports = fallback.zoneReports;
    }

    const { level, reason } = classifyEmergencyFromScan(
      baseline,
      subjective,
      metrics,
      zoneReports,
      simMode,
      lang
    );

    const newRecord: DailyScanRecord = {
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      subjective: { ...subjective },
      metrics,
      overallSummary,
      zoneReports,
      emergencyLevel: level,
      emergencyReason: reason,
      aiGenerated,
    };

    setActiveScan(newRecord);
    onSaveScan(newRecord);
    onTriggerScanEmergency(level, reason);

    // Automatic emergency alarm & voice alert immediately upon completing body scan
    soundEngine.startEmergencyAlarm(level);
    const levelColorName = levelMetaMap[level].colorLabel.toLowerCase();
    const spokenAlert = isEs
      ? `Estás frente a una emergencia médica nivel ${level}, código ${levelColorName}, mantén la calma, estoy aquí para ayudarte.`
      : `You are facing a Level ${level} medical emergency, ${levelColorName} code, stay calm, I am here to help you.`;
    soundEngine.speak(spokenAlert, lang);

    const chatAlertPrefix = isEs
      ? `Estás frente a una emergencia médica nivel ${level} (${levelMetaMap[level].colorLabel}), mantén la calma, estoy aquí para ayudarte.`
      : `You are facing a Level ${level} medical emergency (${levelMetaMap[level].colorLabel}), stay calm, I am here to help you.`;

    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `${chatAlertPrefix} ${overallSummary}`,
        timestamp: newRecord.timestamp,
      },
    ]);

    window.setTimeout(() => {
      setIsScanning(false);
    }, 300);
  };

  const handleSendChat = async (customText?: string) => {
    const text = (customText ?? chatInput).trim();
    if (!text || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    if (!customText) setChatInput("");
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          lang,
          context: {
            identity,
            baseline,
            latestScan: activeScan,
            selectedZone,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        const zone = activeScan?.zoneReports.find((z) => z.zoneId === selectedZone);
        const fallbackReply = isEs
          ? zone
            ? `Sobre ${zone.label} (${zone.keyMetric}): ${zone.summary} Recomendación: ${zone.recommendation} Alergias registradas: ${baseline.allergies}.`
            : `Tu expediente base (${baseline.restingHeartRateBpm} lpm en reposo, glucosa ${baseline.baselineGlucoseMgDl} mg/dL) está activo. Ejecuta "Escanear Cuerpo" para obtener lectura en vivo de sensores de cabina.`
          : zone
          ? `Regarding ${zone.label} (${zone.keyMetric}): ${zone.summary} Recommendation: ${zone.recommendation} Recorded allergies: ${baseline.allergies}.`
          : `Your baseline profile (${baseline.restingHeartRateBpm} bpm resting, glucose ${baseline.baselineGlucoseMgDl} mg/dL) is active. Run "Scan Body" for live cabin sensor telemetry.`;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: fallbackReply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: isEs
            ? "Enlace conversacional temporalmente en modo local. Revisa la lectura detallada de cada zona en el panel del holograma."
            : "Conversational link temporarily running in local mode. Review detailed zone readings in the hologram panel.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const activeZoneReport = activeScan?.zoneReports.find(
    (z) => z.zoneId === selectedZone
  );

  const activeAlertMeta = activeScan
    ? levelMetaMap[activeScan.emergencyLevel ?? 1]
    : levelMetaMap[emergencyLevel];

  const hrUnit = isEs ? "lpm" : "bpm";

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-8 space-y-6">
      {/* Top Telemetry Ribbon */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-800 bg-[#0D121B] px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="font-display text-lg font-bold text-white">
            {isEs
              ? "Etapa 3 · Cabina y Escáner Diario de Salud"
              : "Stage 3 · Cabin Console & Daily Health Scanner"}
          </h1>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-mono text-xs text-cyan-400">
            {identity.firstName} {identity.lastName} ({identity.nasaId})
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-mono text-xs text-slate-400">
            {isEs ? "Base" : "Baseline"}: {baseline.restingHeartRateBpm} {hrUnit} /{" "}
            {baseline.baselineGlucoseMgDl} mg/dL
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToSuit}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-200 whitespace-nowrap shrink-0 hover:bg-cyan-500/25 transition-colors"
        >
          {isEs
            ? "Ir a Etapa 4: Modo Traje / Emergencia"
            : "Proceed to Stage 4: EVA Suit / Emergency"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Automatic Scan Emergency Alert Banner (Levels 1 Blue, 2 Yellow, 3 Red) */}
      {emergencyActive && activeScan && (
        <div
          role="alert"
          className={`rounded-xl border p-5 transition-colors ${activeAlertMeta.borderClass} ${activeAlertMeta.bgClass}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 font-mono text-xs font-bold ${activeAlertMeta.badgeBgClass}`}
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                  {activeAlertMeta.severityLabel}
                </span>
                <span className={`font-display text-base font-bold ${activeAlertMeta.textClass}`}>
                  {activeAlertMeta.title}
                </span>
              </div>
              <p className="text-sm font-medium text-white">
                {isEs
                  ? `Asistente ICIP: “Estás frente a una emergencia médica (Nivel ${activeScan.emergencyLevel ?? 1} · ${activeAlertMeta.colorLabel}), mantén la calma, estoy aquí para ayudarte.”`
                  : `ICIP Assistant: “You are facing a medical emergency (Level ${activeScan.emergencyLevel ?? 1} · ${activeAlertMeta.colorLabel}), stay calm, I am here to help you.”`}
              </p>
              <p className="text-xs text-slate-300">{activeScan.emergencyReason}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onSilenceScanEmergency}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#07090E] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-400 hover:text-white transition-colors"
              >
                <VolumeX className="h-4 w-4 text-amber-300" />
                {isEs ? "Silenciar Alarma" : "Silence Alarm"}
              </button>
              <button
                type="button"
                onClick={onProceedToSuit}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${activeAlertMeta.badgeBgClass}`}
              >
                {isEs
                  ? "Abrir Protocolo de Primeros Auxilios"
                  : "Open First-Aid Protocol"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Asymmetric Split Console */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-stretch">
        {/* Left Column: Manual Subjective State + Sensor Scan Trigger */}
        <div className="xl:col-span-3 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0D121B] p-5 space-y-5">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-base font-semibold text-white">
                {isEs ? "01. Evaluación Subjetiva Diaria" : "01. Daily Subjective Check-In"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {isEs
                  ? "Introduce cómo te sientes antes del barrido de sensores."
                  : "Log how you feel before initiating the cabin sensor sweep."}
              </p>
            </div>

            {/* Physical */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="physicalSelect" className="font-medium text-slate-200">
                  {isEs ? "Estado Físico" : "Physical State"}
                </label>
                <span className="font-mono tabular-nums text-cyan-400">
                  {subjective.physicalScore}/10
                </span>
              </div>
              <select
                id="physicalSelect"
                value={subjective.physicalFeeling}
                onChange={(e) =>
                  setSubjective({ ...subjective, physicalFeeling: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {PHYSICAL_OPTIONS[lang].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min={1}
                max={10}
                value={subjective.physicalScore}
                aria-label={isEs ? "Puntuación estado físico" : "Physical condition score"}
                onChange={(e) =>
                  setSubjective({
                    ...subjective,
                    physicalScore: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Mental */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="mentalSelect" className="font-medium text-slate-200">
                  {isEs ? "Estado Mental" : "Mental State"}
                </label>
                <span className="font-mono tabular-nums text-cyan-400">
                  {subjective.mentalScore}/10
                </span>
              </div>
              <select
                id="mentalSelect"
                value={subjective.mentalState}
                onChange={(e) =>
                  setSubjective({ ...subjective, mentalState: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {MENTAL_OPTIONS[lang].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min={1}
                max={10}
                value={subjective.mentalScore}
                aria-label={isEs ? "Puntuación estado mental" : "Mental state score"}
                onChange={(e) =>
                  setSubjective({
                    ...subjective,
                    mentalScore: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Emotional */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="emotionalSelect" className="font-medium text-slate-200">
                  {isEs ? "Estado Emocional" : "Emotional State"}
                </label>
                <span className="font-mono tabular-nums text-cyan-400">
                  {subjective.emotionalScore}/10
                </span>
              </div>
              <select
                id="emotionalSelect"
                value={subjective.emotionalState}
                onChange={(e) =>
                  setSubjective({ ...subjective, emotionalState: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {EMOTIONAL_OPTIONS[lang].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min={1}
                max={10}
                value={subjective.emotionalScore}
                aria-label={isEs ? "Puntuación estado emocional" : "Emotional state score"}
                onChange={(e) =>
                  setSubjective({
                    ...subjective,
                    emotionalScore: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="dailyNotes"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                {isEs ? "Notas de bitácora (opcional)" : "Mission log notes (optional)"}
              </label>
              <textarea
                id="dailyNotes"
                rows={2}
                value={subjective.notes}
                onChange={(e) =>
                  setSubjective({ ...subjective, notes: e.target.value })
                }
                placeholder={
                  isEs
                    ? "Calidad de sueño, apetito o sensación tras ejercicio..."
                    : "Sleep quality, appetite, or post-workout sensation..."
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3 border-t border-slate-800/80">
            {/* Level Simulation Selector */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-slate-400">
                {isEs
                  ? "Calibración de Escáner (Niveles 1–3)"
                  : "Scanner Calibration (Alert Levels 1–3)"}
              </p>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#07090E] p-1 border border-slate-800">
                {[
                  { id: "auto" as ScanSimulationMode, label: "Auto", tone: "text-cyan-300" },
                  {
                    id: 1 as ScanSimulationMode,
                    label: isEs ? "1 Azul" : "1 Blue",
                    tone: "text-blue-400",
                  },
                  {
                    id: 2 as ScanSimulationMode,
                    label: isEs ? "2 Amar." : "2 Yel.",
                    tone: "text-amber-300",
                  },
                  {
                    id: 3 as ScanSimulationMode,
                    label: isEs ? "3 Rojo" : "3 Red",
                    tone: "text-red-400",
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.id)}
                    type="button"
                    onClick={() => setSimMode(opt.id)}
                    className={`rounded py-1.5 text-[11px] font-mono font-medium transition-colors ${
                      simMode === opt.id
                        ? `bg-slate-800 ${opt.tone}`
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {isScanning && (
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px] text-cyan-300 tabular-nums">
                  <span>
                    {isEs ? "Sensores de cabina activos" : "Cabin sensors scanning"}
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isScanning}
              onClick={handleRunScan}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60 transition-colors"
            >
              <ScanLine className="h-4 w-4" />
              {isScanning
                ? isEs
                  ? "Escaneando Cuerpo..."
                  : "Scanning Body..."
                : isEs
                ? "Escanear Cuerpo"
                : "Scan Body"}
            </button>
          </div>
        </div>

        {/* Center Column: Interactive Human Body Hologram + Live Cabin Sensor Readouts */}
        <div className="xl:col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0D121B] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-white">
              {isEs
                ? "02. Holograma Anatómico y Sensores de Cabina"
                : "02. Anatomical Hologram & Cabin Sensors"}
            </h2>
            {activeScan && (
              <span
                className={`font-mono text-xs font-semibold ${
                  levelMetaMap[activeScan.emergencyLevel ?? 1].textClass
                }`}
              >
                {levelMetaMap[activeScan.emergencyLevel ?? 1].severityLabel}
              </span>
            )}
          </div>

          <BodyHologram
            lang={lang}
            isScanning={isScanning}
            scanProgress={scanProgress}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            zoneReports={activeScan?.zoneReports ?? []}
            hasScanned={Boolean(activeScan)}
          />

          {/* 6 Objective Telemetry Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Ritmo Cardíaco" : "Heart Rate"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white">
                {activeScan ? activeScan.metrics.heartRateBpm : "—"}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  {hrUnit}
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Presión Arterial" : "Blood Pressure"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white">
                {activeScan
                  ? `${activeScan.metrics.systolicMmHg}/${activeScan.metrics.diastolicMmHg}`
                  : "—"}
                <span className="ml-1 text-xs font-normal text-slate-400">mmHg</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Saturación SpO2" : "SpO2 Saturation"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-emerald-400">
                {activeScan ? activeScan.metrics.spo2Percent : "—"}
                <span className="ml-1 text-xs font-normal text-slate-400">%</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Glucosa Intersticial" : "Interstitial Glucose"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white">
                {activeScan ? activeScan.metrics.glucoseMgDl : "—"}
                <span className="ml-1 text-xs font-normal text-slate-400">mg/dL</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Temperatura" : "Body Temp"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white">
                {activeScan ? activeScan.metrics.bodyTempC : "—"}
                <span className="ml-1 text-xs font-normal text-slate-400">°C</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#07090E] px-3 py-2.5">
              <p className="text-[11px] text-slate-400">
                {isEs ? "Hidratación / HRV" : "Hydration / HRV"}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-cyan-300">
                {activeScan
                  ? `${activeScan.metrics.hydrationPercent}% · ${activeScan.metrics.stressHrvMs}ms`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Zone Explanation + Conversational AI Assistant */}
        <div className="xl:col-span-4 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0D121B] p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-400" />
                <h2 className="font-display text-base font-semibold text-white">
                  {isEs ? "03. Asistente Médico IA" : "03. AI Medical Assistant"}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {isEs ? "Diagnóstico por zona" : "Zone diagnostics"}
              </span>
            </div>

            {aiNotice && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                {aiNotice}
              </div>
            )}

            {/* Selected Hologram Zone Inspection Card */}
            {activeZoneReport ? (
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-white">
                    {activeZoneReport.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${
                      activeZoneReport.status === "alerta"
                        ? "text-rose-400"
                        : activeZoneReport.status === "observacion"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {activeZoneReport.status === "alerta" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {activeZoneReport.status === "alerta"
                      ? isEs
                        ? "Alerta"
                        : "Alert"
                      : activeZoneReport.status === "observacion"
                      ? isEs
                        ? "Observación"
                        : "Watch"
                      : "Nominal"}
                  </span>
                </div>
                <p className="font-mono text-xs text-cyan-300 tabular-nums">
                  {activeZoneReport.keyMetric}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeZoneReport.summary}
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                  <p className="text-xs text-emerald-300/90">
                    {isEs ? "Protocolo:" : "Protocol:"}{" "}
                    {activeZoneReport.recommendation}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      soundEngine.speak(
                        `${activeZoneReport.label}. ${activeZoneReport.summary} ${activeZoneReport.recommendation}`,
                        lang
                      )
                    }
                    aria-label={isEs ? "Escuchar explicación por voz" : "Listen to voice explanation"}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-cyan-300 whitespace-nowrap shrink-0 hover:border-cyan-500/40"
                  >
                    <Volume2 className="h-3 w-3" />
                    {isEs ? "Voz" : "Voice"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-4 text-xs text-slate-400 leading-relaxed">
                {isEs ? (
                  <>
                    Presiona{" "}
                    <span className="text-cyan-300 font-medium">"Escanear Cuerpo"</span>{" "}
                    para activar los sensores de cabina, clasificar el nivel de alerta
                    (1 Azul, 2 Amarillo o 3 Rojo) y generar el diagnóstico dinámico en el
                    holograma.
                  </>
                ) : (
                  <>
                    Press{" "}
                    <span className="text-cyan-300 font-medium">"Scan Body"</span> to
                    activate cabin sensors, automatically classify emergency alert level
                    (1 Blue, 2 Yellow, or 3 Red), and generate dynamic hologram
                    diagnostics.
                  </>
                )}
              </div>
            )}
          </div>

          {/* Conversational Chat Feed */}
          <div className="flex flex-1 flex-col rounded-lg border border-slate-800 bg-[#07090E] overflow-hidden min-h-[260px]">
            <div className="flex items-center justify-between border-b border-slate-800/90 px-3.5 py-2 text-[11px] font-mono text-slate-400">
              <span>
                {isEs
                  ? "Consulta Conversacional Orbital"
                  : "Orbital Medical Consultation"}
              </span>
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
            </div>

            <div className="flex-1 max-h-[260px] overflow-y-auto p-3.5 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {isEs
                    ? "Realiza un escaneo o escribe una consulta sobre tu estado físico, mental o nutricional."
                    : "Run a body scan or ask a question about your physical, mental, or nutritional status."}
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                          : "bg-slate-900 text-slate-200 border border-slate-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isSendingChat && (
                <p className="font-mono text-[11px] text-cyan-400">
                  {isEs
                    ? "Analizando telemetría y redactando respuesta..."
                    : "Analyzing telemetry and generating medical response..."}
                </p>
              )}
            </div>

            {/* Quick question triggers */}
            <div className="flex flex-wrap gap-1.5 border-t border-slate-800/80 px-3 py-2">
              {(isEs
                ? [
                    "¿Estoy apto para caminata EVA?",
                    "Explica esta zona corporal",
                    "Plan de hidratación hoy",
                  ]
                : [
                    "Am I cleared for EVA spacewalk?",
                    "Explain this body zone",
                    "Today's hydration plan",
                  ]
              ).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendChat(q)}
                  className="rounded border border-slate-700/80 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2 border-t border-slate-800 p-2.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  isEs
                    ? "Pregunta al asistente médico IA..."
                    : "Ask the AI medical assistant..."
                }
                className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                aria-label={isEs ? "Enviar consulta" : "Send message"}
                className="inline-flex items-center justify-center rounded-md bg-cyan-500 p-2 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Historical Health Database */}
      <ScanHistoryPanel
        lang={lang}
        history={scanHistory}
        activeScanId={activeScan?.id ?? null}
        onSelectScan={(scan) => {
          setActiveScan(scan);
          setChatMessages([
            {
              id: `load-${scan.id}`,
              role: "assistant",
              content: scan.overallSummary,
              timestamp: scan.timestamp,
            },
          ]);
        }}
      />
    </section>
  );
};
