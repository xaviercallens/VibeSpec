import { Download, FileCode2, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function VaultPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
      
      <div className="w-20 h-20 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center text-emerald mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
        <CheckCircle2 size={40} />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-white mb-4 text-center">
        Sprint Completed Successfully
      </h1>
      <p className="text-muted-foreground text-center max-w-xl mb-12">
        Your 3-screen Stitch prototype was successfully compiled and 84% mathematically verified in 28m 14s. 
        You just saved roughly 6 hours of frontend engineering and QA time.
      </p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Code Download */}
        <div className="glass-panel p-6 rounded-xl border-cyan/20 flex flex-col items-center text-center gap-4 hover:border-cyan/50 transition-colors group cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform">
            <FileCode2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Production Codebase</h2>
            <p className="text-xs text-gray-400">Next.js 14 + Tailwind + Assets</p>
          </div>
          <button className="mt-2 w-full py-2 bg-cyan/10 text-cyan border border-cyan/30 rounded flex items-center justify-center gap-2 hover:bg-cyan/20 transition-colors">
            <Download size={16} /> Download .ZIP (4.2 MB)
          </button>
        </div>

        {/* Certificate */}
        <div className="glass-panel p-6 rounded-xl border-emerald/20 flex flex-col items-center text-center gap-4 hover:border-emerald/50 transition-colors group cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald group-hover:scale-110 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Proof Certificate</h2>
            <p className="text-xs text-gray-400">Z3 Math Proofs + WCAG Audit</p>
          </div>
          <button className="mt-2 w-full py-2 bg-emerald/10 text-emerald border border-emerald/30 rounded flex items-center justify-center gap-2 hover:bg-emerald/20 transition-colors">
            <Download size={16} /> Download .PDF (1.1 MB)
          </button>
        </div>
      </div>

      {/* The Upsell Hook */}
      <div className="w-full p-8 rounded-xl border border-magenta/30 bg-gradient-to-br from-magenta/10 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-magenta/20 blur-[80px]" />
        
        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Scale to the Entire Application.</h3>
        <p className="text-gray-300 text-sm mb-6 max-w-2xl relative z-10">
          Your full Google Stitch project has 40 more screens, complex state routing, and requires deep multi-page RL validation. 
          Upgrade to the Agile Pro Calendar Subscription in the next 48 hours to book your first 24-hour full-agent sprint, 
          and we will instantly credit your $19 Discovery fee toward your first month.
        </p>

        <div className="flex gap-4 relative z-10">
          <Link href="/checkout?upgrade=agile-pro" className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors">
            Upgrade to Agile Pro ($1,000/mo)
          </Link>
          <button className="px-6 py-3 glass-panel text-white font-medium rounded hover:bg-white/5 transition-colors">
            Dismiss
          </button>
        </div>
      </div>

    </div>
  );
}
