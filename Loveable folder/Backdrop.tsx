import { useEffect, useRef } from "react";
import { motion } from "motion/react";

/** Ambient layer: faint grid, drifting light points, one slow scanning sweep. */
export function Backdrop({ intensity }: { intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let dpr = 1;

    const pts = Array.from({ length: 44 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.00006,
      vy: -0.00004 - Math.random() * 0.00008,
      a: 0.12 + Math.random() * 0.3,
    }));

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190, 228, 255, ${p.a})`;
        ctx.fill();
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 85% at 50% 45%, color-mix(in oklab, var(--core) 9%, transparent), transparent 60%), radial-gradient(80% 60% at 82% 108%, color-mix(in oklab, var(--violet) 10%, transparent), transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          maskImage: "radial-gradient(90% 75% at 50% 45%, black, transparent 78%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.13]" aria-hidden>
        <defs>
          <radialGradient id="jv-ring-fade">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--hud) 55%, transparent)" />
          </radialGradient>
        </defs>
        {[26, 38, 49].map((r) => (
          <circle
            key={r}
            cx="50%"
            cy="47%"
            r={`${r}%`}
            fill="none"
            stroke="url(#jv-ring-fade)"
            strokeWidth="1"
            strokeDasharray={r === 38 ? "2 10" : undefined}
          />
        ))}
      </svg>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <motion.div
        className="absolute inset-x-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--core) 6%, transparent), transparent)",
        }}
        animate={{ y: ["-12%", "112%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear", repeatDelay: 8 }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: "var(--gradient-veil)" }}
        animate={{ opacity: 0.4 + intensity * 0.5 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </div>
  );
}
