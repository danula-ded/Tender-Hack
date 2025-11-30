# backend/app/services/storage.py
import sqlite3
from pathlib import Path
import pandas as pd
import json
from typing import Dict, List, Optional, Any
from app.models.product import Product
from app.models.group import ProductGroup
from app.services.grouping_core import aggregate_df
import logging

logger = logging.getLogger(__name__)

class Storage:
    def __init__(self):
        self.db_path = Path('data/catalog.db')
        self.db_path.parent.mkdir(exist_ok=True)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self._init_db()

    def _init_db(self):
        # Таблица продуктов (существующая)
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_id TEXT,
            name TEXT,
            model TEXT,
            manufacturer TEXT,
            country TEXT,
            category_id TEXT,
            category_name TEXT,
            image_url TEXT,
            characteristics TEXT,
            group_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
    
        # Таблица групп (существующая)
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            group_id TEXT PRIMARY KEY,
            name TEXT,
            representative_id INTEGER,
            product_count INTEGER DEFAULT 0,
            score REAL DEFAULT 0.0,
            user_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (representative_id) REFERENCES products (id)
        )''')
    
        # Добавьте эту таблицу для групповых атрибутов
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_attributes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT,
            attribute_name TEXT,
            attribute_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (group_id)
        )''')
    
        self.conn.commit()

    def add_products(self, df: pd.DataFrame):
        """Добавление продуктов в БД"""
        self.clear()
        
        for _, row in df.iterrows():
            self.cursor.execute('''
            INSERT INTO products 
            (original_id, name, model, manufacturer, country, category_id, category_name, image_url, characteristics)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(row.get('id сте', '')),
                str(row.get('название сте', '')),
                str(row.get('модель', '')),
                str(row.get('производитель', '')),
                str(row.get('страна происхождения', '')),
                str(row.get('id категории', '')),
                str(row.get('название категории', '')),
                str(row.get('ссылка на картинку сте', '')),
                str(row.get('характеристики', ''))
            ))
        self.conn.commit()
        logger.info(f"Added {len(df)} products to database")

    def apply_groups(self, groups: Dict[str, List[int]]):
        """Применение групп к продуктам в БД"""
        # Очистка старых групп
        self.cursor.execute('DELETE FROM groups')
        self.cursor.execute('UPDATE products SET group_id = NULL')
        
        # Создание новых групп
        for gid, indices in groups.items():
            if not indices:
                continue
                
            # Получаем первый продукт как представителя
            first_idx = indices[0]
            product = self.get_product_by_index(first_idx)
            if not product:
                continue
                
            rep_id = product['id']
            name = product['name']
            
            # Создаем группу
            self.cursor.execute(
                'INSERT INTO groups (group_id, name, representative_id, product_count) VALUES (?, ?, ?, ?)',
                (gid, name, rep_id, len(indices))
            )
            
            # Обновляем продукты
            for idx in indices:
                product = self.get_product_by_index(idx)
                if product:
                    self.cursor.execute(
                        'UPDATE products SET group_id = ? WHERE id = ?',
                        (gid, product['id'])
                    )
        
        self.conn.commit()
        logger.info(f"Applied {len(groups)} groups to database")

    def get_product_by_index(self, idx: int) -> Optional[Dict]:
        """Получить продукт по индексу (для совместимости)"""
        self.cursor.execute('SELECT * FROM products LIMIT 1 OFFSET ?', (idx,))
        row = self.cursor.fetchone()
        if not row:
            return None
            
        columns = [desc[0] for desc in self.cursor.description]
        return dict(zip(columns, row))

    def get_all_products_df(self) -> pd.DataFrame:
        """Получить все продукты как DataFrame"""
        return pd.read_sql('SELECT * FROM products', self.conn)

    def search_groups(self, query: str = None, category: str = None,
                    filters: dict = None, offset: int = 0, limit: int = 20):

        try:
            sql = """
                SELECT DISTINCT g.group_id, g.name, g.product_count, g.created_at
                FROM groups g
                LEFT JOIN products p ON g.group_id = p.group_id
                WHERE 1=1
            """

            params = []

            # Поиск по названию группы или товара
            if query:
                sql += " AND (g.name LIKE ? OR p.name LIKE ?)"
                q = f"%{query}%"
                params.extend([q, q])

            # Поиск по категории (в таблице products)
            if category:
                sql += " AND p.category_name LIKE ?"
                params.append(f"%{category}%")

            # Дополнительные фильтры
            if filters:
                for key, value in filters.items():
                    # фильтруем только поля таблицы groups или products
                    if key in ["name", "category_name", "manufacturer", "model"]:
                        sql += f" AND p.{key} LIKE ?"
                        params.append(f"%{value}%")
                    elif key in ["product_count"]:
                        sql += f" AND g.{key} = ?"
                        params.append(value)

            sql += " ORDER BY g.product_count DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = self.cursor.execute(sql, params).fetchall()

            result = []
            for g in rows:
                group_id = g[0]

                # Получаем продукты группы
                products = self.cursor.execute("""
                    SELECT id, name, category_name, image_url 
                    FROM products 
                    WHERE group_id = ? 
                    LIMIT 100
                """, (group_id,)).fetchall()

                product_list = [{
                    "product_id": p[0],
                    "name": p[1],
                    "category": p[2],
                    "image_url": p[3]
                } for p in products]

                result.append({
                    "group_id": g[0],
                    "name": g[1],
                    "product_count": g[2],
                    "created_at": g[3],
                    "products": product_list,
                    "attributes": {}
                })

            return result

        except Exception as e:
            logger.error(f"Error in search_groups: {e}")
            return []


    def get_group(self, group_id: str) -> Optional[ProductGroup]:
        """Получить группу по ID"""
        row = self.cursor.execute(
            'SELECT * FROM groups WHERE group_id = ?', (group_id,)
        ).fetchone()
        
        if not row:
            return None
            
        columns = [desc[0] for desc in self.cursor.description]
        group_dict = dict(zip(columns, row))
        
        # Продукты группы
        product_rows = self.cursor.execute(
            'SELECT id FROM products WHERE group_id = ?', (group_id,)
        ).fetchall()
        product_ids = [p[0] for p in product_rows]
        
        return ProductGroup(
            id=group_dict['group_id'],
            name=group_dict['name'],
            representative_id=group_dict['representative_id'],
            product_ids=product_ids,
            score=group_dict['score'],
            user_score=group_dict['user_score']
        )

    # Остальные методы остаются примерно такими же, но с улучшенной обработкой ошибок
    def rate_group(self, group_id: str, score: int):
        try:
            self.cursor.execute(
                'UPDATE groups SET user_score = ? WHERE group_id = ?',
                (score, group_id)
            )
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error rating group {group_id}: {e}")

    def save_groups(self, groups: List[ProductGroup]):
        """Сохраняет группы в базу данных"""
        try:
            for group in groups:
                # Сохраняем группу
                self.cursor.execute('''
                INSERT OR REPLACE INTO groups (group_id, name, representative_id, product_count, score, user_score)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    group.group_id,
                    group.name,
                    group.representative_id,
                    len(group.products),
                    group.score,
                    group.user_score
                ))
            
                # Сохраняем атрибуты группы
                for attr_name, attr_value in group.attributes.items():
                    self.cursor.execute('''
                    INSERT OR REPLACE INTO group_attributes (group_id, attribute_name, attribute_value)
                    VALUES (?, ?, ?)
                    ''', (group.group_id, attr_name, str(attr_value)))
            
                # Обновляем продукты с group_id
                for product in group.products:
                    self.cursor.execute(
                        'UPDATE products SET group_id = ? WHERE id = ?',
                        (group.group_id, product.id)
                    )
        
            self.conn.commit()
            logger.info(f"Saved {len(groups)} groups to database")
        
        except Exception as e:
            logger.error(f"Error saving groups: {e}")
            raise
    def delete_group(self, group_id: str):
        try:
            self.cursor.execute('UPDATE products SET group_id = NULL WHERE group_id = ?', (group_id,))
            self.cursor.execute('DELETE FROM groups WHERE group_id = ?', (group_id,))
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error deleting group {group_id}: {e}")

    def create_product(self, product_data: dict, target_group_id: Optional[str] = None) -> int:
        """Создание нового продукта. Если указан target_group_id, добавляет товар в существующую группу.

        Иначе создаёт новую группу вида manual_{product_id} через _auto_assign_group.
        """
        try:
            self.cursor.execute('''
            INSERT INTO products 
            (original_id, name, model, manufacturer, country, category_id, category_name, image_url, characteristics)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                product_data.get('original_id', ''),
                product_data.get('name', ''),
                product_data.get('model', ''),
                product_data.get('manufacturer', ''),
                product_data.get('country', ''),
                product_data.get('category_id', ''),
                product_data.get('category_name', ''),
                product_data.get('image_url', ''),
                product_data.get('characteristics', '')
            ))
            new_id = self.cursor.lastrowid
            self.conn.commit()

            if target_group_id:
                # Проверяем, что группа существует
                grp = self.cursor.execute('SELECT group_id, product_count FROM groups WHERE group_id = ?', (target_group_id,)).fetchone()
                if not grp:
                    raise ValueError(f"Group '{target_group_id}' not found")

                # Привязываем товар к группе
                self.cursor.execute('UPDATE products SET group_id = ? WHERE id = ?', (target_group_id, new_id))
                # Обновляем счётчик товаров группы
                self.cursor.execute('UPDATE groups SET product_count = COALESCE(product_count, 0) + 1 WHERE group_id = ?', (target_group_id,))
                self.conn.commit()
            else:
                # Автоматическое определение/создание группы
                self._auto_assign_group(new_id)

            return new_id
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            raise

    def _auto_assign_group(self, product_id: int):
        """Автоматическое назначение группы для продукта"""
        try:
            # Получаем все группы и их продукты для сравнения
            all_groups = self.cursor.execute('SELECT group_id FROM groups').fetchall()
            product = self.cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
            
            if not product:
                return
                
            # Простая логика сопоставления - в реальности нужно использовать grouping_core
            # Временная заглушка - создаем новую группу
            new_group_id = f"manual_{product_id}"
            self.cursor.execute(
                'INSERT INTO groups (group_id, name, representative_id, product_count) VALUES (?, ?, ?, 1)',
                (new_group_id, product[2], product_id)  # product[2] - name
            )
            self.cursor.execute(
                'UPDATE products SET group_id = ? WHERE id = ?',
                (new_group_id, product_id)
            )
            self.conn.commit()
            
        except Exception as e:
            logger.error(f"Error auto-assigning group: {e}")

    def update_product(self, product_id: int, product_data: dict):
        """Обновление продукта"""
        try:
            self.cursor.execute('''
            UPDATE products SET 
            name=?, model=?, manufacturer=?, country=?, category_id=?, category_name=?, image_url=?, characteristics=?
            WHERE id=?
            ''', (
                product_data.get('name'),
                product_data.get('model'),
                product_data.get('manufacturer'),
                product_data.get('country'),
                product_data.get('category_id'),
                product_data.get('category_name'),
                product_data.get('image_url'),
                product_data.get('characteristics'),
                product_id
            ))
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error updating product {product_id}: {e}")
            raise

    def delete_product(self, product_id: int):
        """Удаление продукта"""
        try:
            # Получаем группу продукта
            group_row = self.cursor.execute(
                'SELECT group_id FROM products WHERE id = ?', (product_id,)
            ).fetchone()
            
            self.cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
            
            # Обновляем счетчик группы
            if group_row and group_row[0]:
                self.cursor.execute(
                    'UPDATE groups SET product_count = product_count - 1 WHERE group_id = ?',
                    (group_row[0],)
                )
                
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {e}")
            raise

    def clear(self):
        """Очистка всех данных"""
        self.cursor.execute('DELETE FROM products')
        self.cursor.execute('DELETE FROM groups')
        self.conn.commit()

storage = Storage()