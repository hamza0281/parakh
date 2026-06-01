"""
NLI Client — DeBERTa-v3-large-MNLI via HuggingFace Inference API.
Used for spec-claim contradiction detection (L4).
"""
import httpx
from typing import Literal
from app.config import get_settings

HF_MODEL = "cross-encoder/nli-deberta-v3-large"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

NLILabel = Literal["CONTRADICTION", "ENTAILMENT", "NEUTRAL"]


class NLIResult:
    def __init__(self, label: NLILabel, score: float):
        self.label = label
        self.score = score

    def is_contradiction(self, threshold: float = 0.7) -> bool:
        return self.label == "CONTRADICTION" and self.score >= threshold


async def check_nli(premise: str, hypothesis: str) -> NLIResult:
    """
    Check if hypothesis contradicts premise.
    premise = product spec description
    hypothesis = claim from review
    """
    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.hf_api_key}"}
    payload = {
        "inputs": {
            "text": premise,
            "text_pair": hypothesis,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(HF_API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            results = resp.json()

            # HF returns list of {label, score}
            if isinstance(results, list):
                best = max(results, key=lambda x: x["score"])
                return NLIResult(label=best["label"].upper(), score=best["score"])

            # Fallback: model loading
            return NLIResult(label="NEUTRAL", score=0.5)

    except Exception:
        # If HF API fails, return neutral (don't crash pipeline)
        return NLIResult(label="NEUTRAL", score=0.5)


async def batch_nli(pairs: list[tuple[str, str]]) -> list[NLIResult]:
    """Check multiple premise-hypothesis pairs."""
    import asyncio
    tasks = [check_nli(p, h) for p, h in pairs]
    return await asyncio.gather(*tasks)
