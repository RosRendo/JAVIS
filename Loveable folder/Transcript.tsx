import { AnimatePresence, motion } from "motion/react";
import type { JarvisMessage } from "./types";

export function Transcript({ messages }: { messages: JarvisMessage[] }) {
  const visible = messages.slice(-3);
  return (
    <div className="pointer-events-none relative z-10 flex w-[min(620px,86vw)] flex-col gap-3">
      <AnimatePresence initial={false}>
        {visible.map((m, i) => {
          const depth = visible.length - 1 - i;
          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1 - depth * 0.32, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              className="flex gap-3"
            >
              <span
                className="hud-label w-14 shrink-0 pt-0.5"
                style={m.role === "jarvis" ? { color: "var(--hud)" } : {}}
              >
                {m.role === "user" ? "user" : "jarvis"}
              </span>
              <p
                className={`text-sm leading-relaxed ${
                  m.role === "jarvis" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {m.text}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
