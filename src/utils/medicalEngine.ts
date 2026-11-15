import {
  AppLanguage,
  AstronautIdentity,
  CabinSensorMetrics,
  ClinicalStatus,
  DailySubjectiveCheckIn,
  EmergencyLevel,
  EmergencyProtocolResponse,
  MedicalBaseline,
  SuitTelemetry,
  ZoneAnalysis,
} from "../types/icip";

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export type ScanSimulationMode = "auto" | 1 | 2 | 3;

export interface EmergencyLevelMeta {
  level: EmergencyLevel;
  colorLabel: string;
  title: string;
  severityLabel: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  badgeBgClass: string;
}

export function getEmergencyLevelMeta(
  lang: AppLanguage = "en"
): Record<EmergencyLevel, EmergencyLevelMeta> {
  if (lang === "es") {
    return {
      1: {
        level: 1,
        colorLabel: "Azul",
        title: "Emergencia Médica Nivel 1 · Azul (Leve / Preventiva)",
        severityLabel: "Nivel 1 · Azul",
        borderClass: "border-blue-500/60",
        bgClass: "bg-blue-950/35",
        textClass: "text-blue-300",
        badgeBgClass: "bg-blue-500 text-slate-950",
      },
      2: {
        level: 2,
        colorLabel: "Amarillo",
        title: "Emergencia Médica Nivel 2 · Amarillo (Moderada)",
        severityLabel: "Nivel 2 · Amarillo",
        borderClass: "border-amber-400/70",
        bgClass: "bg-amber-950/35",
        textClass: "text-amber-300",
        badgeBgClass: "bg-amber-400 text-slate-950",
      },
      3: {
        level: 3,
        colorLabel: "Rojo",
        title: "Emergencia Médica Nivel 3 · Rojo (Crítica)",
        severityLabel: "Nivel 3 · Rojo",
        borderClass: "border-red-500/75",
        bgClass: "bg-red-950/40",
        textClass: "text-red-300",
        badgeBgClass: "bg-red-500 text-white",
      },
    };
  }

  return {
    1: {
      level: 1,
      colorLabel: "Blue",
      title: "Level 1 Medical Emergency · Blue (Mild / Preventive)",
      severityLabel: "Level 1 · Blue",
      borderClass: "border-blue-500/60",
      bgClass: "bg-blue-950/35",
      textClass: "text-blue-300",
      badgeBgClass: "bg-blue-500 text-slate-950",
    },
    2: {
      level: 2,
      colorLabel: "Yellow",
      title: "Level 2 Medical Emergency · Yellow (Moderate)",
      severityLabel: "Level 2 · Yellow",
      borderClass: "border-amber-400/70",
      bgClass: "bg-amber-950/35",
      textClass: "text-amber-300",
      badgeBgClass: "bg-amber-400 text-slate-950",
    },
    3: {
      level: 3,
      colorLabel: "Red",
      title: "Level 3 Medical Emergency · Red (Critical)",
      severityLabel: "Level 3 · Red",
      borderClass: "border-red-500/75",
      bgClass: "bg-red-950/40",
      textClass: "text-red-300",
      badgeBgClass: "bg-red-500 text-white",
    },
  };
}

export const EMERGENCY_LEVEL_META = getEmergencyLevelMeta("en");

/**
 * Generates realistic cabin sensor readings anchored to the astronaut's Stage 2 baseline,
 * subjective scores, and optional simulation level override.
 */
