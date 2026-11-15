import React, { useState } from "react";
import { ArrowRight, BookOpenCheck, ShieldCheck, Volume2 } from "lucide-react";
import { AppLanguage } from "../types/icip";
import missionEmblemImg from "../assets/images/nasa_mission_emblem_1794702054743.jpg";
import orbitalCabinImg from "../assets/images/orbital_cabin_backdrop_1794702055741.jpg";

interface WelcomeEntranceProps {
  lang: AppLanguage;
  onChangeLang: (lang: AppLanguage) => void;
  hasSavedSession: boolean;
  savedAstronautName?: string;
  onEnter: () => void;
  onResumeSaved?: () => void;
}

export const WelcomeEntrance: React.FC<WelcomeEntranceProps> = ({
  lang,
  onChangeLang,
  hasSavedSession,
  savedAstronautName,
  onEnter,
  onResumeSaved,
}) => {
  const [emblemBroken, setEmblemBroken] = useState(false);
  const [backdropBroken, setBackdropBroken] = useState(false);

  const isEs = lang === "es";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#07090E] px-6 py-12">
      {/* Subtle orbital backdrop with measured contrast scrim */}
      {!backdropBroken && (
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src={orbitalCabinImg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setBackdropBroken(true)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090E]/90 via-[#07090E]/75 to-[#07090E]" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 hud-grid-bg opacity-65" />

      <div className="relative z-10 mx-auto w-full max-w-4xl rounded-2xl border border-slate-800/90 bg-[#0D121B]/95 p-8 sm:p-12 hud-panel-glow">
        {/* Top utility bar inside welcome card: Official Event & Language Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800/80">
          <span className="font-mono text-xs font-medium tracking-wider text-cyan-400">
            NASA Space Apps Challenge
          </span>
          <div
            role="group"
            aria-label={isEs ? "Idioma del sistema" : "System language"}
            className="inline-flex rounded-md border border-slate-700 bg-[#07090E] p-0.5 text-xs font-mono"
          >
            <button
              type="button"
              onClick={() => onChangeLang("en")}
              className={`rounded px-2.5 py-1 transition-colors ${
                lang === "en"
                  ? "bg-cyan-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang("es")}
              className={`rounded px-2.5 py-1 transition-colors ${
                lang === "es"
                  ? "bg-cyan-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ES
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          {/* Mission Emblem */}
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#07090E] flex items-center justify-center">
            {!emblemBroken ? (
              <img
                src={missionEmblemImg}
                alt="ICIP NASA Space Apps Challenge Official Mission Emblem"
                referrerPolicy="no-referrer"
                onError={() => setEmblemBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 80 80"
                className="h-20 w-20 text-cyan-400"
                fill="none"
                aria-label="ICIP Emblem"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <path
                  d="M36 28H44V36H52V44H44V52H36V44H28V36H36V28Z"
                  stroke="#22D3EE"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>

          <h1 className="mt-6 font-display text-4xl sm:text-5xl font-bold tracking-tight text-white [text-wrap:balance]">
            {isEs ? "Bienvenido a ICIP" : "Welcome to ICIP"}
          </h1>

          <p className="mt-3 font-display text-xl sm:text-2xl font-semibold text-cyan-300">
            Instant Care (Innovative Protection) ICIP
          </p>

          <p className="mt-4 max-w-2xl text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
            “Universal monitoring of astronauts caring for and protecting lives”
          </p>

          <p className="mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
            {isEs
              ? "Sistema operativo portátil para monitoreo biomédico continuo, escáner holográfico en cabina y asistencia médica inmediata en caminatas espaciales EVA."
              : "Portable aerospace operating system for continuous biomedical monitoring, holographic cabin scanning, and immediate EVA spacesuit medical response."}
          </p>

          {/* Official Authorship, NASA Space Apps Challenge & Official NASA Data Attribution */}
          <div className="mt-7 w-full max-w-2xl rounded-xl border border-slate-800 bg-[#07090E]/90 p-5 text-left space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
              <BookOpenCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p>
                  <span className="font-semibold text-white">
                    {isEs ? "Autoría del Proyecto:" : "Project Authorship:"}
                  </span>{" "}
                  {isEs
                    ? "Equipo de Ingeniería Biomédica Aeroespacial ICIP (Instant Care — Innovative Protection)."
                    : "ICIP Aerospace Biomedical Engineering Team (Instant Care — Innovative Protection)."}
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">
                    NASA Space Apps Challenge:
                  </span>{" "}
                  {isEs
                    ? "Este proyecto ha sido elaborado para el NASA Space Apps Challenge."
                    : "This project was developed for the NASA Space Apps Challenge."}
                </p>
                <p className="text-slate-300">
                  <span className="font-semibold text-emerald-300">
                    {isEs ? "Fuentes Oficiales:" : "Official Data Sources:"}
                  </span>{" "}
                  {isEs
                    ? "Todos los datos, parámetros biomédicos de referencia y protocolos de esta aplicación se han recolectado con base en fuentes oficiales de la NASA (NASA Human Research Program, NASA-STD-3001 y estándares de trajes EVA)."
                    : "All application data, biomedical reference parameters, and operational thresholds have been collected based on official NASA sources (NASA Human Research Program, NASA-STD-3001, and EVA suit standards)."}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={onEnter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-cyan-500 px-7 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span>{isEs ? "Iniciar Acceso al Sistema" : "Launch System Access"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {hasSavedSession && onResumeSaved && (
              <button
                type="button"
                onClick={onResumeSaved}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                {isEs
                  ? `Reanudar sesión de ${savedAstronautName}`
                  : `Resume session for ${savedAstronautName}`}
              </button>
            )}
          </div>
        </div>

        {/* Clean unboxed operational metadata footer inside welcome card */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/90 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {isEs
                ? "4 Etapas Operativas · Base de Datos Local y Asistente IA"
                : "4 Sequential Stages · Local Crew Database & AI Medical Assistant"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              {isEs
                ? "Audio de telemetría y alerta médica por voz habilitados"
                : "Telemetry audio & automated voice medical alerts enabled"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
