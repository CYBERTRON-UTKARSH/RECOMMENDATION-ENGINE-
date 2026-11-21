import base64
import io
import os
import traceback
from pathlib import Path
from typing import Any, Optional
from urllib.request import urlopen

import cohere
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from PIL import Image
from pydantic import BaseModel
from qdrant_client import QdrantClient

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

COLLECTION = "ecommerce_products"
TEXT_VECTOR_NAME = "text"
VISUAL_VECTOR_NAME = "visual"
EMBED_MODEL = "embed-v4.0"
DIM = 1536

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
COHERE_API_KEY = (os.getenv("COHERE_API_KEY") or "").strip()
QDRANT_URL = (os.getenv("QDRANT_URL") or "").strip()
QDRANT_API_KEY = (os.getenv("QDRANT_API_KEY") or "").strip() or None
GROQ_MODEL = (os.getenv("GROQ_MODEL") or "qwen/qwen3.8-27b").strip()

if not GROQ_API_KEY:
    raise RuntimeError(f"GROQ_API_KEY missing in {BASE_DIR / '.env'}")

groq_client = Groq(api_key=GROQ_API_KEY)
cohere_client = cohere.ClientV2(api_key=COHERE_API_KEY) if COHERE_API_KEY else None
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY) if QDRANT_URL else None

app = FastAPI(title="Multimodal E-Commerce Recommender", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    query: str = ""
    product_id: Optional[Any] = None
    title: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    limit: int = 8


def clean_text_query(raw_query: str) -> str:
    """Normalize broad or specific e-commerce queries without asking clarifying questions."""
    query = (raw_query or "").strip()
    if not query:
        return ""

    system_prompt = (
        "Extract e-commerce product search keywords for vector retrieval. "
        "Broad or single-word queries like 'tops' or 't-shirt' are always valid—never ask for "
        "missing attributes like color, gender, or style, and never add conversational text. "
        "Keep any provided attributes and expand broad item types with closely related "
        "catalog terms (for example: 'tops' -> 'top shirt blouse apparel', "
        "'t-shirt' -> 't-shirt tee casual top'). Return ONLY keywords."
    )

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            temperature=0.0,
            max_tokens=48,
        )
        cleaned = (completion.choices[0].message.content or "").strip()
        cleaned = cleaned.strip('"').strip("'").strip("`").strip()
        return cleaned or query
    except Exception:
        return query


def normalize_point(point: Any) -> dict[str, Any]:
    payload = getattr(point, "payload", None) or {}
    title = (
        payload.get("title")
        or payload.get("name")
        or payload.get("product_name")
        or payload.get("productDisplayName")
        or "Untitled Product"
    )
    image_url = (
        payload.get("image_url")
        or payload.get("image")
        or payload.get("img")
        or payload.get("thumbnail")
        or ""
    )
    category = payload.get("category") or payload.get("subCategory") or payload.get("articleType") or ""
    return {
        "id": getattr(point, "id", None),
        "score": round(float(getattr(point, "score", 0.0) or 0.0), 4),
        "title": title,
        "category": category,
        "price": payload.get("price"),
        "image_url": image_url,
        "payload": payload,
    }


def _extract_embedding(response: Any) -> list[float]:
    emb = getattr(response, "embeddings", None)
    if hasattr(emb, "float_") and emb.float_:
        return list(emb.float_[0])
    if isinstance(emb, list) and emb:
        return list(emb[0])
    raise RuntimeError("Unexpected embedding response structure from Cohere.")


def embed_query_text(text: str) -> list[float]:
    if not cohere_client:
        raise HTTPException(status_code=500, detail="COHERE_API_KEY is not configured in .env")
    response = cohere_client.embed(
        texts=[text],
        model=EMBED_MODEL,
        input_type="search_query",
        embedding_types=["float"],
        output_dimension=DIM,
    )
    return _extract_embedding(response)


def embed_image_bytes(image_bytes: bytes) -> list[float]:
    if not cohere_client:
        raise HTTPException(status_code=500, detail="COHERE_API_KEY is not configured in .env")

    with Image.open(io.BytesIO(image_bytes)) as img:
        rgb_img = img.convert("RGB")
        buf = io.BytesIO()
        rgb_img.save(buf, format="JPEG")
        b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")

    data_uri = f"data:image/jpeg;base64,{b64_data}"
    response = cohere_client.embed(
        images=[data_uri],
        model=EMBED_MODEL,
        input_type="image",
        embedding_types=["float"],
        output_dimension=DIM,
    )
    return _extract_embedding(response)


