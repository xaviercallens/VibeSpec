import { UploadCloud, Link as LinkIcon, Settings2, ShieldAlert } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Command Center</h1>
        <p className="text-muted-foreground">Ingest your Google Stitch designs and configure VLM synthesis parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Ingestion Engine */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* File Drop Zone */}
          <section className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-cyan/30 hover:border-cyan/60 transition-colors group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center text-cyan mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Drop Stitch Export Here</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Drag and drop your <code className="text-cyan text-sm">RAW_STITCH_MOCKUP.zip</code> to initialize the VibeSpec parsing pipeline.
            </p>
          </section>

          {/* MCP Live Link */}
          <section className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LinkIcon size={20} className="text-magenta" />
              Live MCP Binding
            </h3>
            <p className="text-sm text-muted-foreground">Keep VibeSpec continuously synced with your live Google Stitch workspace via the Model Context Protocol.</p>
            <div className="flex gap-4 mt-2">
              <input 
                type="text" 
                placeholder="stitch.withgoogle.com/projects/xyz123" 
                className="flex-1 bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
              />
              <button className="px-6 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors">
                Bind Socket
              </button>
            </div>
          </section>

        </div>

        {/* Right Column: Vibe Configurator */}
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Settings2 size={24} className="text-emerald" />
            <h2 className="text-xl font-bold text-white">Vibe Configurator</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Target Paradigm</label>
              <select className="bg-black border border-white/20 rounded-md p-2 text-sm text-white">
                <option>OLED Minimalist (Dark Mode Default)</option>
                <option>Enterprise B2B (High Contrast Light)</option>
                <option>Web3 Glassmorphism</option>
                <option>Neo-Brutalism</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">Gemini Asset Directives</label>
              <textarea 
                rows={4} 
                className="bg-black border border-white/20 rounded-md p-3 text-sm text-white focus:border-cyan outline-none"
                placeholder="e.g., 'Strict WCAG AAA colors, 3D claymorphism avatars, minimalist SVGs'"
                defaultValue="Strict WCAG AAA colors, minimalist vector SVGs, avoid complex gradients in icons."
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <label className="text-sm font-medium text-white">Target Framework</label>
              <div className="flex flex-wrap gap-2">
                {['Next.js 14 (App)', 'React + Vite', 'SvelteKit'].map(fw => (
                  <span key={fw} className={`px-3 py-1 rounded-full text-xs font-mono border ${fw.startsWith('Next') ? 'bg-cyan/20 border-cyan text-cyan' : 'border-white/20 text-gray-400'}`}>
                    {fw}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 rounded-md border border-orange-500/30 bg-orange-500/5 flex items-start gap-3">
              <ShieldAlert size={20} className="text-orange-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-orange-500">Neuro-Symbolic Target</span>
                <span className="text-xs text-orange-500/80">Z3 proofs will strictly enforce WCAG 2.2 AAA contrast ratios across all generated assets.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
