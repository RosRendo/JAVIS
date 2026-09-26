import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Minus, Settings, Shield, X } from "lucide-react";
import type { JarvisState } from "./types";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-baseline gap-2">
      <span className="hud-value text-sm">
        {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
      </span>
      <span className="hud-label">
        {now ? now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" }) : ""}
      </span>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.06, opacity: 1 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      className="rounded-md p-1.5 text-muted-foreground opacity-80 transition-colors hover:bg-secondary hover:text-primary"
    >
      {children}
    </motion.button>
  );
}

export function TopBar({
  state,
  micActive,
  onToggleMic,
}: {
  state: JarvisState;
  micActive: boolean;
  onToggleMic: () => void;
}) {
  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-sm font-medium tracking-[0.45em] text-foreground">
          JARVIS
        </h1>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--core)", boxShadow: "var(--glow-soft)" }}
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="hud-label">online</span>
        </div>
      </div>

      <Clock />

      <div className="flex items-center gap-3">
        <span className="hud-label hidden sm:inline">{state}</span>
        <IconButton label="Toggle microphone" onClick={onToggleMic}>
          {micActive ? <Mic size={14} /> : <MicOff size={14} />}
        </IconButton>
        <IconButton label="System integrity">
          <Shield size={14} />
        </IconButton>
        <IconButton label="Settings">
          <Settings size={14} />
        </IconButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <IconButton label="Minimise to tray">
          <Minus size={14} />
        </IconButton>
        <IconButton label="Close">
          <X size={14} />
        </IconButton>
      </div>
    </header>
  );
}
