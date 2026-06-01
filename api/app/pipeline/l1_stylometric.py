"""
L1: Stylometric Clustering

Detects reviews generated from the same AI prompt template by finding
structurally similar review clusters using sentence embeddings + hierarchical clustering.

Real reviews have natural variation. AI-generated reviews from the same prompt
template share structural patterns even when surface words differ.

Pipeline:
  1. Encode all reviews with sentence-transformers (all-MiniLM-L6-v2)
  2. Compute pairwise cosine similarity matrix
  3. Agglomerative clustering with distance threshold
  4. Flag clusters of size >= MIN_CLUSTER_SIZE
"""
import asyncio
from typing import Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from app.models.schemas import Review, ReviewCluster, L1Result, Flag
from app.logger import get_logger

logger = get_logger("l1_stylometric")

# Minimum cluster size to flag
MIN_CLUSTER_SIZE = 2

# Cosine distance threshold (1 - similarity). Lower = tighter clusters.
# 0.30 means reviews must be at least 70% similar to cluster together.
# Tuned on demo data — 0.22 was too tight for small datasets.
DISTANCE_THRESHOLD = 0.30

# Minimum review length to include in analysis (very short reviews are noise)
MIN_REVIEW_LENGTH = 20

# Lazy-loaded model (loaded once, reused)
_model: Optional[SentenceTransformer] = None
_model_lock = asyncio.Lock()


async def _get_model() -> SentenceTransformer:
    """Load sentence-transformer model lazily (once per process)."""
    global _model
    if _model is None:
        async with _model_lock:
            if _model is None:
                logger.info("L1: Loading sentence-transformer model...")
                # Run in thread pool to avoid blocking event loop
                loop = asyncio.get_event_loop()
                _model = await loop.run_in_executor(
                    None,
                    lambda: SentenceTransformer("all-MiniLM-L6-v2")
                )
                logger.info("L1: Model loaded.")
    return _model


def _describe_cluster(reviews: list[Review]) -> str:
    """Generate a human-readable description of a cluster's pattern."""
    avg_stars = sum(r.stars for r in reviews) / len(reviews)
    avg_len = int(sum(len(r.text.split()) for r in reviews) / len(reviews))
    star_str = f"{avg_stars:.1f} stars"

    # Find common words/phrases
    all_words = " ".join(r.text.lower() for r in reviews).split()
    word_freq: dict[str, int] = {}
    for w in all_words:
        if len(w) > 4:  # skip short words
            word_freq[w] = word_freq.get(w, 0) + 1
    top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:3]
    common = ", ".join(w for w, _ in top_words)

    return f"Avg {star_str}, ~{avg_len} words, common terms: {common}"


async def run_l1(reviews: list[Review]) -> L1Result:
    """
    Run L1 Stylometric Clustering pipeline.

    Args:
        reviews: List of reviews to analyze

    Returns:
        L1Result with clusters, flagged review IDs, and flags
    """
    # Filter reviews that are long enough to analyze
    valid_reviews = [r for r in reviews if len(r.text.strip()) >= MIN_REVIEW_LENGTH]

    if len(valid_reviews) < MIN_CLUSTER_SIZE:
        logger.info(f"L1: Too few valid reviews ({len(valid_reviews)}) — skipping")
        return L1Result()

    logger.info(f"L1: Clustering {len(valid_reviews)} reviews")

    try:
        model = await _get_model()

        # Encode reviews in thread pool (CPU-bound)
        loop = asyncio.get_event_loop()
        texts = [r.text for r in valid_reviews]
        embeddings = await loop.run_in_executor(
            None,
            lambda: model.encode(texts, batch_size=32, show_progress_bar=False)
        )

        # Agglomerative clustering
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=DISTANCE_THRESHOLD,
            metric="cosine",
            linkage="average",
        )
        labels = clustering.fit_predict(embeddings)

        # Group reviews by cluster label
        cluster_map: dict[int, list[int]] = {}
        for idx, label in enumerate(labels):
            cluster_map.setdefault(int(label), []).append(idx)

        # Build clusters — only keep those with >= MIN_CLUSTER_SIZE
        clusters: list[ReviewCluster] = []
        flagged_ids: list[str] = []
        flags: list[Flag] = []

        for cluster_id, indices in cluster_map.items():
            if len(indices) < MIN_CLUSTER_SIZE:
                continue

            cluster_reviews = [valid_reviews[i] for i in indices]
            cluster_review_ids = [r.id for r in cluster_reviews]

            # Compute average pairwise similarity within cluster
            cluster_embeddings = embeddings[indices]
            sim_matrix = cosine_similarity(cluster_embeddings)
            # Average of upper triangle (excluding diagonal)
            n = len(indices)
            if n > 1:
                upper = sim_matrix[np.triu_indices(n, k=1)]
                avg_sim = float(np.mean(upper))
            else:
                avg_sim = 1.0

            description = _describe_cluster(cluster_reviews)

            clusters.append(ReviewCluster(
                cluster_id=cluster_id,
                review_ids=cluster_review_ids,
                similarity_score=round(avg_sim, 3),
                pattern_description=description,
            ))

            # Flag all reviews in this cluster
            for review in cluster_reviews:
                if review.id not in flagged_ids:
                    flagged_ids.append(review.id)
                    flags.append(Flag(
                        review_id=review.id,
                        layer="L1",
                        reason=f"Part of cluster of {len(cluster_reviews)} structurally similar reviews (similarity: {avg_sim:.2f})",
                        confidence=min(0.90, 0.55 + avg_sim * 0.35),
                        evidence={
                            "cluster_id": cluster_id,
                            "cluster_size": len(cluster_reviews),
                            "avg_similarity": avg_sim,
                            "pattern": description,
                        },
                    ))

        # Sort clusters by size (largest first)
        clusters.sort(key=lambda c: len(c.review_ids), reverse=True)

        logger.info(
            f"L1: Complete — {len(clusters)} clusters, "
            f"{len(flagged_ids)} reviews flagged"
        )

        return L1Result(
            clusters=clusters,
            flagged_review_ids=flagged_ids,
            flags=flags,
        )

    except Exception as e:
        logger.warning(f"L1: Pipeline failed: {e}. Returning empty result.")
        return L1Result()
