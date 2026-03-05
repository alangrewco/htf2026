"use client";

import { motion } from "framer-motion";
import { Globe, MapPin, Navigation } from "lucide-react";

export function GeoPlaceholder() {
  return (
    <div className="glass flex h-full flex-col items-center justify-center rounded-xl overflow-hidden relative">
      {/* Decorative background grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Animated decorative dots representing supply chain nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { x: "20%", y: "30%", delay: 0 },
          { x: "45%", y: "25%", delay: 0.5 },
          { x: "70%", y: "35%", delay: 1 },
          { x: "30%", y: "60%", delay: 1.5 },
          { x: "55%", y: "55%", delay: 0.8 },
          { x: "80%", y: "50%", delay: 1.2 },
          { x: "15%", y: "70%", delay: 0.3 },
          { x: "65%", y: "70%", delay: 1.8 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: dot.x, top: dot.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              delay: dot.delay,
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="h-2 w-2 rounded-full bg-primary/50" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary/20 animate-ping" />
          </motion.div>
        ))}

        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <line
            x1="20%"
            y1="30%"
            x2="45%"
            y2="25%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
          <line
            x1="45%"
            y1="25%"
            x2="70%"
            y2="35%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
          <line
            x1="30%"
            y1="60%"
            x2="55%"
            y2="55%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
          <line
            x1="55%"
            y1="55%"
            x2="80%"
            y2="50%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
          <line
            x1="20%"
            y1="30%"
            x2="30%"
            y2="60%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
          <line
            x1="70%"
            y1="35%"
            x2="65%"
            y2="70%"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4,4"
            className="text-primary"
          />
        </svg>
      </div>

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center gap-3 z-10"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Globe className="h-7 w-7 text-primary/60" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground/80">
            Geographic Overview
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
            Interactive supply chain map coming soon — track shipments, suppliers
            & disruptions globally.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>42 locations</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Navigation className="h-3 w-3" />
            <span>18 active routes</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
