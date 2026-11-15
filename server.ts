import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiConfigured: Boolean(getGeminiClient()),
      timestamp: new Date().toISOString(),
    });
  });

  // Stage 3: Cabin Body Scan AI Analysis
  app.post("/api/ai/scan-analysis", async (req, res) => {
    const ai = getGeminiClient();
    const lang = req.body?.lang === "es" ? "es" : "en";

    if (!ai) {
      res.status(503).json({
        error:
          lang === "en"
            ? "GEMINI_API_KEY is not configured in server environment."
            : "GEMINI_API_KEY no configurada en el entorno del servidor.",
        fallbackRequired: true,
      });
      return;
    }

    try {
      const { identity, baseline, subjective, metrics } = req.body;
      const responseLanguage =
        lang === "en"
          ? "Respond in clear, empathetic, clinical aerospace English."
          : "Responde en español técnico médico-aeroespacial claro, empático y preciso.";

      const prompt = `
Analyze the daily biomedical cabin scan of an astronaut for the ICIP (Instant Care — Innovative Protection) system.
${responseLanguage}

ASTRONAUT PROFILE:
- Name: ${identity?.firstName} ${identity?.lastName} (NASA ID: ${identity?.nasaId})
- General physical condition: ${baseline?.generalCondition}
- Weight / Height: ${baseline?.weightKg} kg / ${baseline?.heightCm} cm
- Disease history: ${baseline?.diseaseHistory || "None reported"}
- Known medical complications: ${baseline?.knownComplications || "None reported"}
- Allergies: ${baseline?.allergies || "None reported"}
- Baseline glucose: ${baseline?.baselineGlucoseMgDl} mg/dL
- Baseline resting heart rate: ${baseline?.restingHeartRateBpm} bpm
- Nutrition preferences: ${baseline?.nutritionPreferences || "Standard orbital diet"}

TODAY'S SUBJECTIVE CHECK-IN:
- Physical: ${subjective?.physicalFeeling} (${subjective?.physicalScore}/10)
- Mental: ${subjective?.mentalState} (${subjective?.mentalScore}/10)
- Emotional: ${subjective?.emotionalState} (${subjective?.emotionalScore}/10)
- Notes: ${subjective?.notes || "None"}

CABIN SENSOR METRICS:
- Heart rate: ${metrics?.heartRateBpm} bpm
- Blood pressure: ${metrics?.systolicMmHg}/${metrics?.diastolicMmHg} mmHg
- SpO2: ${metrics?.spo2Percent}%
- Body temperature: ${metrics?.bodyTempC} °C
- Interstitial glucose: ${metrics?.glucoseMgDl} mg/dL
- Cellular hydration: ${metrics?.hydrationPercent}%
- Shift radiation: ${metrics?.radiationMsv} mSv
- HRV recovery index: ${metrics?.stressHrvMs} ms

Generate an overall summary and a specific analysis for each of the 5 hologram anatomical zones:
1. "cranium": Cranium & Central Nervous System
2. "thorax": Thorax & Cardiopulmonary System
3. "abdomen": Abdomen & Metabolism
4. "upperLimbs": Upper Limbs
5. "lowerLimbs": Lower Limbs

For status use strictly: "nominal", "observacion", or "alerta".
`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            lang === "en"
              ? "You are the ICIP Orbital Flight Surgeon AI (NASA Space Apps Challenge). Evaluate astronaut biomedical data based on official NASA physiological thresholds with clinical precision and conciseness."
              : "Eres el Oficial Médico Orbital de IA del sistema ICIP (NASA Space Apps Challenge). Evalúas datos biomédicos de astronautas con rigor clínico, claridad y concisión.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSummary: {
                type: Type.STRING,
                description: "Comprehensive 2-3 sentence medical summary.",
              },
              zoneReports: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    zoneId: {
                      type: Type.STRING,
                      description:
                        "One of: cranium, thorax, abdomen, upperLimbs, lowerLimbs",
                    },
                    label: {
                      type: Type.STRING,
                      description: "Short clinical zone name.",
                    },
                    status: {
                      type: Type.STRING,
                      description: "One of: nominal, observacion, alerta",
                    },
                    keyMetric: {
                      type: Type.STRING,
                      description: "Primary formatted metric with unit.",
                    },
                    summary: {
                      type: Type.STRING,
                      description: "Dynamic 2-3 sentence clinical explanation.",
                    },
                    recommendation: {
                      type: Type.STRING,
                      description: "Preventive action or recommended protocol.",
                    },
                  },
                  required: [
                    "zoneId",
                    "label",
                    "status",
                    "keyMetric",
                    "summary",
                    "recommendation",
                  ],
                },
              },
            },
            required: ["overallSummary", "zoneReports"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({ ...parsed, aiGenerated: true });
    } catch (err) {
      console.error("Error in /api/ai/scan-analysis:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Scan analysis error",
        fallbackRequired: true,
      });
    }
  });

  // Stage 3: Conversational Medical Assistant Chat
  app.post("/api/ai/chat", async (req, res) => {
    const ai = getGeminiClient();
    const lang = req.body?.context?.lang === "es" ? "es" : "en";

    if (!ai) {
      res.status(503).json({
        error:
          lang === "en"
            ? "GEMINI_API_KEY is not configured in server environment."
            : "GEMINI_API_KEY no configurada en el entorno del servidor.",
        fallbackRequired: true,
      });
      return;
    }

    try {
      const { message, history, context } = req.body;
      const languageRule =
        lang === "en"
          ? "Respond in English with a concise, actionable aerospace clinical tone (max 4-5 sentences unless asked for detail)."
          : "Responde en español con tono profesional aeroespacial, conciso y accionable (máximo 4-5 oraciones salvo que pidan detalle).";

      const systemContext = `You are the ICIP (Instant Care — Innovative Protection) Conversational Orbital Medical Assistant aboard the spacecraft.
${languageRule}
Always consider the astronaut's allergies and medical history before suggesting actions.

Astronaut context:
- Name: ${context?.identity?.firstName ?? ""} ${context?.identity?.lastName ?? ""} (${context?.identity?.nasaId ?? ""})
- Allergies: ${context?.baseline?.allergies || "None"}
- Known complications: ${context?.baseline?.knownComplications || "None"}
- Baseline glucose: ${context?.baseline?.baselineGlucoseMgDl ?? "N/A"} mg/dL, Resting HR: ${context?.baseline?.restingHeartRateBpm ?? "N/A"} bpm
- Latest scan: ${context?.latestScan ? JSON.stringify(context.latestScan.metrics) : "No recent scan"}
- Focused hologram zone: ${context?.selectedZone || "General view"}`;

      const chat = ai.chats.create({
        model: "gemini-4-hydrogen",
        config: {
          systemInstruction: systemContext,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
        history: Array.isArray(history)
          ? history.slice(-8).map((m: { role: string; content: string }) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            }))
          : undefined,
      });

      const response = await chat.sendMessage({ message });
      res.json({ reply: response.text ?? "", aiGenerated: true });
    } catch (err) {
      console.error("Error in /api/ai/chat:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Chat assistant error",
        fallbackRequired: true,
      });
    }
  });

  // Stage 4: EVA Suit Emergency First-Aid Protocol
  app.post("/api/ai/emergency", async (req, res) => {
    const ai = getGeminiClient();
    const lang = req.body?.lang === "es" ? "es" : "en";

    if (!ai) {
      res.status(503).json({
        error:
          lang === "en"
            ? "GEMINI_API_KEY is not configured in server environment."
            : "GEMINI_API_KEY no configurada en el entorno del servidor.",
        fallbackRequired: true,
      });
      return;
    }

    try {
      const { symptom, details, identity, baseline, suitTelemetry } = req.body;
      const languageRule =
        lang === "en"
          ? "Write all fields in clear, direct English."
          : "Redacta todos los campos en español claro y directo.";

      const prompt = `
EVA SPACE SUIT EMERGENCY PROTOCOL ACTIVATED.
Generate immediate first-aid instructions inside the space suit and cabin for the astronaut.
${languageRule}

ASTRONAUT: ${identity?.firstName} ${identity?.lastName} (${identity?.nasaId})
CRITICAL MEDICAL HISTORY:
- Allergies: ${baseline?.allergies || "None reported"}
- Known complications: ${baseline?.knownComplications || "None"}
- Disease history: ${baseline?.diseaseHistory || "None"}
- Baseline glucose: ${baseline?.baselineGlucoseMgDl} mg/dL | Resting HR: ${baseline?.restingHeartRateBpm} bpm

REPORTED SYMPTOM / ALERT: ${symptom}
ADDITIONAL DETAILS: ${details || "Portable suit module trigger"}

LIVE SUIT TELEMETRY:
- Suit O2: ${suitTelemetry?.o2Percent}%
- Suit Pressure: ${suitTelemetry?.suitPressureKpa} kPa
- Heart Rate: ${suitTelemetry?.heartRateBpm} bpm
- SpO2: ${suitTelemetry?.spo2Percent}%
- Glucose: ${suitTelemetry?.glucoseMgDl} mg/dL
- Internal Suit Temp: ${suitTelemetry?.suitTempC} °C
- Partial CO2: ${suitTelemetry?.co2MmHg} mmHg

Return 4 to 5 concrete first-aid steps ordered by life-safety priority, strictly respecting allergies and microgravity/EVA suit constraints.
`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            lang === "en"
              ? "You are the ICIP EVA Emergency Medical System. Instructions must be direct, safe in pressurized space environments, and strictly free of contraindications regarding the astronaut's allergies."
              : "Eres el Sistema Médico de Emergencia EVA ICIP. Tus instrucciones deben ser directas, seguras en entorno espacial presurizado y libres de contraindicaciones respecto a las alergias del astronauta.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: {
                type: Type.STRING,
                description: "One of: critica, urgente, moderada",
              },
              headline: {
                type: Type.STRING,
                description: "One-line operational diagnosis.",
              },
              contraindicationAlert: {
                type: Type.STRING,
                description: "Allergy or contraindication warning from medical history.",
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    order: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    timeframe: { type: Type.STRING },
                  },
                  required: ["order", "title", "instruction", "timeframe"],
                },
              },
            },
            required: ["severity", "headline", "contraindicationAlert", "steps"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({ ...parsed, aiGenerated: true });
    } catch (err) {
      console.error("Error in /api/ai/emergency:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Emergency protocol error",
        fallbackRequired: true,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ICIP Aerospace Medical OS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
