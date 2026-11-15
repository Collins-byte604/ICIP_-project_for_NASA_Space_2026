import React, { useState } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { AppLanguage, AstronautIdentity, MedicalBaseline } from "../types/icip";
import { calculateBmi } from "../utils/storage";

interface Stage2OnboardingProps {
  lang?: AppLanguage;
  identity: AstronautIdentity;
  existingBaseline: MedicalBaseline | null;
  onSaveBaseline: (baseline: MedicalBaseline) => void;
}

export const Stage2Onboarding: React.FC<Stage2OnboardingProps> = ({
  lang = "en",
  identity,
  existingBaseline,
  onSaveBaseline,
}) => {
  const isEs = lang === "es";

  const [generalCondition, setGeneralCondition] = useState<
    MedicalBaseline["generalCondition"]
  >(existingBaseline?.generalCondition ?? "Optima");
  const [weightKg, setWeightKg] = useState<string>(
    existingBaseline ? String(existingBaseline.weightKg) : "68"
  );
  const [heightCm, setHeightCm] = useState<string>(
    existingBaseline ? String(existingBaseline.heightCm) : "172"
  );
  const [diseaseHistory, setDiseaseHistory] = useState<string>(
    existingBaseline?.diseaseHistory ??
      (isEs
        ? "Sin patologías crónicas ni cirugías mayores."
        : "No chronic pathologies or major prior surgeries.")
  );
  const [knownComplications, setKnownComplications] = useState<string>(
    existingBaseline?.knownComplications ??
      (isEs
        ? "Ligera susceptibilidad a cinetosis espacial durante las primeras 48 horas."
        : "Mild susceptibility to space motion sickness during initial 48 hours in microgravity.")
  );
  const [allergies, setAllergies] = useState<string>(
    existingBaseline?.allergies ??
      (isEs ? "Penicilina y sulfamidas." : "Penicillin and sulfonamides.")
  );
  const [baselineGlucoseMgDl, setBaselineGlucoseMgDl] = useState<string>(
    existingBaseline ? String(existingBaseline.baselineGlucoseMgDl) : "92"
  );
  const [restingHeartRateBpm, setRestingHeartRateBpm] = useState<string>(
    existingBaseline ? String(existingBaseline.restingHeartRateBpm) : "62"
  );
  const [nutritionPreferences, setNutritionPreferences] = useState<string>(
    existingBaseline?.nutritionPreferences ??
      (isEs
        ? "Dieta hiperproteica equilibrada (2,400 kcal/día), baja en sodio, sin lácteos fermentados."
        : "Balanced high-protein diet (2,400 kcal/day), low sodium, no fermented dairy.")
  );
  const [hydrationTargetLiters, setHydrationTargetLiters] = useState<string>(
    existingBaseline ? String(existingBaseline.hydrationTargetLiters) : "2.8"
  );
  const [error, setError] = useState<string | null>(null);

  const parsedWeight = Number(weightKg);
  const parsedHeight = Number(heightCm);
  const bmi = calculateBmi(parsedWeight, parsedHeight);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const glucose = Number(baselineGlucoseMgDl);
    const hr = Number(restingHeartRateBpm);
    const hydration = Number(hydrationTargetLiters);

    if (
      !parsedWeight ||
      parsedWeight < 35 ||
      parsedWeight > 180 ||
      !parsedHeight ||
      parsedHeight < 120 ||
      parsedHeight > 230
    ) {
      setError(
        isEs
          ? "Ingresa valores válidos de peso (kg) y estatura (cm)."
          : "Enter valid weight (kg) and height (cm) values."
      );
      return;
    }

    if (!glucose || glucose < 40 || glucose > 350) {
      setError(
        isEs
          ? "Ingresa un nivel de glucosa válido en mg/dL (40 - 350)."
          : "Enter a valid glucose level in mg/dL (40 - 350)."
      );
      return;
    }

    if (!hr || hr < 35 || hr > 140) {
      setError(
        isEs
          ? "Ingresa un ritmo cardíaco en reposo válido en lpm (35 - 140)."
          : "Enter a valid resting heart rate in bpm (35 - 140)."
      );
      return;
    }

    setError(null);
    onSaveBaseline({
      generalCondition,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      diseaseHistory:
        diseaseHistory.trim() || (isEs ? "Ninguno reportado" : "None reported"),
      knownComplications:
        knownComplications.trim() || (isEs ? "Ninguna reportada" : "None reported"),
      allergies: allergies.trim() || (isEs ? "Ninguna conocida" : "None known"),
      baselineGlucoseMgDl: glucose,
      restingHeartRateBpm: hr,
      nutritionPreferences:
        nutritionPreferences.trim() ||
        (isEs ? "Régimen orbital estándar" : "Standard orbital regimen"),
      hydrationTargetLiters: hydration > 0 ? hydration : 2.5,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-slate-800 pb-6">
        <div>
          <p className="font-mono text-xs text-cyan-400">
            {isEs
              ? "Etapa 2 de 4 · Incorporación Pre-Vuelo"
              : "Stage 2 of 4 · Pre-Flight Medical Onboarding"}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white [text-wrap:balance]">
            {isEs
              ? "Datos Médicos Iniciales del Astronauta"
              : "Astronaut Initial Medical Baseline"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {isEs ? "Expediente vinculado a " : "Clinical file linked to "}
            <span className="text-slate-200 font-medium">
              {identity.firstName} {identity.lastName}
            </span>{" "}
            · <span className="font-mono text-cyan-300">{identity.nasaId}</span>
          </p>
        </div>

        <div className="flex items-center gap-6 rounded-lg border border-slate-800 bg-[#0D121B] px-5 py-3">
          <div>
            <p className="text-xs text-slate-400">
              {isEs ? "IMC Calculado" : "Calculated BMI"}
            </p>
            <p className="font-mono text-xl font-bold tabular-nums text-white">
              {bmi > 0 ? bmi.toFixed(1) : "—"}
              <span className="ml-1 text-xs font-normal text-slate-400">kg/m²</span>
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-xs text-slate-400">
              {isEs ? "Estado de Registro" : "Record Status"}
            </p>
            <p className="font-mono text-xs font-medium text-emerald-400">
              {existingBaseline
                ? isEs
                  ? "Actualizable"
                  : "Updatable"
                : isEs
                ? "Nuevo expediente"
                : "New record"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A: Physical Condition & Anthropometry */}
        <div className="rounded-xl border border-slate-800 bg-[#0D121B] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="font-display text-lg font-semibold text-white">
              {isEs
                ? "01. Condición Física y Biometría Base"
                : "01. Physical Condition & Baseline Biometrics"}
            </h2>
            <span className="font-mono text-xs text-slate-400">
              {isEs ? "Parámetros previos al vuelo" : "Pre-flight NASA-STD-3001"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label
                htmlFor="generalCondition"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs ? "Condición física general" : "General physical condition"}
              </label>
              <select
                id="generalCondition"
                value={generalCondition}
                onChange={(e) =>
                  setGeneralCondition(
                    e.target.value as MedicalBaseline["generalCondition"]
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Optima">
                  {isEs ? "Óptima (Apto EVA completo)" : "Optimal (Full EVA Cleared)"}
                </option>
                <option value="Acondicionada">
                  {isEs
                    ? "Acondicionada (Nominal en cabina)"
                    : "Conditioned (Cabin Nominal)"}
                </option>
                <option value="En observacion">
                  {isEs ? "En observación médica" : "Under Medical Observation"}
                </option>
                <option value="Recuperacion">
                  {isEs ? "En fase de recuperación" : "Recovery Phase"}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="weightKg"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs ? "Peso corporal (kg)" : "Body weight (kg)"}
              </label>
              <input
                id="weightKg"
                type="number"
                step="0.1"
                min="35"
                max="180"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 font-mono tabular-nums text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="heightCm"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs ? "Estatura (cm)" : "Height (cm)"}
              </label>
              <input
                id="heightCm"
                type="number"
                step="1"
                min="120"
                max="230"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 font-mono tabular-nums text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label
                htmlFor="glucose"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Nivel de glucosa actual (mg/dL)"
                  : "Current baseline glucose (mg/dL)"}
              </label>
              <input
                id="glucose"
                type="number"
                min="40"
                max="350"
                required
                value={baselineGlucoseMgDl}
                onChange={(e) => setBaselineGlucoseMgDl(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 font-mono tabular-nums text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="restingHr"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Ritmo cardíaco promedio en reposo (lpm)"
                  : "Average resting heart rate (bpm)"}
              </label>
              <input
                id="restingHr"
                type="number"
                min="35"
                max="140"
                required
                value={restingHeartRateBpm}
                onChange={(e) => setRestingHeartRateBpm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 font-mono tabular-nums text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="hydrationTarget"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Meta de hidratación diaria (Litros)"
                  : "Daily hydration target (Liters)"}
              </label>
              <input
                id="hydrationTarget"
                type="number"
                step="0.1"
                min="1"
                max="6"
                value={hydrationTargetLiters}
                onChange={(e) => setHydrationTargetLiters(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 font-mono tabular-nums text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section B: Clinical History, Complications & Allergies */}
        <div className="rounded-xl border border-slate-800 bg-[#0D121B] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="font-display text-lg font-semibold text-white">
              {isEs
                ? "02. Historial Clínico, Alergias y Nutrición"
                : "02. Medical History, Allergies & Nutrition"}
            </h2>
            <span className="font-mono text-xs text-slate-400">
              {isEs
                ? "Referencia crítica para IA y Emergencias"
                : "Critical reference for AI & Emergency Protocols"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="diseaseHistory"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs ? "Historial de enfermedades" : "Medical / disease history"}
              </label>
              <textarea
                id="diseaseHistory"
                rows={3}
                value={diseaseHistory}
                onChange={(e) => setDiseaseHistory(e.target.value)}
                placeholder={
                  isEs
                    ? "Antecedentes médicos relevantes, cirugías previas o condiciones crónicas..."
                    : "Relevant medical history, prior surgeries, or chronic conditions..."
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="knownComplications"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Posibles complicaciones médicas conocidas"
                  : "Known medical complications"}
              </label>
              <textarea
                id="knownComplications"
                rows={3}
                value={knownComplications}
                onChange={(e) => setKnownComplications(e.target.value)}
                placeholder={
                  isEs
                    ? "Ej. tendencia a hipotensión ortostática, migrañas, barotrauma previo..."
                    : "e.g., orthostatic hypotension tendency, migraines, prior barotrauma..."
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="allergies"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Alergias (medicamentosas, alimentarias o ambientales)"
                  : "Allergies (medications, food, or environmental)"}
              </label>
              <textarea
                id="allergies"
                rows={3}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={
                  isEs
                    ? "Especificar fármacos o alimentos restringidos..."
                    : "Specify restricted medications or food allergens..."
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="nutrition"
                className="block text-xs font-medium text-slate-300 mb-2"
              >
                {isEs
                  ? "Datos nutricionales y preferencias"
                  : "Nutritional data & dietary preferences"}
              </label>
              <textarea
                id="nutrition"
                rows={3}
                value={nutritionPreferences}
                onChange={(e) => setNutritionPreferences(e.target.value)}
                placeholder={
                  isEs
                    ? "Requerimiento calórico, intolerancias, suplementación..."
                    : "Caloric target, intolerances, daily supplementation..."
                }
                className="w-full rounded-lg border border-slate-700 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ClipboardCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {isEs
                ? "Los datos se consolidan con su ID de la NASA en la base de datos local."
                : "Data is consolidated with your NASA ID in the local crew database."}
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            {isEs
              ? "Consolidar Perfil e Ir a Cabina"
              : "Save Medical Profile & Enter Cabin"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
};
