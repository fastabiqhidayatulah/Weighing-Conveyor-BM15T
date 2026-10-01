import { useState } from 'react';
import { X, Check, Cpu, RefreshCw, Scale } from 'lucide-react';
import { CalculationResults, ConveyorInputs } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: ConveyorInputs;
  results: CalculationResults;
  onUpdateTare: (newTareKg: number) => void;
}

export function CalibrationModal({
  isOpen,
  onClose,
  inputs,
  results,
  onUpdateTare,
}: CalibrationModalProps) {
  const [calibrating, setCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  const [calibSuccess, setCalibSuccess] = useState(false);
  const [testWeightKg, setTestWeightKg] = useState(10);

  if (!isOpen) return null;

  const handleStartZeroCalibration = () => {
    setCalibrating(true);
    setCalibProgress(0);
    setCalibSuccess(false);

    const stepInterval = setInterval(() => {
      setCalibProgress((prev) => {
        if (prev >= 100) {
          clearInterval(stepInterval);
          setCalibrating(false);
          setCalibSuccess(true);
          // Set tare calibrated
          onUpdateTare(inputs.tareWeightKg);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Kalibrasi Zero & Span Timbangan</h3>
              <p className="text-xs text-slate-400">Prosedur penyesuaian offset tare dan kompensasi sudut</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Routine 1: Zero Tare Calibration */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Kalibrasi Nol (Zero / Tare Routine)
                </div>
                <div className="text-[11px] text-slate-400">
                  Mengukur berat sabuk kosong pada sudut {inputs.inclineAngleDeg}°
                </div>
              </div>

              <button
                onClick={handleStartZeroCalibration}
                disabled={calibrating}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin' : ''}`} />
                {calibrating ? 'Mengukur...' : 'Mulai Kalibrasi Nol'}
              </button>
            </div>

            {calibrating && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Sampling 1 putaran sabuk penuh...</span>
                  <span className="font-mono text-amber-300">{calibProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${calibProgress}%` }} />
                </div>
              </div>
            )}

            {calibSuccess && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero tare berhasil disimpan! Offset gaya terkompensasi: {formatNum(results.gayaUkurTare, 2)} kg</span>
              </div>
            )}
          </div>

          {/* Routine 2: Span Check with Test Weights */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="font-semibold text-slate-200">Uji Span Beban Uji (Static Test Weight)</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Simulasi meletakkan beban uji pada idler penimbang untuk memverifikasi akurasi faktor pengali integrator.
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-slate-300 text-[11px]">Beban Uji Terpasang:</label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1">
                  <input
                    type="number"
                    value={testWeightKg}
                    onChange={(e) => setTestWeightKg(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-12 bg-transparent text-right font-mono font-bold text-cyan-300 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[11px] ml-1">kg</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400">Gaya Normal Terbaca:</div>
                <div className="font-mono font-bold text-emerald-400">
                  {formatNum(testWeightKg * results.cosTheta, 2)} kg
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
