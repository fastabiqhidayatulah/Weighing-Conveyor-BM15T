import { Scale, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { CalculationResults, HardwareConstants } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface LoadCellReadoutProps {
  results: CalculationResults;
  constants: HardwareConstants;
  onOpenCalibration: () => void;
}

export function LoadCellReadout({ results, constants, onOpenCalibration }: LoadCellReadoutProps) {
  const percentLoad = (results.gayaBebanPerLoadCell / constants.loadCellRatedCapacityKg) * 100;
  const isOverload = percentLoad > 90;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
            Status Sensor Dual Load Cell (Kiri & Kanan)
          </h3>
        </div>

        <button
          onClick={onOpenCalibration}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 transition-colors"
        >
          <Cpu className="w-3.5 h-3.5" />
          Kalibrasi Nol / Span (Zero Tare)
        </button>
      </div>

      {/* Dual Cells Comparison Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Load Cell 1 (Left) */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Load Cell 1 (Sisi Kiri)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              CH-1 A/D
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Beban Fisik Terukur</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {formatNum(results.gayaBebanPerLoadCell, 2)}
                </span>
                <span className="text-xs text-slate-400 font-mono">kg</span>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-[10px] text-slate-400">Sinyal Analog</div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {formatNum(results.loadCellMvOutput, 2)} mV
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {formatNum(results.transmitterMaOutput, 2)} mA
              </div>
            </div>
          </div>

          {/* Breakdown Net vs Tare */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400">Netto (Material): </span>
              <span className="text-emerald-400 font-semibold">{formatNum(results.gayaNettoPerLoadCell, 2)} kg</span>
            </div>
            <div>
              <span className="text-slate-400">Tare (Rangka): </span>
              <span className="text-slate-400">{formatNum(results.gayaUkurTare / 2, 2)} kg</span>
            </div>
          </div>
        </div>

        {/* Load Cell 2 (Right) */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Load Cell 2 (Sisi Kanan)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              CH-2 A/D
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Beban Fisik Terukur</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {formatNum(results.gayaBebanPerLoadCell, 2)}
                </span>
                <span className="text-xs text-slate-400 font-mono">kg</span>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-[10px] text-slate-400">Sinyal Analog</div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {formatNum(results.loadCellMvOutput, 2)} mV
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {formatNum(results.transmitterMaOutput, 2)} mA
              </div>
            </div>
          </div>

          {/* Breakdown Net vs Tare */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400">Netto (Material): </span>
              <span className="text-emerald-400 font-semibold">{formatNum(results.gayaNettoPerLoadCell, 2)} kg</span>
            </div>
            <div>
              <span className="text-slate-400">Tare (Rangka): </span>
              <span className="text-slate-400">{formatNum(results.gayaUkurTare / 2, 2)} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Utilization Bar */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Utilisasi Kapasitas Sensor ({constants.loadCellRatedCapacityKg} kg FS):</span>
          <span className={`font-mono font-bold ${isOverload ? 'text-rose-400' : 'text-slate-200'}`}>
            {percentLoad.toFixed(1)}% dari kapasitas terpasang
          </span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverload ? 'bg-rose-500' : percentLoad > 75 ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(percentLoad, 100)}%` }}
          />
        </div>

        {isOverload && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Peringatan: Beban sensor mendekati batas kapasitas maksimum load cell (50 kg)!
          </div>
        )}
      </div>
    </div>
  );
}
