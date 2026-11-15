import React, { useEffect, useState } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  Check,
  CheckCircle2,
  Radio,
  ShieldAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  AppLanguage,
  AstronautIdentity,
  DailyScanRecord,
  DistressPacket,
  EmergencyLevel,
  EmergencyLogEntry,
  EmergencyProtocolResponse,
  MedicalBaseline,
  SuitTelemetry,
} from "../types/icip";
import {
  buildLocalFallbackEmergencyProtocol,
  getEmergencyLevelMeta,
} from "../utils/medicalEngine";
import { soundEngine } from "../utils/soundEngine";

interface Stage4SuitEmergencyProps {
  lang?: AppLanguage;
  identity: AstronautIdentity;
  baseline: MedicalBaseline;
  latestScan: DailyScanRecord | null;
  emergencyHistory: EmergencyLogEntry[];
  emergencyActive: boolean;
  emergencyLevel: EmergencyLevel;
  initialSymptom?: string;
  onEmergencyStateChange: (active: boolean, level?: EmergencyLevel) => void;
  onLogEmergency: (entry: EmergencyLogEntry) => void;
  onResolveEmergency: (entryId: string) => void;
  onBackToCabin: () => void;
}

const SYMPTOM_PRESETS: Record<AppLanguage, string[]> = {
  en: [
    "Mild dizziness or suspected hypoxia",
    "Palpitations / chest discomfort",
    "Weakness or hypoglycemia",
    "Extremity impact or injury",
    "Thermal stress or excessive sweating",
  ],
  es: [
    "Mareo leve o sospecha de hipoxia",
    "Palpitaciones / dolor torácico",
    "Debilidad o hipoglucemia",
    "Impacto o lesión en extremidad",
    "Estrés térmico o sudoración excesiva",
  ],
};

