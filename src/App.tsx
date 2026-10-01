import { useState, useMemo } from 'react';
import { ConveyorInputs, HardwareConstants } from './types/conveyor';
import {
  DEFAULT_INPUTS,
  DEFAULT_CONSTANTS,
  calculateConveyorScale,
} from './utils/calculations';
import { Header } from './components/Header';
import { ValidationBanner } from './components/ValidationBanner';
import { DigitalTwinConveyor } from './components/DigitalTwinConveyor';
import { ParameterControls } from './components/ParameterControls';
import { LoadCellReadout } from './components/LoadCellReadout';
import { LiveTelemetryChart } from './components/LiveTelemetryChart';
import { FormulaBreakdown } from './components/FormulaBreakdown';
import { HardwareConstantsModal } from './components/HardwareConstantsModal';
import { CalibrationModal } from './components/CalibrationModal';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [inputs, setInputs] = useState<ConveyorInputs>(DEFAULT_INPUTS);
  const [constants, setConstants] = useState<HardwareConstants>(DEFAULT_CONSTANTS);
  const [isConveyorRunning, setIsConveyorRunning] = useState<boolean>(true);

  // Modals state
  const [isConstantsModalOpen, setIsConstantsModalOpen] = useState<boolean>(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Compute scale physics in real-time
  const results = useMemo(() => {
    return calculateConveyorScale(inputs, constants);
  }, [inputs, constants]);

  // Apply Prompt's exact 50 Hz & 20° validation preset
  const handleApplyValidationPreset = () => {
    setInputs({
      targetCapacityTph: 11,
      vfdFrequencyHz: 50,
      inclineAngleDeg: 20,
      tareWeightKg: 15,
      capacityCalculationMode: 'exact_305',
      controlMode: 'manual',
      autoMaterialLoadKgM: 6.80,
    });
  };

  const handleResetAll = () => {
    setInputs(DEFAULT_INPUTS);
    setConstants(DEFAULT_CONSTANTS);
    setIsConveyorRunning(true);
  };

  const handleUpdateTare = (newTareKg: number) => {
    setInputs((prev) => ({
      ...prev,
      tareWeightKg: newTareKg,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* SCADA Navigation Header */}
      <Header
        onResetAll={handleResetAll}
        onOpenHelp={() => setIsGuideModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Validation Banner (Validates against Prompt's 50 Hz & 20° conditions) */}
        <ValidationBanner
          inputs={inputs}
          results={results}
          onApplyValidationPreset={handleApplyValidationPreset}
        />

        {/* Top Interactive Row: Digital Twin Mechanical Visualization */}
        <div className="grid grid-cols-1 gap-6">
          <DigitalTwinConveyor
            inputs={inputs}
            constants={constants}
            results={results}
            isRunning={isConveyorRunning}
            onToggleRunning={() => setIsConveyorRunning(!isConveyorRunning)}
          />
        </div>

        {/* Core Controls & Real-Time Dual Load Cell Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ParameterControls
              inputs={inputs}
              results={results}
              onChange={setInputs}
              onOpenConstantsModal={() => setIsConstantsModalOpen(true)}
            />
          </div>

          <div className="lg:col-span-5">
            <LoadCellReadout
              results={results}
              constants={constants}
              onOpenCalibration={() => setIsCalibrationModalOpen(true)}
            />
          </div>
        </div>

        {/* Real-time Streaming Chart & Dynamic Fluctuation Telemetry */}
        <LiveTelemetryChart
          results={results}
          isConveyorRunning={isConveyorRunning}
        />

        {/* Step-by-Step Mathematical & Trigonometric Algorithm Breakdown */}
        <FormulaBreakdown
          inputs={inputs}
          constants={constants}
          results={results}
        />
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Simulator Timbangan Sabuk Konveyor</span>
            <span>·</span>
            <span>Kompensasi Sudut Trigonometri COS(θ)</span>
            <span>·</span>
            <span>Single Idler 1-Meter Span</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Lebar: 600mm</span>
            <span>·</span>
            <span>Pulley Ø: 0,254m</span>
            <span>·</span>
            <span>Cyclo: 1:{constants.gearboxRatio}</span>
            <span>·</span>
            <span>Dual Load Cell: 2x 50kg</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HardwareConstantsModal
        isOpen={isConstantsModalOpen}
        onClose={() => setIsConstantsModalOpen(false)}
        constants={constants}
        onSave={(c) => {
          setConstants(c);
          setIsConstantsModalOpen(false);
        }}
      />

      <CalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        inputs={inputs}
        results={results}
        onUpdateTare={handleUpdateTare}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
