import pandas as pd
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from dataclasses import dataclass
from typing import Dict, List

# Load JSONs (assume in data/)
with open('data/category_rules.json', 'r', encoding='utf-8') as f:
    category_rules = json.load(f)

with open('data/category_signatures.json', 'r', encoding='utf-8') as f:
    category_signatures = json.load(f)

@dataclass
class AggregationResult:
    groups: Dict[str, List[int]]
    category: str
    strategy: str
    quality_score: float
    metrics: Dict

class IndustrialGoodsGrouper:
    def __init__(self):
        self.signatures = self._load_signatures()
        self.rules = self._load_rules()

    def _load_signatures(self):
        path = "category_signatures.json"
        if not os.path.exists(path):
            print("Нет category_signatures.json")
            return {}
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _load_rules(self):
        path = "category_rules.json"
        if not os.path.exists(path):
            return {}
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _safe_text(self, x):
        if pd.isna(x): return ""
        return str(x)

    def _detect_category(self, text: str) -> str:
        text = text.lower()
        scores = {}
        for cat, patterns in self.signatures.items():
            score = sum(1 for p in patterns if re.search(p, text, re.IGNORECASE))
            if score > 0:
                scores[cat] = score
        return max(scores, key=scores.get) if scores else "unknown"

    def _pre_cluster(self, df: pd.DataFrame) -> List[List[int]]:
        texts = (df['название сте'].fillna("") + " " + df['характеристики'].fillna("")).tolist()
        vectorizer = TfidfVectorizer(max_features=300, ngram_range=(1,3), min_df=2, max_df=0.8)
        try:
            X = vectorizer.fit_transform(texts)
            clustering = DBSCAN(eps=0.5, min_samples=3, metric='euclidean')
            labels = clustering.fit_predict(X.toarray())
            clusters = {}
            for idx, label in enumerate(labels):
                if label != -1:
                    clusters.setdefault(label, []).append(idx)
            result = [v for v in clusters.values() if len(v) >= 5]
            return result or [list(range(len(df)))]
        except:
            return [list(range(len(df)))]

    def group(self, df: pd.DataFrame, min_group_size: int = 2) -> AggregationResult:
        print(f"Старт | {len(df)} строк")

        clusters = self._pre_cluster(df)
        print(f"Кластеров: {len(clusters)}")

        all_groups = {}
        gid = 0

        for i, indices in enumerate(clusters):
            sub = df.iloc[indices].copy()
            sample = " ".join(sub['характеристики'].fillna("").head(30))
            cat = self._detect_category(sample)
            print(f"  Кластер {i+1} | {len(indices)} строк | Категория: {cat}")

            rule = self.rules.get(cat, {})
            size_pat = rule.get("size_patterns", [r'\d{3}/\d{2}[rR]?\d{2}', r'\d+[xX]\d+'])
            model_pat = rule.get("model_patterns", [r'\b\w{4,}\b'])

            def key(row):
                text = " ".join([self._safe_text(row['название сте']), self._safe_text(row['модель']), self._safe_text(row['характеристики']) ]).lower()
                size = next((re.search(p, text, re.I).group(0).upper() for p in size_pat if re.search(p, text, re.I)), "")
                model = next((re.search(p, text).group(0).upper() for p in model_pat if re.search(p, text)), "")
                return f"{model}|{size}".strip('|')

            sub['key'] = sub.apply(key, axis=1)
            for k, g in sub.groupby('key'):
                indices = g.index.tolist()
                if len(indices) >= min_group_size and k:
                    all_groups[f"card_{gid}"] = indices
                    gid += 1

        # Fallback для остатков
        used = [i for g in all_groups.values() for i in g]
        remaining = df.drop(used)
        if len(remaining) > 20:
            print("Fallback для остатков")
            texts = remaining['название сте'].fillna("") + " " + remaining['характеристики'].fillna("")
            vectorizer = TfidfVectorizer(max_features=100)
            X = vectorizer.fit_transform(texts)
            labels = DBSCAN(eps=0.3, min_samples=2).fit_predict(X.toarray())
            for label in set(labels):
                if label != -1:
                    idxs = [remaining.index[i] for i, l in enumerate(labels) if l == label]
                    if len(idxs) >= 2:
                        all_groups[f"fb_{gid}"] = idxs
                        gid += 1

        covered = sum(len(v) for v in all_groups.values())
        quality = round(covered / len(df) * 100, 2)
        print(f"ФИНАЛ: Групп: {len(all_groups)} | Покрытие: {quality}%")

        return AggregationResult(
            groups=all_groups,
            category="mixed",
            strategy="precluster+rules",
            quality_score=quality,
            metrics={"clusters": len(clusters), "groups": len(all_groups), "covered": covered}
        )

def aggregate_df(df: pd.DataFrame) -> AggregationResult:
    grouper = IndustrialGoodsGrouper()
    return grouper.group(df, min_group_size=2)