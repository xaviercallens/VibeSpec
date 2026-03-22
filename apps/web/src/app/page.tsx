import { XRayScrubber } from "@/components/ui/x-ray-scrubber";
import { ArrowRight, Terminal, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="w-full py-24 px-6 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-magenta/20 text-magenta text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
          VibeSpec NSVE Matrix is Online
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl text-white mb-6">
          Zero-Hallucination Front-End Engineering
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12">
          Transform raw mockups into production-ready React components, mathematically proven by Reinforcement Learning and Z3 SMT solvers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            href="/checkout" 
            className="group relative px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-hero-glow opacity-0 group-hover:opacity-20 transition-opacity" />
            Start 30-Min Discovery Sprint
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/schedule" 
            className="px-6 py-3 glass-panel text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            Book Calendar Pipeline
          </Link>
        </div>
      </section>

      {/* The Glasshouse Demo (Interactive Slider) */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">The Glasshouse Demo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Drag the X-Ray slider to see how VibeSpec transforms raw Google Stitch JSON into mathematically proven, asset-rich UI components.
          </p>
        </div>

        <XRayScrubber 
          leftNode={<MockupView />} 
          rightNode={<RenderedView />} 
        />
      </section>

      {/* Value Props */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center">
            <Terminal />
          </div>
          <h3 className="text-xl font-bold text-white">Neuro-Symbolic VLM</h3>
          <p className="text-sm text-muted-foreground">
            Ingests Google Stitch or raw images via Qwen2.5-VL and translates them into deterministic EARS constraints.
          </p>
        </div>
        <div className="glass-panel p-6 flex flex-col gap-4 border-magenta/20">
          <div className="w-12 h-12 rounded-lg bg-magenta/10 text-magenta flex items-center justify-center">
            <Zap />
          </div>
          <h3 className="text-xl font-bold text-white">RL Chaos Validation</h3>
          <p className="text-sm text-muted-foreground">
            A PPO RL Agent frantically attacks the DOM, hunting for layout breaks and responsive constraint violations.
          </p>
        </div>
        <div className="glass-panel p-6 flex flex-col gap-4 border-emerald/20">
          <div className="w-12 h-12 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center">
            <ShieldCheck />
          </div>
          <h3 className="text-xl font-bold text-white">Z3 Spatial Proofs</h3>
          <p className="text-sm text-muted-foreground">
            Issues a mathematically verified Certificate of Correctness proving 44dp tap targets and zero overlap.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Dummy Components for the Scrubber ───────────────────────────

function MockupView() {
  return (
    <div className="w-full h-full bg-[#111] p-12 pattern-grid flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl aspect-video border-2 border-dashed border-gray-600 rounded flex flex-col p-4 bg-gray-900/50">
        <div className="h-10 w-full border-b-2 border-dashed border-gray-600 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600" />
          <div className="h-4 w-32 bg-gray-700/50 rounded" />
        </div>
        <div className="flex-1 mt-6 flex gap-6">
          <div className="flex-1 border-2 border-dashed border-gray-600 rounded bg-gray-800/30 flex items-center justify-center">
            <span className="font-mono text-gray-500 uppercase">img_placeholder_hero</span>
          </div>
          <div className="w-1/3 flex flex-col gap-4">
            <div className="h-6 w-full bg-gray-700/50 rounded" />
            <div className="h-4 w-3/4 bg-gray-700/50 rounded" />
            <div className="h-10 w-full border-2 border-dashed border-gray-600 rounded mt-auto flex items-center justify-center">
              btn_cta
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderedView() {
  return (
    <div className="w-full h-full bg-background p-12 flex flex-col items-center justify-center relative">
      {/* Proof Overlay */}
      <div className="absolute top-12 left-12 w-64 glass-panel border-emerald/30 p-4 font-mono text-[10px] text-emerald leading-relaxed z-10 hidden md:block neon-glow-emerald">
        <div>[Z3_SOLVER] SATISFIABLE</div>
        <div>Assert: BoxA.y {'>'} BoxB.y+BoxB.height</div>
        <div>Assert: Btn.width {'>='} 44dp</div>
        <div className="text-white mt-1">✔ Layout Math Verified</div>
      </div>

      <div className="w-full max-w-2xl aspect-video rounded-xl border border-white/10 shadow-2xl bg-black overflow-hidden flex flex-col relative z-0">
        <header className="h-14 border-b border-white/5 flex items-center px-6 gap-4 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-magenta to-orange-500 shadow-[0_0_15px_rgba(219,39,119,0.5)]" />
          <nav className="flex gap-4 text-xs font-medium text-gray-400">
            <span>Features</span>
            <span>Pricing</span>
          </nav>
        </header>
        <div className="flex-1 p-8 flex gap-8">
          <div className="flex-1 rounded-lg bg-gradient-to-br from-cyan/20 to-blue-900/20 border border-cyan/20 flex flex-col justify-center p-6 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 text-cyan/10">
              <Zap size={120} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Supersonic Speeds</h2>
            <p className="text-gray-400 text-sm">Deploy faster than ever with automated CI/CD.</p>
          </div>
          <div className="w-1/3 flex flex-col justify-center gap-4">
            <h3 className="text-xl font-bold text-white">Join the Beta</h3>
            <p className="text-sm text-gray-400">Limited spots available.</p>
            <button className="h-10 w-full bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 text-sm">
              Get Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
