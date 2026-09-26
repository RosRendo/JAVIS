import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SECTIONS = ["conversation", "memory", "tasks", "tools"] as const;
type Section = (typeof SECTIONS)[number];

const CONTENT: Record<Section, string[]> = {
  conversation: ["Session 04 · 12 exchanges", "Context window 68% used", "Voice profile locked"],
  memory: ["Prefers dark rooms after 21:00", "Standup every weekday 09:15", "Calls mother on Sundays"],
  tasks: ["Deploy staging build", "Review pull request #482", "Renew domain in 6 days"],
  tools: ["System control", "File search", "Calendar", "Code runner"],
};

function panelTransition(open: boolean) {
  return { type: "spring" as const, stiffness: 210, damping: 26, mass: 0.7, delay: open ? 0 : 0 };
}

export function ContextPanel() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<Section>("conversation");

  return (
    <div className="absolute left-6 top-1/2 z-20 -translate-y-1/2">
      <div className="flex items-center gap-2">
        <AnimatePresence initial={false}>
          {open && (
            <motion.aside
              key="context"
              initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -24, filter: "blur(8px)" }}
              transition={panelTransition(open)}
              className="glass-panel w-60 rounded-xl p-4"
            >
              <p className="hud-label mb-3">context</p>
              <nav className="flex flex-col gap-0.5">
                {SECTIONS.map((s) => (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => setActive(s)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex items-center justify-between rounded-md px-2 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                      active === s
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                    {active === s && (
                      <motion.span
                        layoutId="ctx-dot"
                        className="h-1 w-1 rounded-full"
                        style={{ background: "var(--core)", boxShadow: "var(--glow-soft)" }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
              <div className="mt-4 h-px w-full bg-border" />
              <AnimatePresence mode="wait">
                <motion.ul
                  key={active}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="mt-3 space-y-2"
                >
                  {CONTENT[active].map((line) => (
                    <li key={line} className="text-[11px] leading-relaxed text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </motion.aside>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label={open ? "Collapse context panel" : "Expand context panel"}
          onClick={() => setOpen((o) => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          className="glass-panel rounded-md p-1 text-muted-foreground hover:text-primary"
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </motion.button>
      </div>
    </div>
  );
}
