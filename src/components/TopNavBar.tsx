import React from "react";
import {
  AppLanguage,
  AstronautIdentity,
  EmergencyLevel,
  MedicalBaseline,
  MissionStage,
} from "../types/icip";

interface TopNavBarProps {
  lang: AppLanguage;
  currentStage: MissionStage;
  identity: AstronautIdentity | null;
  baseline: MedicalBaseline | null;
  emergencyActive: boolean;
  emergencyLevel: EmergencyLevel;
  onSelectStage: (stage: MissionStage) => void;
  onResetSession: () => void;
  onFillDemo: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  lang,
  currentStage,
  identity,
  baseline,
  emergencyActive,
  emergencyLevel,
  onSelectStage,
  onResetSession,
  onFillDemo,
}) => {
  const isEs = lang === "es";

  const stages: { id: MissionStage; label: string }[] = isEs
    ? [
        { id: "login", label: "1. Acceso" },
        { id: "onboarding", label: "2. Perfil Médico" },
        { id: "cabin", label: "3. Escáner Cabina" },
        { id: "suit", label: "4. Traje y Emergencia" },
      ]
    : [
        { id: "login", label: "1. Access" },
        { id: "onboarding", label: "2. Medical Profile" },
        { id: "cabin", label: "3. Cabin Scanner" },
        { id: "suit", label: "4. Suit & Emergency" },
      ];

  const isUnlocked = (stage: MissionStage): boolean => {
    if (stage === "login") return true;
    if (stage === "onboarding") return Boolean(identity);
    if (stage === "cabin" || stage === "suit") {
      return Boolean(identity && baseline);
    }
    return false;
  };

  const headerTone = emergencyActive
    ? emergencyLevel === 3
      ? "border-red-500/50 bg-[#160709]/95"
      : emergencyLevel === 2
      ? "border-amber-400/50 bg-[#161206]/95"
      : "border-blue-500/50 bg-[#07101C]/95"
    : "border-slate-800/90 bg-[#07090E]/92";

  const activeTextTone = emergencyActive
    ? emergencyLevel === 3
      ? "text-red-400"
      : emergencyLevel === 2
      ? "text-amber-300"
      : "text-blue-400"
    : "text-cyan-400";

  const activeBarTone = emergencyActive
    ? emergencyLevel === 3
      ? "bg-red-500"
      : emergencyLevel === 2
      ? "bg-amber-400"
      : "bg-blue-500"
    : "bg-cyan-400";

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${headerTone}`}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() =>
            onSelectStage(identity ? (baseline ? "cabin" : "onboarding") : "login")
          }
          className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
          ICIP · Instant Care
        </button>

        {/* Zone 2: 4 single-line stage navigation links */}
        <nav
          aria-label={isEs ? "Etapas del sistema ICIP" : "ICIP system stages"}
          className="hidden md:flex items-center gap-6 overflow-x-auto"
        >
          {stages.map((stage) => {
            const active = currentStage === stage.id;
            const unlocked = isUnlocked(stage.id);
            return (
              <button
                key={stage.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onSelectStage(stage.id)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 ${
                  active
                    ? activeTextTone
                    : unlocked
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                {stage.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-[15px] h-0.5 ${activeBarTone}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          {identity ? (
            <button
              type="button"
              onClick={onResetSession}
              className="rounded-md border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 hover:border-slate-500 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              {isEs ? "Cerrar Sesión" : "Sign Out"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onFillDemo}
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-medium text-cyan-300 whitespace-nowrap shrink-0 hover:bg-cyan-500/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              {isEs ? "Cargar Demo NASA" : "Load NASA Demo"}
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile stage selector */}
      <div className="flex md:hidden items-center justify-between gap-2 border-t border-slate-800/80 px-4 py-2 overflow-x-auto">
        {stages.map((stage) => {
          const active = currentStage === stage.id;
          const unlocked = isUnlocked(stage.id);
          return (
            <button
              key={stage.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onSelectStage(stage.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded whitespace-nowrap shrink-0 ${
                active
                  ? "bg-cyan-500/15 text-cyan-300"
                  : unlocked
                  ? "text-slate-300"
                  : "text-slate-600"
              }`}
            >
              {stage.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
