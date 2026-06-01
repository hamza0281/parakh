"""
Cross-Track Demo — Bonus +3

Shows that Parakh's Spec-Claim Mismatch engine generalizes beyond marketplaces:
- Track F (Academia): Verify citation claims against actual sources
- Track C (Hiring): Match resume claims against job posting requirements

Same NLI-based contradiction detection, different domain.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal
from app.services.nli_client import check_nli
from app.services.llm_client import groq_json
from app.logger import get_logger

router = APIRouter()
logger = get_logger("cross_track")


# ── Schemas ────────────────────────────────────────────────────────────────

class CrossTrackRequest(BaseModel):
    track: Literal["academia", "hiring"]
    document: str          # Paper abstract / Resume text
    reference: str         # Citation source text / Job posting


class ClaimResult(BaseModel):
    claim: str
    verdict: Literal["supported", "contradicted", "unverifiable"]
    confidence: float
    explanation: str


class CrossTrackResponse(BaseModel):
    track: str
    total_claims: int
    contradicted: int
    supported: int
    unverifiable: int
    claims: list[ClaimResult]
    slop_score: float      # 0-1, higher = more slop
    summary: str


# ── Prompts ────────────────────────────────────────────────────────────────

CLAIM_EXTRACT_PROMPT = """Extract factual claims from this {doc_type} that can be verified against a reference.

{doc_type_upper}:
{document}

Return JSON:
{{
  "claims": [
    {{
      "claim": "specific verifiable claim",
      "claim_type": "factual|statistical|attribution"
    }}
  ]
}}

Focus on: specific facts, statistics, attributions, technical claims.
Ignore: opinions, general statements, subjective assessments.
Return valid JSON only."""


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/cross-track/analyze", response_model=CrossTrackResponse)
async def analyze_cross_track(request: CrossTrackRequest):
    """
    POST /api/v1/cross-track/analyze

    Applies Parakh's spec-claim mismatch engine to:
    - Academia: verify paper claims against cited sources
    - Hiring: verify resume claims against job requirements
    """
    logger.info(f"Cross-track: {request.track}")

    doc_type = "academic paper" if request.track == "academia" else "resume"
    doc_type_upper = doc_type.upper()

    # Step 1: Extract claims from document
    try:
        data = await groq_json(
            CLAIM_EXTRACT_PROMPT.format(
                doc_type=doc_type,
                doc_type_upper=doc_type_upper,
                document=request.document[:2000],
            )
        )
        raw_claims = data.get("claims", [])
    except Exception as e:
        logger.warning(f"Claim extraction failed: {e}")
        raw_claims = []

    if not raw_claims:
        return CrossTrackResponse(
            track=request.track,
            total_claims=0,
            contradicted=0,
            supported=0,
            unverifiable=0,
            claims=[],
            slop_score=0.0,
            summary="No verifiable claims found in the document.",
        )

    # Step 2: Check each claim against reference using NLI
    results: list[ClaimResult] = []
    premise = request.reference[:1500]

    for item in raw_claims[:10]:  # cap at 10 claims
        claim_text = item.get("claim", "")
        if not claim_text:
            continue

        nli = await check_nli(premise=premise, hypothesis=claim_text)

        if nli.label == "CONTRADICTION" and nli.score >= 0.65:
            verdict = "contradicted"
            explanation = f"This claim contradicts the reference source (confidence: {nli.score:.0%})"
        elif nli.label == "ENTAILMENT" and nli.score >= 0.60:
            verdict = "supported"
            explanation = f"This claim is supported by the reference (confidence: {nli.score:.0%})"
        else:
            verdict = "unverifiable"
            explanation = f"Cannot verify this claim against the reference (NLI: {nli.label}, {nli.score:.0%})"

        results.append(ClaimResult(
            claim=claim_text,
            verdict=verdict,
            confidence=round(nli.score, 3),
            explanation=explanation,
        ))

    # Step 3: Compute slop score
    contradicted = sum(1 for r in results if r.verdict == "contradicted")
    supported = sum(1 for r in results if r.verdict == "supported")
    unverifiable = sum(1 for r in results if r.verdict == "unverifiable")
    total = len(results)

    slop_score = contradicted / total if total > 0 else 0.0

    # Step 4: Generate summary
    if contradicted == 0:
        summary = f"All {total} verifiable claims appear consistent with the reference source."
    elif contradicted == 1:
        summary = f"1 of {total} claims contradicts the reference source. This may indicate AI hallucination."
    else:
        summary = f"{contradicted} of {total} claims contradict the reference source — strong indicator of AI-generated slop."

    logger.info(f"Cross-track complete: {contradicted}/{total} contradicted, slop_score={slop_score:.2f}")

    return CrossTrackResponse(
        track=request.track,
        total_claims=total,
        contradicted=contradicted,
        supported=supported,
        unverifiable=unverifiable,
        claims=results,
        slop_score=round(slop_score, 3),
        summary=summary,
    )


@router.get("/cross-track/demo/{track}")
async def cross_track_demo(track: Literal["academia", "hiring"]):
    """
    GET /api/v1/cross-track/demo/{track}

    Returns pre-built demo data for cross-track showcase.
    """
    if track == "academia":
        return {
            "track": "academia",
            "document": "This study demonstrates that AI-generated content now comprises 45% of all online text (Smith et al., 2024). Our analysis of 10,000 papers shows a 300% increase in AI-assisted writing since 2022. The landmark Chen (2023) study found that 89% of reviewers cannot distinguish AI from human writing.",
            "reference": "Smith et al. (2024) found that AI-generated content comprises approximately 12-15% of online text, with significant variation by domain. The study analyzed 50,000 web pages.",
            "note": "The paper claims 45% but the cited source says 12-15% — a clear contradiction.",
        }
    else:
        return {
            "track": "hiring",
            "document": "Led a team of 50 engineers at Google for 8 years. Architected systems serving 10 billion daily requests. PhD in Computer Science from MIT. Published 15 peer-reviewed papers in top venues.",
            "reference": "Job Requirements: 3+ years experience, team lead experience preferred, Bachelor's degree required, experience with distributed systems.",
            "note": "Resume claims 8 years at Google and PhD — job only requires 3 years and Bachelor's. Overclaiming is a common AI resume pattern.",
        }
