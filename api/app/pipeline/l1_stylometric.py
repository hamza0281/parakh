"""
L1: Stylometric Clustering (Pure Python — no numpy/sklearn/sentence-transformers)

Detects reviews generated from the same AI prompt template using
TF-IDF cosine similarity + simple greedy clustering.

No heavy ML dependencies — works on Render free tier.
"""
import asyncio
import math
import re
from collections import Counter
from app.models.schemas import Review, ReviewCluster, L1Result, Flag
from app.logger import get_logger

logger = get_logger("l1_stylometric")

MIN_CLUSTER_SIZE = 2
SIMILARITY_THRESHOLD = 0.55   # cosine similarity threshold
MIN_REVIEW_LENGTH = 20


def _tokenize(text: str) -> list[str]:
    """Simple word tokenizer — lowercase, remove punctuation."""
    return re.findall(r'\b[a-z]{3,}\b', text.lower())


def _tfidf_vector(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    """Compute TF-IDF vector for a document."""
    if not tokens:
        return {}
    tf = Counter(tokens)
    total = len(tokens)
    return {word: (count / total) * idf.get(word, 1.0) for word, count in tf.items()}


def _cosine_similarity(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    """Cosine similarity between two sparse TF-IDF vectors."""
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(vec_a.get(w, 0.0) * vec_b.get(w, 0.0) for w in vec_b)
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _build_idf(all_tokens: list[list[str]]) -> dict[str, float]:
    """Compute IDF scores across all documents."""
    n = len(all_tokens)
    if n == 0:
        return {}
    doc_freq: dict[str, int] = {}
    for tokens in all_tokens:
        for word in set(tokens):
            doc_freq[word] = doc_freq.get(word, 0) + 1
    return {
        word: math.log((n + 1) / (freq + 1)) + 1
        for word, freq in doc_freq.items()
    }


def _describe_cluster(reviews: list[Review]) -> str:
    avg_stars = sum(r.stars for r in reviews) / len(reviews)
    avg_len = int(sum(len(r.text.split()) for r in reviews) / len(reviews))
    all_words = " ".join(r.text.lower() for r in reviews).split()
    word_freq: dict[str, int] = {}
    for w in all_words:
        if len(w) > 4:
            word_freq[w] = word_freq.get(w, 0) + 1
    top = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:3]
    common = ", ".join(w for w, _ in top)
    return f"Avg {avg_stars:.1f} stars, ~{avg_len} words, common: {common}"


async def run_l1(reviews: list[Review]) -> L1Result:
    """
    Run L1 Stylometric Clustering using pure Python TF-IDF + cosine similarity.
    No numpy, no sklearn, no sentence-transformers.
    """
    valid = [r for r in reviews if len(r.text.strip()) >= MIN_REVIEW_LENGTH]

    if len(valid) < MIN_CLUSTER_SIZE:
        logger.info(f"L1: Too few valid reviews ({len(valid)}) — skipping")
        return L1Result()

    logger.info(f"L1: Clustering {len(valid)} reviews (pure Python TF-IDF)")

    try:
        # Run in thread pool to avoid blocking event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _cluster_reviews, valid)
        return result
    except Exception as e:
        logger.warning(f"L1: Failed: {e}")
        return L1Result()


def _cluster_reviews(valid: list[Review]) -> L1Result:
    """Synchronous clustering logic — runs in thread pool."""
    # Build TF-IDF vectors
    all_tokens = [_tokenize(r.text) for r in valid]
    idf = _build_idf(all_tokens)
    vectors = [_tfidf_vector(tokens, idf) for tokens in all_tokens]

    n = len(valid)
    # Greedy clustering: assign each review to first cluster it's similar to
    cluster_assignments: list[int] = [-1] * n
    cluster_id = 0

    for i in range(n):
        if cluster_assignments[i] != -1:
            continue
        # Start new cluster with review i
        cluster_assignments[i] = cluster_id
        for j in range(i + 1, n):
            if cluster_assignments[j] != -1:
                continue
            sim = _cosine_similarity(vectors[i], vectors[j])
            if sim >= SIMILARITY_THRESHOLD:
                cluster_assignments[j] = cluster_id
        cluster_id += 1

    # Group by cluster
    cluster_map: dict[int, list[int]] = {}
    for idx, cid in enumerate(cluster_assignments):
        cluster_map.setdefault(cid, []).append(idx)

    clusters: list[ReviewCluster] = []
    flagged_ids: list[str] = []
    flags: list[Flag] = []

    for cid, indices in cluster_map.items():
        if len(indices) < MIN_CLUSTER_SIZE:
            continue

        cluster_reviews = [valid[i] for i in indices]
        cluster_review_ids = [r.id for r in cluster_reviews]

        # Average pairwise similarity
        sims = []
        for a in range(len(indices)):
            for b in range(a + 1, len(indices)):
                sims.append(_cosine_similarity(vectors[indices[a]], vectors[indices[b]]))
        avg_sim = sum(sims) / len(sims) if sims else SIMILARITY_THRESHOLD

        description = _describe_cluster(cluster_reviews)

        clusters.append(ReviewCluster(
            cluster_id=cid,
            review_ids=cluster_review_ids,
            similarity_score=round(avg_sim, 3),
            pattern_description=description,
        ))

        for review in cluster_reviews:
            if review.id not in flagged_ids:
                flagged_ids.append(review.id)
                flags.append(Flag(
                    review_id=review.id,
                    layer="L1",
                    reason=f"Part of cluster of {len(cluster_reviews)} structurally similar reviews (similarity: {avg_sim:.2f})",
                    confidence=min(0.88, 0.50 + avg_sim * 0.38),
                    evidence={
                        "cluster_id": cid,
                        "cluster_size": len(cluster_reviews),
                        "avg_similarity": avg_sim,
                        "pattern": description,
                    },
                ))

    clusters.sort(key=lambda c: len(c.review_ids), reverse=True)
    logger.info(f"L1: Complete — {len(clusters)} clusters, {len(flagged_ids)} flagged")

    return L1Result(clusters=clusters, flagged_review_ids=flagged_ids, flags=flags)
