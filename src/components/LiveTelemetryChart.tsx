import { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, RotateCcw, Download, Sparkles, SlidersHorizontal } from 'lucide-react';
import { CalculationResults } from '../types/conveyor';
import { formatNum } from '../utils/calculations';

interface LiveTelemetryChartProps {
  results: CalculationResults;
  isConveyorRunning: boolean;
}

interface DataSample {
  timestamp: number;
  timeStr: string;
  loadCellKg: number;
  materialTph: number;
  beltSpeedMs: number;
  cosTheta: number;
}

export function LiveTelemetryChart({ results, isConveyorRunning }: LiveTelemetryChartProps) {
  const [dataHistory, setDataHistory] = useState<DataSample[]>([]);
  const [isChartActive, setIsChartActive] = useState(true);
  const [enableNoise, setEnableNoise] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState<number>(3); // 3% fluctuation default
  const [activeChannel, setActiveChannel] = useState<'load' | 'tph' | 'speed'>('load');
  
  // Totalizer Accumulator State
  const [totalAccumulatedTonnes, setTotalAccumulatedTonnes] = useState<number>(0);
  const [totalOperatingSeconds, setTotalOperatingSeconds] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interval for capturing live samples
  useEffect(() => {
    if (!isChartActive) return;

    const interval = setInterval(() => {
      // If conveyor running, add small industrial mechanical noise if enabled
      let noiseFactor = 1.0;
      if (enableNoise && isConveyorRunning && results.beltSpeedMs > 0) {
        // Random Gaussian-like vibration around 1.0
        const rand = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        noiseFactor = 1.0 + rand * (noiseLevel / 100);
      }

      const currentLoadKg = isConveyorRunning
        ? results.gayaBebanPerLoadCell * noiseFactor
        : results.gayaUkurTare / 2; // if stopped, just static tare

      const currentRateTph = isConveyorRunning
        ? (results.capacityKgSec * 3.6) * noiseFactor
        : 0;

      const currentSpeedMs = isConveyorRunning ? results.beltSpeedMs : 0;

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const sample: DataSample = {
        timestamp: Date.now(),
        timeStr,
        loadCellKg: currentLoadKg,
        materialTph: Math.max(0, currentRateTph),
        beltSpeedMs: currentSpeedMs,
        cosTheta: results.cosTheta,
      };

      setDataHistory((prev) => {
        const next = [...prev, sample];
        // Keep last 40 samples for smooth viewing
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });

      // Accumulate totalizer if conveyor is running
      if (isConveyorRunning) {
        setTotalOperatingSeconds((s) => s + 1);
        // Rate in Ton/Hour -> Tonnes per second = TPH / 3600
        const tonnesThisSec = (currentRateTph / 3600);
        setTotalAccumulatedTonnes((tonnes) => tonnes + tonnesThisSec);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isChartActive, isConveyorRunning, enableNoise, noiseLevel, results]);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Padding
    const pTop = 30;
    const pBottom = 35;
    const pLeft = 55;
    const pRight = 25;
    const plotW = w - pLeft - pRight;
    const plotH = h - pTop - pBottom;

    if (dataHistory.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText('Mengumpulkan data sampel telemetri...', w / 2, h / 2);
      return;
    }

    // Determine values according to active channel
    const values = dataHistory.map((d) => {
      if (activeChannel === 'load') return d.loadCellKg;
      if (activeChannel === 'tph') return d.materialTph;
      return d.beltSpeedMs;
    });

    const minVal = Math.max(0, Math.min(...values) * 0.85);
    const maxVal = Math.max(1, Math.max(...values) * 1.15);
    const valRange = maxVal - minVal || 1;

    // Draw Grid & Y-Axis Labels
    const yTicks = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px var(--font-mono)';
    ctx.textAlign = 'right';

    for (let i = 0; i <= yTicks; i++) {
      const yVal = minVal + (valRange / yTicks) * (yTicks - i);
      const yPos = pTop + (plotH / yTicks) * i;

      ctx.beginPath();
      ctx.moveTo(pLeft, yPos);
      ctx.lineTo(w - pRight, yPos);
      ctx.stroke();

      const unit = activeChannel === 'load' ? ' kg' : activeChannel === 'tph' ? ' T/h' : ' m/s';
      ctx.fillText(`${formatNum(yVal, activeChannel === 'speed' ? 2 : 1)}${unit}`, pLeft - 8, yPos + 3);
    }

    // Theoretical Benchmark Line
    let targetBench = 0;
    if (activeChannel === 'load') targetBench = results.gayaBebanPerLoadCell;
    if (activeChannel === 'tph') targetBench = results.capacityKgSec * 3.6;
    if (activeChannel === 'speed') targetBench = results.beltSpeedMs;

    if (targetBench >= minVal && targetBench <= maxVal) {
      const benchY = pTop + plotH - ((targetBench - minVal) / valRange) * plotH;
      ctx.strokeStyle = '#f59e0b88';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pLeft, benchY);
      ctx.lineTo(w - pRight, benchY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'left';
      ctx.fillText(`Target Teoretis: ${formatNum(targetBench, 2)}`, pLeft + 8, benchY - 4);
    }

    // Plot Points and Line
    const points = dataHistory.map((d, idx) => {
      const x = pLeft + (idx / (dataHistory.length - 1)) * plotW;
      const val = activeChannel === 'load' ? d.loadCellKg : activeChannel === 'tph' ? d.materialTph : d.beltSpeedMs;
      const y = pTop + plotH - ((val - minVal) / valRange) * plotH;
      return { x, y, val, time: d.timeStr };
    });

    // Fill Gradient under curve
    const grad = ctx.createLinearGradient(0, pTop, 0, pTop + plotH);
    if (activeChannel === 'load') {
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    } else if (activeChannel === 'tph') {
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, pTop + plotH);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, pTop + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = activeChannel === 'load' ? '#38bdf8' : activeChannel === 'tph' ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw End dot with pulse
    const lastPt = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = activeChannel === 'load' ? '#38bdf8' : activeChannel === 'tph' ? '#f59e0b' : '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // X-axis time ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '9px var(--font-mono)';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(dataHistory.length / 5));
    for (let i = 0; i < dataHistory.length; i += step) {
      const pt = points[i];
      ctx.fillText(pt.time, pt.x, h - 12);
    }
  }, [dataHistory, activeChannel, results]);

  const handleExportCsv = () => {
    if (dataHistory.length === 0) return;
    const headers = 'Timestamp,Waktu,Beban_LoadCell_kg,Kapasitas_Tph,KecepatanSabuk_ms,CosTheta\n';
    const rows = dataHistory
      .map(
        (d) =>
          `${d.timestamp},"${d.timeStr}",${d.loadCellKg.toFixed(3)},${d.materialTph.toFixed(2)},${d.beltSpeedMs.toFixed(3)},${d.cosTheta.toFixed(4)}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telemetry_belt_scale_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetTotalizer = () => {
    setTotalAccumulatedTonnes(0);
    setTotalOperatingSeconds(0);
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const latestLoad = dataHistory[dataHistory.length - 1]?.loadCellKg ?? results.gayaBebanPerLoadCell;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-5">
      {/* Title & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
            Monitoring Grafik Fluktuasi Real-Time
          </h3>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">| Telemetri Sensor & Integrator</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Selectors */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveChannel('load')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeChannel === 'load'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gaya Load Cell (kg)
            </button>
            <button
              onClick={() => setActiveChannel('tph')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeChannel === 'tph'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Laju Aliran (T/h)
            </button>
            <button
              onClick={() => setActiveChannel('speed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeChannel === 'speed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kecepatan (m/s)
            </button>
          </div>

          {/* Pause / Resume Plotting */}
          <button
            onClick={() => setIsChartActive(!isChartActive)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isChartActive
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
            title={isChartActive ? 'Jeda Grafik' : 'Lanjutkan Grafik'}
          >
            {isChartActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={dataHistory.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Fluctuation Noise Mode & Live Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnableNoise(!enableNoise)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              enableNoise
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {enableNoise ? 'Mode Fluktuasi Nyata: ON' : 'Mode Teoretis Ideal: ON'}
          </button>

          {enableNoise && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Variasi Beban:</span>
              {[1, 3, 5, 8].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setNoiseLevel(lvl)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                    noiseLevel === lvl
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  ±{lvl}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live instantaneous value readout */}
        <div className="flex items-center gap-4 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Gaya Terbaca Saat Ini:</span>
            <span className="text-sm font-bold text-cyan-300">{formatNum(latestLoad, 2)} kg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Teoretis:</span>
            <span className="text-slate-300">{formatNum(results.gayaBebanPerLoadCell, 2)} kg</span>
          </div>
        </div>
      </div>

      {/* Canvas Plot */}
      <div className="relative w-full h-[240px] sm:h-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Industrial Integrator / Totalizer Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Akumulasi Total (Totalizer)</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {formatNum(totalAccumulatedTonnes, 4)}
              </span>
              <span className="text-xs text-slate-400 font-mono">Ton</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              = {formatNum(totalAccumulatedTonnes * 1000, 1)} kg
            </div>
          </div>

          <button
            onClick={handleResetTotalizer}
            title="Reset Totalizer Akumulasi"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Waktu Operasional</div>
          <div className="text-lg font-bold font-mono text-slate-200">
            {formatSeconds(totalOperatingSeconds)}
          </div>
          <div className="text-[10px] text-slate-500">
            Status: {isConveyorRunning ? 'Motor Berputar (Run)' : 'Motor Berhenti (Standby)'}
          </div>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Signal Transmitter (4-20 mA)</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-cyan-300">
              {formatNum(results.transmitterMaOutput, 2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">mA</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Load cell: {formatNum(results.loadCellMvOutput, 2)} mV (20mV FS)
          </div>
        </div>
      </div>
    </div>
  );
}
