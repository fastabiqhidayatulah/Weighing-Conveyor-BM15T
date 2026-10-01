import { Sliders, Gauge, RotateCw, Weight, Zap, Layers, Cpu, ArrowRight, AlertTriangle } from 'lucide-react';
import { ConveyorInputs, CalculationResults } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface ParameterControlsProps {
  inputs: ConveyorInputs;
  results: CalculationResults;
  onChange: (inputs: ConveyorInputs) => void;
  onOpenConstantsModal: () => void;
}

export function ParameterControls({ inputs, results, onChange, onOpenConstantsModal }: ParameterControlsProps) {
  const updateField = <K extends keyof ConveyorInputs>(key: K, value: ConveyorInputs[K]) => {
    onChange({
      ...inputs,
      [key]: value,
    });
  };

  const presets = [
    {
      label: 'Benchmark Revisi (50 Hz, 20° @ 1:43)',
      active: inputs.vfdFrequencyHz === 50 && inputs.inclineAngleDeg === 20 && inputs.targetCapacityTph === 11 && inputs.controlMode === 'manual',
      apply: () =>
        onChange({
          ...inputs,
          targetCapacityTph: 11,
          vfdFrequencyHz: 50,
          inclineAngleDeg: 20,
          tareWeightKg: 15,
          controlMode: 'manual',
          autoMaterialLoadKgM: 6.80,
          capacityCalculationMode: 'exact_305',
        }),
    },
    {
      label: 'Horizontal (50 Hz, 0°)',
      active: inputs.vfdFrequencyHz === 50 && inputs.inclineAngleDeg === 0 && inputs.targetCapacityTph === 11 && inputs.controlMode === 'manual',
      apply: () =>
        onChange({
          ...inputs,
          targetCapacityTph: 11,
          vfdFrequencyHz: 50,
          inclineAngleDeg: 0,
          tareWeightKg: 15,
          controlMode: 'manual',
        }),
    },
    {
      label: 'Auto-VFD: Beban Standar (6,8 kg/m → 50 Hz)',
      active: inputs.controlMode === 'auto_vfd' && Math.abs(inputs.autoMaterialLoadKgM - 6.8) < 0.1,
      apply: () =>
        onChange({
          ...inputs,
          controlMode: 'auto_vfd',
          targetCapacityTph: 11,
          autoMaterialLoadKgM: 6.80,
          inclineAngleDeg: 20,
        }),
    },
    {
      label: 'Auto-VFD: Beban Tebal (10 kg/m → VFD Melambat ~34 Hz)',
      active: inputs.controlMode === 'auto_vfd' && Math.abs(inputs.autoMaterialLoadKgM - 10) < 0.1,
      apply: () =>
        onChange({
          ...inputs,
          controlMode: 'auto_vfd',
          targetCapacityTph: 11,
          autoMaterialLoadKgM: 10.0,
          inclineAngleDeg: 20,
        }),
    },
    {
      label: 'Auto-VFD: Beban Tipis (4,5 kg/m → VFD Dipercepat)',
      active: inputs.controlMode === 'auto_vfd' && Math.abs(inputs.autoMaterialLoadKgM - 4.5) < 0.1,
      apply: () =>
        onChange({
          ...inputs,
          controlMode: 'auto_vfd',
          targetCapacityTph: 11,
          autoMaterialLoadKgM: 4.5,
          inclineAngleDeg: 20,
        }),
    },
    {
      label: 'Uji Sabuk Kosong (Tare Only, 0 T/h)',
      active: inputs.targetCapacityTph === 0,
      apply: () =>
        onChange({
          ...inputs,
          targetCapacityTph: 0,
        }),
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
            Variabel Input & Kontrol Kecepatan VFD
          </h3>
        </div>

        <button
          onClick={onOpenConstantsModal}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/40 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          Konstanta Mekanik (Rasio 1:43, Lebar 600mm)
        </button>
      </div>

      {/* Control Mode Segmented Tabs: Manual vs Auto-VFD */}
      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Mode Sistem Kontrol VFD (Inverter):
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {inputs.controlMode === 'auto_vfd' ? 'Feed Rate Closed-Loop' : 'Fixed Speed Open-Loop'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateField('controlMode', 'manual')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              inputs.controlMode === 'manual'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Mode 1: Manual VFD (Hz Tetap)
          </button>

          <button
            onClick={() => updateField('controlMode', 'auto_vfd')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              inputs.controlMode === 'auto_vfd'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Mode 2: Auto-VFD (Beban Ubah → VFD Mengikuti)
          </button>
        </div>

        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
          {inputs.controlMode === 'auto_vfd' ? (
            <span className="text-emerald-300">
              💡 <strong>Sistem Auto-VFD Aktif:</strong> Saat Anda menggeser <strong>Beban Material (kg/m)</strong>, VFD secara otomatis menghitung dan menyesuaikan frekuensi (Hz) agar <strong>Target Kapasitas ({inputs.targetCapacityTph} T/h)</strong> tetap tercapai stabil!
            </span>
          ) : (
            <span>
              ℹ️ <strong>Mode Manual:</strong> Frekuensi VFD diatur manual oleh slider (25 - 60 Hz). Beban per meter sabuk mengikuti kecepatan putar motor.
            </span>
          )}
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Preset Uji & Skenario Cepat
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={preset.apply}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                preset.active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-800/70 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Target Kapasitas (Ton/Jam) - SELALU TETAP */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200">Target Kapasitas (Tetap)</label>
                <div className="text-[10px] text-slate-400">Throughput Target Aliran Material</div>
              </div>
            </div>

            <div className="flex items-baseline gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/70">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={inputs.targetCapacityTph}
                onChange={(e) => updateField('targetCapacityTph', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 bg-transparent text-right font-mono font-bold text-amber-300 text-sm focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">T/h</span>
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={inputs.targetCapacityTph}
              onChange={(e) => updateField('targetCapacityTph', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 T/h</span>
              <span className="text-amber-400 font-semibold">
                Laju Aliran: {inputs.targetCapacityTph === 11 && inputs.capacityCalculationMode === 'exact_305' ? '3,05' : formatNum((inputs.targetCapacityTph * 1000) / 3600, 2)} kg/detik
              </span>
              <span>50 T/h</span>
            </div>
          </div>
        </div>

        {/* 2. AUTO-VFD BEBAN MATERIAL INPUT or MANUAL VFD FREQUENCY */}
        {inputs.controlMode === 'auto_vfd' ? (
          /* AUTO-VFD: Slider Beban Material (kg/m) */
          <div className="p-3.5 bg-emerald-950/20 rounded-xl border border-emerald-500/50 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Weight className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-emerald-300">Beban Material pada Sabuk</label>
                    <span className="text-[9px] bg-emerald-500 text-slate-950 px-1 rounded font-bold uppercase">Ubah Ini</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Ketebalan / Densitas Lapisan Material</div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-500/60">
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  value={inputs.autoMaterialLoadKgM}
                  onChange={(e) => updateField('autoMaterialLoadKgM', Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-16 bg-transparent text-right font-mono font-bold text-emerald-300 text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">kg/m</span>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="2"
                max="20"
                step="0.1"
                value={inputs.autoMaterialLoadKgM}
                onChange={(e) => updateField('autoMaterialLoadKgM', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>2 kg/m (Tipis)</span>
                <span className="text-emerald-300 font-semibold">
                  Berat di Timbangan 1m: {formatNum(inputs.autoMaterialLoadKgM, 2)} kg
                </span>
                <span>20 kg/m (Tebal)</span>
              </div>
            </div>

            {/* Live Auto-VFD Response Feedback */}
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Respon Otomatis VFD:</span>
                <span className="text-sm font-bold text-cyan-300 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  {results.calculatedAutoVfdHz.toFixed(1)} Hz
                  <span className="text-slate-400 text-xs font-normal">({Math.round(results.motorRpmActual)} RPM)</span>
                </span>
              </div>

              {results.isVfdSaturated !== 'none' && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium pt-1 border-t border-slate-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {results.isVfdSaturated === 'max_limit'
                    ? 'Beban terlalu ringan! Inverter mencapai batas maksimum 60 Hz.'
                    : 'Beban terlalu berat! Inverter mencapai batas minimum 25 Hz.'}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MANUAL MODE: Slider Frekuensi VFD (Hz) */
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200">Frekuensi VFD (Inverter)</label>
                  <div className="text-[10px] text-slate-400">Kontrol Kecepatan Motor Manual (25 - 60 Hz)</div>
                </div>
              </div>

              <div className="flex items-baseline gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/70">
                <input
                  type="number"
                  min="25"
                  max="60"
                  step="0.5"
                  value={inputs.vfdFrequencyHz}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 25;
                    updateField('vfdFrequencyHz', Math.min(60, Math.max(25, val)));
                  }}
                  className="w-14 bg-transparent text-right font-mono font-bold text-cyan-300 text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">Hz</span>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="25"
                max="60"
                step="0.5"
                value={inputs.vfdFrequencyHz}
                onChange={(e) => updateField('vfdFrequencyHz', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>25 Hz (Min)</span>
                <span className="text-cyan-400 font-semibold">
                  Motor: {Math.round((inputs.vfdFrequencyHz / 50) * 1450)} RPM
                </span>
                <span>60 Hz (Max)</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Sudut Kemiringan (Incline Angle) */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <RotateCw className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200">Sudut Kemiringan (Incline)</label>
                <div className="text-[10px] text-slate-400">Elevasi Konveyor (0° - 45°)</div>
              </div>
            </div>

            <div className="flex items-baseline gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/70">
              <input
                type="number"
                min="0"
                max="45"
                step="1"
                value={inputs.inclineAngleDeg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  updateField('inclineAngleDeg', Math.min(45, Math.max(0, val)));
                }}
                className="w-12 bg-transparent text-right font-mono font-bold text-emerald-300 text-sm focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">°</span>
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={inputs.inclineAngleDeg}
              onChange={(e) => updateField('inclineAngleDeg', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0° (Datar)</span>
              <span className="text-emerald-400 font-semibold font-mono">
                COS({inputs.inclineAngleDeg}°) = {Math.cos((inputs.inclineAngleDeg * Math.PI) / 180).toFixed(4)}
              </span>
              <span>45° (Curam)</span>
            </div>
          </div>
        </div>

        {/* 4. Berat Mati Timbangan (Tare Weight) */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Weight className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-200">Berat Mati (Tare Weight)</label>
                <div className="text-[10px] text-slate-400">1 Roll Penyangga + Rangka Besi</div>
              </div>
            </div>

            <div className="flex items-baseline gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/70">
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={inputs.tareWeightKg}
                onChange={(e) => updateField('tareWeightKg', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 bg-transparent text-right font-mono font-bold text-indigo-300 text-sm focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">kg</span>
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="5"
              max="35"
              step="0.5"
              value={inputs.tareWeightKg}
              onChange={(e) => updateField('tareWeightKg', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5 kg</span>
              <span className="text-indigo-400 font-semibold font-mono">
                Tare Terkompensasi: {formatNum(inputs.tareWeightKg * Math.cos((inputs.inclineAngleDeg * Math.PI) / 180), 2)} kg
              </span>
              <span>35 kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
