"use client";

import { useEffect, useState } from "react";
import { Terminal, Image as ImageIcon, Zap, ShieldCheck } from "lucide-react";

export default function CruciblePage({ params }: { params: { id: string } }) {
  const [logs, setLogs] = useState<string[]>(['[Firestore] Connecting to telemetry stream...']);
  const [z3Logs, setZ3Logs] = useState<string[]>(['[Firestore] Connecting to Z3 stream...']);

  // Simulate Firestore onSnapshot listener for live telemetry
  useEffect(() => {
    console.log(`[Firebase SDK] Subscribed to collection: telemetry/sprints/${params.id}/logs`);
    console.log(`[Firebase SDK] Subscribed to collection: telemetry/sprints/${params.id}/proofs`);

    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-15), `[React] Synthesizing Component_${Math.floor(Math.random()*1000)}.tsx`]);
      setZ3Logs(prev => [...prev.slice(-15), `[SATISFIABLE] Assert: Node_${Math.floor(Math.random()*100)}.width >= 44dp`]);
    }, 800);
    
    return () => {
      console.log(`[Firebase SDK] Unsubscribed from telemetry streams for sprint ${params.id}`);
      clearInterval(interval);
    };
  }, [params.id]);

  return (
    <div className="w-full h-[calc(100vh-64px)] p-6 bg-black flex flex-col gap-4 overflow-hidden">
      <header className="flex items-center justify-between shrink-0 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            The Crucible <span className="text-sm font-mono text-cyan neon-glow-cyan px-2 py-0.5 rounded border border-cyan/30 bg-cyan/10">LIVE</span>
          </h1>
          <p className="text-sm text-muted-foreground">Sprint ID: {params.id || 'ONE-SHOT-XYZ'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Time Remaining</span>
            <span className="text-xl font-mono text-white">28:14</span>
          </div>
          <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-sm hover:bg-red-500/20 transition-colors">
            Force Kill Compute
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
        
        {/* Pane 1: Antigravity Terminal */}
        <div className="glass-panel border-white/5 rounded-xl flex flex-col overflow-hidden relative">
          <div className="h-10 bg-black/80 border-b border-white/10 flex items-center px-4 gap-2 shrink-0">
            <Terminal size={16} className="text-cyan" />
            <span className="text-xs font-mono text-gray-400">Antigravity VFS Terminal</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-cyan/70 space-y-1">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
            <div className="animate-pulse">_</div>
          </div>
        </div>

        {/* Pane 2: Banana Canvas */}
        <div className="glass-panel border-white/5 rounded-xl flex flex-col overflow-hidden relative">
          <div className="h-10 bg-black/80 border-b border-white/10 flex items-center px-4 gap-2 shrink-0">
            <ImageIcon size={16} className="text-orange-400" />
            <span className="text-xs font-mono text-gray-400">Banana Asset Canvas</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded border border-white/10 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 flex items-center justify-center relative overflow-hidden group">
                <ImageIcon size={24} className="text-orange-500/50" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-mono text-white text-center p-1">
                  hero_bg_{i}.webp<br/>14kb
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pane 3: The Chaos Arena */}
        <div className="glass-panel border-magenta/20 rounded-xl flex flex-col overflow-hidden relative">
          <div className="h-10 bg-black/80 border-b border-magenta/20 flex items-center px-4 gap-2 shrink-0">
            <Zap size={16} className="text-magenta" />
            <span className="text-xs font-mono text-magenta">RL Chaos Arena (Playwright)</span>
            <span className="ml-auto text-[10px] text-magenta animate-pulse">Recording...</span>
          </div>
          <div className="flex-1 bg-white/5 m-4 border border-white/10 rounded overflow-hidden relative">
            <div className="w-full h-8 bg-black border-b border-white/10 flex items-center px-2">
              <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/></div>
              <div className="mx-auto bg-black border border-white/10 text-[10px] text-gray-500 px-4 rounded">localhost:3000</div>
            </div>
            {/* Fake cursor bouncing around */}
            <div className="absolute w-3 h-3 rounded-full bg-magenta/50 blur-[2px] animate-pulse" style={{ top: '40%', left: '60%' }} />
            <div className="absolute top-1/2 left-1/4 w-32 h-10 border-2 border-dashed border-magenta flex items-center justify-center text-[10px] text-magenta font-mono">
              [Click Attemp]
            </div>
          </div>
        </div>

        {/* Pane 4: Symbolic Prover */}
        <div className="glass-panel border-emerald/20 rounded-xl flex flex-col overflow-hidden relative">
          <div className="h-10 bg-black/80 border-b border-emerald/20 flex items-center px-4 gap-2 shrink-0">
            <ShieldCheck size={16} className="text-emerald" />
            <span className="text-xs font-mono text-emerald">Z3 Spatial Prover</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-emerald/80 space-y-1">
            {z3Logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>

      </div>
    </div>
  );
}
