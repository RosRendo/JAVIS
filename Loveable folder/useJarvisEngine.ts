import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import type { JarvisMessage, JarvisState, SystemVitals } from "./types";

const WS_URL = import.meta.env["VITE_JARVIS_WS"] as string | undefined;

const CANNED: Array<[RegExp, string]> = [
  [/vs ?code|editor/i, "Opening Visual Studio Code."],
  [/weather/i, "Clear skies, 21 degrees. Wind is negligible."],
  [/time/i, "Local time synchronised. Everything is on schedule."],
  [/music|play/i, "Resuming your focus playlist at low volume."],
  [/status|system/i, "All subsystems nominal. Thermals within range."],
];

function reply(input: string) {
  for (const [re, out] of CANNED) if (re.test(input)) return out;
  return `Understood. Working on "${input.replace(/\.$/, "")}" now.`;
}

let seq = 0;
const uid = () => `m${++seq}`;

/**
 * Central JARVIS runtime: one state machine + one amplitude signal that every
 * visual layer subscribes to. Amplitude lives in a MotionValue so audio-reactive
 * motion never triggers React re-renders.
 */
export function useJarvisEngine() {
  const [state, setState] = useState<JarvisState>("idle");
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [flash, setFlash] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const amplitude = useMotionValue(0);
  const stateRef = useRef<JarvisState>("idle");
  stateRef.current = state;

  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; analyser: AnalyserNode } | null>(
    null,
  );
  const rafRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const push = useCallback((role: JarvisMessage["role"], text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, text }].slice(-8));
  }, []);

  /* ---------- amplitude loop (mic + synthetic speech envelope) ---------- */
  useEffect(() => {
    let last = 0;
    const buf = new Uint8Array(64);
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (t - last < 33) return; // ~30Hz sampling, motion interpolates the rest
      last = t;
      const s = stateRef.current;
      const a = audioRef.current;
      if (s === "listening" && a) {
        a.analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < 24; i++) sum += buf[i]!;
        const level = Math.min(1, sum / 24 / 120);
        amplitude.set(amplitude.get() * 0.6 + level * 0.4);
      } else if (s === "speaking") {
        const v =
          0.45 +
          0.3 * Math.sin(t / 90) * Math.sin(t / 210) +
          0.2 * Math.sin(t / 47) +
          0.05 * Math.random();
        amplitude.set(Math.max(0.08, Math.min(1, Math.abs(v))));
      } else if (s === "thinking") {
        amplitude.set(0.22 + 0.06 * Math.sin(t / 300));
      } else {
        amplitude.set(amplitude.get() * 0.9);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [amplitude]);

  const closeMic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.stream.getTracks().forEach((t) => t.stop());
    void a.ctx.close();
    audioRef.current = null;
    setMicActive(false);
  }, []);

  const openMic = useCallback(async () => {
    if (audioRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioRef.current = { ctx, stream, analyser };
      setMicActive(true);
      return true;
    } catch {
      setError("Microphone unavailable — text input still active.");
      setTimeout(() => setError(null), 4000);
      return false;
    }
  }, []);

  /* ---------- speech ---------- */
  const speak = useCallback((text: string) => {
    setState("speaking");
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) {
      setTimeout(() => setState("idle"), 1600);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 0.9;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    synth.cancel();
    synth.speak(u);
    // safety net if the engine never fires onend
    setTimeout(() => setState((s) => (s === "speaking" && !synth.speaking ? "idle" : s)), 12000);
  }, []);

  /* ---------- optional FastAPI websocket bridge ---------- */
  useEffect(() => {
    if (!WS_URL) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      return;
    }
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          type?: string;
          state?: JarvisState;
          text?: string;
        };
        if (msg.type === "state" && msg.state) setState(msg.state);
        if (msg.type === "transcript" && msg.text) push("user", msg.text);
        if (msg.type === "response" && msg.text) {
          push("jarvis", msg.text);
          speak(msg.text);
        }
        if (msg.type === "wake") void wake();
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => {
      wsRef.current = null;
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [push, speak]);

  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      push("user", text);
      setState("thinking");
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "command", text }));
        return;
      }
      const answer = reply(text);
      setTimeout(
        () => {
          push("jarvis", answer);
          setFlash((f) => f + 1);
          speak(answer);
        },
        1100 + Math.random() * 700,
      );
    },
    [push, speak],
  );

  const wake = useCallback(async () => {
    setFlash((f) => f + 1);
    await openMic();
    setState("listening");
  }, [openMic]);

  const stopListening = useCallback(() => {
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  const toggleMic = useCallback(() => {
    if (stateRef.current === "listening") {
      stopListening();
      closeMic();
    } else {
      void wake();
    }
  }, [closeMic, stopListening, wake]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleMic();
      }
      if (e.key === "Escape") stopListening();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stopListening, toggleMic]);

  useEffect(() => closeMic, [closeMic]);

  return { state, messages, amplitude, micActive, flash, error, submit, toggleMic, wake };
}

/** Smoothly drifting fake telemetry — replaced by backend frames when present. */
export function useVitals(): SystemVitals {
  const [v, setV] = useState<SystemVitals>({
    cpu: 24,
    ram: 51,
    gpu: 12,
    battery: 89,
    network: "online",
  });
  useEffect(() => {
    const id = setInterval(() => {
      setV((p) => ({
        cpu: clamp(p.cpu + rand(9)),
        ram: clamp(p.ram + rand(4)),
        gpu: clamp(p.gpu + rand(11)),
        battery: clamp(p.battery - Math.random() * 0.3),
        network: "online",
      }));
    }, 2600);
    return () => clearInterval(id);
  }, []);
  return v;
}

const rand = (n: number) => (Math.random() - 0.5) * n * 2;
const clamp = (n: number) => Math.max(2, Math.min(99, Math.round(n)));

export type Amplitude = MotionValue<number>;

export function useStateLabel(state: JarvisState) {
  return useMemo(
    () =>
      ({ idle: "STANDBY", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING" })[
        state
      ],
    [state],
  );
}