export const Stage4SuitEmergency: React.FC<Stage4SuitEmergencyProps> = ({
  lang = "en",
  identity,
  baseline,
  latestScan,
  emergencyHistory,
  emergencyActive,
  emergencyLevel,
  initialSymptom,
  onEmergencyStateChange,
  onLogEmergency,
  onResolveEmergency,
  onBackToCabin,
}) => {
  const isEs = lang === "es";
  const levelMetaMap = getEmergencyLevelMeta(lang);

  const [telemetry, setTelemetry] = useState<SuitTelemetry>({
    o2Percent: 99.4,
    suitPressureKpa: 29.8,
    batteryPercent: 89,
    suitTempC: 21.4,
    heartRateBpm:
      latestScan?.metrics.heartRateBpm ?? baseline.restingHeartRateBpm + 14,
    spo2Percent: latestScan?.metrics.spo2Percent ?? 98.4,
    glucoseMgDl:
      latestScan?.metrics.glucoseMgDl ?? baseline.baselineGlucoseMgDl,
    co2MmHg: 1.7,
  });

  const [evaSeconds, setEvaSeconds] = useState(4925);
  const [selectedLevel, setSelectedLevel] = useState<EmergencyLevel>(emergencyLevel);
  const [selectedSymptom, setSelectedSymptom] = useState(
    initialSymptom || SYMPTOM_PRESETS[lang][0]
  );
  const [customDetails, setCustomDetails] = useState("");
  const [isTriggering, setIsTriggering] = useState(false);

  const [activeEntry, setActiveEntry] = useState<EmergencyLogEntry | null>(() => {
    if (!emergencyActive) return null;
    const symptomText =
      initialSymptom || latestScan?.emergencyReason || SYMPTOM_PRESETS[lang][0];
    const protocol = buildLocalFallbackEmergencyProtocol(
      symptomText,
      baseline,
      telemetry,
      emergencyLevel,
      lang
    );
    const now = new Date().toISOString();
    return {
      id: `emg-scan-${Date.now()}`,
      timestamp: now,
      level: emergencyLevel,
      symptom: symptomText,
      details: isEs
        ? "Detectado automáticamente en escáner corporal de cabina"
        : "Automatically detected by cabin body scanner",
      protocol,
      packets: [
        {
          id: `pkt-auto-cab-${Date.now()}`,
          timestamp: now,
          target: isEs ? "Cabina Central" : "Central Cabin",
          orbitalCoords: "41.42°N 74.61°W · ALT 418 km",
          latencyMs: 14,
          acknowledged: true,
          payloadSummary: `${isEs ? "NIVEL" : "LEVEL"} ${emergencyLevel} · ${symptomText}`,
        },
        {
          id: `pkt-auto-mcc-${Date.now() + 1}`,
          timestamp: now,
          target: isEs ? "Tierra (Houston MCC)" : "Earth (Houston MCC)",
          orbitalCoords: "41.42°N 74.61°W · ALT 418 km",
          latencyMs: 252,
          acknowledged: true,
          payloadSummary: `${
            isEs ? "SOCORRO BIOMÉDICO NIVEL" : "BIOMEDICAL DISTRESS LEVEL"
          } ${emergencyLevel} · ${identity.nasaId}`,
        },
      ],
    };
  });

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [packets, setPackets] = useState<DistressPacket[]>(
    () => activeEntry?.packets ?? []
  );
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(() => soundEngine.isMuted());

  useEffect(() => {
    setSelectedSymptom((prev) =>
      initialSymptom
        ? prev
        : SYMPTOM_PRESETS[lang].includes(prev)
        ? prev
        : SYMPTOM_PRESETS[lang][0]
    );
  }, [lang, initialSymptom]);

  // Live suit telemetry ticker
  useEffect(() => {
    const interval = window.setInterval(() => {
      setEvaSeconds((s) => s + 3);
      setTelemetry((prev) => ({
        ...prev,
        heartRateBpm: Math.max(
          52,
          Math.min(
            165,
            prev.heartRateBpm +
              (emergencyActive
                ? Math.round(Math.random() * 4 - 1)
                : Math.round(Math.random() * 2 - 1))
          )
        ),
        spo2Percent: Number(
          Math.max(
            90.0,
            Math.min(99.9, prev.spo2Percent + (Math.random() * 0.2 - 0.1))
          ).toFixed(1)
        ),
        suitTempC: Number(
          Math.max(
            18.5,
            Math.min(27.5, prev.suitTempC + (Math.random() * 0.2 - 0.1))
          ).toFixed(1)
        ),
        co2MmHg: Number(
          Math.max(
            1.2,
            Math.min(4.8, prev.co2MmHg + (Math.random() * 0.1 - 0.05))
          ).toFixed(1)
        ),
      }));
    }, 3000);
    return () => window.clearInterval(interval);
  }, [emergencyActive]);

  // Continuous distress beacon simulation while emergency is active
  useEffect(() => {
    if (!emergencyActive || !activeEntry) return;
    const beaconTimer = window.setInterval(() => {
      const now = new Date().toISOString();
      const coords = `${(41.2 + Math.random() * 0.4).toFixed(2)}°N ${(
        -74.8 +
        Math.random() * 0.5
      ).toFixed(2)}°W · ALT 418 km`;

      const hrUnit = isEs ? "lpm" : "bpm";

      const packetCabin: DistressPacket = {
        id: `pkt-cab-${Date.now()}`,
        timestamp: now,
        target: isEs ? "Cabina Central" : "Central Cabin",
        orbitalCoords: coords,
        latencyMs: 14 + Math.round(Math.random() * 8),
        acknowledged: true,
        payloadSummary: `${isEs ? "NIVEL" : "LEVEL"} ${activeEntry.level} · ${
          isEs ? "FC" : "HR"
        } ${telemetry.heartRateBpm} ${hrUnit} · SpO2 ${telemetry.spo2Percent}%`,
      };

      const packetEarth: DistressPacket = {
        id: `pkt-mcc-${Date.now() + 1}`,
        timestamp: now,
        target: isEs ? "Tierra (Houston MCC)" : "Earth (Houston MCC)",
        orbitalCoords: coords,
        latencyMs: 248 + Math.round(Math.random() * 45),
        acknowledged: true,
        payloadSummary: `${isEs ? "SOCORRO NIVEL" : "DISTRESS LEVEL"} ${
          activeEntry.level
        } ${identity.nasaId} · ${activeEntry.symptom}`,
      };

      setPackets((prev) => [packetEarth, packetCabin, ...prev].slice(0, 12));
    }, 4500);

    return () => window.clearInterval(beaconTimer);
  }, [emergencyActive, activeEntry, identity.nasaId, telemetry, isEs]);

  const formatMissionTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((totalSec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `T+${hrs}:${mins}:${secs}`;
  };

  const handleActivateEmergency = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setAiNotice(null);
    setCompletedSteps([]);

    const levelToUse = selectedLevel;
    const levelColor = levelMetaMap[levelToUse].colorLabel.toLowerCase();

    soundEngine.startEmergencyAlarm(levelToUse);
    const spokenAlert = isEs
      ? `Estás frente a una emergencia médica nivel ${levelToUse}, código ${levelColor}, mantén la calma, estoy aquí para ayudarte.`
      : `You are facing a Level ${levelToUse} medical emergency, ${levelColor} code, stay calm, I am here to help you.`;
    soundEngine.speak(spokenAlert, lang);

    let protocol: EmergencyProtocolResponse;

    try {
      const response = await fetch("/api/ai/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom: `Level ${levelToUse} (${levelMetaMap[levelToUse].colorLabel}): ${selectedSymptom}`,
          details: customDetails,
          identity,
          baseline,
          suitTelemetry: telemetry,
          lang,
        }),
      });

      if (response.ok) {
        protocol = await response.json();
        protocol.level = levelToUse;
      } else {
        const err = await response.json().catch(() => ({}));
        setAiNotice(
          isEs
            ? err.error
              ? `Protocolo de primeros auxilios activado localmente (${err.error}).`
              : "Protocolo de primeros auxilios activado localmente."
            : err.error
            ? `First-aid protocol activated locally (${err.error}).`
            : "First-aid protocol activated locally."
        );
        protocol = buildLocalFallbackEmergencyProtocol(
          selectedSymptom,
          baseline,
          telemetry,
          levelToUse,
          lang
        );
      }
    } catch {
      setAiNotice(
        isEs
          ? "Sin enlace al servidor IA; protocolo de contingencia autónomo activo."
          : "AI server link unavailable; autonomous contingency protocol active."
      );
      protocol = buildLocalFallbackEmergencyProtocol(
        selectedSymptom,
        baseline,
        telemetry,
        levelToUse,
        lang
      );
    }

    const now = new Date().toISOString();
    const hrUnit = isEs ? "lpm" : "bpm";
    const initialPackets: DistressPacket[] = [
      {
        id: `pkt-init-cab-${Date.now()}`,
        timestamp: now,
        target: isEs ? "Cabina Central" : "Central Cabin",
        orbitalCoords: "41.42°N 74.61°W · ALT 418 km",
        latencyMs: 16,
        acknowledged: true,
        payloadSummary: `${isEs ? "ALERTA NIVEL" : "ALERT LEVEL"} ${levelToUse} (${
          levelMetaMap[levelToUse].colorLabel
        }) · ${selectedSymptom}`,
      },
      {
        id: `pkt-init-mcc-${Date.now() + 1}`,
        timestamp: now,
        target: isEs ? "Tierra (Houston MCC)" : "Earth (Houston MCC)",
        orbitalCoords: "41.42°N 74.61°W · ALT 418 km",
        latencyMs: 264,
        acknowledged: true,
        payloadSummary: `${
          isEs ? "SOCORRO BIOMÉDICO NIVEL" : "BIOMEDICAL DISTRESS LEVEL"
        } ${levelToUse} · SpO2 ${telemetry.spo2Percent}% · ${isEs ? "FC" : "HR"} ${
          telemetry.heartRateBpm
        } ${hrUnit}`,
      },
    ];

    const entry: EmergencyLogEntry = {
      id: `emg-${Date.now()}`,
      timestamp: now,
      level: levelToUse,
      symptom: selectedSymptom,
      details: customDetails.trim(),
      protocol,
      packets: initialPackets,
    };

    setPackets(initialPackets);
    setActiveEntry(entry);
    onLogEmergency(entry);
    onEmergencyStateChange(true, levelToUse);
    setIsTriggering(false);
  };

  const handleResolve = () => {
    if (activeEntry) {
      onResolveEmergency(activeEntry.id);
    } else {
      soundEngine.stopEmergencyAlarm();
      soundEngine.stopSpeech();
      onEmergencyStateChange(false);
    }
    setActiveEntry(null);
    setCompletedSteps([]);
  };

  const handleToggleAudio = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (!nextMuted && emergencyActive) {
      soundEngine.startEmergencyAlarm(activeEntry?.level ?? emergencyLevel);
    }
  };

  const toggleStep = (order: number) => {
    setCompletedSteps((prev) =>
      prev.includes(order) ? prev.filter((s) => s !== order) : [...prev, order]
    );
  };

  const currentLevel = activeEntry?.level ?? emergencyLevel;
  const levelMeta = levelMetaMap[currentLevel];
  const locale = isEs ? "es-ES" : "en-US";
  const hrUnit = isEs ? "lpm" : "bpm";

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-8 space-y-6">
      {/* Portable Suit Header Ribbon */}
      <div
        className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border px-6 py-4 transition-colors ${
          emergencyActive
            ? `${levelMeta.borderClass} ${levelMeta.bgClass}`
            : "border-slate-800 bg-[#0D121B]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="font-display text-lg font-bold text-white">
            {isEs
              ? "Etapa 4 · Sistema Portátil de Traje EVA"
              : "Stage 4 · Portable EVA Suit Emergency System"}
          </h1>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-mono text-xs text-cyan-300 tabular-nums">
            {formatMissionTime(evaSeconds)}
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
              emergencyActive ? levelMeta.textClass : "text-emerald-400"
            }`}
          >
            {emergencyActive ? (
              <>
                <AlertOctagon className="h-3.5 w-3.5" />
                {isEs ? "EMERGENCIA" : "EMERGENCY"} {levelMeta.severityLabel.toUpperCase()}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isEs ? "TRAJE NOMINAL EN MISIÓN" : "SUIT NOMINAL ON MISSION"}
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleAudio}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 hover:border-cyan-500/40 hover:text-white transition-colors"
          >
            {audioMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-amber-400" />
                {isEs ? "Audio Silenciado" : "Audio Muted"}
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                {isEs ? "Audio Activo" : "Audio Active"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onBackToCabin}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#07090E] px-4 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 hover:border-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isEs ? "Volver a Cabina" : "Back to Cabin"}
          </button>
        </div>
      </div>

      {/* Portable Device Frame + Emergency Console */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Portable EVA Suit Telemetry & Emergency Trigger */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between rounded-2xl border p-6 space-y-6 transition-colors ${
            emergencyActive
              ? `${levelMeta.borderClass} ${levelMeta.bgClass}`
              : "border-slate-800 bg-[#0D121B]"
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <p className="font-mono text-xs text-cyan-400">
                  {isEs ? "Módulo Portátil" : "Portable Unit"} · {identity.nasaId}
                </p>
                <h2 className="font-display text-base font-semibold text-white">
                  {isEs
                    ? "Telemetría de Traje y Astronauta"
                    : "Suit & Astronaut Telemetry"}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                BAT {telemetry.batteryPercent}%
              </span>
            </div>

            {/* Suit & Biomedical Live Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "Oxígeno Traje" : "Suit Oxygen"}
                </p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-400">
                  {telemetry.o2Percent}
                  <span className="ml-1 text-xs font-normal text-slate-400">%</span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "Presión Traje" : "Suit Pressure"}
                </p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                  {telemetry.suitPressureKpa}
                  <span className="ml-1 text-xs font-normal text-slate-400">kPa</span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "Ritmo Cardíaco" : "Heart Rate"}
                </p>
                <p
                  className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                    emergencyActive ? levelMeta.textClass : "text-cyan-300"
                  }`}
                >
                  {telemetry.heartRateBpm}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    {hrUnit}
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "SpO2 / Glucosa" : "SpO2 / Glucose"}
                </p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
                  {telemetry.spo2Percent}% · {telemetry.glucoseMgDl}
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    mg/dL
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "Temp. Traje" : "Suit Temp"}
                </p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
                  {telemetry.suitTempC}
                  <span className="ml-1 text-xs font-normal text-slate-400">°C</span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-3">
                <p className="text-[11px] text-slate-400">
                  {isEs ? "CO2 Parcial" : "Partial CO2"}
                </p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
                  {telemetry.co2MmHg}
                  <span className="ml-1 text-xs font-normal text-slate-400">mmHg</span>
                </p>
              </div>
            </div>

            {/* Emergency Trigger Controls */}
            {!emergencyActive ? (
              <div className="space-y-4 rounded-xl border border-slate-700/80 bg-[#07090E] p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <h3 className="font-display text-sm font-semibold">
                    {isEs
                      ? "Disparador de Alerta Médica (Nivel 1–3)"
                      : "Medical Alert Trigger (Level 1–3)"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([1, 2, 3] as EmergencyLevel[]).map((lvl) => {
                    const meta = levelMetaMap[lvl];
                    const active = selectedLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedLevel(lvl)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-mono font-semibold transition-colors ${
                          active
                            ? `${meta.borderClass} ${meta.bgClass} ${meta.textClass}`
                            : "border-slate-800 bg-[#0D121B] text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {isEs ? "Nivel" : "Level"} {lvl} · {meta.colorLabel}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="symptomSelect"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {isEs
                      ? "Complicación o síntoma percibido"
                      : "Perceived symptom or complication"}
                  </label>
                  <select
                    id="symptomSelect"
                    value={selectedSymptom}
                    onChange={(e) => setSelectedSymptom(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D121B] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {SYMPTOM_PRESETS[lang].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="symptomDetails"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {isEs ? "Detalle adicional (opcional)" : "Additional details (optional)"}
                  </label>
                  <input
                    id="symptomDetails"
                    type="text"
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    placeholder={
                      isEs
                        ? "Ej. Visión borrosa al girar escotilla..."
                        : "e.g., Blurred vision near airlock hatch..."
                    }
                    className="w-full rounded-lg border border-slate-700 bg-[#0D121B] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isTriggering}
                  onClick={handleActivateEmergency}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${levelMetaMap[selectedLevel].badgeBgClass}`}
                >
                  <AlertOctagon className="h-4 w-4" />
                  {isTriggering
                    ? isEs
                      ? "Activando Protocolo y Enlace..."
                      : "Activating Protocol & Telemetry Link..."
                    : isEs
                    ? `Activar Alerta Nivel ${selectedLevel} (${levelMetaMap[selectedLevel].colorLabel})`
                    : `Trigger Level ${selectedLevel} Alert (${levelMetaMap[selectedLevel].colorLabel})`}
                </button>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-emerald-500/35 bg-[#07090E] p-4">
                <p className="text-xs text-slate-300">
                  {isEs
                    ? "Cuando hayas ejecutado las maniobras de primeros auxilios y tu estado esté estabilizado en esclusa o cabina, confirma para apagar la alarma."
                    : "Once first-aid procedures are complete and your condition is stabilized inside the airlock or cabin, confirm to silence the alarm."}
                </p>
                <button
                  type="button"
                  onClick={handleResolve}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isEs
                    ? "Confirmar Estabilización y Desactivar Alerta"
                    : "Confirm Stabilization & Clear Alert"}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-400">
            {isEs ? "Alergias críticas en memoria:" : "Critical allergies on file:"}{" "}
            <span className="text-slate-200">{baseline.allergies}</span>
          </div>
        </div>

        {/* Right: AI First-Aid Guidance + Real-Time Distress Telemetry to Cabin & Earth */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div
            className={`rounded-2xl border p-6 space-y-4 ${
              emergencyActive
                ? `${levelMeta.borderClass} ${levelMeta.bgClass}`
                : "border-slate-800 bg-[#0D121B]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <h2 className="font-display text-base font-semibold text-white">
                {isEs
                  ? "Asistente de Primeros Auxilios IA"
                  : "AI First-Aid Medical Assistant"}
              </h2>
              {activeEntry && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const voiceScript = isEs
                        ? `Estás frente a una emergencia médica nivel ${currentLevel}, código ${levelMeta.colorLabel.toLowerCase()}, mantén la calma, estoy aquí para ayudarte. ${activeEntry.protocol.steps
                            .map((s) => `Paso ${s.order}: ${s.title}. ${s.instruction}`)
                            .join(" ")}`
                        : `You are facing a Level ${currentLevel} medical emergency, ${levelMeta.colorLabel.toLowerCase()} code, stay calm, I am here to help you. ${activeEntry.protocol.steps
                            .map((s) => `Step ${s.order}: ${s.title}. ${s.instruction}`)
                            .join(" ")}`;
                      soundEngine.speak(voiceScript, lang);
                    }}
                    className="inline-flex items-center gap-1 rounded border border-slate-600 bg-[#07090E] px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-cyan-400"
                  >
                    <Volume2 className="h-3 w-3 text-cyan-400" />
                    {isEs ? "Leer pasos por voz" : "Read steps aloud"}
                  </button>
                  <span className={`font-mono text-xs font-bold uppercase ${levelMeta.textClass}`}>
                    {levelMeta.severityLabel}
                  </span>
                </div>
              )}
            </div>

            {aiNotice && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {aiNotice}
              </div>
            )}

            {activeEntry ? (
              <div className="space-y-4">
                <div
                  className={`rounded-lg border px-4 py-3 text-xs text-white ${levelMeta.borderClass} bg-[#07090E]`}
                >
                  <span className={`font-mono font-semibold ${levelMeta.textClass}`}>
                    {isEs
                      ? `Asistente de Voz ICIP (${levelMeta.severityLabel}): `
                      : `ICIP Voice Assistant (${levelMeta.severityLabel}): `}
                  </span>
                  {isEs
                    ? "“Estás frente a una emergencia médica, mantén la calma, estoy aquí para ayudarte.”"
                    : "“You are facing a medical emergency, stay calm, I am here to help you.”"}
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#07090E] p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-white">
                    {activeEntry.protocol.headline}
                  </p>
                  <p className="text-xs text-amber-300">
                    {isEs ? "Contraindicación / Alergias:" : "Contraindication / Allergies:"}{" "}
                    {activeEntry.protocol.contraindicationAlert}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {activeEntry.protocol.steps.map((step) => {
                    const checked = completedSteps.includes(step.order);
                    return (
                      <button
                        key={step.order}
                        type="button"
                        onClick={() => toggleStep(step.order)}
                        className={`w-full text-left flex items-start gap-3.5 rounded-lg border p-3.5 transition-colors ${
                          checked
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-slate-800 bg-[#07090E] hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                            checked
                              ? "bg-emerald-500 text-slate-950"
                              : `${levelMeta.badgeBgClass}`
                          }`}
                        >
                          {checked ? <Check className="h-3.5 w-3.5" /> : step.order}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                checked ? "text-emerald-200 line-through" : "text-white"
                              }`}
                            >
                              {step.title}
                            </span>
                            <span className="font-mono text-[11px] text-cyan-300 shrink-0">
                              {step.timeframe}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {step.instruction}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-[#07090E] p-6 text-sm text-slate-400 leading-relaxed">
                {isEs
                  ? "Sistema en espera de guardia biomédica. Si el escáner corporal detectó una emergencia o sientes algún síntoma en el traje, activa el nivel correspondiente (1 Azul, 2 Amarillo o 3 Rojo) para desplegar primeros auxilios inmediatos."
                  : "System on biomedical standby. If the cabin body scanner flagged an anomaly or you experience any symptoms during EVA, trigger the matching alert level (1 Blue, 2 Yellow, or 3 Red) for immediate first-aid steps."}
              </div>
            )}
          </div>

          {/* Distress Signal Telemetry Log to Central Cabin & Earth */}
          <div className="flex-1 rounded-2xl border border-slate-800 bg-[#0D121B] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${
                    emergencyActive ? levelMeta.textClass : "text-cyan-400"
                  }`}
                />
                <h2 className="font-display text-base font-semibold text-white">
                  {isEs
                    ? "Enlace de Socorro: Cabina Central y Tierra (MCC)"
                    : "Distress Telemetry Link: Central Cabin & Earth (MCC)"}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {emergencyActive
                  ? isEs
                    ? "Transmitiendo cada 4.5s"
                    : "Transmitting every 4.5s"
                  : isEs
                  ? "Enlace en espera"
                  : "Beacon standby"}
              </span>
            </div>

            {packets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <th className="py-2 pr-3 font-medium">
                        {isEs ? "Hora UTC" : "UTC Time"}
                      </th>
                      <th className="py-2 px-3 font-medium">
                        {isEs ? "Destino" : "Destination"}
                      </th>
                      <th className="py-2 px-3 font-medium">
                        {isEs ? "Carga Telemétrica" : "Telemetry Payload"}
                      </th>
                      <th className="py-2 pl-3 font-medium text-right">ACK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {packets.slice(0, 6).map((pkt) => (
                      <tr key={pkt.id} className="text-slate-200">
                        <td className="py-2 pr-3 font-mono tabular-nums whitespace-nowrap text-slate-400">
                          {new Date(pkt.timestamp).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2 px-3 font-medium whitespace-nowrap text-cyan-300">
                          {pkt.target}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                          {pkt.payloadSummary}
                        </td>
                        <td className="py-2 pl-3 font-mono tabular-nums text-right text-emerald-400">
                          {pkt.latencyMs} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {isEs
                  ? "Al activar el protocolo de emergencia, ICIP transmitirá automáticamente paquetes de telemetría biomédica hacia la Cabina Central y Houston MCC."
                  : "When the emergency protocol is triggered, ICIP automatically dispatches live biomedical telemetry packets to Central Cabin and Earth (Houston MCC)."}
                {emergencyHistory.length > 0 &&
                  (isEs
                    ? ` (${emergencyHistory.length} incidente(s) previos archivados en este dispositivo).`
                    : ` (${emergencyHistory.length} prior incident(s) archived on this unit).`)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
