import os
import json
import tempfile
import wave

# Dynamically import speech libraries to allow graceful fallbacks
HAS_SR = False
try:
    import speech_recognition as sr
    HAS_SR = True
except ImportError:
    pass

HAS_WHISPER = False
try:
    from faster_whisper import WhisperModel
    HAS_WHISPER = True
except ImportError:
    pass

HAS_PYTTSX3 = False
try:
    import pyttsx3
    HAS_PYTTSX3 = True
except ImportError:
    pass

# Edge TTS fallback
HAS_EDGE_TTS = False
try:
    import edge_tts
    import asyncio
    HAS_EDGE_TTS = True
except ImportError:
    pass

class SpeechPipeline:
    def __init__(self, config_path="config/settings.json"):
        self.config = self._load_config(config_path)
        
        # Initialize TTS Engine
        self.tts_provider = self.config.get("text_to_speech", {}).get("provider", "pyttsx3")
        self.stt_provider = self.config.get("speech_to_text", {}).get("provider", "google")
        
        self.whisper_model = None
        self.tts_engine = None
        
        self._init_stt()
        self._init_tts()
        
    def _load_config(self, path):
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _init_stt(self):
        if self.stt_provider == "faster-whisper" and HAS_WHISPER:
            print("Initializing faster-whisper model...")
            try:
                model_size = self.config.get("speech_to_text", {}).get("model_size", "base")
                # Run on CPU by default, float16 or int8
                self.whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
                print(f"faster-whisper model ({model_size}) loaded successfully.")
            except Exception as e:
                print(f"Error loading faster-whisper: {e}. Falling back to Google STT.")
                self.stt_provider = "google"
        elif self.stt_provider == "faster-whisper" and not HAS_WHISPER:
            print("faster-whisper not installed. Falling back to Google STT.")
            self.stt_provider = "google"

    def _init_tts(self):
        # SAPI voice doesn't need static main-thread initialization.
        # We dispatch it dynamically on demand when speaking to prevent background thread lockups.
        pass

    def speak(self, text: str):
        print(f"Jarvis: {text}")
        
        # Try Edge-TTS first if configured and available
        if self.tts_provider == "edge-tts" and HAS_EDGE_TTS:
            try:
                asyncio.run(self._speak_edge_tts(text))
                return
            except Exception as e:
                print(f"Edge-TTS failed: {e}. Falling back to SAPI.")
                
        # Direct Windows SAPI SpVoice (replaces pyttsx3 for robust threading)
        try:
            import win32com.client
            import pythoncom
            pythoncom.CoInitialize()
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            
            tts_cfg = self.config.get("tts", {}) or self.config.get("text_to_speech", {})
            
            # Voice Selection
            voice_idx = tts_cfg.get("voice_index", 1)
            voices = speaker.GetVoices()
            if voice_idx < voices.Count:
                speaker.Voice = voices.Item(voice_idx)
                
            # Rate Configuration (SAPI accepts -10 to 10)
            rate_offset = tts_cfg.get("rate_offset", -50)
            sapi_rate = max(-10, min(10, int(rate_offset / 20)))
            speaker.Rate = sapi_rate
            
            # Volume Configuration (SAPI accepts 0 to 100)
            volume_offset = tts_cfg.get("volume_offset", 0.25)
            sapi_volume = int((1.0 + volume_offset) * 100)
            speaker.Volume = max(0, min(100, sapi_volume))
            
            speaker.Speak(text)
            return
        except Exception as e:
            print(f"Windows SAPI speak failed: {e}")
            
        print("[Voice Synthesis Unavailable]")

    async def _speak_edge_tts(self, text: str):
        # Generates a temporary MP3 file and plays it
        communicate = edge_tts.Communicate(text, "en-US-GuyNeural")
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as fp:
            temp_path = fp.name
        try:
            await communicate.save(temp_path)
            # Play MP3 on Windows using os.system
            os.system(f'start "" /min "{temp_path}"')
        finally:
            # We don't delete immediately to allow player to open it, 
            # ideally the file will clean up later or we can track it
            pass

    def listen_and_transcribe(self, state_callback=None) -> str:
        if not HAS_SR:
            print("SpeechRecognition library not installed. Please install it with 'pip install SpeechRecognition'.")
            return "None"
            
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=0.5)
            if state_callback:
                state_callback("LISTENING")
            print("Listening...", flush=True)
            try:
                audio = r.listen(source, timeout=10, phrase_time_limit=10)
            except sr.WaitTimeoutError:
                if state_callback:
                    state_callback("IDLE")
                return "None"
                
        if state_callback:
            state_callback("THINKING")
            
        print("Recognizing...")
        
        # Local faster-whisper transcription
        if self.stt_provider == "faster-whisper" and self.whisper_model:
            try:
                # Save wav bytes to temp file
                wav_data = audio.get_wav_data()
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as fp:
                    fp.write(wav_data)
                    temp_path = fp.name
                
                try:
                    segments, info = self.whisper_model.transcribe(temp_path, beam_size=5)
                    text = "".join(segment.text for segment in segments).strip()
                    print(f"Transcribed (local): {text}")
                    return text
                finally:
                    os.unlink(temp_path)
            except Exception as e:
                print(f"Local Whisper failed: {e}. Falling back to Google STT.")
                
        # Google Web STT fallback
        try:
            query = r.recognize_google(audio, language='en-US')
            print(f"User said: {query}")
            return query
        except Exception as e:
            print("Could not understand audio.")
            return "None"
