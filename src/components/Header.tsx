import { Activity, Gauge, RotateCcw, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onResetAll: () => void;
  onOpenHelp: () => void;
}

export function Header({ onResetAll, onOpenHelp }: HeaderProps) {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Gauge className="w-5 h-5 text-slate-950 font-bold" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Virtualisasi Conveyor Belt Scale
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 hidden sm:inline">
                SCADA / Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulasi Dinamika Penimbangan Sabuk Konveyor & Kompensasi Sudut Trigonometri
            </p>
          </div>
        </div>

        {/* Live System Status & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Sistem Integrator Aktif</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono">1-Idler / Dual Load Cell</span>
          </div>

          {/* Reset button */}
          <button
            onClick={onResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
            title="Reset semua parameter ke default awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Parameter</span>
          </button>

          {/* Help button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Panduan & Rumus</span>
          </button>
        </div>
      </div>
    </header>
  );
}
