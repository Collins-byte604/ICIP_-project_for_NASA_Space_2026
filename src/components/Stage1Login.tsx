import React, { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { AppLanguage, AstronautIdentity } from "../types/icip";
import missionEmblemImg from "../assets/images/nasa_mission_emblem_1794702054743.jpg";
import orbitalCabinImg from "../assets/images/orbital_cabin_backdrop_1794702055741.jpg";

interface Stage1LoginProps {
  lang?: AppLanguage;
  existingIdentity: AstronautIdentity | null;
  onAuthenticate: (identity: AstronautIdentity) => void;
  onResumeExisting: () => void;
}

export const Stage1Login: React.FC<Stage1LoginProps> = ({
  lang = "en",
  existingIdentity,
  onAuthenticate,
  onResumeExisting,
}) => {
  const [firstName, setFirstName] = useState(existingIdentity?.firstName ?? "");
  const [lastName, setLastName] = useState(existingIdentity?.lastName ?? "");
  const [nasaId, setNasaId] = useState(existingIdentity?.nasaId ?? "");
  const [passwordAssigned, setPasswordAssigned] = useState(
    existingIdentity?.passwordAssigned ?? ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emblemBroken, setEmblemBroken] = useState(false);
  const [cabinImgBroken, setCabinImgBroken] = useState(false);

  const isEs = lang === "es";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const nid = nasaId.trim().toUpperCase();
    const pwd = passwordAssigned.trim();

    if (!fn || !ln || !nid || !pwd) {
      setError(
        isEs
          ? "Todos los campos son obligatorios para inicializar el perfil biomédico orbital."
          : "All fields are required to initialize your orbital biomedical profile."
      );
      return;
    }
    if (pwd.length < 4) {
      setError(
        isEs
          ? "La contraseña asignada por la NASA debe tener al menos 4 caracteres."
          : "NASA-assigned password must be at least 4 characters long."
      );
      return;
    }

    setError(null);
    onAuthenticate({
      firstName: fn,
      lastName: ln,
      nasaId: nid,
      passwordAssigned: pwd,
      authenticatedAt: new Date().toISOString(),
    });
  };

  const handleFillSample = () => {
    setFirstName("Elena");
    setLastName("Vásquez");
    setNasaId("NASA-AST-408");
    setPasswordAssigned("ORION-2026-XP");
    setError(null);
  };

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-10 lg:py-14">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left Column: Mission Identity & Authentication Form */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0D121B] p-8 hud-panel-glow">
          <div>
            {/* Mission Emblem & Official Designation */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-slate-800/90">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#07090E] flex items-center justify-center">
                {!emblemBroken ? (
                  <img
                    src={missionEmblemImg}
                    alt="NASA Space Apps Challenge & ICIP Official Mission Emblem"
                    referrerPolicy="no-referrer"
                    onError={() => setEmblemBroken(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    viewBox="0 0 80 80"
                    className="h-16 w-16 text-cyan-400"
                    fill="none"
                    aria-label="NASA Space Apps Challenge Emblem"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <ellipse
                      cx="40"
                      cy="40"
                      rx="30"
                      ry="12"
                      transform="rotate(-25 40 40)"
                      stroke="#E2E8F0"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M36 28H44V36H52V44H44V52H36V44H28V36H36V28Z"
                      stroke="#22D3EE"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="font-mono text-xs font-medium tracking-wider text-cyan-400">
                  {isEs
                    ? "NASA Space Apps Challenge · Etapa 1 de 4"
                    : "NASA Space Apps Challenge · Stage 1 of 4"}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
                  Instant Care (Innovative Protection)
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {isEs
                    ? "Sistema operativo portátil de protección biomédica y respuesta médica para tripulación orbital y caminatas espaciales."
                    : "Portable biomedical protection and emergency medical operating system for orbital crew and EVA spacewalks."}
                </p>
              </div>
            </div>

            {/* Resume Existing Profile Banner if present in localStorage */}
            {existingIdentity && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-mono text-emerald-400">
                    {isEs
                      ? "Perfil guardado en base de datos local"
                      : "Profile saved in local crew database"}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {existingIdentity.firstName} {existingIdentity.lastName} ·{" "}
                    <span className="font-mono text-slate-300">
                      {existingIdentity.nasaId}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onResumeExisting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap shrink-0 hover:bg-emerald-400 transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  {isEs ? "Reanudar Misión" : "Resume Mission"}
                </button>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-medium text-slate-300 mb-2"
                  >
                    {isEs ? "Nombre del Astronauta *" : "Astronaut First Name *"}
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isEs ? "Ej. Elena" : "e.g. Elena"}
                    className="w-full rounded-lg border border-slate-700/90 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-medium text-slate-300 mb-2"
                  >
                    {isEs ? "Apellido del Astronauta *" : "Astronaut Last Name *"}
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isEs ? "Ej. Vásquez" : "e.g. Vásquez"}
                    className="w-full rounded-lg border border-slate-700/90 bg-[#07090E] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="nasaId"
                    className="block text-xs font-medium text-slate-300 mb-2"
                  >
                    {isEs ? "ID de la NASA *" : "NASA ID *"}
                  </label>
                  <input
                    id="nasaId"
                    type="text"
                    required
                    value={nasaId}
                    onChange={(e) => setNasaId(e.target.value)}
                    placeholder={isEs ? "Ej. NASA-AST-408" : "e.g. NASA-AST-408"}
                    className="w-full rounded-lg border border-slate-700/90 bg-[#07090E] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nasaPassword"
                    className="block text-xs font-medium text-slate-300 mb-2"
                  >
                    {isEs
                      ? "Contraseña asignada por la NASA *"
                      : "NASA-Assigned Password *"}
                  </label>
                  <div className="relative">
                    <input
                      id="nasaPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordAssigned}
                      onChange={(e) => setPasswordAssigned(e.target.value)}
                      placeholder={isEs ? "Clave de acceso de misión" : "Mission access key"}
                      className="w-full rounded-lg border border-slate-700/90 bg-[#07090E] py-2.5 pl-3.5 pr-10 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? isEs
                            ? "Ocultar contraseña"
                            : "Hide password"
                          : isEs
                          ? "Mostrar contraseña"
                          : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-cyan-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-left text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {isEs ? "Rellenar credenciales de prueba" : "Fill sample NASA credentials"}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                >
                  <Lock className="h-4 w-4" />
                  {isEs
                    ? "Autenticar e Inicializar Perfil"
                    : "Authenticate & Initialize Profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex items-center gap-2.5 border-t border-slate-800/80 pt-5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              {isEs
                ? "Registro persistente en almacenamiento local del dispositivo portátil ICIP."
                : "Persistent local registry stored directly on the ICIP portable unit."}
            </span>
          </div>
        </div>

        {/* Right Column: Orbital Cabin Visual & Mission Architecture Overview */}
        <div className="lg:col-span-6 flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#0D121B]">
          <div className="relative h-64 sm:h-72 lg:h-80 w-full overflow-hidden bg-[#07090E]">
            {!cabinImgBroken ? (
              <img
                src={orbitalCabinImg}
                alt="Orbital medical module and space cabin telemetry console"
                referrerPolicy="no-referrer"
                onError={() => setCabinImgBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center hud-grid-bg text-cyan-500/50">
                <span className="font-mono text-xs tracking-wider">
                  {isEs ? "MÓDULO MÉDICO ORBITAL ICIP" : "ICIP ORBITAL MEDICAL MODULE"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D121B] via-[#0D121B]/45 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6">
              <p className="font-mono text-xs text-cyan-300">
                {isEs
                  ? "Arquitectura Operativa ICIP · NASA Space Apps Challenge"
                  : "ICIP Operational Architecture · NASA Space Apps Challenge"}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-white">
                {isEs
                  ? "Cuidado médico continuo de cabina a caminata espacial"
                  : "Continuous medical protection from cabin to EVA spacewalk"}
              </h2>
            </div>
          </div>

          <div className="flex-1 p-8 space-y-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              {isEs
                ? "ICIP integra el historial clínico previo al vuelo con sensores ambientales de cabina, análisis anatómico por holograma y respuesta de emergencia autónoma en el traje EVA."
                : "ICIP unifies pre-flight clinical baselines with cabin environmental sensors, interactive hologram diagnostics, and autonomous EVA suit emergency protocols."}
            </p>

            <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
              <div className="py-3.5 flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-cyan-400 shrink-0">
                  {isEs ? "01. Acceso" : "01. Access"}
                </span>
                <span className="text-sm text-slate-300 text-right">
                  {isEs
                    ? "Validación de identidad NASA y apertura de expediente local"
                    : "NASA credential verification & local crew record initialization"}
                </span>
              </div>
              <div className="py-3.5 flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-cyan-400 shrink-0">
                  {isEs ? "02. Línea Base" : "02. Baseline"}
                </span>
                <span className="text-sm text-slate-300 text-right">
                  {isEs
                    ? "Biometría inicial, alergias, glucosa y perfil nutricional"
                    : "Pre-flight vitals, allergies, glucose, and nutrition profile"}
                </span>
              </div>
              <div className="py-3.5 flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-cyan-400 shrink-0">
                  {isEs ? "03. Escáner Diario" : "03. Daily Scanner"}
                </span>
                <span className="text-sm text-slate-300 text-right">
                  {isEs
                    ? "Sensores de cabina, holograma 360° y médico conversacional IA"
                    : "Cabin sensors, 360° hologram, and conversational AI medical officer"}
                </span>
              </div>
              <div className="py-3.5 flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-cyan-400 shrink-0">
                  {isEs ? "04. Modo Traje" : "04. Suit Mode"}
                </span>
                <span className="text-sm text-slate-300 text-right">
                  {isEs
                    ? "Protocolo de primeros auxilios y socorro a Cabina y Tierra"
                    : "First-aid protocol & real-time distress beacon to Cabin & Earth"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
