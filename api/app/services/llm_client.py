"""
LLM Client — Groq primary, Gemini fallback.
Groq: fast + free for structured extraction (spec, claims)
Gemini: better reasoning for phantom trace + prompt reconstruction
"""
import json
import re
from typing import Any
from groq import AsyncGroq
import google.generativeai as genai
from app.config import get_settings

_groq: AsyncGroq | None = None
_gemini_flash = None
_gemini_pro = None


def _init_clients():
    global _groq, _gemini_flash, _gemini_pro
    settings = get_settings()
    if _groq is None:
        _groq = AsyncGroq(api_key=settings.groq_api_key)
    if _gemini_flash is None:
        genai.configure(api_key=settings.gemini_api_key)
        # Gemini 2.5 is current; 1.5 was deprecated
        _gemini_flash = genai.GenerativeModel("gemini-2.5-flash")
        _gemini_pro = genai.GenerativeModel("gemini-2.5-pro")


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response that may have markdown fences."""
    text = text.strip()
    # Remove markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text)
    # Find first { ... }
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


async def groq_json(prompt: str, system: str = "") -> dict:
    """Call Groq with JSON mode. Returns parsed dict. Falls back to Gemini on rate limit."""
    _init_clients()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        resp = await _groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2048,
            max_retries=2,  # fail fast, don't wait forever
        )
        return _extract_json(resp.choices[0].message.content)
    except Exception:
        # Fallback to Gemini Flash on any error (rate limit, quota, etc.)
        return await gemini_json(prompt, model="flash")


async def groq_text(prompt: str) -> str:
    """Call Groq for plain text response. Falls back to Gemini on rate limit."""
    _init_clients()
    try:
        resp = await _groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024,
            max_retries=2,  # fail fast
        )
        return resp.choices[0].message.content.strip()
    except Exception:
        return await gemini_text(prompt, model="flash")


async def gemini_json(prompt: str, model: str = "flash") -> dict:
    """Call Gemini for JSON response. Does NOT fall back to Groq (avoids recursion)."""
    _init_clients()
    m = _gemini_flash if model == "flash" else _gemini_pro
    full_prompt = prompt + "\n\nRespond with valid JSON only, no markdown."
    try:
        resp = m.generate_content(full_prompt)
        return _extract_json(resp.text)
    except Exception as e:
        # Last resort: return empty dict rather than infinite recursion
        raise RuntimeError(f"Both Groq and Gemini failed: {e}") from e


async def gemini_text(prompt: str, model: str = "flash") -> str:
    """Call Gemini for text response. Does NOT fall back to Groq (avoids recursion)."""
    _init_clients()
    m = _gemini_flash if model == "flash" else _gemini_pro
    try:
        resp = m.generate_content(prompt)
        return resp.text.strip()
    except Exception as e:
        raise RuntimeError(f"Gemini text generation failed: {e}") from e
