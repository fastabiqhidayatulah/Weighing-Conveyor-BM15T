import { X, BookOpen, CheckCircle, Compass, Scale, Zap } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Buku Panduan & Teori Belt Conveyor Scale</h3>
              <p className="text-xs text-slate-400">Prinsip dasar kinematika, dinamika beban, dan kompensasi sudut</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              1. Mengapa Diperlukan Kompensasi Sudut Trigonometri COS(θ)?
            </h4>
            <p>
              Pada konveyor miring (inclined conveyor), vektor gravitasi material dan struktur tetap mengarah tegak lurus ke pusat bumi (<code className="text-amber-300 font-mono">F = m · g</code>). Namun, load cell dipasang tegak lurus terhadap rangka konveyor yang miring sebesar sudut θ.
            </p>
            <p className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
              Gaya Normal Terbaca = Massa × Gravitasi × COS(θ)
            </p>
            <p>
              Tanpa kompensasi trigonometri ini, integrator timbangan konveyor akan mengalami pembacaan berlebih (over-measurement) atau salah hitung ketika sudut conveyor berubah atau saat kalibrasi dipindahkan dari bidang datar ke incline.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              2. Rantai Kinematika Kecepatan Sabuk
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong className="text-slate-100">Inverter VFD (25 - 60 Hz):</strong> Mengatur frekuensi motor listrik nominal 4-pole 1.450 RPM pada 50 Hz.
              </li>
              <li>
                <strong className="text-slate-100">Gearbox Cyclo (Rasio 1:43):</strong> Mereduksi putaran tinggi motor menjadi putaran rendah dengan torsi tinggi untuk memutar drive pulley.
              </li>
              <li>
                <strong className="text-slate-100">Drive Pulley (Ø 0,254 m / 10"):</strong> Memiliki keliling <code className="text-cyan-300 font-mono">0,798 m</code> setiap 1 kali putaran penuh.
              </li>
            </ul>
          </div>

          {/* Section 3: Dual Load Cell */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              3. Sistem Penimbang 1 Roll (Single Idler) & Dual Load Cell
            </h4>
            <p>
              Weighbridge span memiliki bentang sepanjang <strong className="text-slate-100">1,0 meter</strong>. Beban yang berada tepat di atas rol penimbang ditransmisikan ke dua unit load cell (sisi kiri dan kanan) secara simetris:
            </p>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300">
              Gaya_Per_Load_Cell = (Gaya_Ukur_Material / 2) + (Gaya_Ukur_Tare / 2)
            </div>
            <p>
              Tare weight (berat mati 15 kg) mencakup massa fisik 1 roll penyangga bersama rangka baja penopang yang juga terkoreksi oleh <code className="text-cyan-300 font-mono">COS(θ)</code>.
            </p>
          </div>

          {/* Section 4: Data Validasi Acuan */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              4. Data Validasi Output Standar (Benchmark Revisi 1:43)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden font-mono text-[11px]">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-2 border-b border-slate-800">Parameter Uji</th>
                    <th className="p-2 border-b border-slate-800">Kondisi Input</th>
                    <th className="p-2 border-b border-slate-800">Hasil Teoretis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-2 text-slate-300">Kecepatan Sabuk</td>
                    <td className="p-2 text-slate-400">50 Hz, Cyclo 1:43, Pulley 0.798m</td>
                    <td className="p-2 text-cyan-300 font-bold">~0,45 m/detik (0,448 m/s)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">Berat Material Aktual</td>
                    <td className="p-2 text-slate-400">3,05 kg/s pada 0,448 m/s, L = 1m</td>
                    <td className="p-2 text-cyan-300 font-bold">6,80 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">Gaya Material Terkompensasi</td>
                    <td className="p-2 text-slate-400">6,80 kg × COS(20°) [0,939]</td>
                    <td className="p-2 text-emerald-300 font-bold">6,39 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">Gaya Tare Terkompensasi</td>
                    <td className="p-2 text-slate-400">15 kg × COS(20°) [0,939]</td>
                    <td className="p-2 text-emerald-300 font-bold">14,08 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">Total Beban per Load Cell</td>
                    <td className="p-2 text-slate-400">(6,39 + 14,08) / 2</td>
                    <td className="p-2 text-amber-300 font-bold">~10,24 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
