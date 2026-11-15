import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import {
  AppLanguage,
  BodyZoneId,
  ClinicalStatus,
  ZoneAnalysis,
} from "../types/icip";

interface BodyHologramProps {
  lang?: AppLanguage;
  isScanning: boolean;
  scanProgress: number;
  selectedZone: BodyZoneId;
  onSelectZone: (zone: BodyZoneId) => void;
  zoneReports: ZoneAnalysis[];
  hasScanned: boolean;
}

function getZoneCoords(
  lang: AppLanguage
): Record<BodyZoneId, { cx: number; cy: number; label: string; short: string }> {
  if (lang === "es") {
    return {
      cranium: { cx: 150, cy: 52, label: "Cráneo / SNC", short: "SNC" },
      thorax: { cx: 150, cy: 132, label: "Tórax / Cardiopulmonar", short: "TÓRAX" },
      abdomen: { cx: 150, cy: 196, label: "Abdomen / Metabólico", short: "METAB" },
      upperLimbs: { cx: 78, cy: 155, label: "Extremidades Sup.", short: "BRAZOS" },
      lowerLimbs: { cx: 122, cy: 318, label: "Extremidades Inf.", short: "PIERNAS" },
    };
  }
  return {
    cranium: { cx: 150, cy: 52, label: "Cranium / CNS", short: "CNS" },
    thorax: { cx: 150, cy: 132, label: "Thorax / Cardiopulm.", short: "THORAX" },
    abdomen: { cx: 150, cy: 196, label: "Abdomen / Metabolic", short: "METAB" },
    upperLimbs: { cx: 78, cy: 155, label: "Upper Limbs", short: "ARMS" },
    lowerLimbs: { cx: 122, cy: 318, label: "Lower Limbs", short: "LEGS" },
  };
}

function getStatusColors(status: ClinicalStatus, lang: AppLanguage) {
  const isEs = lang === "es";
  if (status === "alerta") {
    return {
      stroke: "#F43F5E",
      fill: "rgba(244, 63, 94, 0.22)",
      text: "text-rose-400",
      border: "border-rose-500/40",
      label: isEs ? "Alerta" : "Alert",
    };
  }
  if (status === "observacion") {
    return {
      stroke: "#F59E0B",
      fill: "rgba(245, 158, 11, 0.20)",
      text: "text-amber-400",
      border: "border-amber-500/40",
      label: isEs ? "Observación" : "Watch",
    };
  }
  return {
    stroke: "#10B981",
    fill: "rgba(16, 185, 129, 0.18)",
    text: "text-emerald-400",
    border: "border-emerald-500/35",
    label: "Nominal",
  };
}

