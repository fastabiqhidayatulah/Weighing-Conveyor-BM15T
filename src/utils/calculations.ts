import { ConveyorInputs, HardwareConstants, CalculationResults } from '../types/conveyor';

export const DEFAULT_INPUTS: ConveyorInputs = {
  targetCapacityTph: 11,
  vfdFrequencyHz: 50,
  inclineAngleDeg: 0,
  tareWeightKg: 15,
  capacityCalculationMode: 'exact_305',
  controlMode: 'manual',
  autoMaterialLoadKgM: 6.80,
};

export const DEFAULT_CONSTANTS: HardwareConstants = {
  beltWidthMm: 600,
  drivePulleyDiameterM: 0.254, // 10 inch
  pulleyCircumferenceM: 0.798, // meter per rev
  baseMotorRpm: 1450,         // at 50 Hz
  gearboxRatio: 43,           // Cyclo ratio 1:43
  weighbridgeSpanM: 1.0,      // 1 meter single idler
  loadCellCount: 2,           // 2 units (Left & Right)
  loadCellRatedCapacityKg: 50, // rated 50 kg per cell
};

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates complete conveyor belt scale physics and load cell forces.
 */
export function calculateConveyorScale(
  inputs: ConveyorInputs,
  constants: HardwareConstants = DEFAULT_CONSTANTS
): CalculationResults {
  const {
    targetCapacityTph,
    vfdFrequencyHz,
    inclineAngleDeg,
    tareWeightKg,
    capacityCalculationMode,
    controlMode,
    autoMaterialLoadKgM,
  } = inputs;
  const { pulleyCircumferenceM, baseMotorRpm, gearboxRatio, weighbridgeSpanM, loadCellRatedCapacityKg } = constants;

  // Target Capacity in kg/s:
  // In the prompt specification: Target 11 Ton/Jam diolah sebagai 3.05 kg/detik.
  // For other values: (targetCapacityTph * 1000) / 3600.
  let capacityKgSec: number;
  if (capacityCalculationMode === 'exact_305' && targetCapacityTph === 11) {
    capacityKgSec = 3.05;
  } else {
    capacityKgSec = (targetCapacityTph * 1000) / 3600;
  }

  // Factor relating VFD (Hz) to Belt Speed (m/s):
  // Belt_Speed = ((VFD / 50) * baseMotorRpm / gearboxRatio * pulleyCircumferenceM) / 60
  // Belt_Speed = VFD * vfdToSpeedFactor
  const vfdToSpeedFactor = (baseMotorRpm * pulleyCircumferenceM) / (50 * gearboxRatio * 60);

  let effectiveVfdHz = vfdFrequencyHz;
  let calculatedAutoVfdHz = vfdFrequencyHz;
  let isVfdSaturated: 'none' | 'min_limit' | 'max_limit' = 'none';

  // In Auto-VFD mode: user changes material load (autoMaterialLoadKgM)
  // while target capacity remains fixed. VFD auto-adjusts to match required belt speed!
  if (controlMode === 'auto_vfd') {
    const desiredMaterialLoad = Math.max(autoMaterialLoadKgM, 0.1);
    const requiredSpeedMs = capacityKgSec / desiredMaterialLoad;
    calculatedAutoVfdHz = requiredSpeedMs / vfdToSpeedFactor;

    if (calculatedAutoVfdHz < 25) {
      effectiveVfdHz = 25;
      isVfdSaturated = 'min_limit';
    } else if (calculatedAutoVfdHz > 60) {
      effectiveVfdHz = 60;
      isVfdSaturated = 'max_limit';
    } else {
      effectiveVfdHz = calculatedAutoVfdHz;
      isVfdSaturated = 'none';
    }
  }

  // 1. Motor RPM Aktual = (Input_Frekuensi / 50) * 1450
  const motorRpmActual = (effectiveVfdHz / 50) * baseMotorRpm;

  // 2. Output RPM Gearbox = Motor_RPM_Aktual / gearboxRatio
  const outputRpmGearbox = motorRpmActual / gearboxRatio;

  // 3. Belt Speed (m/s) = (Output_RPM_Gearbox * pulleyCircumferenceM) / 60
  const beltSpeedMs = (outputRpmGearbox * pulleyCircumferenceM) / 60;

  // 4. Material Load (kg/m):
  // In manual mode: Material_Load_kg_m = Kapasitas_kg_s / Belt_Speed_m_s
  // In auto_vfd mode: if saturated, material load is adjusted by actual speed, otherwise exactly desired
  const effectiveBeltSpeed = Math.max(beltSpeedMs, 0.0001);
  let materialLoadKgM: number;
  if (controlMode === 'auto_vfd' && isVfdSaturated === 'none') {
    materialLoadKgM = autoMaterialLoadKgM;
  } else {
    materialLoadKgM = capacityKgSec / effectiveBeltSpeed;
  }

  // 5. Berat Material di Area Timbangan = Material_Load_kg_m * Weighbridge_Span
  const beratMaterialAreaTimbangan = materialLoadKgM * weighbridgeSpanM;

  // Trigonometri: Sudut Kemiringan dalam Radian
  const inclineAngleRad = degToRad(inclineAngleDeg);
  const cosTheta = Math.cos(inclineAngleRad);

  // [UPDATE] Gaya Ukur Material = Berat_Material_Area_Timbangan * COS(Sudut_Kemiringan_dalam_Radian)
  const gayaUkurMaterial = beratMaterialAreaTimbangan * cosTheta;

  // [UPDATE] Gaya Ukur Tare = Tare_Weight * COS(Sudut_Kemiringan_dalam_Radian)
  const gayaUkurTare = tareWeightKg * cosTheta;

  // Gaya Beban Per Load Cell = (Gaya_Ukur_Material / 2) + (Gaya_Ukur_Tare / 2)
  const gayaBebanPerLoadCell = (gayaUkurMaterial / 2) + (gayaUkurTare / 2);
  const gayaNettoPerLoadCell = gayaUkurMaterial / 2;

  const totalGrossWeightKg = gayaUkurMaterial + gayaUkurTare;
  const totalNetWeightKg = gayaUkurMaterial;

  // Electrical Signal Simulation:
  // Standard load cell: 2.0 mV/V sensitivity with 10V DC excitation -> 20.0 mV at rated capacity (e.g. 50 kg)
  const fullScaleMv = 20.0;
  const loadCellMvOutput = Math.min((gayaBebanPerLoadCell / loadCellRatedCapacityKg) * fullScaleMv, fullScaleMv * 1.5);

  // 4-20 mA Transmitter simulation (calibrated for 0 to 100% rated cell load)
  const transmitterMaOutput = 4.0 + Math.min(Math.max(gayaBebanPerLoadCell / loadCellRatedCapacityKg, 0), 1.2) * 16.0;

  return {
    motorRpmActual,
    outputRpmGearbox,
    beltSpeedMs,
    capacityKgSec,
    materialLoadKgM,
    beratMaterialAreaTimbangan,
    inclineAngleRad,
    cosTheta,
    gayaUkurMaterial,
    gayaUkurTare,
    gayaBebanPerLoadCell,
    gayaNettoPerLoadCell,
    totalGrossWeightKg,
    totalNetWeightKg,
    loadCellMvOutput,
    transmitterMaOutput,
    calculatedAutoVfdHz,
    isVfdSaturated,
  };
}

/**
 * Format numbers with specified decimals for Indonesian / Engineering display
 */
export function formatNum(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0.00';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
