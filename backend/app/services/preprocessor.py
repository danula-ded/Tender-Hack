# backend/app/services/preprocessor.py
import pandas as pd
import re
import warnings
from typing import Dict, List, Tuple, Optional


# Популярные бренды для исправления опечаток
KNOWN_BRANDS = {
    "huskvarna", "husqvarna", "husqwarna", "husqvarna ab", "husqvarnaab"
}
BRAND_CANONICAL = {
    "husqvarna": "HUSQVARNA AB",
    "ozka": "Ozka",
    "superguider": "Superguider",
    "ekka": "EKKA",
    "michelin": "Michelin",
    "hankook": "Hankook",
}

def normalize_brand(brand: str) -> str:
    if not brand or pd.isna(brand):
        return ""
    b = brand.strip().lower()
    for wrong, correct in BRAND_CANONICAL.items():
        if wrong in b:
            return correct
    return brand.strip().title()

def parse_characteristics(raw: str) -> Dict[str, str]:
    if pd.isna(raw) or not raw:
        return {}
    result = {}
    parts = [p.strip() for p in str(raw).split(';') if p.strip()]
    for part in parts:
        if ':' not in part:
            continue
        key, val = part.split(':', 1)
        key = key.strip().lower()
        # Нормализация ключей
        key = re.sub(r'\s+', ' ', key)
        key = key.replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '')
        val = val.strip()
        result[key] = val
    return result

def extract_model_from_name(name: str) -> Optional[str]:
    if not name:
        return None
    # Ищем паттерны: 215/55R16, 18x9.50-8, 11.00 R22.5 и т.д.
    patterns = [
        r'\b\d+[xX]?\d*\.?\d*-?\d*[xX]?\d*\b',
        r'\b\d{2,4}/\d{2,3}[rR]?\d{1,3}\b',
        r'\b\d+\.\d+[rR]?\d+\b',
        r'\b\d+[xX]\d+[xX]?\d*\b',
    ]
    for pat in patterns:
        match = re.search(pat, name, re.I)
        if match:
            return match.group(0).upper()
    return None

def detect_column_shift(df: pd.DataFrame) -> List[int]:
    """Возвращает индексы строк, где явно съехали колонки"""
    shifted = []
    expected_cols = ['id сте', 'название сте', 'ссылка на картинку сте', 'модель',
                     'страна происхождения', 'производитель', 'id категории',
                     'название категории', 'характеристики']

    current_cols = [str(c).strip() for c in df.columns.tolist()]
    if current_cols[:9] != expected_cols:
        return list(range(len(df)))  # вся таблица битая
    for idx, row in df.iterrows():
        # Если в колонке "производитель" число > 100000 — скорее всего это id категории
        if pd.notna(row['производитель']) and str(row['производитель']).isdigit() and int(row['производитель']) > 100000:
            shifted.append(idx)
        if pd.notna(row['страна происхождения']) and len(str(row['страна происхождения'])) > 50:
            shifted.append(idx)
    return shifted

def preprocess_and_normalize(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    warnings_list = []
    original_len = len(df)

    shifted_rows = detect_column_shift(df)
    if len(shifted_rows) == len(df):
        warnings_list.append(
            "Обнаружен полный сдвиг колонок — структура файла не соответствует шаблону. "
            "Проверьте наличие лишних колонок (Unnamed: ...) и порядок колонок."
        )
        return pd.DataFrame(columns=df.columns), warnings_list  # пустой, но с колонками

    if shifted_rows:
        warnings_list.append(f"Обнаружен сдвиг колонок в {len(shifted_rows)} строках (пример: {shifted_rows[:5]}). "
                             "Эти строки будут пропущены.")
        df = df.drop(index=shifted_rows).reset_index(drop=True)
    # 2. Удаляем полные дубли
    df = df.drop_duplicates().reset_index(drop=True)
    # 3. Нормализация брендов
    df['производитель'] = df['производитель'].apply(normalize_brand)
    # 4. Заполняем пустую модель из названия
    mask = df['модель'].isna() | (df['модель'] == '')
    df.loc[mask, 'модель'] = df.loc[mask, 'название сте'].apply(extract_model_from_name)
    # 5. Парсим характеристики
    df['characteristics_raw'] = df['характеристики']
    df['characteristics_norm'] = df['характеристики'].apply(parse_characteristics)
    # 6. Приводим числовые поля к числу где возможно
    for col in ['Ширина профиля', 'Номинальный посадочный диаметр обода', 'Высота профиля']:
        key = col.lower().replace(' ', '_')
        def extract_num(val):
            if not val: return None
            match = re.search(r'[\d\.]+', str(val))
            return float(match.group()) if match else None
        if key in df['characteristics_norm'].iloc[0]:
            df[f'char_{key}'] = df['characteristics_norm'].apply(lambda x: extract_num(x.get(key)))
    # 7. Удаляем полностью пустые строки
    df = df.dropna(subset=['id сте', 'название сте'], how='all')
    warnings_list.append(f"Обработано: {original_len} → {len(df)} строк (-{original_len - len(df)})")
    return df, warnings_list