export function simulateCabinSensors(
  baseline: MedicalBaseline,
  subjective: DailySubjectiveCheckIn,
  mode: ScanSimulationMode = "auto"
): CabinSensorMetrics {
  const avgSubjective =
    (subjective.physicalScore +
      subjective.mentalScore +
      subjective.emotionalScore) /
    3;

  const effectivePenalty =
    mode === 3
      ? 6.2
      : mode === 2
      ? 3.8
      : mode === 1
      ? 1.2
      : Math.max(0, 8 - avgSubjective);

  const hrDelta = Math.round(effectivePenalty * 4.2 + (Math.random() * 6 - 3));
  const heartRateBpm = clamp(baseline.restingHeartRateBpm + hrDelta, 48, 148);

  const systolicMmHg = clamp(
    Math.round(116 + effectivePenalty * 3.2 + (Math.random() * 6 - 3)),
    96,
    162
  );
  const diastolicMmHg = clamp(
    Math.round(74 + effectivePenalty * 2.0 + (Math.random() * 4 - 2)),
    60,
    98
  );

  const spo2Percent = clamp(
    Number(
      (
        98.8 -
        effectivePenalty * 0.65 +
        (Math.random() * 0.6 - 0.3)
      ).toFixed(1)
    ),
    90.5,
    99.8
  );

  const bodyTempC = clamp(
    Number(
      (
        36.6 +
        (effectivePenalty > 4 ? 0.9 : effectivePenalty > 2 ? 0.4 : 0.1) +
        (Math.random() * 0.2 - 0.1)
      ).toFixed(1)
    ),
    35.8,
    38.8
  );

  const glucoseMgDl = clamp(
    Math.round(
      baseline.baselineGlucoseMgDl +
        (effectivePenalty > 4 ? -24 : effectivePenalty > 2 ? -12 : 4) +
        (Math.random() * 10 - 5)
    ),
    58,
    185
  );

  const hydrationPercent = clamp(
    Math.round(62 - effectivePenalty * 2.1 + (Math.random() * 3 - 1)),
    44,
    68
  );

  const radiationMsv = Number(
    (0.38 + effectivePenalty * 0.08 + Math.random() * 0.15).toFixed(2)
  );
  const muscleIndex = clamp(
    Number(
      (94.8 - effectivePenalty * 2.1 + (Math.random() * 2 - 1)).toFixed(1)
    ),
    72.0,
    99.0
  );
  const stressHrvMs = clamp(
    Math.round(66 - effectivePenalty * 6.5 + (Math.random() * 6 - 3)),
    18,
    95
  );

  return {
    heartRateBpm,
    systolicMmHg,
    diastolicMmHg,
    spo2Percent,
    bodyTempC,
    glucoseMgDl,
    hydrationPercent,
    radiationMsv,
    muscleIndex,
    stressHrvMs,
  };
}

