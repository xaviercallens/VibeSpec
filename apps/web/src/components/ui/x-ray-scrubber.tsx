"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { GripVertical } from "lucide-react";

interface XRayScrubberProps {
  leftNode: React.ReactNode;
  rightNode: React.ReactNode;
}

export function XRayScrubber({ leftNode, rightNode }: XRayScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      setContainerWidth(width);
      x.set(width / 2); // Start in the middle
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [x]);

  const clipPathLeft = useTransform(x, (value) => `inset(0 ${containerWidth - value}px 0 0)`);
  const clipPathRight = useTransform(x, (value) => `inset(0 0 0 ${value}px)`);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[600px] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black"
    >
      {/* Left Pane (Raw Mockup) */}
      <motion.div 
        className="absolute inset-0 select-none pointer-events-none"
        style={{ clipPath: clipPathLeft }}
      >
        {leftNode}
      </motion.div>

      {/* Right Pane (Rendered Code + Telemetry) */}
      <motion.div 
        className="absolute inset-0 select-none pointer-events-none"
        style={{ clipPath: clipPathRight }}
      >
        {rightNode}
      </motion.div>

      {/* Draggable Divider */}
      <motion.div
        className="absolute top-0 bottom-0 w-1 bg-cyan shadow-[0_0_15px_rgba(6,182,212,0.8)] cursor-ew-resize z-20 flex items-center justify-center group"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: containerWidth }}
        dragElastic={0}
        dragMomentum={false}
      >
        <div className="w-8 h-8 rounded-full bg-cyan text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute -left-[14px]">
          <GripVertical size={16} />
        </div>
      </motion.div>

      {/* Labels */}
      <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1 text-xs font-mono text-white/70 rounded-md">
        RAW_STITCH_MOCKUP.zip
      </div>
      <div className="absolute top-4 right-4 z-10 glass-panel border-cyan/30 px-3 py-1 text-xs font-mono text-cyan rounded-md neon-glow-cyan">
        VIBESPEC_RENDERED.tsx + Z3_PROOFS
      </div>
    </div>
  );
}
