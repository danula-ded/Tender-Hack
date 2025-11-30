import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
import hashlib
from typing import Dict, List, Tuple
import os

# Загружаем локальную модель (80 МБ)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/all-MiniLM-L6-v2")
embedder = SentenceTransformer('all-MiniLM-L6-v2')  # автоматически скачает при первом запуске

# Значимые характеристики по категориям (холодный старт)
SIGNIFICANT_BY_CATEGORY = {
    "шины": ["модель", "производитель", "номинальный_посадочный_диаметр_обода", "ширина_профиля", "высота_профиля"],
    "перчатки": ["производитель", "материал_основы", "материал_покрытия", "класс_вязки"],
    "стропы": ["длина", "статическая_прочность"],
    "башмаки": ["модель", "производитель", "материал_верха"],
}

def get_fingerprint(row) -> str:
    parts = []
    brand = row['производитель'] or ""
    model = str(row['модель'] or "").strip().upper()
    parts.append(brand)
    parts.append(model)

    # Добавляем значимые характеристики
    chars = row.get('characteristics_norm', {})
    cat = str(row.get('название категории', '')).lower()

    significant_keys = SIGNIFICANT_BY_CATEGORY.get(next((k for k in SIGNIFICANT_BY_CATEGORY if k in cat), None), [])
    if not significant_keys:
        # fallback: самые частотные
        significant_keys = [k for k, v in chars.items() if v and len(str(v)) < 50]

    for key in significant_keys:
        val = str(chars.get(key, '')).strip().upper()
        if val and val != "НЕТ" and val != "NONE":
            parts.append(f"{key}:{val}")

    fingerprint = "|".join(parts)
    return hashlib.md5(fingerprint.encode()).hexdigest()

def first_pass_rule_based(df: pd.DataFrame) -> Dict[str, List[int]]:
    df['fingerprint'] = df.apply(get_fingerprint, axis=1)
    groups = {}
    for fp, group in df.groupby('fingerprint'):
        if len(group) >= 2:
            groups[fp] = group.index.tolist()
    return groups

def auto_detect_significant_features(df: pd.DataFrame) -> List[str]:
    all_keys = set()
    for d in df['characteristics_norm']:
        all_keys.update(d.keys())
    
    scores = {}
    for key in all_keys:
        present = df['characteristics_norm'].apply(lambda x: key in x and x[key]).mean()
        if present < 0.3:
            continue
        values = df['characteristics_norm'].apply(lambda x: x.get(key)).dropna()
        unique_ratio = values.nunique() / len(values) if len(values) > 0 else 1
        if 0.05 < unique_ratio < 0.7:
            scores[key] = present * (1 - unique_ratio)
    
    return sorted(scores, key=scores.get, reverse=True)[:10]

def second_pass_ml_clustering(df_remaining: pd.DataFrame, eps=0.4) -> Dict[str, List[int]]:
    texts = df_remaining['название сте'].fillna('') + " " + \
            df_remaining['модель'].fillna('') + " " + \
            df_remaining['characteristics_raw'].fillna('')
    
    embeddings = embedder.encode(texts.tolist(), show_progress_bar=False)
    clustering = DBSCAN(eps=eps, min_samples=2, metric='cosine')
    labels = clustering.fit_predict(embeddings)
    
    groups = {}
    for label in set(labels):
        if label == -1:
            continue
        indices = df_remaining.index[labels == label].tolist()
        if len(indices) >= 2:
            groups[f"ml_{label}"] = indices
    return groups

def aggregate_df(df: pd.DataFrame, strictness: float = 0.7) -> List[dict]:
    # strictness: 0.0 = очень мягко (eps=0.6), 1.0 = жёстко (eps=0.3)
    eps = 0.6 - (strictness * 0.3)

    rule_groups = first_pass_rule_based(df)
    used_indices = set(idx for indices in rule_groups.values() for idx in indices)
    remaining = df.drop(index=used_indices) if len(used_indices) < len(df) else df.iloc[:0]

    ml_groups = {}
    if len(remaining) > 10:
        ml_groups = second_pass_ml_clustering(remaining, eps=eps)

    all_groups = {}
    gid = 0
    for fp, indices in rule_groups.items():
        all_groups[f"card_{gid}"] = indices
        gid += 1
    for label, indices in ml_groups.items():
        all_groups[f"ml_{gid}"] = indices
        gid += 1

    # Формируем результат
    result = []
    for group_id, indices in all_groups.items():
        rep_idx = indices[0]
        rep_row = df.iloc[rep_idx]
        significant = auto_detect_significant_features(df.iloc[indices])
        result.append({
            "id": group_id,
            "name": rep_row['название сте'],
            "representative_id": df.iloc[rep_idx].name,
            "product_ids": [df.iloc[i]['internal_id'] for i in indices],
            "significant_features": significant[:7],
            "score": len(indices) * 10 + (100 if group_id.startswith("card_") else 70),
            "size": len(indices)
        })
    return result