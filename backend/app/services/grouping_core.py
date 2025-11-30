# backend/app/services/grouping_core.py
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import re
from rapidfuzz import fuzz, process
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
import jellyfish

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductGrouper:
    def __init__(self, strictness: float = 0.7):
        self.strictness = strictness
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=None,
            ngram_range=(1, 2),
            min_df=2
        )
        
    def preprocess_text(self, text: str) -> str:
        """Базовая очистка текста"""
        if pd.isna(text):
            return ""
        text = str(text).lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def extract_key_features(self, row: pd.Series) -> Dict:
        """Извлечение ключевых характеристик из строки"""
        features = {}
        
        # Основные поля
        features['name'] = self.preprocess_text(row.get('name', row.get('название сте', '')))
        features['model'] = self.preprocess_text(row.get('model', row.get('модель', '')))
        features['manufacturer'] = self.preprocess_text(row.get('manufacturer', row.get('производитель', '')))
        features['category'] = self.preprocess_text(row.get('category_name', row.get('название категории', '')))
        
        # Парсинг характеристик
        chars_text = row.get('characteristics', row.get('характеристики', ''))
        if pd.notna(chars_text):
            features.update(self.parse_characteristics(str(chars_text)))
            
        return features
    
    def parse_characteristics(self, text: str) -> Dict:
        """Парсинг характеристик из строки"""
        features = {}
        if pd.isna(text):
            return features
            
        text = str(text)
        # Разные разделители
        parts = re.split(r'[;|,·•]', text)
        
        for part in parts:
            part = part.strip()
            if ':' in part:
                key, value = part.split(':', 1)
            elif '=' in part:
                key, value = part.split('=', 1)
            elif '-' in part and not part.startswith('-'):
                key, value = part.split('-', 1)
            else:
                continue
                
            key = self.preprocess_text(key)
            value = self.preprocess_text(value)
            
            if key and value and len(key) > 2:
                features[key] = value
                
        return features
    
    def build_product_signature(self, features: Dict) -> str:
        """Создание сигнатуры продукта для сравнения"""
        signature_parts = []
        
        # Приоритетные поля для группировки
        priority_fields = ['model', 'name', 'manufacturer', 'category']
        for field in priority_fields:
            if features.get(field):
                signature_parts.append(features[field])
        
        # Ключевые характеристики
        key_chars = ['цвет', 'color', 'размер', 'size', 'модель', 'model', 'тип', 'type']
        for char_key in key_chars:
            if char_key in features:
                signature_parts.append(features[char_key])
                
        return ' '.join(signature_parts)
    
    def calculate_similarity(self, sig1: str, sig2: str) -> float:
        """Расчет схожести между двумя сигнатурами"""
        if not sig1 or not sig2:
            return 0.0
            
        # Комбинированная метрика схожести
        token_ratio = fuzz.token_sort_ratio(sig1, sig2) / 100.0
        partial_ratio = fuzz.partial_ratio(sig1, sig2) / 100.0
        jaro_similarity = jellyfish.jaro_similarity(sig1, sig2)
        
        # Взвешенное среднее
        similarity = (token_ratio * 0.4 + partial_ratio * 0.3 + jaro_similarity * 0.3)
        return similarity
    
    def cluster_products(self, signatures: List[str]) -> List[int]:
        """Кластеризация продуктов на основе их сигнатур"""
        if len(signatures) < 2:
            return [0] * len(signatures)
            
        try:
            # TF-IDF векторизация
            tfidf_matrix = self.vectorizer.fit_transform(signatures)
            
            # Косинусная схожесть
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # DBSCAN кластеризация с адаптивным eps
            eps = 0.7 - (self.strictness * 0.3)  # strictness 0.7 -> eps 0.49
            clustering = DBSCAN(
                eps=eps,
                min_samples=2,
                metric='precomputed'
            )
            
            # Преобразование в расстояние
            distance_matrix = 1 - similarity_matrix
            labels = clustering.fit_predict(distance_matrix)
            
            return labels
            
        except Exception as e:
            logger.warning(f"Clustering failed: {e}, using fallback")
            # Фолбэк: группировка по первым словам названия
            return self.fallback_clustering(signatures)
    
    def fallback_clustering(self, signatures: List[str]) -> List[int]:
        """Простая группировка по первым словам"""
        groups = {}
        labels = []
        current_group = 0
        
        for i, sig in enumerate(signatures):
            eps_param = (10 - int(self.strictness * 10))
            first_words = ' '.join(sig.split()[:eps_param]) 
            
            if not first_words:
                labels.append(-1)
                continue
                
            if first_words not in groups:
                groups[first_words] = current_group
                current_group += 1
                
            labels.append(groups[first_words])
            
        return labels
    
    def aggregate_df(self, df: pd.DataFrame) -> Dict[str, List[int]]:
        """Основная функция агрегации"""
        logger.info(f"Starting aggregation for {len(df)} products with strictness {self.strictness}")
        
        if df.empty:
            return {}
            
        # Извлечение признаков
        features_list = []
        signatures = []
        
        for idx, row in df.iterrows():
            features = self.extract_key_features(row)
            features_list.append(features)
            signature = self.build_product_signature(features)
            signatures.append(signature)
        
        # Кластеризация
        labels = self.cluster_products(signatures)
        
        # Формирование групп
        groups = {}
        group_counter = 0
        
        for label in set(labels):
            if label == -1:  # Шум
                continue
                
            indices = [i for i, l in enumerate(labels) if l == label]
            if len(indices) >= 1:  # Группы из 1+ элемента
                group_id = f"grp_{group_counter}"
                groups[group_id] = indices
                group_counter += 1
        
        # Одиночные товары
        single_indices = [i for i, l in enumerate(labels) if l == -1]
        for i, idx in enumerate(single_indices):
            groups[f"single_{i}"] = [idx]
            
        logger.info(f"Created {len(groups)} groups")
        return groups

def aggregate_df(df: pd.DataFrame, strictness: float = 0.7) -> Dict[str, List[int]]:
    """Основная функция для импорта"""
    grouper = ProductGrouper(strictness)
    return grouper.aggregate_df(df)