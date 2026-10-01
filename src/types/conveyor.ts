export interface ConveyorInputs {
  targetCapacityTph: number; // Ton/Jam (default 11)
  vfdFrequencyHz: number;    // Hz (25 - 60 Hz, default 50)
  inclineAngleDeg: number;   // Derajat (0 - 45°, default 0)
  tareWeightKg: number;      // kg (default 15)
  capacityCalculationMode: 'exact_305' | 'strict_formula'; // allow exact 3.05 kg/s for 11 t/h as specified in prompt
  controlMode: 'manual' | 'auto_vfd'; // Auto VFD follows material load changes to keep capacity constant
  autoMaterialLoadKgM: number;        // Material load setting when in Auto-VFD mode (kg/m)
}

export interface HardwareConstants {
  beltWidthMm: number;          // 600 mm
  drivePulleyDiameterM: number; // 0.254 m (10 inch)
  pulleyCircumferenceM: number; // 0.798 m per rev
  baseMotorRpm: number;         // 1450 RPM at 50 Hz
  gearboxRatio: number;         // 43 (Cyclo 1:43)
  weighbridgeSpanM: number;     // 1.0 meter (Single Idler)
  loadCellCount: number;        // 2 units (Left & Right)
  loadCellRatedCapacityKg: number; // 50 kg per cell
}

export interface CalculationResults {
  // Step 1: Motor RPM
  motorRpmActual: number;
  
  // Step 2: Gearbox Output RPM
  outputRpmGearbox: number;
  
  // Step 3: Belt Speed (m/s)
  beltSpeedMs: number;
  
  // Target Capacity in kg/s
  capacityKgSec: number;
  
  // Step 4: Material Load per meter (kg/m)
  materialLoadKgM: number;
  
  // Step 5: Material Weight on Weighbridge Span (kg)
  beratMaterialAreaTimbangan: number;
  
  // Trigonometry
  inclineAngleRad: number;
  cosTheta: number;
  
  // Step 6: Angle Compensated Forces (kg)
  gayaUkurMaterial: number;
  gayaUkurTare: number;
  
  // Step 7: Load per Load Cell (kg)
  gayaBebanPerLoadCell: number; // Gross per cell
  gayaNettoPerLoadCell: number; // Net per cell (material only)
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  
  // Electrical Transmitter equivalent (2mV/V, 10V excitation = 20mV full scale at rated 50kg)
  loadCellMvOutput: number;
  transmitterMaOutput: number; // 4 - 20 mA

  // Auto VFD Closed-Loop Telemetry
  calculatedAutoVfdHz: number;
  isVfdSaturated: 'none' | 'min_limit' | 'max_limit';
}

export interface TelemetryPoint {
  timestamp: number;
  timeLabel: string;
  loadPerCellKg: number;
  grossTotalKg: number;
  materialRateTph: number;
  beltSpeedMs: number;
  cosTheta: number;
}