def fetch_image_bytes_from_url(url: str) -> Optional[bytes]:
    clean_url = (url or "").strip()
    if not clean_url:
        return None
    try:
        with urlopen(clean_url, timeout=8) as resp:
            return resp.read()
    except Exception:
        return None


def query_qdrant_vectors(
    vector: list[float],
    using: str,
    limit: int = 12,
    score_threshold: Optional[float] = None,
) -> list[dict[str, Any]]:
    if not qdrant_client:
        return []

    kwargs: dict[str, Any] = {
        "collection_name": COLLECTION,
        "query": vector,
        "using": using,
        "limit": limit,
        "with_payload": True,
    }
    if score_threshold is not None:
        kwargs["score_threshold"] = score_threshold

    response = qdrant_client.query_points(**kwargs)
    return [normalize_point(pt) for pt in response.points]


def validate_image_bytes(image_bytes: bytes) -> None:
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.") from exc


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "Multimodal E-Commerce Recommender API running"}


@app.post("/search")
async def search_products(
    query: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    limit: int = Form(16),
) -> dict[str, Any]:
    try:
        raw_text = (query or "").strip()
        image_bytes = await image.read() if image is not None else None

        if not raw_text and not image_bytes:
            raise HTTPException(status_code=400, detail="Provide a search query or upload an image.")

        if image_bytes:
            validate_image_bytes(image_bytes)

        normalized_query = clean_text_query(raw_text) if raw_text else ""

        if image_bytes and not raw_text:
            vector = embed_image_bytes(image_bytes)
            raw_items = query_qdrant_vectors(
                vector=vector,
                using=VISUAL_VECTOR_NAME,
                limit=max(limit * 2, 20),
            )
        else:
            search_text = normalized_query or "apparel product fashion item"
            vector = embed_query_text(search_text)
            raw_items = query_qdrant_vectors(
                vector=vector,
                using=TEXT_VECTOR_NAME,
                limit=max(limit * 2, 20),
            )

        exact_matches: list[dict[str, Any]] = []
        other_matches: list[dict[str, Any]] = []
        lower_query = raw_text.lower()

        for item in raw_items:
            item_title = (item.get("title") or "").strip().lower()
            if lower_query and item_title == lower_query:
                exact_matches.append({**item, "match_type": "exact"})
            else:
                other_matches.append({**item, "match_type": "normal"})

        ordered_results = (exact_matches + other_matches)[: max(1, min(limit, 50))]

        return {
            "raw_query": raw_text,
            "normalized_query": normalized_query,
            "has_exact_match": len(exact_matches) > 0,
            "results": ordered_results,
        }
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc


@app.post("/recommend")
def recommend_matching(req: RecommendRequest) -> dict[str, Any]:
    try:
        anchor_title = (req.title or req.query or "").strip()
        if not anchor_title:
            raise HTTPException(status_code=400, detail="Select a product or enter a query first.")

        # 1. Product recommendations -> "text" vector space
        product_query = clean_text_query(f"{anchor_title} {req.category or ''}".strip())
        product_vector = embed_query_text(product_query)
        product_candidates = query_qdrant_vectors(
            vector=product_vector,
            using=TEXT_VECTOR_NAME,
            limit=req.limit + 4,
        )
        product_recommendations = [
            item for item in product_candidates if str(item.get("id")) != str(req.product_id)
        ][: req.limit]

        # 2. Visual recommendations -> "visual" vector space
        img_bytes = fetch_image_bytes_from_url(req.image_url or "")
        if img_bytes:
            try:
                validate_image_bytes(img_bytes)
                visual_vector = embed_image_bytes(img_bytes)
            except Exception:
                visual_vector = embed_query_text(f"{anchor_title} {req.category or ''}".strip())
        else:
            visual_vector = embed_query_text(f"{anchor_title} {req.category or ''}".strip())

        visual_candidates = query_qdrant_vectors(
            vector=visual_vector,
            using=VISUAL_VECTOR_NAME,
            limit=req.limit + 4,
        )
        visual_recommendations = [
            item for item in visual_candidates if str(item.get("id")) != str(req.product_id)
        ][: req.limit]

        return {
            "anchor_title": anchor_title,
            "product_query": product_query,
            "product_recommendations": product_recommendations,
            "visual_recommendations": visual_recommendations,
        }
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc