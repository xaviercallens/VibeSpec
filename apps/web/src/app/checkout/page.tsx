import { CreditCard, Rocket, Lock } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12">
      
      {/* Left: Summary */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            One-Shot Discovery Sprint
          </h1>
          <p className="text-muted-foreground">
            Experience the full power of the VibeSpec pipeline on your own UI components. 
            Takes exactly 30 minutes. Generates production Next.js code.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">What's Included</h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2"><CheckCircle /> Up to 3 Google Stitch Screens</li>
            <li className="flex items-center gap-2"><CheckCircle /> 30 Minutes of strict L4 GPU compute</li>
            <li className="flex items-center gap-2"><CheckCircle /> 10 synthesized visual assets (Gemini Banana)</li>
            <li className="flex items-center gap-2"><CheckCircle /> Partial Certificate of Correctness (Z3)</li>
            <li className="flex items-center gap-2"><CheckCircle /> Full source code download</li>
          </ul>
        </div>
        
        <div className="p-4 bg-emerald/10 border border-emerald/30 rounded-md flex items-start gap-3 text-emerald text-sm">
          <Lock size={20} className="shrink-0" />
          <p>
            <strong>Data Sovereignty Guarantee:</strong> All execution nodes are forcefully terminated and crypto-shredded instantly at minute 30. Your design artifacts are never used for model training.
          </p>
        </div>
      </div>

      {/* Right: Checkout Form */}
      <div className="glass-panel p-8 rounded-xl border-cyan/20 bg-black/80 flex flex-col">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold text-white">Total Due</h2>
          <span className="text-4xl font-bold text-gradient-cyan">$19.00</span>
        </div>

        <form className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Email Address</label>
            <input type="email" placeholder="engineering@company.com" className="bg-black border border-white/20 rounded-md p-3 text-white focus:border-cyan outline-none" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Card Details (Mocked)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 text-gray-500" size={20} />
              <input type="text" placeholder="4242 4242 4242 4242" className="w-full bg-black border border-white/20 rounded-md p-3 pl-10 text-white font-mono focus:border-cyan outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <input type="text" placeholder="MM/YY" className="bg-black border border-white/20 rounded-md p-3 text-white font-mono focus:border-cyan outline-none" />
              <input type="text" placeholder="CVC" className="bg-black border border-white/20 rounded-md p-3 text-white font-mono focus:border-cyan outline-none" />
            </div>
          </div>

          <div className="mt-8 flex-1 flex flex-col justify-end">
            <Link 
              href="/run/demo-123" 
              className="w-full py-4 bg-cyan text-black font-bold rounded-lg hover:bg-cyan/90 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <Rocket size={20} /> Pay $19.00 & Initialize Sprint
            </Link>
          </div>
        </form>
      </div>

    </div>
  );
}

function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
