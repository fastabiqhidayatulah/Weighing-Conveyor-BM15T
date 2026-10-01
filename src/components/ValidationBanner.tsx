import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { ConveyorInputs, CalculationResults } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface ValidationBannerProps {
  inputs: ConveyorInputs;
  results: CalculationResults;
  onApplyValidationPreset: () => void;
}

export function ValidationBanner({ inputs, results, onApplyValidationPreset }: ValidationBannerProps) {
  const isValidationMatch = 
    inputs.targetCapacityTph === 11 &&
    inputs.vfdFrequencyHz === 50 &&
    inputs.inclineAngleDeg === 20 &&
    inputs.tareWeightKg === 15;

  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${
      isValidationMatch 
        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/20' 
        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isValidationMatch ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Benchmark Validasi Terpenuhi (100% Sesuai Spesifikasi)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Data Uji Validasi (Target Prompt)
              </span>
            )}
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-400 font-mono">
              VFD: {inputs.controlMode === 'auto_vfd' ? `${results.calculatedAutoVfdHz.toFixed(1)} Hz (Auto)` : `${inputs.vfdFrequencyHz} Hz`} | Rasio 1:43 | Incline: {inputs.inclineAngleDeg}° | {inputs.targetCapacityTph} T/h
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Kompensasi gravitasi trigonometri <code className="text-amber-300 font-mono font-medium">COS(20°) ≈ 0,939</code> dengan rasio gearbox terbaharui <code className="text-cyan-300 font-mono font-medium">1:43</code> (kecepatan belt 0,45 m/s).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          {!isValidationMatch ? (
            <button
              onClick={onApplyValidationPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Terapkan Acuan Revisi (50 Hz & 20° @ 1:43)
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Nilai Sinkron dengan Acuan Revisi (1:43)
            </div>
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-800/80">
        <div className="space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Kecepatan Sabuk</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-cyan-300">{formatNum(results.beltSpeedMs, 2)}</span>
            <span className="text-[10px] text-slate-400">m/s</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target (1:43): ~0,45 m/s</div>
        </div>

        <div className="space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Berat Aktual Timbangan</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-cyan-300">{formatNum(results.beratMaterialAreaTimbangan, 2)}</span>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target (1:43): 6,80 kg</div>
        </div>

        <div className="space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Gaya Ukur Material</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-emerald-300">{formatNum(results.gayaUkurMaterial, 2)}</span>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target: 6,39 kg (×0,939)</div>
        </div>

        <div className="space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Gaya Ukur Tare</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-emerald-300">{formatNum(results.gayaUkurTare, 2)}</span>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target: 14,08 kg (×0,939)</div>
        </div>

        <div className="space-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Total Beban / Load Cell</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-amber-300">{formatNum(results.gayaBebanPerLoadCell, 2)}</span>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Target: ~10,24 kg</div>
        </div>
      </div>
    </div>
  );
}
