import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent } from "motion/react";
import { ArrowUp, Mic } from "lucide-react";
import type { JarvisState } from "./types";
import type { Amplitude } from "./useJarvisEngine";

const PLACEHOLDER: Record<JarvisState, string> = {
  idle: "Speak to JARVIS...",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

/** Tiny live waveform inside the capsule. */
function MiniWave({ amplitude, active }: { amplitude: Amplitude; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lvl = useRef(0);
  useMotionValueEvent(amplitude, "change", (v) => {
    lvl.current = v;
  });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = 88 * dpr;
    canvas.height = 22 * dpr;
    const bars = 22;
    const seeds = Array.from({ length: bars }, () => Math.random() * 6);
    let raf = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height;
      for (let i = 0; i < bars; i++) {
        const w = 0.4 + 0.6 * Math.abs(Math.sin(t / 260 + seeds[i]!));
        const bh = Math.max(1.5 * dpr, lvl.current * h * w);
        const x = (i * (canvas.width / bars)) + 1;
        ctx.fillStyle = `rgba(196, 233, 255, ${0.25 + lvl.current * 0.6})`;
        ctx.fillRect(x, (h - bh) / 2, 1.4 * dpr, bh);
      }
    };
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <motion.canvas
      ref={ref}
      className="h-[22px] w-[88px]"
      animate={{ opacity: active ? 1 : 0.25 }}
      transition={{ duration: 0.4 }}
    />
  );
}

export function CommandInput({
  state,
  amplitude,
  micActive,
  onToggleMic,
  onSubmit,
}: {
  state: JarvisState;
  amplitude: Amplitude;
  micActive: boolean;
  onToggleMic: () => void;
  onSubmit: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const active = state === "listening" || state === "speaking";

  return (
    <motion.form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
        setValue("");
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      className="glass-panel relative z-20 flex w-[min(620px,86vw)] items-center gap-3 rounded-full px-3 py-2.5"
      style={{ boxShadow: active ? "var(--glow-core), var(--shadow-glass)" : "var(--shadow-glass)" }}
    >
      <motion.button
        type="button"
        aria-label="Toggle voice capture"
        onClick={onToggleMic}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border transition-colors ${
          micActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-primary"
        }`}
        style={{ boxShadow: micActive ? "var(--glow-soft)" : "none" }}
      >
        <Mic size={15} />
      </motion.button>

      <MiniWave amplitude={amplitude} active={active} />

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER[state]}
        aria-label="Command JARVIS"
        className="min-w-0 flex-1 bg-transparent font-mono text-xs tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      <motion.button
        type="submit"
        aria-label="Send command"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground"
        style={{ background: "var(--core)", boxShadow: "var(--glow-soft)" }}
      >
        <ArrowUp size={15} />
      </motion.button>
    </motion.form>
  );
}
