import { X, Check, RotateCcw, Cog, ShieldCheck } from 'lucide-react';
import { HardwareConstants } from '../types/conveyor';
import { DEFAULT_CONSTANTS } from '../utils/calculations';

interface HardwareConstantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  constants: HardwareConstants;
  onSave: (constants: HardwareConstants) => void;
}

export function HardwareConstantsModal({
  isOpen,
  onClose,
  constants,
  onSave,
}: HardwareConstantsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Konstanta Perangkat Keras (Spesifikasi Statik)</h3>
              <p className="text-xs text-slate-400">Parameter mekanis dasar sistem conveyor belt scale</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Parameter di bawah ini telah dikonfigurasi sesuai dengan dokumen spesifikasi teknis dan algoritma virtualisasi.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Lebar Sabuk */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Lebar Sabuk (Belt Width)</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.beltWidthMm} mm</div>
              <div className="text-[10px] text-slate-400">Dimensi standar konveyor industri menengah (0,6 meter)</div>
            </div>

            {/* Diameter Drive Pulley */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Diameter Drive Pulley</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.drivePulleyDiameterM} meter (10 inch)</div>
              <div className="text-[10px] text-slate-400">Ukuran puli penggerak utama pada head conveyor</div>
            </div>

            {/* Keliling Pulley */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Keliling Pulley (Circumference)</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.pulleyCircumferenceM} m/putaran</div>
              <div className="text-[10px] text-slate-400">Dihitung dari π × D = 3,1416 × 0,254 ≈ 0,798 m</div>
            </div>

            {/* Putaran Motor Dasar */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Putaran Motor Dasar (pada 50 Hz)</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.baseMotorRpm} RPM</div>
              <div className="text-[10px] text-slate-400">Motor induksi standar 4-pole nominal 50 Hz</div>
            </div>

            {/* Rasio Reducer */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Rasio Reducer Gearbox</div>
              <div className="text-base font-bold font-mono text-cyan-300">1 : {constants.gearboxRatio} (Cyclo)</div>
              <div className="text-[10px] text-slate-400">Reduksi putaran tinggi ke kecepatan sabuk kerja konveyor</div>
            </div>

            {/* Weighbridge Span */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Weighbridge Span (Bentang Timbangan)</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.weighbridgeSpanM} meter</div>
              <div className="text-[10px] text-slate-400">Sistem 1 Roll / Single Idler Suspension</div>
            </div>

            {/* Jumlah Load Cell */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Jumlah Load Cell</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.loadCellCount} unit (Kiri & Kanan)</div>
              <div className="text-[10px] text-slate-400">Sensor strain gauge independen simetris 2 sisi</div>
            </div>

            {/* Rated Capacity per Load Cell */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Kapasitas Maksimal per Load Cell</div>
              <div className="text-base font-bold font-mono text-cyan-300">{constants.loadCellRatedCapacityKg} kg / unit</div>
              <div className="text-[10px] text-slate-400">Sensitivitas 2,0 mV/V dengan eksitasi 10V DC</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => onSave(DEFAULT_CONSTANTS)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Nilai Standar Pabrik
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <Check className="w-4 h-4" />
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
