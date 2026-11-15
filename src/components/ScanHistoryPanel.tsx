import React, { useState } from "react";
import { AppLanguage, DailyScanRecord } from "../types/icip";
import { getEmergencyLevelMeta } from "../utils/medicalEngine";

interface ScanHistoryPanelProps {
  lang?: AppLanguage;
  history: DailyScanRecord[];
  activeScanId: string | null;
  onSelectScan: (scan: DailyScanRecord) => void;
}

export const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({
  lang = "en",
  history,
  activeScanId,
  onSelectScan,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isEs = lang === "es";
  const levelMetaMap = getEmergencyLevelMeta(lang);

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0D121B] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <h2 className="font-display text-base font-semibold text-white">
            {isEs ? "Base de Datos Histórica de Salud" : "Historical Health Database"}
          </h2>
          <span className="font-mono text-xs text-slate-400">
            {isEs ? "0 registros almacenados" : "0 stored records"}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          {isEs
            ? "Completa tu primer escaneo de cabina para iniciar la serie temporal biomédica del astronauta en el almacenamiento local."
            : "Complete your first cabin body scan to initiate the astronaut's biomedical time-series log in local storage."}
        </p>
      </div>
    );
  }

  const chartPoints = [...history].slice(0, 12).reverse();
  const width = 560;
  const height = 140;
  const padX = 28;
  const padY = 18;

  const getX = (idx: number) => {
    if (chartPoints.length <= 1) return width / 2;
    return padX + (idx / (chartPoints.length - 1)) * (width - padX * 2);
  };

  const getHrY = (hr: number) => {
    const min = 45;
    const max = 125;
    const norm = Math.min(1, Math.max(0, (hr - min) / (max - min)));
    return height - padY - norm * (height - padY * 2);
  };

  const getGluY = (glu: number) => {
    const min = 60;
    const max = 160;
    const norm = Math.min(1, Math.max(0, (glu - min) / (max - min)));
    return height - padY - norm * (height - padY * 2);
  };

  const hrPath = chartPoints
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getHrY(
          p.metrics.heartRateBpm
        ).toFixed(1)}`
    )
    .join(" ");

  const gluPath = chartPoints
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getGluY(
          p.metrics.glucoseMgDl
        ).toFixed(1)}`
    )
    .join(" ");

  const hoveredPoint = hoveredIdx !== null ? chartPoints[hoveredIdx] : null;
  const locale = isEs ? "es-ES" : "en-US";
  const hrUnit = isEs ? "lpm" : "bpm";

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0D121B] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            {isEs ? "Base de Datos Histórica de Salud" : "Historical Health Database"}
          </h2>
          <p className="text-xs text-slate-400">
            {isEs
              ? "Registro cronológico automático en localStorage · Haz clic en una fila para inspeccionar su holograma"
              : "Automatic chronological log in localStorage · Click any row to inspect its hologram readout"}
          </p>
        </div>
        <span className="font-mono text-xs text-cyan-400 tabular-nums">
          {history.length}{" "}
          {isEs
            ? history.length === 1
              ? "escaneo registrado"
              : "escaneos registrados"
            : history.length === 1
            ? "scan logged"
            : "scans logged"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Dual-Channel Telemetry SVG Trend Chart */}
        <div className="lg:col-span-5 rounded-lg border border-slate-800/90 bg-[#07090E] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-300">
              {isEs ? "Tendencia FC y Glucosa" : "HR & Glucose Trend"}
            </span>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="text-cyan-400">
                — {isEs ? "FC (lpm)" : "HR (bpm)"}
              </span>
              <span className="text-emerald-400">
                - - {isEs ? "Glucosa (mg/dL)" : "Glucose (mg/dL)"}
              </span>
            </div>
          </div>

          <div className="relative mt-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-36 overflow-visible"
              role="img"
              aria-label={
                isEs
                  ? "Gráfica de tendencia de ritmo cardíaco y glucosa"
                  : "Heart rate and glucose trend chart"
              }
            >
              {[0.25, 0.5, 0.75].map((t) => (
                <line
                  key={t}
                  x1={padX}
                  x2={width - padX}
                  y1={padY + t * (height - padY * 2)}
                  y2={padY + t * (height - padY * 2)}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeWidth="1"
                />
              ))}

              <path
                d={gluPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="1.75"
                strokeDasharray="4 4"
              />
              <path d={hrPath} fill="none" stroke="#06B6D4" strokeWidth="2" />

              {chartPoints.map((pt, idx) => {
                const x = getX(idx);
                const yHr = getHrY(pt.metrics.heartRateBpm);
                const yGlu = getGluY(pt.metrics.glucoseMgDl);
                return (
                  <g key={pt.id}>
                    {hoveredIdx === idx && (
                      <line
                        x1={x}
                        x2={x}
                        y1={padY}
                        y2={height - padY}
                        stroke="rgba(34, 211, 238, 0.45)"
                        strokeWidth="1"
                      />
                    )}
                    <circle cx={x} cy={yHr} r="3.5" fill="#06B6D4" />
                    <circle cx={x} cy={yGlu} r="3" fill="#10B981" />
                    <rect
                      x={x - 16}
                      y={0}
                      width="32"
                      height={height}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => onSelectScan(pt)}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="mt-1 flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-400">
              {hoveredPoint ? (
                <>
                  <span>
                    {new Date(hoveredPoint.timestamp).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-cyan-300">
                    {isEs ? "FC" : "HR"}: {hoveredPoint.metrics.heartRateBpm}{" "}
                    {hrUnit} · {isEs ? "Glucosa" : "Glucose"}:{" "}
                    {hoveredPoint.metrics.glucoseMgDl} mg/dL · SpO2:{" "}
                    {hoveredPoint.metrics.spo2Percent}%
                  </span>
                </>
              ) : (
                <span>
                  {isEs
                    ? "Pasa el cursor sobre la serie para ver valores exactos"
                    : "Hover over the series to inspect exact values"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Historical Table */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <th className="py-2 pr-3 font-medium">
                  {isEs ? "Fecha / Hora" : "Date / Time"}
                </th>
                <th className="py-2 px-3 font-medium">
                  {isEs ? "Estado F/M/E" : "P/M/E Score"}
                </th>
                <th className="py-2 px-3 font-medium">{isEs ? "FC" : "HR"}</th>
                <th className="py-2 px-3 font-medium">SpO2</th>
                <th className="py-2 px-3 font-medium">
                  {isEs ? "Glucosa" : "Glucose"}
                </th>
                <th className="py-2 pl-3 font-medium text-right">
                  {isEs ? "Nivel Alerta" : "Alert Level"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {history.slice(0, 8).map((item) => {
                const isActive = item.id === activeScanId;
                const meta = levelMetaMap[item.emergencyLevel ?? 1];
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectScan(item)}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? "bg-cyan-500/12 text-white"
                        : "text-slate-300 hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-mono tabular-nums whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString(locale, {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {item.subjective.physicalScore}/{item.subjective.mentalScore}/
                      {item.subjective.emotionalScore}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-cyan-300">
                      {item.metrics.heartRateBpm} {hrUnit}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {item.metrics.spo2Percent}%
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {item.metrics.glucoseMgDl} mg/dL
                    </td>
                    <td
                      className={`py-2.5 pl-3 font-mono text-right font-semibold ${meta.textClass}`}
                    >
                      {meta.severityLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
