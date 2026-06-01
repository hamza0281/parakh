# Parakh — Reviews ki Parakh. Khara ya Khota?

> **Built for [Slop Scan Hackathon](https://slopscan.dev/) · Track G — Marketplaces**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is Parakh?

Most fake-review detectors ask *"Was this written by AI?"* — that's a coin flip.

**Parakh asks a different question: "Does this review claim things that aren't actually in the product?"**

That's an objective question with a real answer. AI-generated reviews routinely hallucinate features that the specific product doesn't have — because the model picks features common to the *category* (wireless earbuds always have ANC, right?) rather than the specific product's actual specs.

**Real users don't invent features that don't exist. AI does.**

---

## Live Demo

**[parakh.vercel.app](https://parakh.vercel.app)**

Try the demo: [parakh.vercel.app/scan?demo=zen-sound-pro](https://parakh.vercel.app/scan?demo=zen-sound-pro)

---

## The 5-Layer Detection Engine

| Layer | Signal | Type |
|-------|--------|------|
| **L1** | Stylometric Clustering | Supporting |
| **L2** | Temporal Burst Detection | Supporting |
| **L3** | Reviewer History Analysis | Supporting |
| **L4 ⭐** | Spec-Claim Mismatch | **Killer Signal** |
| **L6 ⭐** | Phantom Feature Trace | **Novel Signal** |

### L4: Spec-Claim Mismatch (The Killer Signal)

1. Extract product spec sheet from listing (Groq Llama 3.3)
2. Extract feature claims from each review (Groq)
3. Check if claims contradict spec using NLI (DeBERTa-v3-MNLI)
4. Flag reviews with objective contradictions

**Example:** A review claiming "Active Noise Cancellation is amazing" on a product with only passive isolation = objective fake signal.

### L6: Phantom Feature Trace (The Novel Signal)

AI hallucinates category-typical features even when the product doesn't have them. We:
1. Build a category-feature distribution map (what features are common in this category)
2. Detect "phantom features" — mentioned in reviews but absent from spec
3. Cluster reviews by phantom feature signature
4. **Reverse-engineer the AI prompt template** that generated them

---

## Bake-Off Results

Tested on 25 labeled reviews (15 AI-generated, 10 human-written):

| Metric | Value |
|--------|-------|
| **Precision** | **75%** |
| **Recall** | **60%** |
| **F1 Score** | **0.667** |
| **False Positive Rate** | **30%** |

We catch 60% of AI reviews. The 40% we miss are short generic reviews ("Great product!") with no specific claims to contradict. Those reviews carry less weight in the adjusted score anyway.

[Full confusion matrix →](api/docs/bakeoff_results.md)

---

## Cross-Track Demo (+3 Bonus)

The same Spec-Claim engine works on:
- **Track F (Academia):** Verify paper claims against cited sources
- **Track C (Hiring):** Match resume claims against job requirements

[Try cross-track demo →](https://parakh.vercel.app/cross-track)

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (for Redis)
- API keys: Groq (free), Gemini (free), HuggingFace (free)

### Run locally

```bash
# Clone
git clone https://github.com/<you>/parakh.git
cd parakh

# Backend
cd api
cp .env.example .env
# Edit .env with your API keys
python -m venv venv
venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd web
npm install
npm run dev
```

Or with Docker:
```bash
docker-compose up
```

Frontend: http://localhost:3000
Backend: http://localhost:8000/docs

---

## Tech Stack

### Frontend
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + Framer Motion
- Deployed: Vercel

### Backend
- FastAPI (Python 3.11)
- sentence-transformers (L1 clustering)
- scikit-learn (AgglomerativeClustering)
- Groq API (Llama 3.3 70B — spec/claim extraction)
- Gemini 2.5 Flash (phantom reasoning + fallback)
- HuggingFace Inference (DeBERTa-v3-MNLI — NLI)
- Redis (caching)
- Deployed: Railway

---

## API

```
POST /api/v1/analyze
Body: { "url": "https://amazon.com/dp/..." }
Response: { adjusted_score, flags[], layer_results, reconstructed_prompts, ... }

POST /api/v1/analyze?demo=zen-sound-pro
# Uses pre-cached demo data — zero Amazon scraping

POST /api/v1/cross-track/analyze
Body: { "track": "academia"|"hiring", "document": "...", "reference": "..." }
```

Full docs: http://localhost:8000/docs

---

## Project Structure

```
parakh/
  web/          # Next.js frontend
  api/          # FastAPI backend
    app/
      pipeline/
        l1_stylometric.py   # Sentence-transformer clustering
        l2_temporal.py      # Burst detection
        l3_reviewer.py      # Bot account scoring
        l4_spec_claim.py    # NLI contradiction detection
        l6_phantom.py       # Phantom feature trace
        runner.py           # Orchestrates all 5 layers
      routes/
        analyze.py          # Main endpoint
        cross_track.py      # Cross-track demo
    scripts/
      bakeoff.py            # Accuracy evaluation
    docs/
      bakeoff_results.md    # Confusion matrix
  README.md
  docker-compose.yml
```

---

## Hackathon Submission

- **Track:** G — Marketplaces
- **Bonus claims:** Bake-Off (+5), Live Fire (+5), Cross-Track (+3)
- **Tools used:** Claude, Cursor (per hackathon disclosure rules)

---

## License

MIT — see [LICENSE](LICENSE)
