import { useState } from 'react';
import { Calculator, Check, Copy, ChevronDown, ChevronUp, BookOpen, AlertTriangle } from 'lucide-react';
import { ConveyorInputs, HardwareConstants, CalculationResults } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface FormulaBreakdownProps {
  inputs: ConveyorInputs;
  constants: HardwareConstants;
  results: CalculationResults;
}

export function FormulaBreakdown({ inputs, constants, results }: FormulaBreakdownProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const steps = [
    {
      step: 1,
      name: inputs.controlMode === 'auto_vfd' ? 'Motor RPM (Auto-VFD Penyesuai)' : 'Motor RPM Aktual',
      formula: inputs.controlMode === 'auto_vfd'
        ? `VFD_Auto = (v_req / 0.00897) → Motor = (VFD / 50) × 1450`
        : 'Motor_RPM_Aktual = (Input_Frekuensi / 50) × 1450',
      calc: inputs.controlMode === 'auto_vfd'
        ? `VFD Otomatis: ${results.calculatedAutoVfdHz.toFixed(1)} Hz → (${results.calculatedAutoVfdHz.toFixed(1)} / 50) × 1450`
        : `(${inputs.vfdFrequencyHz} / 50) × 1450`,
      result: `${formatNum(results.motorRpmActual, 1)} RPM`,
      note: inputs.controlMode === 'auto_vfd'
        ? 'Dihitung otomatis oleh loop tertutup agar target kapasitas tetap konstan saat beban berubah.'
        : 'Dihasilkan oleh inverter VFD terhadap putaran nominal motor induksi 4-pole.',
    },
    {
      step: 2,
      name: 'Output RPM Gearbox (Cyclo)',
      formula: `Output_RPM_Gearbox = Motor_RPM_Aktual / ${constants.gearboxRatio}`,
      calc: `${formatNum(results.motorRpmActual, 1)} / ${constants.gearboxRatio}`,
      result: `${formatNum(results.outputRpmGearbox, 3)} RPM`,
      note: `Reduksi kecepatan menggunakan Cycloidal Reducer rasio 1:${constants.gearboxRatio}.`,
    },
    {
      step: 3,
      name: 'Kecepatan Sabuk (Belt Speed)',
      formula: 'Belt_Speed_m_s = (Output_RPM_Gearbox × 0.798) / 60',
      calc: `(${formatNum(results.outputRpmGearbox, 3)} × ${constants.pulleyCircumferenceM}) / 60`,
      result: `${formatNum(results.beltSpeedMs, 3)} m/s (≈ ${formatNum(results.beltSpeedMs, 2)} m/s)`,
      note: 'Keliling Pulley Ø0,254m (10") = π × 0,254 = 0,798 meter/putaran.',
    },
    {
      step: 4,
      name: 'Material Load per Meter Sabuk',
      formula: 'Material_Load_kg_m = Kapasitas_kg_s / Belt_Speed_m_s',
      calc: `${formatNum(results.capacityKgSec, 2)} kg/s / ${formatNum(results.beltSpeedMs, 3)} m/s`,
      result: `${formatNum(results.materialLoadKgM, 2)} kg/m`,
      note: `Target ${inputs.targetCapacityTph} Ton/Jam = ${formatNum(results.capacityKgSec, 2)} kg/detik.`,
    },
    {
      step: 5,
      name: 'Berat Material Aktual di Area Timbangan',
      formula: 'Berat_Material_Area_Timbangan = Material_Load_kg_m × Weighbridge_Span',
      calc: `${formatNum(results.materialLoadKgM, 2)} kg/m × ${constants.weighbridgeSpanM} m`,
      result: `${formatNum(results.beratMaterialAreaTimbangan, 2)} kg`,
      note: 'Bentang timbangan (Weighbridge Span) = 1,0 meter (Sistem 1 Roll / Single Idler).',
    },
    {
      step: 6,
      name: 'Kompensasi Sudut Trigonometri [UPDATE]',
      formula: 'Gaya_Ukur_Material = Berat_Material_Area_Timbangan × COS(Sudut_Radian)',
      calc: `${formatNum(results.beratMaterialAreaTimbangan, 2)} kg × COS(${inputs.inclineAngleDeg}°) [cos = ${results.cosTheta.toFixed(4)}]`,
      result: `${formatNum(results.gayaUkurMaterial, 2)} kg`,
      note: 'Konversi Derajat ke Radian: Rad = Deg × (π / 180). Gaya normal tegak lurus sensor.',
    },
    {
      step: 7,
      name: 'Kompensasi Sudut Berat Mati (Tare) [UPDATE]',
      formula: 'Gaya_Ukur_Tare = Tare_Weight × COS(Sudut_Radian)',
      calc: `${inputs.tareWeightKg} kg × COS(${inputs.inclineAngleDeg}°) [cos = ${results.cosTheta.toFixed(4)}]`,
      result: `${formatNum(results.gayaUkurTare, 2)} kg`,
      note: 'Berat mati (tare) 1 roll penyangga + rangka besi juga terpengaruh kemiringan conveyor.',
    },
    {
      step: 8,
      name: 'Beban Fisik per Load Cell (Kiri & Kanan)',
      formula: 'Gaya_Beban_Per_Load_Cell = (Gaya_Ukur_Material / 2) + (Gaya_Ukur_Tare / 2)',
      calc: `(${formatNum(results.gayaUkurMaterial, 2)} / 2) + (${formatNum(results.gayaUkurTare, 2)} / 2)`,
      result: `${formatNum(results.gayaBebanPerLoadCell, 2)} kg`,
      note: 'Dibagi rata secara simetris ke 2 unit load cell (Kiri dan Kanan).',
    },
  ];

  const handleCopyReport = () => {
    const report = `=== LAPORAN SIMULASI CONVEYOR BELT SCALE ===
Waktu: ${new Date().toLocaleString('id-ID')}
PARAMETER INPUT:
- Kapasitas Target: ${inputs.targetCapacityTph} Ton/Jam (${formatNum(results.capacityKgSec, 2)} kg/s)
- Frekuensi VFD: ${inputs.vfdFrequencyHz} Hz
- Sudut Kemiringan: ${inputs.inclineAngleDeg}° (cos θ = ${results.cosTheta.toFixed(4)})
- Tare Weight: ${inputs.tareWeightKg} kg

HASIL KALKULASI:
1. Motor RPM: ${formatNum(results.motorRpmActual, 1)} RPM
2. Output Gearbox: ${formatNum(results.outputRpmGearbox, 2)} RPM
3. Belt Speed: ${formatNum(results.beltSpeedMs, 2)} m/s
4. Material Loading: ${formatNum(results.materialLoadKgM, 2)} kg/m
5. Berat Material di Timbangan: ${formatNum(results.beratMaterialAreaTimbangan, 2)} kg
6. Gaya Ukur Material (Terkompensasi COS): ${formatNum(results.gayaUkurMaterial, 2)} kg
7. Gaya Ukur Tare (Terkompensasi COS): ${formatNum(results.gayaUkurTare, 2)} kg
8. Total Gaya per Load Cell: ${formatNum(results.gayaBebanPerLoadCell, 2)} kg
=============================================`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Title Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
            Algoritma & Rincian Langkah Kalkulasi
          </h3>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">| Standar Rekayasa Industri</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Ringkasan
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Trigonometry Alert Pill */}
      {expanded && (
        <div className="p-4 space-y-4">
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-start gap-2.5 text-xs text-cyan-200">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">Catatan Pemrograman & Trigonometri:</span>
              <p className="text-slate-300 leading-relaxed">
                Sensor load cell hanya menerima gaya vektor normal yang tegak lurus dengan permukaan rangka sabuk (<code className="text-cyan-300 font-mono">F_normal = F × COS(θ)</code>). Sudut kemiringan <code className="text-cyan-300 font-mono">{inputs.inclineAngleDeg}°</code> dikonversi ke radian melalui rumus <code className="text-cyan-300 font-mono">rad = deg × (π / 180)</code>, menghasilkan faktor pengali <code className="text-emerald-400 font-mono font-bold">COS({inputs.inclineAngleDeg}°) = {results.cosTheta.toFixed(4)}</code>.
              </p>
            </div>
          </div>

          {/* Stepped Breakdown Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">
                        {item.step}
                      </span>
                      {item.name}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-amber-300/90 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                    {item.formula}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[60%]">
                      {item.calc}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      = {item.result}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {item.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
