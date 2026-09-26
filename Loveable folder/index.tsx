import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { AICore } from "@/components/jarvis/AICore";
import { Backdrop } from "@/components/jarvis/Backdrop";
import { CommandInput } from "@/components/jarvis/CommandInput";
import { ContextPanel } from "@/components/jarvis/ContextPanel";
import { SystemPanel } from "@/components/jarvis/SystemPanel";
import { TopBar } from "@/components/jarvis/TopBar";
import { Transcript } from "@/components/jarvis/Transcript";
import { useJarvisEngine, useStateLabel, useVitals } from "@/components/jarvis/useJarvisEngine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS — Premium Futuristic AI Desktop Interface" },
      {
        name: "description",
        content:
          "JARVIS is a cinematic desktop AI assistant interface: a living voice-reactive AI core with idle, listening, thinking and speaking states.",
      },
      { property: "og:title", content: "JARVIS — Futuristic AI Desktop Interface" },
      {
        property: "og:description",
        content:
          "A voice-driven AI operating system interface with a living energy core, holographic HUD panels and cinematic motion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jarvis,
});

const INTENSITY = { idle: 0.15, listening: 0.7, thinking: 0.45, speaking: 0.85 } as const;

function Jarvis() {
  const { state, messages, amplitude, micActive, flash, error, submit, toggleMic } =
    useJarvisEngine();
  const vitals = useVitals();
  const label = useStateLabel(state);

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Backdrop intensity={INTENSITY[state]} />

      {/* wake-word / confirmation illumination pulse */}
      <AnimatePresence>
        <motion.div
          key={flash}
          className="pointer-events-none absolute inset-0 z-30"
          style={{ background: "var(--gradient-veil)" }}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </AnimatePresence>

      <TopBar state={state} micActive={micActive} onToggleMic={toggleMic} />
      <ContextPanel />
      <SystemPanel vitals={vitals} />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <AICore state={state} amplitude={amplitude} />

        <div className="mt-2 flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <motion.span
                className="h-1 w-1 rounded-full"
                style={{ background: "var(--core)", boxShadow: "var(--glow-soft)" }}
                animate={{ opacity: [1, 0.25, 1], scale: [1, 0.7, 1] }}
                transition={{
                  duration: state === "idle" ? 3.4 : 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.42em] text-foreground/85">
                {label}
              </span>
            </motion.div>
          </AnimatePresence>
          <p className="hud-label">ctrl + space · say “hey jarvis”</p>
        </div>
      </section>

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 pb-8">
        <Transcript messages={messages} />
        <CommandInput
          state={state}
          amplitude={amplitude}
          micActive={micActive}
          onToggleMic={toggleMic}
          onSubmit={submit}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--warn)" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
