import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Compass, Eye, Activity, Info, Zap } from 'lucide-react';
import { ConveyorInputs, HardwareConstants, CalculationResults } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface DigitalTwinConveyorProps {
  inputs: ConveyorInputs;
  constants: HardwareConstants;
  results: CalculationResults;
  isRunning: boolean;
  onToggleRunning: () => void;
}

export function DigitalTwinConveyor({
  inputs,
  constants,
  results,
  isRunning,
  onToggleRunning,
}: DigitalTwinConveyorProps) {
  const [showVectors, setShowVectors] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [viewMode, setViewMode] = useState<'side' | 'cross_section'>('side');
  
  // Physical motion states
  const [rotationAngleDrive, setRotationAngleDrive] = useState(0);
  const [linearDistancePx, setLinearDistancePx] = useState(0);
  const [sandStreamPhase, setSandStreamPhase] = useState(0);

  // Animation frame loop for pulley rotation, idlers, belt & pouring sand
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== null && isRunning) {
        const delta = (time - lastTimeRef.current) / 1000; // seconds

        // Belt speed in m/s (e.g. 0.4485 m/s at 50 Hz, Cyclo 1:43)
        const speedMs = results.beltSpeedMs;

        // Drive Pulley RPM = (speedMs / circumference) * 60
        const driveRps = speedMs / Math.max(constants.pulleyCircumferenceM, 0.1);
        const driveDegDelta = driveRps * 360 * delta;

        // Linear pixel speed matching the belt physical scale
        // Drive pulley radius is 36px -> Circumference in SVG is 2 * PI * 36 = 226.2 px
        // 226.2 px corresponds to 0.798 meter -> Scale = ~283.45 px / meter
        const pxPerSec = speedMs * 283.45;
        const linearDelta = pxPerSec * delta;

        // Sand stream vertical fall speed (~160 px/s)
        const streamDelta = 160 * delta;

        setRotationAngleDrive((prev) => (prev + driveDegDelta) % 360);
        setLinearDistancePx((prev) => (prev + linearDelta) % 10000);
        setSandStreamPhase((prev) => (prev + streamDelta) % 60);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, results.beltSpeedMs, constants.pulleyCircumferenceM]);

  const angle = inputs.inclineAngleDeg;

  // Exact physically synchronized rotation angles:
  const angleDrive = rotationAngleDrive;
  const angleTail = (rotationAngleDrive * (36 / 32)) % 360;
  const angleIdlers = (rotationAngleDrive * (36 / 14)) % 360;
  const angleWeighRoll = (rotationAngleDrive * (36 / 16)) % 360;

  // Belt texture marker offset
  const beltOffsetPx = linearDistancePx % 40;
  // Material surface grain offset
  const materialOffsetPx = linearDistancePx % 120;

  // Dynamic sand bed thickness based on materialLoadKgM (thicker when load is higher)
  const sandBedHeight = results.capacityKgSec > 0
    ? Math.min(Math.max((results.materialLoadKgM / 12) * 14, 6), 24)
    : 0;

  // Pivot point for tilting conveyor (tail pulley center)
  const pivotX = 150;
  const pivotY = 310;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
      {/* 1. SCADA Top Control Toolbar */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Digital Twin & Visualisasi Hopper Pasir Konveyor
          </h2>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            | Rasio 1:{constants.gearboxRatio} · Sinkronisasi Fisika Nyata
          </span>
          {inputs.controlMode === 'auto_vfd' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 text-emerald-400" />
              AUTO-VFD AKTIF
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('side')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'side'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elevasi (Samping)
            </button>
            <button
              onClick={() => setViewMode('cross_section')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'cross_section'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Potongan Idler (600mm)
            </button>
          </div>

          {/* Layer toggles */}
          <button
            onClick={() => setShowVectors(!showVectors)}
            title="Tampilkan / Sembunyikan Vektor Gaya Trigonometri"
            className={`px-2 py-1 text-xs rounded-lg border flex items-center gap-1 transition-colors ${
              showVectors
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Vektor Gaya
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            title="Tampilkan Dimensi Fisik"
            className={`px-2 py-1 text-xs rounded-lg border flex items-center gap-1 transition-colors ${
              showDimensions
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Dimensi
          </button>

          {/* Run/Pause Motor */}
          <button
            onClick={onToggleRunning}
            className={`px-3 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              isRunning
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Jeda Motor
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Jalankan Motor
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. DEDICATED SCADA TELEMETRY STRIP (Placed outside SVG canvas to eliminate ANY text overlap!) */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Putaran Motor</div>
          <div className="font-mono font-bold text-slate-100 flex items-baseline gap-1">
            <span>{Math.round(results.motorRpmActual)}</span>
            <span className="text-[10px] text-slate-400">RPM</span>
            <span className="text-[10px] text-cyan-400">({inputs.controlMode === 'auto_vfd' ? results.calculatedAutoVfdHz.toFixed(1) : inputs.vfdFrequencyHz} Hz)</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Pulley Ø254 (1:{constants.gearboxRatio})</div>
          <div className="font-mono font-bold text-cyan-300 flex items-baseline gap-1">
            <span>{formatNum(results.outputRpmGearbox, 2)}</span>
            <span className="text-[10px] text-slate-400">RPM</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Idler Rolls (Ø100)</div>
          <div className="font-mono font-bold text-slate-300 flex items-baseline gap-1">
            <span>{formatNum(results.outputRpmGearbox * (254 / 100), 1)}</span>
            <span className="text-[10px] text-slate-400">RPM</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Kecepatan Sabuk & Pasir</div>
          <div className="font-mono font-bold text-emerald-400 flex items-baseline gap-1">
            <span>{formatNum(results.beltSpeedMs, 2)}</span>
            <span className="text-[10px] text-slate-400">m/s</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Aliran Hopper Pasir</div>
          <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRunning && results.capacityKgSec > 0 ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{isRunning && results.capacityKgSec > 0 ? `${formatNum(results.capacityKgSec, 2)} kg/s` : '0,00 kg/s'}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Mode Kontrol VFD</div>
          <div className="font-mono font-bold">
            {inputs.controlMode === 'auto_vfd' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Auto-Follow
              </span>
            ) : (
              <span className="text-cyan-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" /> Manual {inputs.vfdFrequencyHz} Hz
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SVG Canvas Area (Uncluttered, mathematically separated labels) */}
      <div className="relative w-full h-[410px] sm:h-[480px] bg-slate-950 overflow-hidden select-none bg-grid-pattern flex items-center justify-center">
        {viewMode === 'side' ? (
          <svg
            viewBox="0 0 1000 510"
            className="w-full h-full max-w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Linear gradient for belt */}
              <linearGradient id="beltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Sand grain pattern */}
              <pattern id="sandPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#d97706" fillOpacity="0.9" />
                <circle cx="4" cy="4" r="1.8" fill="#fef3c7" fillOpacity="0.8" />
                <circle cx="14" cy="6" r="1.6" fill="#fbbf24" fillOpacity="0.85" />
                <circle cx="8" cy="14" r="1.5" fill="#78350f" />
                <circle cx="16" cy="15" r="1.7" fill="#b45309" />
                <circle cx="2" cy="16" r="1.4" fill="#fef08a" fillOpacity="0.75" />
              </pattern>

              {/* Hopper Steel Gradient */}
              <linearGradient id="hopperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#334155" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Falling Sand Stream Gradient */}
              <linearGradient id="fallingSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#d97706" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
              </linearGradient>

              {/* Steel frame metal gradient */}
              <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Marker for force vectors */}
              <marker
                id="arrow-amber"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker
                id="arrow-emerald"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* STATIC GROUND REFERENCE DATUM LINE (At bottom y = 475) */}
            <g transform="translate(0, 475)">
              <line x1="30" y1="0" x2="970" y2="0" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,4" />
              <rect x="35" y="-18" width="220" height="16" rx="3" fill="#020617" fillOpacity="0.9" stroke="#1e293b" />
              <text x="42" y="-6" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
                GARIS ACUAN HORIZONTAL (0°)
              </text>
            </g>

            {/* SEPARATED PROTRACTOR ANGLE DIAL (Bottom-Left Corner: x=35, y=430 - Completely isolated!) */}
            <g transform="translate(35, 430)">
              <rect x="0" y="0" width="145" height="32" rx="5" fill="#020617" fillOpacity="0.95" stroke="#334155" strokeWidth="1" />
              <text x="8" y="14" fill="#94a3b8" fontSize="8.5" fontFamily="var(--font-mono)">
                SUDUT ELEVASI (θ)
              </text>
              <text x="8" y="26" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="var(--font-mono)">
                θ = {inputs.inclineAngleDeg}°
              </text>
              <text x="76" y="26" fill="#10b981" fontSize="10.5" fontWeight="bold" fontFamily="var(--font-mono)">
                cos={results.cosTheta.toFixed(3)}
              </text>
            </g>

            {/* TILTING CONVEYOR ASSEMBLY (Pivoting at tail pulley center: x=150, y=310) */}
            <g
              transform={`translate(${pivotX}, ${pivotY}) rotate(${-angle}) translate(-${pivotX}, -${pivotY})`}
              className="transition-transform duration-500 ease-out"
            >
              {/* Longitudinal Structural Stringer Frame */}
              <rect x="140" y="315" width="690" height="14" rx="3" fill="url(#steelGrad)" stroke="#1e293b" />
              {/* Diagonal cross-bracing */}
              {[210, 290, 370, 450, 530, 610, 690, 750].map((xPos, idx) => (
                <g key={idx}>
                  <line x1={xPos} y1="329" x2={xPos + 50} y2="343" stroke="#334155" strokeWidth="2.5" />
                  <line x1={xPos + 50} y1="329" x2={xPos} y2="343" stroke="#334155" strokeWidth="2.5" />
                </g>
              ))}
              <rect x="140" y="343" width="690" height="7" rx="2" fill="#334155" />

              {/* TAIL PULLEY (x=150, y=310, Radius=32) */}
              <g transform="translate(150, 310)">
                <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#64748b" strokeWidth="4" />
                {/* Rotating spokes synchronized with tail speed */}
                <g transform={`rotate(${angleTail})`}>
                  <line x1="-28" y1="0" x2="28" y2="0" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="0" y1="-28" x2="0" y2="28" stroke="#94a3b8" strokeWidth="3" />
                </g>
                <circle cx="0" cy="0" r="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />

                {/* TAIL PULLEY BADGE (Placed safely at y = 46, away from everything) */}
                <g transform="translate(-45, 46)">
                  <rect x="0" y="0" width="90" height="18" rx="4" fill="#020617" fillOpacity="0.95" stroke="#475569" />
                  <text x="45" y="13" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="bold" fontFamily="var(--font-mono)">
                    TAIL PULLEY
                  </text>
                </g>
              </g>

              {/* CARRY IDLERS (Fixed standard rolls along carry side) */}
              {[270, 360, 580, 670].map((idX) => (
                <g key={idX} transform={`translate(${idX}, 290)`}>
                  <line x1="0" y1="0" x2="0" y2="25" stroke="#475569" strokeWidth="4" />
                  <circle cx="0" cy="0" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                  <g transform={`rotate(${angleIdlers})`}>
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#64748b" strokeWidth="2" />
                  </g>
                  <circle cx="0" cy="0" r="4" fill="#64748b" />
                </g>
              ))}

              {/* RETURN IDLERS (Bottom side) */}
              {[240, 470, 700].map((idX) => (
                <g key={idX} transform={`translate(${idX}, 355)`}>
                  <line x1="0" y1="-12" x2="0" y2="0" stroke="#475569" strokeWidth="3" />
                  <circle cx="0" cy="0" r="12" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <g transform={`rotate(${-angleIdlers})`}>
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#475569" strokeWidth="2" />
                  </g>
                </g>
              ))}

              {/* WEIGHBRIDGE AREA (SPAN = 1.0 METER at center x=470) */}
              <g transform="translate(470, 290)">
                {/* Span visual background frame highlight */}
                <rect
                  x="-80"
                  y="-26"
                  width="160"
                  height="82"
                  rx="6"
                  fill="#0369a1"
                  fillOpacity="0.08"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />

                {/* Weighbridge Floating Suspension Frame (Tare 15kg) */}
                <rect x="-44" y="16" width="88" height="12" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />

                {/* Weighing Idler Roll (Single Idler - 1 Roll Penyangga) */}
                <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="3.5" />
                <g transform={`rotate(${angleWeighRoll})`}>
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#fbbf24" strokeWidth="2" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#fbbf24" strokeWidth="2" />
                </g>
                <circle cx="0" cy="0" r="5" fill="#f59e0b" />

                {/* DUAL LOAD CELLS (Mounted beneath cradle, Left and Right) */}
                {/* Left Load Cell */}
                <g transform="translate(-30, 28)">
                  <rect x="-10" y="0" width="20" height="20" rx="3" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="0" cy="10" r="3" fill="#fbbf24" />
                </g>
                {/* Left Label Badge: offset to the left for zero overlap */}
                <g transform="translate(-76, 30)">
                  <rect x="0" y="0" width="44" height="16" rx="3" fill="#020617" fillOpacity="0.95" stroke="#f59e0b" strokeWidth="1" />
                  <text x="22" y="12" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold" fontFamily="var(--font-mono)">
                    LC KIRI
                  </text>
                </g>

                {/* Right Load Cell */}
                <g transform="translate(30, 28)">
                  <rect x="-10" y="0" width="20" height="20" rx="3" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="0" cy="10" r="3" fill="#fbbf24" />
                </g>
                {/* Right Label Badge: offset to the right for zero overlap */}
                <g transform="translate(32, 30)">
                  <rect x="0" y="0" width="50" height="16" rx="3" fill="#020617" fillOpacity="0.95" stroke="#f59e0b" strokeWidth="1" />
                  <text x="25" y="12" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold" fontFamily="var(--font-mono)">
                    LC KANAN
                  </text>
                </g>

                {/* Weighbridge Span Header Badge */}
                <g transform="translate(-65, -18)">
                  <rect x="0" y="0" width="130" height="16" rx="3" fill="#020617" fillOpacity="0.95" stroke="#0284c7" />
                  <text x="65" y="12" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="bold" fontFamily="var(--font-mono)">
                    TIMBANGAN SPAN 1,0 m
                  </text>
                </g>
              </g>

              {/* BELT (Carry side top and return side bottom) */}
              <path d="M 150 342 L 800 344" stroke="url(#beltGrad)" strokeWidth="7" fill="none" />
              <path d="M 150 278 L 800 275" stroke="url(#beltGrad)" strokeWidth="9" fill="none" />

              {/* Physically Synchronized Belt Motion Markers */}
              <g>
                {[170, 210, 250, 290, 330, 370, 410, 450, 490, 530, 570, 610, 650, 690, 730, 770].map((baseX, idx) => {
                  const animatedX = baseX + beltOffsetPx;
                  if (animatedX > 790) return null;
                  return (
                    <line
                      key={idx}
                      x1={animatedX}
                      y1="274"
                      x2={animatedX + 8}
                      y2="274"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* SAND MATERIAL BED (Moves synchronously from hopper impact at x=180 to head pulley x=800) */}
              {results.capacityKgSec > 0 && sandBedHeight > 0 && (
                <g>
                  {/* Continuous Sand Bed Trapezoid Profile */}
                  <path
                    d={`M 180 273 
                        C 195 ${273 - sandBedHeight * 0.7}, 210 ${273 - sandBedHeight}, 240 ${273 - sandBedHeight} 
                        L 780 ${273 - sandBedHeight} 
                        C 792 ${273 - sandBedHeight}, 798 ${273 - sandBedHeight * 0.5}, 800 273 Z`}
                    fill="url(#sandPattern)"
                    stroke="#b45309"
                    strokeWidth="1.2"
                    opacity="0.95"
                  />

                  {/* Sand surface highlight curve */}
                  <path
                    d={`M 200 ${273 - sandBedHeight} L 780 ${273 - sandBedHeight}`}
                    stroke="#fef08a"
                    strokeWidth="1.5"
                    strokeDasharray="8 6"
                    strokeDashoffset={-materialOffsetPx}
                    opacity="0.8"
                  />

                  {/* Moving sand granules / lumps synchronized with roll speed */}
                  {[210, 270, 330, 400, 470, 540, 610, 680, 740].map((mX, idx) => {
                    const dynamicX = 200 + ((mX - 200 + materialOffsetPx) % 580);
                    const yOffset = (idx % 3) * 3 + 2;
                    return (
                      <g key={idx}>
                        <ellipse
                          cx={dynamicX}
                          cy={273 - sandBedHeight + yOffset}
                          rx="6"
                          ry="3.5"
                          fill="#78350f"
                          opacity="0.85"
                        />
                        <circle
                          cx={dynamicX - 1}
                          cy={273 - sandBedHeight + yOffset - 1}
                          r="1.2"
                          fill="#fef3c7"
                          opacity="0.9"
                        />
                      </g>
                    );
                  })}

                  {/* High-Contrast Material Load Badge (Positioned at x=310, y=215, totally clear of hopper & weighbridge!) */}
                  <g transform={`translate(280, ${225 - sandBedHeight})`}>
                    <rect
                      x="0"
                      y="0"
                      width="190"
                      height="22"
                      rx="4"
                      fill="#020617"
                      fillOpacity="0.95"
                      stroke="#d97706"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="11" r="3.5" fill="#f59e0b" />
                    <text x="24" y="15" fill="#fef08a" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">
                      PASIR: {formatNum(results.materialLoadKgM, 2)} kg/m
                    </text>
                  </g>

                  {/* HEAD DISCHARGE STREAM: Sand pouring off head pulley into receiving area */}
                  {isRunning && (
                    <g transform="translate(800, 273)">
                      <path
                        d="M 0 0 C 15 5, 25 25, 30 65"
                        stroke="url(#fallingSandGrad)"
                        strokeWidth="10"
                        strokeDasharray="6 4"
                        strokeDashoffset={-sandStreamPhase}
                        fill="none"
                        opacity="0.9"
                      />
                      {[0, 15, 30, 45].map((off, pIdx) => {
                        const prog = ((sandStreamPhase * 1.5 + off) % 60) / 60;
                        const px = prog * 28 + (pIdx % 2) * 3;
                        const py = prog * prog * 65;
                        return (
                          <circle
                            key={pIdx}
                            cx={px}
                            cy={py}
                            r={1.8}
                            fill="#fde047"
                            opacity={1 - prog * 0.5}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              )}

              {/* ========================================================================= */}
              {/* HOPPER PASIR (FEED HOPPER AT REAR OF CONVEYOR OVER TAIL PULLEY) */}
              {/* Position: x=130 to 210, y=60 to 270 - 100% UNCLUTTERED! */}
              {/* ========================================================================= */}
              <g transform="translate(130, 60)">
                {/* Structural Support Columns for Hopper */}
                <line x1="8" y1="100" x2="8" y2="255" stroke="#334155" strokeWidth="4" />
                <line x1="72" y1="100" x2="72" y2="255" stroke="#334155" strokeWidth="4" />
                <line x1="8" y1="180" x2="72" y2="180" stroke="#475569" strokeWidth="2.5" />
                <line x1="8" y1="220" x2="72" y2="180" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="72" y1="220" x2="8" y2="170" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />

                {/* Hopper Bin Main Body */}
                <polygon
                  points="0,15 80,15 65,100 15,100"
                  fill="url(#hopperGrad)"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                />

                {/* Stiffener horizontal ribs on hopper */}
                <line x1="6" y1="42" x2="74" y2="42" stroke="#0ea5e9" strokeWidth="2" />
                <line x1="11" y1="72" x2="69" y2="72" stroke="#0ea5e9" strokeWidth="2" />

                {/* Sand inside the hopper */}
                <polygon
                  points="4,36 76,36 64,99 16,99"
                  fill="url(#sandPattern)"
                  opacity="0.95"
                />

                {/* Top sand cone / heap */}
                <path
                  d="M 4 36 Q 40 24 76 36 Z"
                  fill="#f59e0b"
                  opacity="0.9"
                />

                {/* Hopper Discharge Chute / Neck */}
                <rect x="24" y="100" width="32" height="30" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />

                {/* Adjustable Feed Knife Gate */}
                <rect
                  x="20"
                  y="125"
                  width="40"
                  height="7"
                  rx="1.5"
                  fill="#f59e0b"
                  stroke="#fbbf24"
                  strokeWidth="1"
                />

                {/* Hopper Title Badge (Placed at y = -6, in clear air above hopper) */}
                <g transform="translate(4, -8)">
                  <rect x="0" y="0" width="72" height="16" rx="3" fill="#020617" fillOpacity="0.95" stroke="#f59e0b" />
                  <text x="36" y="12" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)">
                    HOPPER PASIR
                  </text>
                </g>

                {/* Skirtboard Rubber Seals */}
                <path
                  d="M 18 180 L 62 180 L 68 214 L 14 214 Z"
                  fill="#0f172a"
                  fillOpacity="0.85"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                <text x="40" y="198" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="var(--font-mono)">
                  SKIRT SEAL
                </text>

                {/* ANIMASI PASIR TURUN DARI HOPPER KE CONVEYOR */}
                {isRunning && results.capacityKgSec > 0 ? (
                  <g>
                    {/* Continuous pouring sand cascade stream */}
                    <path
                      d="M 30 132 L 50 132 L 58 216 L 22 216 Z"
                      fill="url(#fallingSandGrad)"
                      opacity="0.88"
                    />

                    {/* Animated vertical sand stream lines */}
                    <line
                      x1="34"
                      y1="132"
                      x2="32"
                      y2="216"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      strokeDasharray="8 5"
                      strokeDashoffset={-sandStreamPhase * 1.6}
                    />
                    <line
                      x1="40"
                      y1="132"
                      x2="40"
                      y2="216"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="10 4"
                      strokeDashoffset={-sandStreamPhase * 1.8}
                    />
                    <line
                      x1="46"
                      y1="132"
                      x2="48"
                      y2="216"
                      stroke="#fef08a"
                      strokeWidth="2.5"
                      strokeDasharray="7 6"
                      strokeDashoffset={-sandStreamPhase * 1.5}
                    />

                    {/* Discrete cascading sand particles pouring down */}
                    {[0, 10, 20, 30, 40, 50].map((phaseOffset, sIdx) => {
                      const progress = ((sandStreamPhase * 1.4 + phaseOffset) % 65) / 65;
                      const py = 132 + progress * 84;
                      const px = 40 + ((sIdx % 3) - 1) * 8 + (Math.sin(sIdx + progress * 4) * 3);
                      return (
                        <circle
                          key={sIdx}
                          cx={px}
                          cy={py}
                          r={1.8}
                          fill="#fef3c7"
                          opacity={0.9}
                        />
                      );
                    })}

                    {/* Sand Landing Impact Pile on Belt */}
                    <ellipse
                      cx="40"
                      cy="218"
                      rx="16"
                      ry="5"
                      fill="#d97706"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    <circle cx="32" cy="215" r="1.5" fill="#fef3c7" />
                    <circle cx="48" cy="215" r="1.5" fill="#fef3c7" />
                  </g>
                ) : (
                  /* Feed Gate Closed indicator */
                  <g transform="translate(18, 145)">
                    <rect x="0" y="0" width="44" height="14" rx="2" fill="#020617" stroke="#ef4444" strokeWidth="1" />
                    <text x="22" y="10" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold" fontFamily="var(--font-mono)">
                      PINTU TUTUP
                    </text>
                  </g>
                )}
              </g>

              {/* HEAD / DRIVE PULLEY (x=800, y=310, Radius=36 ~ 0.254m / 10" diameter) */}
              <g transform="translate(800, 310)">
                {/* CYCLO GEARBOX UNIT */}
                <rect x="36" y="-32" width="56" height="58" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                <text x="64" y="-12" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">
                  CYCLO
                </text>
                <text x="64" y="4" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)">
                  1:{constants.gearboxRatio}
                </text>
                <text x="64" y="16" textAnchor="middle" fill="#bae6fd" fontSize="7.5" fontFamily="var(--font-mono)">
                  RATIO
                </text>

                {/* Electric Motor Casing */}
                <rect x="96" y="-24" width="44" height="42" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                {/* Cooling fins */}
                <line x1="104" y1="-20" x2="104" y2="14" stroke="#475569" strokeWidth="2" />
                <line x1="112" y1="-20" x2="112" y2="14" stroke="#475569" strokeWidth="2" />
                <line x1="120" y1="-20" x2="120" y2="14" stroke="#475569" strokeWidth="2" />
                <line x1="128" y1="-20" x2="128" y2="14" stroke="#475569" strokeWidth="2" />

                {/* Motor Label Badge */}
                <g transform="translate(86, -42)">
                  <rect x="0" y="0" width="70" height="15" rx="3" fill="#020617" fillOpacity="0.95" stroke="#38bdf8" />
                  <text x="35" y="11" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)">
                    1450 RPM
                  </text>
                </g>

                {/* Drive Pulley Cylinder */}
                <circle cx="0" cy="0" r="36" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
                <g transform={`rotate(${angleDrive})`}>
                  <line x1="-32" y1="0" x2="32" y2="0" stroke="#38bdf8" strokeWidth="3" />
                  <line x1="0" y1="-32" x2="0" y2="32" stroke="#38bdf8" strokeWidth="3" />
                  <line x1="-22" y1="-22" x2="22" y2="22" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="-22" y1="22" x2="22" y2="-22" stroke="#38bdf8" strokeWidth="2" />
                </g>
                <circle cx="0" cy="0" r="10" fill="#334155" stroke="#38bdf8" strokeWidth="2" />

                {/* Drive Pulley Badge (Placed at y = 52, completely separated!) */}
                <g transform="translate(-70, 52)">
                  <rect x="0" y="0" width="140" height="18" rx="4" fill="#020617" fillOpacity="0.95" stroke="#38bdf8" />
                  <text x="70" y="13" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)">
                    DRIVE PULLEY Ø254mm (10")
                  </text>
                </g>
              </g>

              {/* PHYSICAL DIMENSIONS OVERLAY */}
              {showDimensions && (
                <g>
                  {/* Weighbridge Span Dimension Line (1 meter) */}
                  <g transform="translate(470, 185)">
                    <line x1="-50" y1="0" x2="50" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="-50" y1="-5" x2="-50" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="50" y1="-5" x2="50" y2="5" stroke="#38bdf8" strokeWidth="1.5" />
                    <rect x="-35" y="-18" width="70" height="15" rx="3" fill="#020617" fillOpacity="0.95" stroke="#38bdf8" />
                    <text x="0" y="-7" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="var(--font-mono)">
                      L = 1,00 m
                    </text>
                  </g>
                </g>
              )}
            </g>

            {/* HIGH-CONTRAST FORCE VECTORS OVERLAY (Placed at y=415, isolated from LC KIRI/KANAN) */}
            {showVectors && (
              <g transform={`translate(${pivotX}, ${pivotY}) rotate(${-angle}) translate(-${pivotX}, -${pivotY})`}>
                <g transform="translate(470, 290)">
                  <line
                    x1="0"
                    y1="16"
                    x2="0"
                    y2="92"
                    stroke="#10b981"
                    strokeWidth="3"
                    markerEnd="url(#arrow-emerald)"
                  />
                  {/* Normal Force Callout Badge */}
                  <g transform="translate(-105, 100)">
                    <rect x="0" y="0" width="210" height="20" rx="4" fill="#020617" fillOpacity="0.95" stroke="#10b981" strokeWidth="1.5" />
                    <text x="105" y="14" textAnchor="middle" fill="#10b981" fontSize="9.5" fontWeight="bold" fontFamily="var(--font-mono)">
                      F_Normal = {formatNum(results.gayaUkurMaterial, 2)} kg (cos θ)
                    </text>
                  </g>
                </g>
              </g>
            )}
          </svg>
        ) : (
          /* CROSS SECTION VIEW: Belt troughing angle, 600mm width, dual load cells */
          <div className="w-full max-w-xl p-4 flex flex-col items-center">
            <svg viewBox="0 0 540 260" className="w-full h-auto">
              <text x="270" y="24" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="var(--font-mono)">
                POTONGAN MELINTANG IDLER TIMBANGAN (LEBAR SABUK: 600 mm)
              </text>

              <g transform="translate(270, 110)">
                <path
                  d="M -160 -30 L -70 10 L 70 10 L 160 -30"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                <path
                  d="M -130 -15 L -60 5 L 60 5 L 130 -15 C 60 -45, -60 -45, -130 -15 Z"
                  fill="url(#sandPattern)"
                  stroke="#b45309"
                  strokeWidth="1.5"
                />

                <line x1="-120" y1="2" x2="-60" y2="40" stroke="#64748b" strokeWidth="5" />
                <line x1="0" y1="18" x2="0" y2="48" stroke="#64748b" strokeWidth="6" />
                <line x1="120" y1="2" x2="60" y2="40" stroke="#64748b" strokeWidth="5" />

                <rect x="-140" y="50" width="280" height="12" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />

                <g transform="translate(-100, 64)">
                  <rect x="-16" y="0" width="32" height="30" rx="3" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="0" cy="15" r="4" fill="#fbbf24" />
                  <text x="0" y="44" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">
                    LC KIRI: {formatNum(results.gayaBebanPerLoadCell, 2)} kg
                  </text>
                  <line x1="0" y1="-8" x2="0" y2="-2" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
                </g>

                <g transform="translate(100, 64)">
                  <rect x="-16" y="0" width="32" height="30" rx="3" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="0" cy="15" r="4" fill="#fbbf24" />
                  <text x="0" y="44" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">
                    LC KANAN: {formatNum(results.gayaBebanPerLoadCell, 2)} kg
                  </text>
                  <line x1="0" y1="-8" x2="0" y2="-2" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
                </g>

                <line x1="-160" y1="-50" x2="160" y2="-50" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="-160" y1="-55" x2="-160" y2="-45" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="160" y1="-55" x2="160" y2="-45" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="-56" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="var(--font-mono)">
                  LEBAR SABUK: 600 mm
                </text>
              </g>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
