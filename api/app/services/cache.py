import hashlib
import json
import redis.asyncio as aioredis
from typing import Optional, Any
from app.config import get_settings

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def make_cache_key(url: str) -> str:
    return "parakh:analysis:" + hashlib.sha256(url.encode()).hexdigest()[:16]


async def get_cached(key: str) -> Optional[dict]:
    try:
        r = await get_redis()
        val = await r.get(key)
        if val:
            return json.loads(val)
    except Exception:
        pass
    return None


async def set_cached(key: str, data: dict, ttl: int = 86400) -> None:
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(data))
    except Exception:
        pass  # Redis down — degrade gracefully