export function classifyEmergencyFromScan(
  baseline: MedicalBaseline,
  subjective: DailySubjectiveCheckIn,
  metrics: CabinSensorMetrics,
  zoneReports: ZoneAnalysis[],
  forcedMode: ScanSimulationMode = "auto",
  lang: AppLanguage = "en"
): { level: EmergencyLevel; reason: string } {
  const isEs = lang === "es";

  if (forcedMode === 3) {
    return {
      level: 3,
      reason: isEs
        ? `Alteración crítica detectada en escáner (SpO2 ${metrics.spo2Percent}%, FC ${metrics.heartRateBpm} lpm, glucosa ${metrics.glucoseMgDl} mg/dL).`
        : `Critical alteration detected by cabin scanner (SpO2 ${metrics.spo2Percent}%, HR ${metrics.heartRateBpm} bpm, glucose ${metrics.glucoseMgDl} mg/dL).`,
    };
  }
  if (forcedMode === 2) {
    return {
      level: 2,
      reason: isEs
        ? `Desviación biométrica moderada detectada (FC ${metrics.heartRateBpm} lpm frente a reposo ${baseline.restingHeartRateBpm} lpm, hidratación ${metrics.hydrationPercent}%).`
        : `Moderate biometric deviation detected (HR ${metrics.heartRateBpm} bpm vs. resting ${baseline.restingHeartRateBpm} bpm, hydration ${metrics.hydrationPercent}%).`,
    };
  }
  if (forcedMode === 1) {
    return {
      level: 1,
      reason: isEs
        ? `Alerta preventiva leve en cabina: monitoreo continuo activo sobre signos vitales (${metrics.heartRateBpm} lpm, SpO2 ${metrics.spo2Percent}%).`
        : `Mild preventive cabin alert: continuous monitoring active on vital signs (${metrics.heartRateBpm} bpm, SpO2 ${metrics.spo2Percent}%).`,
    };
  }

  const avgSubjective =
    (subjective.physicalScore +
      subjective.mentalScore +
      subjective.emotionalScore) /
    3;
  const hasAlertZone = zoneReports.some((z) => z.status === "alerta");
  const hasObsZone = zoneReports.some((z) => z.status === "observacion");
  const hrDiff = metrics.heartRateBpm - baseline.restingHeartRateBpm;

  if (
    hasAlertZone ||
    avgSubjective <= 4.5 ||
    metrics.spo2Percent < 94 ||
    hrDiff > 24 ||
    metrics.glucoseMgDl < 70
  ) {
    return {
      level: 3,
      reason: isEs
        ? `Anomalía fisiológica crítica detectada en el escaneo corporal (SpO2 ${metrics.spo2Percent}%, FC ${metrics.heartRateBpm} lpm).`
        : `Critical physiological anomaly detected during body scan (SpO2 ${metrics.spo2Percent}%, HR ${metrics.heartRateBpm} bpm).`,
    };
  }

  if (
    hasObsZone ||
    avgSubjective <= 7 ||
    hrDiff > 12 ||
    metrics.hydrationPercent < 55
  ) {
    return {
      level: 2,
      reason: isEs
        ? `Variación biométrica o fatiga moderada detectada durante la rutina de escaneo (${metrics.heartRateBpm} lpm, hidratación ${metrics.hydrationPercent}%).`
        : `Moderate biometric shift or fatigue detected during routine scan (${metrics.heartRateBpm} bpm, hydration ${metrics.hydrationPercent}%).`,
    };
  }

  return {
    level: 1,
    reason: isEs
      ? `Revisión preventiva de cabina activa: ajuste fino de hidratación y carga orbital recomendado (${metrics.heartRateBpm} lpm, SpO2 ${metrics.spo2Percent}%).`
      : `Preventive cabin check active: fine-tuning of hydration and orbital workload recommended (${metrics.heartRateBpm} bpm, SpO2 ${metrics.spo2Percent}%).`,
  };
}

