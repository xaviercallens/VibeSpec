import { Calendar as CalendarIcon, Zap, Info, Clock, CheckCircle2 } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-2 border-b border-white/10 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-white">Burst Scheduler</h1>
          <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-full px-4 py-2">
            <span className="text-sm text-muted-foreground">Active Plan:</span>
            <span className="text-sm font-bold text-gradient-magenta">Agile Pro ($1,000/mo)</span>
            <div className="h-4 w-px bg-white/20 mx-2" />
            <span className="text-sm text-white">Credits: 3 / 4 Sprints Remaining</span>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Reserve your 24-hour dedicated GPU compute blocks. Infrastructure scales to zero automatically.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Booking Controls & Upsell */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-cyan" />
              Book Sprint
            </h2>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Select Date</label>
              <input type="date" className="bg-black border border-white/20 rounded-md p-2 text-sm text-white color-scheme-dark" defaultValue="2026-03-24" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400">Target Timezone</label>
              <select className="bg-black border border-white/20 rounded-md p-2 text-sm text-white">
                <option>UTC (Coordinated Universal Time)</option>
                <option>PST (Pacific Standard Time)</option>
                <option>EST (Eastern Standard Time)</option>
              </select>
            </div>

            <button className="mt-4 w-full px-4 py-2 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition-colors">
              Lock Compute Slot
            </button>
            
            {/* Margin Protector Tooltip */}
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md flex items-start gap-3">
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong className="text-white block mb-1">Compute Locked.</strong>
                To protect data sovereignty and ensure predictable pricing, all GPU infrastructure will automatically spin down and crypto-shred at exactly 24:00 UTC.
              </p>
            </div>
          </div>

          {/* Surge Compute Upsell */}
          <div className="glass-panel p-6 rounded-xl border-magenta/40 flex flex-col gap-4 relative overflow-hidden group hover:border-magenta transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-magenta/20 blur-[50px] group-hover:bg-magenta/40 transition-colors" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap size={20} className="text-magenta" />
              Surge Compute
            </h3>
            <p className="text-sm text-gray-400">
              Need immediate execution? Bypass the calendar queue and spin up a dedicated multi-agent pod instantly.
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-bold text-white">$150</span>
              <span className="text-xs font-mono text-magenta border border-magenta/30 px-2 py-1 rounded bg-magenta/10">PREMIUM</span>
            </div>
            <button className="w-full mt-2 glass-panel border border-magenta/50 text-magenta font-semibold py-2 rounded hover:bg-magenta/10 transition-colors">
              Activate Surge
            </button>
          </div>
        </div>

        {/* Right Area: Gantt / Calendar View Mockup */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon size={20} />
              March 2026 Schedule
            </h2>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan/50" /> Available</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald flex items-center justify-center"><CheckCircle2 size={10} className="text-black" /></span> Booked (Yours)</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-700" /> Unavailable</div>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[800px] flex flex-col gap-2">
              {/* Calendar Grid Header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{day}</div>
                ))}
              </div>
              
              {/* Calendar Days Simulation (2 weeks) */}
              <div className="grid grid-cols-7 gap-2">
                {[...Array(14)].map((_, i) => {
                  const day = i + 16;
                  const isBooked = day === 20; // Simulated booking
                  const isUnavailable = day === 18 || day === 19;
                  const isPast = day < 22; // Let's pretend today is 22nd

                  let blockClass = "h-24 rounded-md border p-2 flex flex-col justify-between transition-colors";
                  if (isBooked) blockClass += " bg-emerald/10 border-emerald/50";
                  else if (isUnavailable || isPast) blockClass += " bg-gray-900 border-white/5 opacity-50";
                  else blockClass += " bg-black/40 border-cyan/20 cursor-pointer hover:border-cyan hover:bg-cyan/5";

                  return (
                    <div key={i} className={blockClass}>
                      <span className={`text-sm font-medium ${isBooked ? 'text-emerald' : 'text-gray-400'}`}>{day}</span>
                      {isBooked && (
                        <div className="bg-emerald text-black text-[10px] font-bold px-1.5 py-0.5 rounded leading-none w-max">
                          LOCKED
                        </div>
                      )}
                      {!isBooked && !isUnavailable && !isPast && (
                        <div className="text-[10px] text-cyan/50 mt-auto">Avail: 4 slots</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
