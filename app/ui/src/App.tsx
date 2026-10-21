import React, { memo, useState, useEffect, useRef } from 'react';
import {
  motion, AnimatePresence,
  useMotionValue, useMotionValueEvent,
  useSpring, useTransform,
  type MotionValue
} from 'framer-motion';
import { Mic, MicOff, Minus, Settings, Shield, X, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type JarvisState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: string; }
interface MemoryItem { key: string; value: string; updated_at: string; }
interface SystemStatus { cpu_percent: number; ram_percent: number; battery_percent: number | null; battery_plugged: boolean | null; }

/* ─────────────────────────────────────────
   CORE PRESET — exactly from source
───────────────────────────────────────── */
const PRESET: Record<JarvisState, { scale: number; glow: number; ringSpin: number; brightness: number }> = {
  IDLE:      { scale: 1,    glow: 0.42, ringSpin: 46, brightness: 0.85 },
  LISTENING: { scale: 1.06, glow: 0.78, ringSpin: 26, brightness: 1.06 },
  THINKING:  { scale: 1.02, glow: 0.62, ringSpin: 8,  brightness: 0.98 },
  SPEAKING:  { scale: 1.05, glow: 0.88, ringSpin: 18, brightness: 1.12 },
};

/* ─────────────────────────────────────────
   BACKDROP — faithful port
───────────────────────────────────────── */
function Backdrop({ intensity }: { intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0, dpr = 1;

    const pts = Array.from({ length: 44 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.00006,
      vy: -0.00004 - Math.random() * 0.00008,
      a: 0.12 + Math.random() * 0.3,
    }));

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x >  1.02) p.x = -0.02;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,228,255,${p.a})`;
        ctx.fill();
      }
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Ambient gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(115% 85% at 50% 45%, color-mix(in oklab, var(--core) 9%, transparent), transparent 60%), radial-gradient(80% 60% at 82% 108%, color-mix(in oklab, var(--violet) 10%, transparent), transparent 65%)',
      }} />
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.16,
        backgroundImage: 'linear-gradient(to right, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px)',
        backgroundSize: '88px 88px',
        maskImage: 'radial-gradient(90% 75% at 50% 45%, black, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(90% 75% at 50% 45%, black, transparent 78%)',
      }} />
      {/* Large faint background rings */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.13 }} aria-hidden>
        <defs>
          <radialGradient id="jv-ring-fade">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--hud) 55%, transparent)" />
          </radialGradient>
        </defs>
        {[26, 38, 49].map(r => (
          <circle key={r} cx="50%" cy="47%" r={`${r}%`} fill="none" stroke="url(#jv-ring-fade)" strokeWidth="1" strokeDasharray={r === 38 ? '2 10' : undefined} />
        ))}
      </svg>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* Slow scanning sweep */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, height: 160,
          background: 'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--core) 6%, transparent), transparent)',
        }}
        animate={{ y: ['-12%', '112%'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear', repeatDelay: 8 }}
      />
      {/* Gradient veil that reacts to intensity */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'var(--gradient-veil)' }}
        animate={{ opacity: 0.4 + intensity * 0.5 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   CIRCULAR SPECTRUM — faithful port
───────────────────────────────────────── */
const Spectrum = memo(function Spectrum({ amplitude, active }: { amplitude: MotionValue<number>; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const level = useRef(0);
  useMotionValueEvent(amplitude, 'change', v => { level.current = v as number; });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
        ctx.strokeStyle = `rgba(196,233,255,${0.18 + lvl * 0.6 * wobble})`;
        ctx.stroke();
      }
    };
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.canvas
      ref={ref}
      style={{ pointerEvents: 'none', position: 'absolute', left: '50%', top: '50%', width: 460, height: 460, x: '-50%', y: '-50%' }}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.94 }}
      transition={{ type: 'spring', stiffness: 90, damping: 20 }}
    />
  );
});

/* ─────────────────────────────────────────
   ORBITERS — faithful port
───────────────────────────────────────── */
const Orbiters = memo(function Orbiters({ speed }: { speed: number }) {
  const items = [
    { r: 118, size: 3,   dur: 1,   delay: 0,  opacity: 0.9 },
    { r: 152, size: 2,   dur: 1.5, delay: -4, opacity: 0.6 },
    { r: 186, size: 2.5, dur: 2.1, delay: -9, opacity: 0.5 },
    { r: 214, size: 1.8, dur: 2.8, delay: -2, opacity: 0.4 },
    { r: 132, size: 1.6, dur: 1.8, delay: -6, opacity: 0.5 },
  ];
  return (
    <>
      {items.map((o, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', left: '50%', top: '50%', height: 0, width: 0 }}
          animate={{ rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: speed * o.dur, repeat: Infinity, ease: 'linear', delay: o.delay }}
        >
          <div style={{
            position: 'absolute', borderRadius: '50%',
            width: o.size, height: o.size,
            transform: `translate(${o.r}px, 0)`,
            background: 'var(--core-hot)',
            opacity: o.opacity,
            boxShadow: 'var(--glow-soft)',
          }} />
        </motion.div>
      ))}
    </>
  );
});

/* ─────────────────────────────────────────
   AI CORE — faithful port
───────────────────────────────────────── */
function AICore({ state, amplitude, onClick }: { state: JarvisState; amplitude: MotionValue<number>; onClick: () => void }) {
  const p = PRESET[state];
  const raw = useMotionValue(0);
  useMotionValueEvent(amplitude, 'change', v => raw.set(v as number));
  const reactive = useSpring(raw, { stiffness: 220, damping: 26, mass: 0.4 });
  const audioScale = useTransform(reactive, [0, 1], [1, 1.14]);
  const audioGlow  = useTransform(reactive, [0, 1], [0, 0.5]);

  const audible = state === 'LISTENING' || state === 'SPEAKING';
  const orbiterSpeed = state === 'THINKING' ? 9 : state === 'IDLE' ? 30 : 18;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        /* Scale the 520px box to fit the available height (viewport minus header+footer ~220px) */
        width:  'clamp(320px, min(520px, calc(100vh - 240px)), 520px)',
        height: 'clamp(320px, min(520px, calc(100vh - 240px)), 520px)',
      }}

    >
      {/* Volumetric glow */}
      <motion.div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 420, height: 420,
        x: '-50%', y: '-50%',
        borderRadius: '50%',
        filter: 'blur(48px)',
        background: 'radial-gradient(circle, color-mix(in oklab, var(--core) 55%, transparent) 0%, color-mix(in oklab, var(--violet) 18%, transparent) 45%, transparent 70%)',
        opacity: audioGlow,
      }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 340, height: 340,
        x: '-50%', y: '-50%',
        borderRadius: '50%',
        filter: 'blur(32px)',
        background: 'radial-gradient(circle, color-mix(in oklab, var(--core) 42%, transparent), transparent 68%)',
      }}
        animate={{ opacity: p.glow, scale: p.scale }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      />

      {/* Thin orbital rings */}
      {[
        { s: 300, rot: 1,    dash: '1 14', w: 1 },
        { s: 366, rot: -1.6, dash: '3 22', w: 1 },
        { s: 430, rot: 2.4,  dash: '1 30', w: 1 },
      ].map((r, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: r.s, height: r.s,
            x: '-50%', y: '-50%',
            borderRadius: '50%',
          }}
          animate={{ rotate: r.rot > 0 ? 360 : -360, opacity: 0.3 + p.glow * 0.4 }}
          transition={{
            rotate: { duration: p.ringSpin * Math.abs(r.rot) * 2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8 },
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="49" fill="none"
              stroke="color-mix(in oklab, var(--hud) 70%, transparent)"
              strokeWidth={r.w / 2} strokeDasharray={r.dash}
            />
          </svg>
        </motion.div>
      ))}

      {/* Inner rotating ring with tick marks */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 250, height: 250,
          x: '-50%', y: '-50%',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: state === 'THINKING' ? 6 : 34, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <circle cx="50" cy="50" r="46" fill="none"
            stroke="color-mix(in oklab, var(--core) 55%, transparent)"
            strokeWidth="0.5" strokeDasharray="34 8 12 8"
          />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="50" y1="2" x2="50" y2="6"
              stroke="color-mix(in oklab, var(--hud) 60%, transparent)"
              strokeWidth="0.6" transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      </motion.div>

      {/* Scanning sweep (thinking only) */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 300, height: 300,
          x: '-50%', y: '-50%',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--core) 30%, transparent) 22deg, transparent 46deg)',
          maskImage: 'radial-gradient(circle, transparent 44%, black 46%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 44%, black 46%, black 100%)',
        }}
        animate={{ rotate: 360, opacity: state === 'THINKING' ? 1 : 0 }}
        transition={{
          rotate: { duration: 2.4, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 0.6 },
        }}
      />

      {/* Spectrum */}
      <Spectrum amplitude={amplitude} active={audible} />

      {/* Orbiters */}
      <Orbiters speed={orbiterSpeed} />

      {/* Nucleus */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          x: '-50%', y: '-50%',
          scale: audible ? audioScale : 1,
        }}
      >
        <motion.div
          style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%' }}
          animate={{ scale: [1, 1.035, 1], filter: `brightness(${p.brightness})` }}
          transition={{ scale: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 36%, var(--core-hot) 0%, var(--core) 34%, color-mix(in oklab, var(--violet) 60%, transparent) 74%, transparent 100%)',
            boxShadow: 'var(--glow-core)',
          }} />
          <motion.div
            style={{
              position: 'absolute', inset: '18%', borderRadius: '50%', filter: 'blur(6px)',
              background: 'radial-gradient(circle at 55% 45%, var(--core-hot), transparent 72%)',
            }}
            animate={{ opacity: [0.7, 1, 0.7], rotate: 360 }}
            transition={{
              opacity: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              rotate:  { duration: 24, repeat: Infinity, ease: 'linear' },
            }}
          />
        </motion.div>
      </motion.div>

      {/* Outer pulse waves (listening / speaking only) */}
      {audible && [0, 1].map(i => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 200, height: 200,
            x: '-50%', y: '-50%',
            borderRadius: '50%',
            border: '1px solid color-mix(in oklab, var(--core) 40%, transparent)',
          }}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 2, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   CLOCK
───────────────────────────────────────── */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.06em', color: 'var(--hud)', fontVariantNumeric: 'tabular-nums' }}>
        {now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>
        {now ? now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }) : ''}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   ICON BUTTON — exact from TopBar
───────────────────────────────────────── */
function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <motion.button type="button" aria-label={label} onClick={onClick}
      whileHover={{ scale: 1.06, opacity: 1 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      style={{
        borderRadius: 6, padding: '6px', color: 'var(--muted-foreground)', opacity: 0.8,
        background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s, color 0.18s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)'; }}
    >
      {children}
    </motion.button>
  );
}

/* ─────────────────────────────────────────
   CONTEXT PANEL — exact from source
───────────────────────────────────────── */
const CTX_SECTIONS = ['conversation', 'memory', 'tasks', 'tools'] as const;
type CtxSection = typeof CTX_SECTIONS[number];

function ContextPanel({ history, memories, alwaysListen }: { history: ChatMessage[]; memories: MemoryItem[]; alwaysListen: boolean }) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<CtxSection>('conversation');

  const content: Record<CtxSection, string[]> = {
    conversation: [
      `Session 04 · ${history.filter(m => m.role === 'user').length} exchanges`,
      `Context window ${Math.min(98, history.length * 4)}% used`,
      alwaysListen ? 'Always-listen active' : 'Voice profile locked',
    ],
    memory: memories.length ? memories.slice(0, 5).map(m => `${m.key}: ${m.value}`) : ['No memories stored.'],
    tasks: ['Deploy JARVIS backend · done', 'API key configured · done', 'Holographic UI rebuild · active', 'Obsidian memory sync · live'],
    tools: ['System control', 'File search', 'Calendar', 'Code runner', 'Obsidian vault'],
  };

  return (
    <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside key="ctx"
              initial={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 210, damping: 26, mass: 0.7 }}
              style={{
                background: 'var(--glass)',
                backdropFilter: 'blur(22px) saturate(130%)',
                WebkitBackdropFilter: 'blur(22px) saturate(130%)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-glass)',
                width: 240, borderRadius: 12, padding: 16,
              }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)', marginBottom: 12 }}>context</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {CTX_SECTIONS.map(s => (
                  <motion.button key={s} type="button" onClick={() => setActive(s)}
                    whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderRadius: 6, padding: '6px 8px', textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em',
                      background: active === s ? 'var(--secondary)' : 'transparent',
                      color: active === s ? 'var(--primary)' : 'var(--muted-foreground)',
                      border: 'none', cursor: 'pointer', transition: 'color 0.18s, background 0.18s',
                    }}
                  >
                    {s}
                    {active === s && (
                      <motion.span layoutId="ctx-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--core)', boxShadow: 'var(--glow-soft)', flexShrink: 0 }} />
                    )}
                  </motion.button>
                ))}
              </nav>
              <div style={{ marginTop: 16, height: 1, background: 'var(--border)' }} />
              <AnimatePresence mode="wait">
                <motion.ul key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  style={{ marginTop: 12, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {content[active].map(line => (
                    <li key={line} style={{ fontSize: 11, lineHeight: 1.625, color: 'var(--muted-foreground)' }}>{line}</li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </motion.aside>
          )}
        </AnimatePresence>
        <motion.button type="button"
          aria-label={open ? 'Collapse context panel' : 'Expand context panel'}
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--glass)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-glass)',
            borderRadius: 6, padding: 4, color: 'var(--muted-foreground)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </motion.button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SYSTEM PANEL — exact from source
───────────────────────────────────────── */
function Dial({ label, value }: { label: string; value: number }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r={r} fill="none" stroke="color-mix(in oklab, var(--hud) 14%, transparent)" strokeWidth="1.4" />
          <motion.circle cx="18" cy="18" r={r} fill="none" stroke="var(--core)" strokeWidth="1.4" strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>{label}</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', color: 'var(--hud)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}%</p>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--hud)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}%</span>
      </div>
      <div style={{ marginTop: 6, height: 1, width: '100%', background: 'var(--border)', position: 'relative' }}>
        <motion.div
          style={{ height: 1, background: 'var(--core)', boxShadow: 'var(--glow-soft)', position: 'absolute', left: 0, top: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        />
      </div>
    </div>
  );
}

function SystemPanel({ sys, wsConnected }: { sys: SystemStatus; wsConnected: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button type="button"
          aria-label={open ? 'Collapse system panel' : 'Expand system panel'}
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--glass)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-glass)',
            borderRadius: 6, padding: 4, color: 'var(--muted-foreground)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside key="sys"
              initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 210, damping: 26, mass: 0.7 }}
              style={{
                background: 'var(--glass)',
                backdropFilter: 'blur(22px) saturate(130%)',
                WebkitBackdropFilter: 'blur(22px) saturate(130%)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-glass)',
                width: 224, borderRadius: 12, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>system</p>
              <Dial label="cpu" value={sys.cpu_percent} />
              <Dial label="ram" value={sys.ram_percent} />
              <Bar label="gpu" value={20 + sys.cpu_percent % 35} />
              <Bar label="battery" value={sys.battery_percent ?? 89} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>network</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.span
                    style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--core)', display: 'inline-block' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hud)' }}>
                    {wsConnected ? '• online' : '• offline'}
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

/* ─────────────────────────────────────────
   MINI WAVE — exact from CommandInput
───────────────────────────────────────── */
function MiniWave({ amplitude, active }: { amplitude: MotionValue<number>; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lvl = useRef(0);
  useMotionValueEvent(amplitude, 'change', v => { lvl.current = v as number; });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width  = 88 * dpr;
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
        ctx.fillStyle = `rgba(196,233,255,${0.25 + lvl.current * 0.6})`;
        ctx.fillRect(x, (h - bh) / 2, 1.4 * dpr, bh);
      }
    };
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.canvas ref={ref} style={{ width: 88, height: 22 }}
      animate={{ opacity: active ? 1 : 0.25 }}
      transition={{ duration: 0.4 }}
    />
  );
}

/* ─────────────────────────────────────────
   COMMAND INPUT — exact from source
───────────────────────────────────────── */
const PLACEHOLDER: Record<JarvisState, string> = {
  IDLE: 'Speak to JARVIS...', LISTENING: 'Listening...', THINKING: 'Thinking...', SPEAKING: 'Speaking...',
};

function CommandInput({ state, amplitude, micActive, onToggleMic, onSubmit }: {
  state: JarvisState; amplitude: MotionValue<number>;
  micActive: boolean; onToggleMic: () => void; onSubmit: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  const active = state === 'LISTENING' || state === 'SPEAKING';

  return (
    <motion.form onSubmit={e => { e.preventDefault(); if (value.trim()) { onSubmit(value); setValue(''); } }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
      style={{
        position: 'relative', zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 12,
        width: 'min(620px, 86vw)',
        borderRadius: 9999, padding: '10px 12px',
        background: 'var(--glass)',
        backdropFilter: 'blur(22px) saturate(130%)',
        WebkitBackdropFilter: 'blur(22px) saturate(130%)',
        border: '1px solid var(--border)',
        boxShadow: active ? 'var(--glow-core), var(--shadow-glass)' : 'var(--shadow-glass)',
      }}
    >
      <motion.button type="button" aria-label="Toggle voice capture" onClick={onToggleMic}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: '1px solid var(--border)',
          background: micActive ? 'var(--secondary)' : 'transparent',
          color: micActive ? 'var(--primary)' : 'var(--muted-foreground)',
          boxShadow: micActive ? 'var(--glow-soft)' : 'none',
          cursor: 'pointer', transition: 'all 0.18s',
        }}
      >
        <Mic size={15} />
      </motion.button>

      <MiniWave amplitude={amplitude} active={active} />

      <input value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[state]}
        aria-label="Command JARVIS"
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em',
          color: 'var(--foreground)',
        }}
      />

      <motion.button type="submit" aria-label="Send command"
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: 'var(--core)', color: 'var(--primary-foreground)',
          boxShadow: 'var(--glow-soft)', border: 'none', cursor: 'pointer',
        }}
      >
        <ArrowUp size={15} />
      </motion.button>
    </motion.form>
  );
}

/* ─────────────────────────────────────────
   TRANSCRIPT — below orb
───────────────────────────────────────── */
function Transcript({ latestQuery, activeSpeech }: { latestQuery: string; activeSpeech: string }) {
  if (!latestQuery && !activeSpeech) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(560px, 86vw)', pointerEvents: 'none' }}>
      <AnimatePresence initial={false}>
        {latestQuery && (
          <motion.div key="q" style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.5 }}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hud-dim)', width: 48, flexShrink: 0, paddingTop: 3 }}>user</span>
            <p style={{ color: 'var(--muted-foreground)', flex: 1 }}>{latestQuery}</p>
          </motion.div>
        )}
        {activeSpeech && (
          <motion.div key="r" style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.5 }}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--core)', width: 48, flexShrink: 0, paddingTop: 3 }}>jarvis</span>
            <p style={{ color: 'var(--foreground)', flex: 1 }}>{activeSpeech}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN APP
───────────────────────────────────────── */
export default function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [state, setState] = useState<JarvisState>('IDLE');
  const [alwaysListen, setAlwaysListen] = useState(true);
  const [sys, setSys] = useState<SystemStatus>({ cpu_percent: 24, ram_percent: 51, battery_percent: 89, battery_plugged: false });
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeSpeech, setActiveSpeech] = useState('');
  const [latestQuery, setLatestQuery] = useState('');

  const ws = useRef<WebSocket | null>(null);
  const amplitude = useMotionValue(0);
  const micRef = useRef<{ stream: MediaStream; ctx: AudioContext; analyser: AnalyserNode } | null>(null);

  const stopMic = () => {
    if (micRef.current) {
      micRef.current.stream.getTracks().forEach(t => t.stop());
      micRef.current.ctx.close();
      micRef.current = null;
    }
  };
  const startMic = async () => {
    if (micRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.7;
      ctx.createMediaStreamSource(stream).connect(analyser);
      micRef.current = { stream, ctx, analyser };
    } catch { /* mic denied */ }
  };

  const connectWS = () => {
    ws.current = new WebSocket('ws://localhost:8000/ws');
    ws.current.onopen  = () => setWsConnected(true);
    ws.current.onclose = () => { setWsConnected(false); setTimeout(connectWS, 3000); };
    ws.current.onmessage = e => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'state':
          setState(msg.value?.toUpperCase() as JarvisState);
          if (msg.value === 'listening') startMic();
          else if (msg.value === 'idle') stopMic();
          break;
        case 'always_listen': setAlwaysListen(msg.value); break;
        case 'transcript':
          setHistory(p => [...p, { role: 'user', content: msg.value, timestamp: new Date().toISOString() }]);
          setLatestQuery(msg.value); setActiveSpeech('');
          break;
        case 'response':
          setHistory(p => [...p, { role: 'assistant', content: msg.value, timestamp: new Date().toISOString() }]);
          setActiveSpeech(msg.value);
          fetchData();
          break;
        case 'system_status': setSys(msg.value); break;
      }
    };
  };

  const fetchData = async () => {
    try {
      const [hr, mr] = await Promise.all([fetch('http://localhost:8000/api/history'), fetch('http://localhost:8000/api/memories')]);
      if (hr.ok) setHistory(await hr.json());
      if (mr.ok) setMemories(await mr.json());
    } catch { /* offline */ }
  };

  useEffect(() => {
    connectWS(); fetchData();
    return () => { ws.current?.close(); stopMic(); };
  }, []);

  // Amplitude animation
  useEffect(() => {
    const freqs = new Uint8Array(64);
    let raf: number;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (state === 'LISTENING' && micRef.current) {
        micRef.current.analyser.getByteFrequencyData(freqs);
        let s = 0; for (let i = 0; i < 24; i++) s += freqs[i]!;
        amplitude.set(amplitude.get() * 0.6 + Math.min(1, s / 24 / 120) * 0.4);
      } else if (state === 'SPEAKING') {
        const v = 0.45 + 0.3 * Math.sin(ts / 90) * Math.sin(ts / 210) + 0.18 * Math.sin(ts / 47) + 0.05 * Math.random();
        amplitude.set(Math.max(0.08, Math.min(1, Math.abs(v))));
      } else if (state === 'THINKING') {
        amplitude.set(0.20 + 0.06 * Math.sin(ts / 300));
      } else {
        amplitude.set(amplitude.get() * 0.88);
      }
    };
    tick(0);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const send = (type: string, value?: unknown) =>
    ws.current?.readyState === 1 && ws.current.send(JSON.stringify({ type, ...(value !== undefined ? { value } : {}) }));

  const intensity = state === 'IDLE' ? 0 : state === 'THINKING' ? 0.5 : 0.85;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', userSelect: 'none', background: 'var(--background)' }}>
      <Backdrop intensity={intensity} />

      {/* TOP BAR */}
      <header style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, letterSpacing: '0.45em', color: 'var(--foreground)' }}>JARVIS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.span
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--core)', boxShadow: 'var(--glow-soft)', display: 'inline-block' }}
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>online</span>
          </div>
        </div>

        <Clock />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>{state.toLowerCase()}</span>
          <IconButton label="Toggle microphone" onClick={() => send('toggle_always_listen')}>
            {alwaysListen ? <Mic size={14} /> : <MicOff size={14} />}
          </IconButton>
          <IconButton label="System integrity"><Shield size={14} /></IconButton>
          <IconButton label="Settings"><Settings size={14} /></IconButton>
          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
          <IconButton label="Minimise"><Minus size={14} /></IconButton>
          <IconButton label="Close"><X size={14} /></IconButton>
        </div>
      </header>

      {/* CONTEXT PANEL */}
      <ContextPanel history={history} memories={memories} alwaysListen={alwaysListen} />

      {/* SYSTEM PANEL */}
      <SystemPanel sys={sys} wsConnected={wsConnected} />

      {/* CENTER — dynamically centered in remaining vertical space */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <AICore
            state={state}
            amplitude={amplitude}
            onClick={() => { if (state === 'IDLE' && wsConnected) send('trigger_listen'); }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'var(--hud-dim)' }}>
            <motion.span
              style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--core)', boxShadow: 'var(--glow-soft)', display: 'inline-block' }}
              animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
              transition={{ duration: state === 'IDLE' ? 3.5 : 1.1, repeat: Infinity }}
            />
            {state === 'IDLE' ? 'standby' : state.toLowerCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--hud-dim)', opacity: 0.45 }}>
            ctrl + space &middot; say &ldquo;hey jarvis&rdquo;
          </div>
        </div>
      </main>

      {/* FOOTER — transcript + command bar */}
      <footer style={{ position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 24px 28px' }}>

        <Transcript latestQuery={latestQuery} activeSpeech={activeSpeech} />
        <CommandInput
          state={state}
          amplitude={amplitude}
          micActive={alwaysListen}
          onToggleMic={() => send('toggle_always_listen')}
          onSubmit={text => { send('query', text); setLatestQuery(text); setActiveSpeech(''); }}
        />
      </footer>
    </div>
  );
}