export const BodyHologram: React.FC<BodyHologramProps> = ({
  lang = "en",
  isScanning,
  scanProgress,
  selectedZone,
  onSelectZone,
  zoneReports,
  hasScanned,
}) => {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const isEs = lang === "es";
  const zoneCoords = getZoneCoords(lang);

  const getZoneStatus = (zoneId: BodyZoneId): ClinicalStatus => {
    const found = zoneReports.find((z) => z.zoneId === zoneId);
    return found?.status ?? "nominal";
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 300);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 430);
    setCursorPos({ x, y });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Interactive Zone Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-800/80">
        {(Object.keys(zoneCoords) as BodyZoneId[]).map((zoneId) => {
          const active = selectedZone === zoneId;
          const status = getZoneStatus(zoneId);
          const tone = getStatusColors(status, lang);
          return (
            <button
              key={zoneId}
              type="button"
              onClick={() => onSelectZone(zoneId)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50"
                  : "bg-[#07090E] text-slate-300 border border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
            >
              {hasScanned && status === "alerta" && (
                <AlertTriangle className="h-3 w-3 text-rose-400" />
              )}
              {hasScanned && status === "observacion" && (
                <Eye className="h-3 w-3 text-amber-400" />
              )}
              {hasScanned && status === "nominal" && (
                <CheckCircle2 className={`h-3 w-3 ${tone.text}`} />
              )}
              <span>{zoneCoords[zoneId].label}</span>
            </button>
          );
        })}
      </div>

      {/* Hologram Viewport */}
      <div className="relative mt-4 flex-1 min-h-[410px] rounded-xl border border-slate-800 bg-[#07090E] hud-grid-bg overflow-hidden flex items-center justify-center p-4">
        {/* Coordinate corner readout */}
        <div className="pointer-events-none absolute top-3 left-4 font-mono text-[11px] text-cyan-400/80 tabular-nums">
          {isScanning
            ? `${isEs ? "BARRIDO BIOMÉTRICO" : "BIOMETRIC SWEEP"}: ${scanProgress}%`
            : hasScanned
            ? `${isEs ? "ZONA ACTIVA" : "ACTIVE ZONE"}: ${zoneCoords[selectedZone].short}`
            : isEs
            ? "ESPERANDO ESCANEO DE CABINA"
            : "AWAITING CABIN SCAN"}
        </div>

        <div className="pointer-events-none absolute top-3 right-4 font-mono text-[11px] text-slate-500 tabular-nums">
          {cursorPos ? `X:${cursorPos.x} Y:${cursorPos.y}` : "HOLO-AXIS 1:1"}
        </div>

        {/* Active scanning horizontal laser beam */}
        {isScanning && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_2px_rgba(34,211,238,0.65)] animate-scan-beam z-20"
          />
        )}

        {/* Precision SVG Anatomical Wireframe */}
        <svg
          viewBox="0 0 300 430"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
          className="h-[390px] w-full max-w-[300px] cursor-crosshair select-none"
          role="img"
          aria-label={
            isEs
              ? "Holograma anatómico interactivo del cuerpo humano"
              : "Interactive human body anatomical hologram"
          }
        >
          <defs>
            <radialGradient id="holoGlow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.16)" />
              <stop offset="100%" stopColor="rgba(7, 9, 14, 0)" />
            </radialGradient>
          </defs>

          <ellipse cx="150" cy="215" rx="115" ry="185" fill="url(#holoGlow)" />

          <ellipse
            cx="150"
            cy="402"
            rx="86"
            ry="14"
            fill="none"
            stroke="rgba(34, 211, 238, 0.35)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <ellipse
            cx="150"
            cy="402"
            rx="56"
            ry="8"
            fill="none"
            stroke="rgba(34, 211, 238, 0.55)"
            strokeWidth="1"
          />

          <line
            x1="150"
            y1="30"
            x2="150"
            y2="245"
            stroke="rgba(34, 211, 238, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* CRANIUM ZONE */}
          <g
            onClick={() => onSelectZone("cranium")}
            className="cursor-pointer transition-opacity hover:opacity-100"
          >
            <path
              d="M150 22 C132 22 124 36 125 53 C126 67 136 78 150 78 C164 78 174 67 175 53 C176 36 168 22 150 22 Z"
              fill={
                selectedZone === "cranium"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("cranium"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "cranium"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("cranium"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "cranium" ? "2" : "1.25"}
            />
            <path
              d="M138 45 Q150 36 162 45 M142 56 H158"
              fill="none"
              stroke="rgba(226, 232, 240, 0.55)"
              strokeWidth="1"
            />
          </g>

          {/* Neck */}
          <path
            d="M141 78 L139 94 L161 94 L159 78"
            fill="none"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth="1"
          />

          {/* THORAX ZONE */}
          <g onClick={() => onSelectZone("thorax")} className="cursor-pointer">
            <path
              d="M114 96 L186 96 L180 164 L120 164 Z"
              fill={
                selectedZone === "thorax"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("thorax"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "thorax"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("thorax"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "thorax" ? "2" : "1.25"}
            />
            <path
              d="M126 112 H174 M124 126 H176 M126 140 H174 M130 152 H170"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1"
            />
            <circle
              cx="157"
              cy="128"
              r="9"
              fill="rgba(34, 211, 238, 0.18)"
              stroke="#22D3EE"
              strokeWidth="1.2"
            />
          </g>

          {/* ABDOMEN ZONE */}
          <g onClick={() => onSelectZone("abdomen")} className="cursor-pointer">
            <path
              d="M120 166 L180 166 L176 228 L124 228 Z"
              fill={
                selectedZone === "abdomen"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("abdomen"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "abdomen"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("abdomen"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "abdomen" ? "2" : "1.25"}
            />
            <path
              d="M132 184 Q150 176 168 184 M134 204 Q150 212 166 204"
              fill="none"
              stroke="rgba(148, 163, 184, 0.4)"
              strokeWidth="1"
            />
          </g>

          {/* UPPER LIMBS ZONE */}
          <g onClick={() => onSelectZone("upperLimbs")} className="cursor-pointer">
            <path
              d="M112 97 L84 112 L72 172 L64 226 L77 230 L89 175 L102 124 L114 116 Z"
              fill={
                selectedZone === "upperLimbs"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("upperLimbs"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "upperLimbs"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("upperLimbs"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "upperLimbs" ? "2" : "1.25"}
            />
            <path
              d="M188 97 L216 112 L228 172 L236 226 L223 230 L211 175 L198 124 L186 116 Z"
              fill={
                selectedZone === "upperLimbs"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("upperLimbs"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "upperLimbs"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("upperLimbs"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "upperLimbs" ? "2" : "1.25"}
            />
          </g>

          {/* LOWER LIMBS ZONE */}
          <g onClick={() => onSelectZone("lowerLimbs")} className="cursor-pointer">
            <path
              d="M124 230 L148 230 L143 310 L137 390 L118 390 L120 308 Z"
              fill={
                selectedZone === "lowerLimbs"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("lowerLimbs"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "lowerLimbs"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("lowerLimbs"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "lowerLimbs" ? "2" : "1.25"}
            />
            <path
              d="M152 230 L176 230 L180 308 L182 390 L163 390 L157 310 Z"
              fill={
                selectedZone === "lowerLimbs"
                  ? "rgba(34, 211, 238, 0.22)"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("lowerLimbs"), lang).fill
                  : "rgba(15, 23, 42, 0.55)"
              }
              stroke={
                selectedZone === "lowerLimbs"
                  ? "#22D3EE"
                  : hasScanned
                  ? getStatusColors(getZoneStatus("lowerLimbs"), lang).stroke
                  : "#38BDF8"
              }
              strokeWidth={selectedZone === "lowerLimbs" ? "2" : "1.25"}
            />
          </g>

          {/* Active target reticle on selected zone */}
          {(() => {
            const c = zoneCoords[selectedZone];
            return (
              <g className="pointer-events-none">
                <circle
                  cx={c.cx}
                  cy={c.cy}
                  r="14"
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                />
                <line
                  x1={c.cx - 20}
                  y1={c.cy}
                  x2={c.cx - 8}
                  y2={c.cy}
                  stroke="#22D3EE"
                  strokeWidth="1.2"
                />
                <line
                  x1={c.cx + 8}
                  y1={c.cy}
                  x2={c.cx + 20}
                  y2={c.cy}
                  stroke="#22D3EE"
                  strokeWidth="1.2"
                />
                <line
                  x1={c.cx}
                  y1={c.cy - 20}
                  x2={c.cx}
                  y2={c.cy - 8}
                  stroke="#22D3EE"
                  strokeWidth="1.2"
                />
                <line
                  x1={c.cx}
                  y1={c.cy + 8}
                  x2={c.cx}
                  y2={c.cy + 20}
                  stroke="#22D3EE"
                  strokeWidth="1.2"
                />
              </g>
            );
          })()}
        </svg>

        {/* Bottom HUD Hint */}
        <div className="pointer-events-none absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            {isEs
              ? "Haz clic en cualquier región anatómica"
              : "Click any anatomical region"}
          </span>
          <span className="text-cyan-400">
            {hasScanned
              ? isEs
                ? "Telemetría sincronizada"
                : "Telemetry synchronized"
              : isEs
              ? "Escaneo pendiente"
              : "Scan pending"}
          </span>
        </div>
      </div>
    </div>
  );
};
