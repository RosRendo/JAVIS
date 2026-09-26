import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SystemVitals } from "./types";

function Dial({ label, value }: { label: string; value: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="color-mix(in oklab, var(--hud) 14%, transparent)"
            strokeWidth="1.4"
          />
          <motion.circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="var(--core)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          />
        </svg>
      </div>
      <div>
        <p className="hud-label">{label}</p>
        <p className="hud-value text-xs">{Math.round(value)}%</p>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="hud-label">{label}</span>
        <span className="hud-value text-[11px]">{Math.round(value)}%</span>
      </div>
      <div className="mt-1.5 h-px w-full bg-border">
        <motion.div
          className="h-px"
          style={{ background: "var(--core)", boxShadow: "var(--glow-soft)" }}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
      </div>
    </div>
  );
}

export function SystemPanel({ vitals }: { vitals: SystemVitals }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          aria-label={open ? "Collapse system panel" : "Expand system panel"}
          onClick={() => setOpen((o) => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          className="glass-panel rounded-md p-1 text-muted-foreground hover:text-primary"
        >
          {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside
              key="system"
              initial={{ opacity: 0, x: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 24, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 210, damping: 26, mass: 0.7 }}
              className="glass-panel w-56 space-y-4 rounded-xl p-4"
            >
              <p className="hud-label">system</p>
              <Dial label="cpu" value={vitals.cpu} />
              <Dial label="ram" value={vitals.ram} />
              <Bar label="gpu" value={vitals.gpu} />
              <Bar label="battery" value={vitals.battery} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="hud-label">network</span>
                <span className="flex items-center gap-1.5">
                  <motion.span
                    className="h-1 w-1 rounded-full"
                    style={{ background: "var(--core)" }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                  <span className="hud-value text-[10px] uppercase tracking-[0.2em]">
                    {vitals.network}
                  </span>
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