export function buildLocalFallbackScanAnalysis(
  identity: AstronautIdentity,
  baseline: MedicalBaseline,
  subjective: DailySubjectiveCheckIn,
  metrics: CabinSensorMetrics,
  lang: AppLanguage = "en"
): { overallSummary: string; zoneReports: ZoneAnalysis[] } {
  const isEs = lang === "es";
  const hrDiff = metrics.heartRateBpm - baseline.restingHeartRateBpm;
  const thoraxStatus: ClinicalStatus =
    metrics.spo2Percent < 95 || hrDiff > 22
      ? "alerta"
      : hrDiff > 12 || metrics.systolicMmHg > 134
      ? "observacion"
      : "nominal";

  const abdomenStatus: ClinicalStatus =
    metrics.glucoseMgDl < 72 || metrics.glucoseMgDl > 140
      ? "alerta"
      : metrics.hydrationPercent < 55
      ? "observacion"
      : "nominal";

  const craniumStatus: ClinicalStatus =
    subjective.mentalScore <= 4 || subjective.emotionalScore <= 4 || metrics.stressHrvMs < 35
      ? "alerta"
      : subjective.mentalScore <= 6 || subjective.emotionalScore <= 6
      ? "observacion"
      : "nominal";

  const limbsStatus: ClinicalStatus =
    subjective.physicalScore <= 4 || metrics.muscleIndex < 82
      ? "alerta"
      : subjective.physicalScore <= 6 || metrics.muscleIndex < 88
      ? "observacion"
      : "nominal";

  const overallSummary = isEs
    ? `Evaluación completada para ${identity.firstName} ${identity.lastName} (${identity.nasaId}). Frecuencia cardíaca en ${metrics.heartRateBpm} lpm (línea base ${baseline.restingHeartRateBpm} lpm), SpO2 en ${metrics.spo2Percent}% y glucosa en ${metrics.glucoseMgDl} mg/dL.`
    : `Assessment completed for ${identity.firstName} ${identity.lastName} (${identity.nasaId}). Heart rate at ${metrics.heartRateBpm} bpm (baseline ${baseline.restingHeartRateBpm} bpm), SpO2 at ${metrics.spo2Percent}%, and glucose at ${metrics.glucoseMgDl} mg/dL.`;

  const zoneReports: ZoneAnalysis[] = isEs
    ? [
        {
          zoneId: "cranium",
          label: "Cráneo y Sistema Nervioso",
          status: craniumStatus,
          keyMetric: `HRV ${metrics.stressHrvMs} ms`,
          summary: `Variabilidad cardíaca de ${metrics.stressHrvMs} ms con estado mental "${subjective.mentalState}" (${subjective.mentalScore}/10) y emocional "${subjective.emotionalState}" (${subjective.emotionalScore}/10).`,
          recommendation:
            craniumStatus === "nominal"
              ? "Mantener ciclo circadiano programado y pausas visuales cada 90 minutos."
              : "Ejecutar protocolo de respiración guiada de 6 minutos y reducir carga cognitiva.",
        },
        {
          zoneId: "thorax",
          label: "Tórax y Cardiopulmonar",
          status: thoraxStatus,
          keyMetric: `${metrics.heartRateBpm} lpm · SpO2 ${metrics.spo2Percent}%`,
          summary: `Ritmo cardíaco en ${metrics.heartRateBpm} lpm (variación de ${
            hrDiff >= 0 ? "+" : ""
          }${hrDiff} lpm frente a reposo base de ${baseline.restingHeartRateBpm} lpm). Presión ${metrics.systolicMmHg}/${metrics.diastolicMmHg} mmHg y SpO2 ${metrics.spo2Percent}%.`,
          recommendation:
            thoraxStatus === "nominal"
              ? "Función cardiopulmonar estable para tareas nominales de cabina."
              : "Permanecer en reposo monitorizado y verificar mezcla de oxígeno en cabina.",
        },
        {
          zoneId: "abdomen",
          label: "Abdomen y Metabolismo",
          status: abdomenStatus,
          keyMetric: `${metrics.glucoseMgDl} mg/dL · Hidrat. ${metrics.hydrationPercent}%`,
          summary: `Glucosa intersticial de ${metrics.glucoseMgDl} mg/dL respecto a línea base de ${baseline.baselineGlucoseMgDl} mg/dL. Hidratación celular estimada en ${metrics.hydrationPercent}%.`,
          recommendation:
            abdomenStatus === "nominal"
              ? `Mantener ingesta hídrica objetivo de ${baseline.hydrationTargetLiters} L/día.`
              : "Ingerir 350 ml de solución electrolítica orbital y colación controlada.",
        },
        {
          zoneId: "upperLimbs",
          label: "Extremidades Superiores",
          status: limbsStatus,
          keyMetric: `Tono ${metrics.muscleIndex}%`,
          summary: `Índice de tono neuromuscular superior en ${metrics.muscleIndex}% con temperatura periférica de ${metrics.bodyTempC} °C. Sensación física: "${subjective.physicalFeeling}" (${subjective.physicalScore}/10).`,
          recommendation:
            "Realizar estiramiento cervical y de muñecas previo a manipulación de consola.",
        },
        {
          zoneId: "lowerLimbs",
          label: "Extremidades Inferiores",
          status: limbsStatus,
          keyMetric: `Rad. ${metrics.radiationMsv} mSv`,
          summary: `Distribución de fluidos y retorno venoso evaluados en microgravedad. Exposición acumulada del turno en ${metrics.radiationMsv} mSv.`,
          recommendation:
            "Completar sesión programada de ejercicio resistivo (ARED) para preservar densidad ósea.",
        },
      ]
    : [
        {
          zoneId: "cranium",
          label: "Cranium & Nervous System",
          status: craniumStatus,
          keyMetric: `HRV ${metrics.stressHrvMs} ms`,
          summary: `Heart rate variability at ${metrics.stressHrvMs} ms with mental state "${subjective.mentalState}" (${subjective.mentalScore}/10) and emotional state "${subjective.emotionalState}" (${subjective.emotionalScore}/10).`,
          recommendation:
            craniumStatus === "nominal"
              ? "Maintain scheduled circadian cycle and take visual rest breaks every 90 minutes."
              : "Execute 6-minute guided breathing protocol and reduce cognitive task load.",
        },
        {
          zoneId: "thorax",
          label: "Thorax & Cardiopulmonary",
          status: thoraxStatus,
          keyMetric: `${metrics.heartRateBpm} bpm · SpO2 ${metrics.spo2Percent}%`,
          summary: `Heart rate at ${metrics.heartRateBpm} bpm (${
            hrDiff >= 0 ? "+" : ""
          }${hrDiff} bpm delta from resting baseline ${baseline.restingHeartRateBpm} bpm). BP ${metrics.systolicMmHg}/${metrics.diastolicMmHg} mmHg and SpO2 ${metrics.spo2Percent}%.`,
          recommendation:
            thoraxStatus === "nominal"
              ? "Cardiopulmonary function stable for nominal cabin operations."
              : "Remain in monitored rest and verify cabin oxygen partial pressure.",
        },
        {
          zoneId: "abdomen",
          label: "Abdomen & Metabolism",
          status: abdomenStatus,
          keyMetric: `${metrics.glucoseMgDl} mg/dL · Hydr. ${metrics.hydrationPercent}%`,
          summary: `Interstitial glucose at ${metrics.glucoseMgDl} mg/dL relative to baseline ${baseline.baselineGlucoseMgDl} mg/dL. Estimated cellular hydration at ${metrics.hydrationPercent}%.`,
          recommendation:
            abdomenStatus === "nominal"
              ? `Maintain daily hydration target of ${baseline.hydrationTargetLiters} L/day.`
              : "Consume 350 mL orbital electrolyte solution and controlled carbohydrate snack.",
        },
        {
          zoneId: "upperLimbs",
          label: "Upper Extremities",
          status: limbsStatus,
          keyMetric: `Tone ${metrics.muscleIndex}%`,
          summary: `Upper neuromuscular tone index at ${metrics.muscleIndex}% with peripheral temperature ${metrics.bodyTempC} °C. Physical feeling: "${subjective.physicalFeeling}" (${subjective.physicalScore}/10).`,
          recommendation:
            "Perform cervical and wrist mobility stretches prior to console operation.",
        },
        {
          zoneId: "lowerLimbs",
          label: "Lower Extremities",
          status: limbsStatus,
          keyMetric: `Rad. ${metrics.radiationMsv} mSv`,
          summary: `Fluid shift and venous return evaluated under microgravity. Cumulative shift radiation exposure at ${metrics.radiationMsv} mSv.`,
          recommendation:
            "Complete scheduled resistive exercise session (ARED) to preserve bone density.",
        },
      ];

  return { overallSummary, zoneReports };
}

