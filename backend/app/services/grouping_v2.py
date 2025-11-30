# backend/app/services/grouping_v2.py
from typing import Dict, List
import re
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Новая модель: русская для лучшей точности
MODEL = SentenceTransformer('ai-forever/sbert_large_nlu_ru')

# Парсер характеристик (сохранил из старого)
_sep_re = re.compile(r'[|/\\,·•]')
_dotsep_re = re.compile(r'\.(?=\s|[A-Za-zА-Яа-я0-9])')

def fast_parse_features(text):
    if pd.isna(text):
        return {}
    s = str(text)
    s = _sep_re.sub(';', s)
    s = s.replace('=', ':')
    s = _dotsep_re.sub(';', s)
    s = re.sub(r';{2,}', ';', s)
    parts = s.split(';')
    out = {}
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if ':' in p:
            k, v = p.split(':', 1)
        elif '-' in p:
            k, v = p.split('-', 1)
        else:
            continue
        k = re.sub(r'[^A-Za-zА-Яа-я0-9\s\-/]+', '', k).strip().lower()
        v = v.strip()
        if k:
            out[k] = v
    return out

def build_product_signature(row):
    parts = [
        row.get('название сте', ''),
        row.get('модель', ''),
        row.get('производитель', ''),
        ' '.join([f"{k}:{v}" for k, v in row.get('parsed_features', {}).items()])
    ]
    return ' | '.join(filter(None, parts)).strip()

def embed_products(df):
    df['parsed_features'] = df['характеристики'].apply(fast_parse_features)
    signatures = df.apply(build_product_signature, axis=1).tolist()
    embeddings = MODEL.encode(signatures, batch_size=32, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings, df

def aggregate_df(df: pd.DataFrame, strictness: float = 0.7) -> Dict[str, List[int]]:
    if df.empty:
        return {}
    from .preprocessor import preprocess_and_normalize
    df, _ = preprocess_and_normalize(df)
    embeddings, df = embed_products(df)
    distance_threshold = 1 - strictness  # strictness 0.7 → threshold 0.3
    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=distance_threshold,
        linkage='average',
        metric='cosine'
    )
    labels = clustering.fit_predict(embeddings)
    groups = {}
    gid = 0
    for label in set(labels):
        if label == -1:
            continue
        idxs = df.index[labels == label].tolist()
        if len(idxs) >= 2:
            groups[f"emb_{gid}"] = idxs
            gid += 1
    # Singles as unique
    singles = df.index[labels == -1].tolist()
    for i, idx in enumerate(singles):
        groups[f"unique_{i}"] = [idx]
    return groups

def find_closest_group(new_product: dict, existing_embeddings: np.ndarray, existing_groups: Dict[str, List[int]], threshold=0.8):
    new_sig = build_product_signature(new_product)
    new_emb = MODEL.encode([new_sig], convert_to_numpy=True, normalize_embeddings=True)[0]
    similarities = cosine_similarity([new_emb], existing_embeddings)[0]
    max_sim = np.max(similarities)
    if max_sim >= threshold:
        closest_idx = np.argmax(similarities)
        for gid, idxs in existing_groups.items():
            if closest_idx in idxs:
                return gid
    return None  # Create new group