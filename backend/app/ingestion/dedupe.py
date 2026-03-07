import hashlib

from app.ingestion.base import RawArticleCandidate


def content_hash(candidate: RawArticleCandidate) -> str:
    normalized = " ".join(
        [
            candidate.source.strip().lower(),
            candidate.headline.strip().lower(),
            candidate.published_at.strftime("%Y-%m-%d"),
        ]
    )
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def dedupe_candidates(candidates: list[RawArticleCandidate]) -> list[RawArticleCandidate]:
    seen_urls = set()
    seen_hashes = set()
    deduped = []
    for candidate in candidates:
        url_key = f"{candidate.source}::{candidate.source_url.strip().lower()}"
        hash_key = content_hash(candidate)
        if url_key in seen_urls or hash_key in seen_hashes:
            continue
        seen_urls.add(url_key)
        seen_hashes.add(hash_key)
        deduped.append(candidate)
    return deduped
