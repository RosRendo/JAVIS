import { memo, useEffect, useRef } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "motion/react";
import type { JarvisState } from "./types";
import type { Amplitude } from "./useJarvisEngine";

const PRESET: Record<
  JarvisState,
  { scale: number; glow: number; ringSpin: number; brightness: number }
> = {
  idle: { scale: 1, glow: 0.42, ringSpin: 46, brightness: 0.85 },
  listening: { scale: 1.06, glow: 0.78, ringSpin: 26, brightness: 1.06 },
  thinking: { scale: 1.02, glow: 0.62, ringSpin: 8, brightness: 0.98 },
  speaking: { scale: 1.05, glow: 0.88, ringSpin: 18, brightness: 1.12 },
};

/** Circular audio spectrum drawn on canvas so 64 bars never touch React state. */
const Spectrum = memo(function Spectrum({
  amplitude,
  active,
}: {
  amplitude: Amplitude;
  active: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const level = useRef(0);
  useMotionValueEvent(amplitude, "change", (v) => {
    level.current = v;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = 460;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const bars = 72;
    const seeds = Array.from({ length: bars }, () => Math.random() * Math.PI * 2);
    let raf = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = (size / 2) * dpr;
      const base = 150 * dpr;
      const lvl = level.current;
      for (let i = 0; i < bars; i++) {
        const ang = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const wobble = 0.35 + 0.65 * Math.abs(Math.sin(t / 340 + seeds[i]!));
        const len = (6 + lvl * 62 * wobble) * dpr;
        const x1 = c + Math.cos(ang) * base;
        const y1 = c + Math.sin(ang) * base;
        const x2 = c + Math.cos(ang) * (base + len);
        const y2 = c + Math.sin(ang) * (base + len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 1.4 * dpr;
        ctx.strokeStyle = `rgba(196, 233, 255, ${0.18 + lvl * 0.6 * wobble})`;
        ctx.stroke();
      }
    };
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.canvas
      ref={ref}
      className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2"
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.94 }}
      transition={{ type: "spring", stiffness: 90, damping: 20 }}
    />
  );
});

/** Small orbiting particles — pure transform animation, GPU friendly. */
const Orbiters = memo(function Orbiters({ speed }: { speed: number }) {
  const items = [
    { r: 118, size: 3, dur: 1, delay: 0, opacity: 0.9 },
    { r: 152, size: 2, dur: 1.5, delay: -4, opacity: 0.6 },
    { r: 186, size: 2.5, dur: 2.1, delay: -9, opacity: 0.5 },
    { r: 214, size: 1.8, dur: 2.8, delay: -2, opacity: 0.4 },
    { r: 132, size: 1.6, dur: 1.8, delay: -6, opacity: 0.5 },
  ];
  return (
    <>
      {items.map((o, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          animate={{ rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: speed * o.dur, repeat: Infinity, ease: "linear", delay: o.delay }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: o.size,
              height: o.size,
              transform: `translate(${o.r}px, 0)`,
              background: "var(--core-hot)",
              opacity: o.opacity,
              boxShadow: "var(--glow-soft)",
            }}
          />
        </motion.div>
      ))}
    </>
  );
});

export function AICore({ state, amplitude }: { state: JarvisState; amplitude: Amplitude }) {
  const p = PRESET[state];
  const raw = useMotionValue(0);
  useMotionValueEvent(amplitude, "change", (v) => raw.set(v));
  const reactive = useSpring(raw, { stiffness: 220, damping: 26, mass: 0.4 });
  const audioScale = useTransform(reactive, [0, 1], [1, 1.14]);
  const audioGlow = useTransform(reactive, [0, 1], [0, 0.5]);

  const audible = state === "listening" || state === "speaking";

  return (
    <div className="pointer-events-none relative h-[520px] w-[520px]">
      {/* volumetric glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--core) 55%, transparent) 0%, color-mix(in oklab, var(--violet) 18%, transparent) 45%, transparent 70%)",
          opacity: audioGlow,
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--core) 42%, transparent), transparent 68%)",
        }}
        animate={{ opacity: p.glow, scale: p.scale }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
      />

      {/* thin orbital rings */}
      {[
        { s: 300, rot: 1, dash: "1 14", w: 1 },
        { s: 366, rot: -1.6, dash: "3 22", w: 1 },
        { s: 430, rot: 2.4, dash: "1 30", w: 1 },
      ].map((r, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: r.s, height: r.s }}
          animate={{ rotate: r.rot > 0 ? 360 : -360, opacity: 0.3 + p.glow * 0.4 }}
          transition={{
            rotate: {
              duration: p.ringSpin * Math.abs(r.rot) * 2,
              repeat: Infinity,
              ease: "linear",
            },
            opacity: { duration: 0.8 },
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="color-mix(in oklab, var(--hud) 70%, transparent)"
              strokeWidth={r.w / 2}
              strokeDasharray={r.dash}
            />
          </svg>
        </motion.div>
      ))}

      {/* inner rotating ring with technical markers */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: -360 }}
        transition={{ duration: state === "thinking" ? 6 : 34, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="color-mix(in oklab, var(--core) 55%, transparent)"
            strokeWidth="0.5"
            strokeDasharray="34 8 12 8"
          />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="2"
              x2="50"
              y2="6"
              stroke="color-mix(in oklab, var(--hud) 60%, transparent)"
              strokeWidth="0.6"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      </motion.div>

      {/* radial scanning line — thinking */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--core) 30%, transparent) 22deg, transparent 46deg)",
          maskImage: "radial-gradient(circle, transparent 44%, black 46%, black 100%)",
        }}
        animate={{
          rotate: 360,
          opacity: state === "thinking" ? 1 : 0,
        }}
        transition={{
          rotate: { duration: 2.4, repeat: Infinity, ease: "linear" },
          opacity: { duration: 0.6 },
        }}
      />

      <Spectrum amplitude={amplitude} active={audible} />

      <Orbiters speed={state === "thinking" ? 9 : state === "idle" ? 30 : 18} />

      {/* nucleus */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ scale: audible ? audioScale : 1 }}
      >
        <motion.div
          className="relative h-[140px] w-[140px] rounded-full"
          animate={{ scale: [1, 1.035, 1], filter: [`brightness(${p.brightness})`] }}
          transition={{
            scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 42% 36%, var(--core-hot) 0%, var(--core) 34%, color-mix(in oklab, var(--violet) 60%, transparent) 74%, transparent 100%)",
              boxShadow: "var(--glow-core)",
            }}
          />
          <motion.div
            className="absolute inset-[18%] rounded-full blur-[6px]"
            style={{
              background:
                "radial-gradient(circle at 55% 45%, var(--core-hot), transparent 72%)",
            }}
            animate={{ opacity: [0.7, 1, 0.7], rotate: 360 }}
            transition={{
              opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 24, repeat: Infinity, ease: "linear" },
            }}
          />
        </motion.div>
      </motion.div>

      {/* outer pulse waves */}
      {audible &&
        [0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: "color-mix(in oklab, var(--core) 40%, transparent)" }}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 2, ease: "easeOut" }}
          />
        ))}
    </div>
  );
}