export function buildLocalFallbackEmergencyProtocol(
  symptom: string,
  baseline: MedicalBaseline | null,
  telemetry: SuitTelemetry,
  level: EmergencyLevel = 3,
  lang: AppLanguage = "en"
): EmergencyProtocolResponse {
  const isEs = lang === "es";
  const allergyText = baseline?.allergies?.trim()
    ? isEs
      ? `Alergias registradas: ${baseline.allergies}. Evitar estrictamente cualquier agente relacionado.`
      : `Recorded allergies: ${baseline.allergies}. Strictly avoid any related agent.`
    : isEs
    ? "Sin alergias medicamentosas registradas en Etapa 2."
    : "No drug allergies recorded in Stage 2.";

  const lower = symptom.toLowerCase();
  const severity: EmergencyProtocolResponse["severity"] =
    level === 3 ? "critica" : level === 2 ? "urgente" : "moderada";

  if (
    lower.includes("hipoxia") ||
    lower.includes("hypoxia") ||
    lower.includes("mareo") ||
    lower.includes("dizziness") ||
    telemetry.spo2Percent < 94
  ) {
    return isEs
      ? {
          level,
          severity,
          headline: `Nivel ${level}: Sospecha de hipoxia o desajuste de presión en circuito`,
          contraindicationAlert: allergyText,
          steps: [
            {
              order: 1,
              title: "Verificar sello y válvula de O2",
              instruction:
                "Detener movimiento físico de inmediato. Confirmar presión superior a 29.6 kPa y abrir flujo auxiliar de oxígeno puro.",
              timeframe: "0 – 30 seg",
            },
            {
              order: 2,
              title: "Anclaje de seguridad en estructura",
              instruction:
                "Asegurar mosquetón de sujeción al pasamanos más cercano para evitar deriva.",
              timeframe: "30 – 60 seg",
            },
            {
              order: 3,
              title: "Control respiratorio lento y revisión de CO2",
              instruction: `Ejecutar inhalaciones profundas de 4 segundos mientras el scrubber estabiliza CO2 (actual ${telemetry.co2MmHg} mmHg).`,
              timeframe: "1 – 3 min",
            },
            {
              order: 4,
              title: "Retorno asistido a esclusa de Cabina Central",
              instruction:
                "Esperar confirmación de enlace de Cabina Central y proceder hacia la esclusa aérea guiado por telemetría continua.",
              timeframe: "Inmediato",
            },
          ],
        }
      : {
          level,
          severity,
          headline: `Level ${level}: Suspected hypoxia or suit circuit pressure deviation`,
          contraindicationAlert: allergyText,
          steps: [
            {
              order: 1,
              title: "Verify suit seal and O2 valve",
              instruction:
                "Halt physical movement immediately. Confirm suit pressure above 29.6 kPa and open auxiliary pure oxygen flow.",
              timeframe: "0 – 30 sec",
            },
            {
              order: 2,
              title: "Tether anchor to station structure",
              instruction:
                "Lock safety tether carabiner onto the nearest handrail to prevent orbital drift.",
              timeframe: "30 – 60 sec",
            },
            {
              order: 3,
              title: "Paced breathing and CO2 scrubber check",
              instruction: `Perform slow 4-second deep inhalations while scrubber stabilizes CO2 (current ${telemetry.co2MmHg} mmHg).`,
              timeframe: "1 – 3 min",
            },
            {
              order: 4,
              title: "Assisted return to Central Cabin airlock",
              instruction:
                "Await Central Cabin telemetry lock and proceed to the airlock under continuous medical monitoring.",
              timeframe: "Immediate",
            },
          ],
        };
  }

  if (
    lower.includes("glucosa") ||
    lower.includes("glucose") ||
    lower.includes("hipoglucemia") ||
    lower.includes("hypoglycemia") ||
    telemetry.glucoseMgDl < 75
  ) {
    return isEs
      ? {
          level,
          severity,
          headline: `Nivel ${level}: Descompensación glucémica detectada`,
          contraindicationAlert: allergyText,
          steps: [
            {
              order: 1,
              title: "Suspender esfuerzo físico",
              instruction:
                "Detener trabajo manual y mantener posición estable sujeto al módulo.",
              timeframe: "0 – 30 seg",
            },
            {
              order: 2,
              title: "Administrar gel de glucosa",
              instruction:
                "Ingerir 15 g de dextrosa líquida desde la válvula de hidratación/nutrición verificando compatibilidad con alergias.",
              timeframe: "30 – 90 seg",
            },
            {
              order: 3,
              title: "Reevaluar sensor intersticial",
              instruction: `Monitorear ascenso desde ${telemetry.glucoseMgDl} mg/dL hacia rango objetivo (${baseline?.baselineGlucoseMgDl ?? 95} mg/dL).`,
              timeframe: "5 – 10 min",
            },
            {
              order: 4,
              title: "Confirmación con Cabina Central",
              instruction:
                "Coordinar control capilar de verificación con el Oficial Médico orbital.",
              timeframe: "10 – 15 min",
            },
          ],
        }
      : {
          level,
          severity,
          headline: `Level ${level}: Glycemic decompensation detected`,
          contraindicationAlert: allergyText,
          steps: [
            {
              order: 1,
              title: "Suspend physical exertion",
              instruction:
                "Stop manual EVA tasks and maintain a stable anchored posture on the module.",
              timeframe: "0 – 30 sec",
            },
            {
              order: 2,
              title: "Administer liquid glucose gel",
              instruction:
                "Ingest 15 g liquid dextrose via the in-suit hydration/nutrition port after confirming allergy clearance.",
              timeframe: "30 – 90 sec",
            },
            {
              order: 3,
              title: "Reassess interstitial glucose sensor",
              instruction: `Track upward trend from ${telemetry.glucoseMgDl} mg/dL toward target baseline (${baseline?.baselineGlucoseMgDl ?? 95} mg/dL).`,
              timeframe: "5 – 10 min",
            },
            {
              order: 4,
              title: "Confirm with Central Cabin Medical Officer",
              instruction:
                "Coordinate capillary verification check upon airlock ingress.",
              timeframe: "10 – 15 min",
            },
          ],
        };
  }

  return isEs
    ? {
        level,
        severity,
        headline: `Nivel ${level}: Protocolo de contingencia activo (${symptom})`,
        contraindicationAlert: allergyText,
        steps: [
          {
            order: 1,
            title: "Inmovilización y aseguramiento de posición",
            instruction:
              "Suspender actividad física intensa, fijar línea de seguridad y reducir consumo metabólico.",
            timeframe: "0 – 45 seg",
          },
          {
            order: 2,
            title: "Estabilización térmica y respiratoria",
            instruction: `Ajustar refrigeración líquida a flujo medio (temp. actual ${telemetry.suitTempC} °C) y respirar pausadamente para estabilizar ritmo cardíaco (${telemetry.heartRateBpm} lpm).`,
            timeframe: "1 – 2 min",
          },
          {
            order: 3,
            title: "Hidratación y monitoreo de síntomas",
            instruction:
              "Tomar pequeños sorbos de electrolitos y reportar cualquier cambio en visión, mareo o dolor.",
            timeframe: "2 – 5 min",
          },
          {
            order: 4,
            title: "Enlace continuo con Cabina Central y Tierra",
            instruction:
              "Mantener la baliza biomédica transmitiendo hasta recibir confirmación médica.",
            timeframe: "Continuo",
          },
        ],
      }
    : {
        level,
        severity,
        headline: `Level ${level}: Active medical contingency protocol (${symptom})`,
        contraindicationAlert: allergyText,
        steps: [
          {
            order: 1,
            title: "Immobilize and secure safety tether",
            instruction:
              "Halt strenuous physical activity, lock safety tether, and lower metabolic load.",
            timeframe: "0 – 45 sec",
          },
          {
            order: 2,
            title: "Thermal and respiratory stabilization",
            instruction: `Set liquid cooling loop to medium flow (current temp ${telemetry.suitTempC} °C) and breathe steadily to stabilize heart rate (${telemetry.heartRateBpm} bpm).`,
            timeframe: "1 – 2 min",
          },
          {
            order: 3,
            title: "Controlled hydration and symptom tracking",
            instruction:
              "Take small sips of electrolyte fluid and report any visual changes, dizziness, or chest discomfort.",
            timeframe: "2 – 5 min",
          },
          {
            order: 4,
            title: "Maintain continuous Cabin & Earth link",
            instruction:
              "Keep the biomedical distress beacon active until cleared by flight surgeon.",
            timeframe: "Continuous",
          },
        ],
      };
}
