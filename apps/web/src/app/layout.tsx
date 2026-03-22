import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "VibeSpec | Mathematically Proven Front-End",
  description: "Transform raw UI mockups into mathematically proven, production-ready code autonomously.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased min-h-screen relative`}>
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-magenta/10 blur-[120px]" />
        </div>
        
        {/* Navbar Placeholder */}
        <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 h-16 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan to-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              V
            </div>
            <span className="font-bold text-xl tracking-tight text-white">VibeSpec</span>
          </div>
          <nav className="ml-auto flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">The Glasshouse</a>
            <a href="/schedule" className="hover:text-white transition-colors">Burst Scheduler</a>
            <a href="/dashboard" className="text-white bg-white/10 px-4 py-2 rounded-md hover:bg-white/20 transition-colors">
              Command Center
            </a>
          </nav>
        </header>

        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
