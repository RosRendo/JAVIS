"""
AI Gateway — provider-agnostic LLM interface for JARVIS.

Active provider is read from config/settings.json → ai.provider.
Switch provider at runtime by changing that one value.

Supported providers:
  - ollama    (local, free, no key needed)
  - openai    (requires api_key)
  - gemini    (requires api_key)
  - anthropic (requires api_key)
"""

import os
import json
import requests
from abc import ABC, abstractmethod


# ─────────────────────────────────────────────
# Base class
# ─────────────────────────────────────────────

class BaseProvider(ABC):
    @abstractmethod
    def query(self, system_prompt: str, user_prompt: str) -> str:
        """Send prompt to the LLM, return raw text response."""


# ─────────────────────────────────────────────
# Ollama (local)
# ─────────────────────────────────────────────

class OllamaProvider(BaseProvider):
    def __init__(self, cfg: dict):
        self.url = cfg.get("url", "http://localhost:11434")
        self.model = cfg.get("model", "llama3.2")

    def is_alive(self) -> bool:
        try:
            res = requests.get(f"{self.url}/api/tags", timeout=0.3)
            return res.status_code == 200
        except Exception:
            return False

    def query(self, system_prompt: str, user_prompt: str) -> str:
        if not self.is_alive():
            raise ConnectionError("Ollama is not running or not reachable.")

        payload = {
            "model": self.model,
            "prompt": f"{system_prompt}\nUser: {user_prompt}\nAssistant:",
            "stream": False,
        }
        res = requests.post(f"{self.url}/api/generate", json=payload, timeout=30)
        res.raise_for_status()
        return res.json().get("response", "").strip()


# ─────────────────────────────────────────────
# OpenAI
# ─────────────────────────────────────────────

class OpenAIProvider(BaseProvider):
    def __init__(self, cfg: dict):
        self.api_key = cfg.get("api_key", "")
        self.model = cfg.get("model", "gpt-4o-mini")

    def query(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("OpenAI api_key is not set in config/settings.json.")
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")

        client = OpenAI(api_key=self.api_key)
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            timeout=30,
        )
        return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────
# Google Gemini
# ─────────────────────────────────────────────

class GeminiProvider(BaseProvider):
    def __init__(self, cfg: dict):
        self.api_key = cfg.get("api_key", "")
        self.model = cfg.get("model", "gemini-1.5-flash")

    def query(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("Gemini api_key is not set in config/settings.json.")
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError("google-generativeai not installed. Run: pip install google-generativeai")

        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(
            model_name=self.model,
            system_instruction=system_prompt,
        )
        response = model.generate_content(user_prompt)
        return response.text.strip()


# ─────────────────────────────────────────────
# Anthropic Claude
# ─────────────────────────────────────────────

class AnthropicProvider(BaseProvider):
    def __init__(self, cfg: dict):
        self.api_key = cfg.get("api_key", "")
        self.model = cfg.get("model", "claude-3-haiku-20240307")

    def query(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("Anthropic api_key is not set in config/settings.json.")
        try:
            import anthropic
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")

        client = anthropic.Anthropic(api_key=self.api_key)
        message = client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return message.content[0].text.strip()


# ─────────────────────────────────────────────
# DeepSeek
# ─────────────────────────────────────────────

class DeepSeekProvider(BaseProvider):
    def __init__(self, cfg: dict):
        self.api_key = cfg.get("api_key", "")
        self.model = cfg.get("model", "deepseek-chat")

    def query(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("DeepSeek api_key is not set in config/settings.json.")
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")

        client = OpenAI(
            api_key=self.api_key, 
            base_url="https://api.deepseek.com"
        )
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            timeout=30,
        )
        return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────
# AI Gateway — main entry point
# ─────────────────────────────────────────────

_PROVIDER_MAP = {
    "ollama":    OllamaProvider,
    "openai":    OpenAIProvider,
    "gemini":    GeminiProvider,
    "anthropic": AnthropicProvider,
    "deepseek":  DeepSeekProvider,
}


class AIGateway:
    def __init__(self, config_path: str = "config/settings.json"):
        self.config = self._load_config(config_path)
        ai_cfg = self.config.get("ai", {})

        self.active_provider_name: str = ai_cfg.get("provider", "ollama")
        self.providers_cfg: dict = ai_cfg.get("providers", {})

        self._provider: BaseProvider | None = None
        self._build_provider()

    def _load_config(self, path: str) -> dict:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {}

    def _build_provider(self):
        name = self.active_provider_name
        cls = _PROVIDER_MAP.get(name)
        if cls is None:
            print(f"[Gateway] Unknown provider '{name}'. Falling back to Ollama.")
            name = "ollama"
            cls = OllamaProvider

        cfg = self.providers_cfg.get(name, {})
        self._provider = cls(cfg)
        print(f"[Gateway] Active AI provider: {name} (model: {cfg.get('model', 'default')})")

    def switch_provider(self, name: str):
        """Hot-switch the active provider at runtime."""
        if name not in _PROVIDER_MAP:
            raise ValueError(f"Unknown provider '{name}'. Valid: {list(_PROVIDER_MAP.keys())}")
        self.active_provider_name = name
        self._build_provider()

    def query(self, system_prompt: str, user_prompt: str) -> str:
        """
        Query the active provider. If it fails, iterate through
        remaining providers as fallbacks before giving up.
        """
        fallback_order = [self.active_provider_name] + [
            p for p in _PROVIDER_MAP if p != self.active_provider_name
        ]

        for provider_name in fallback_order:
            cfg = self.providers_cfg.get(provider_name, {})

            # Skip providers that clearly have no credentials configured
            if provider_name != "ollama" and not cfg.get("api_key"):
                continue

            try:
                cls = _PROVIDER_MAP[provider_name]
                provider = cls(cfg)
                result = provider.query(system_prompt, user_prompt)
                if provider_name != self.active_provider_name:
                    print(f"[Gateway] Used fallback provider: {provider_name}")
                return result
            except Exception as e:
                print(f"[Gateway] Provider '{provider_name}' failed: {e}")

        raise RuntimeError("[Gateway] All configured AI providers failed.")
