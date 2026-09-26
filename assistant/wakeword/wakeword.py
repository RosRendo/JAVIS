import os
import time
import threading

HAS_OWW = False
try:
    import openwakeword
    from openwakeword.model import Model
    import pyaudio
    import numpy as np
    HAS_OWW = True
except ImportError:
    pass

HAS_SR = False
try:
    import speech_recognition as sr
    HAS_SR = True
except ImportError:
    pass

class WakeWordListener:
    def __init__(self, wake_word="hey jarvis", on_detect_callback=None, always_listen=False, state_check_callback=None):
        self.wake_word = wake_word.lower()
        self.on_detect = on_detect_callback
        self.always_listen = always_listen
        self.state_check = state_check_callback
        self.running = False
        self._thread = None
        
    def start(self):
        if self.running:
            return
        self.running = True
        # If always listening is enabled, we force the fallback transcriber since openwakeword is only a binary detector
        if HAS_OWW and not self.always_listen:
            self._thread = threading.Thread(target=self._run_openwakeword, daemon=True)
        else:
            self._thread = threading.Thread(target=self._run_fallback, daemon=True)
        self._thread.start()
        
    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            
    def _run_openwakeword(self):
        print("Starting openWakeWord listener...")
        CHUNK = 1280
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000
        
        p = pyaudio.PyAudio()
        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        frames_per_buffer=CHUNK)
                        
        try:
            oww_model = Model(wakeword_models=["hey_jarvis"])
        except Exception as e:
            print(f"Error loading openwakeword model: {e}. Falling back to default models.")
            oww_model = Model()
            
        print("openWakeWord listener running. Speak wake word to activate.")
        
        while self.running:
            try:
                # Skip detection if JARVIS is currently busy thinking or speaking
                if self.state_check and self.state_check() != "IDLE":
                    time.sleep(0.2)
                    continue

                data = stream.read(CHUNK, exception_on_overflow=False)
                audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                prediction = oww_model.predict(audio_data)
                
                for mdl in oww_model.prediction_buffer.keys():
                    scores = list(oww_model.prediction_buffer[mdl])
                    if scores and scores[-1] > 0.5:
                        print(f"Wake word detected: {mdl} (score: {scores[-1]})")
                        if self.on_detect:
                            self.on_detect()
                            time.sleep(2.0)
                            oww_model.reset()
            except Exception as e:
                print(f"Error in openwakeword stream: {e}")
                time.sleep(0.5)
                
        stream.stop_stream()
        stream.close()
        p.terminate()

    def _run_fallback(self):
        print(f"Background listener running (always_listen={self.always_listen})...")
        if not HAS_SR:
            print("SpeechRecognition not installed. Fallback wake word listener cannot start.")
            return
            
        r = sr.Recognizer()
        mic = sr.Microphone()
        
        with mic as source:
            r.adjust_for_ambient_noise(source, duration=0.5)
            
        print("Fallback listener active. Ready for input.")
        
        def callback(recognizer, audio):
            if not self.running:
                return
            # CRITICAL SAFETY: Ignore all sound inputs if JARVIS is currently thinking or speaking!
            # This prevents JARVIS from listening to his own speech synthesis.
            if self.state_check and self.state_check() != "IDLE":
                return

            try:
                text = recognizer.recognize_google(audio, language='en-US').strip()
                if not text:
                    return
                
                print(f"Ambient check heard: '{text}'")
                text_lower = text.lower()
                
                if self.always_listen:
                    print(f"Always-Listen triggering query: {text}")
                    if self.on_detect:
                        self.on_detect(text)
                elif self.wake_word in text_lower or "jarvis" in text_lower:
                    print(f"Wake word phrase matched: {text}")
                    if self.on_detect:
                        self.on_detect()
            except sr.UnknownValueError:
                pass
            except Exception as e:
                print(f"Error in fallback wake recognizer: {e}")
                
        # Start listening in background
        stop_listening = r.listen_in_background(mic, callback, phrase_time_limit=4.0)
        
        while self.running:
            time.sleep(0.5)
            
        stop_listening(wait_for_stop=False)
        print("Fallback wake-word listener stopped.")
        
        while self.running:
            time.sleep(0.5)
            
        stop_listening(wait_for_stop=False)
        print("Fallback wake-word listener stopped.")
