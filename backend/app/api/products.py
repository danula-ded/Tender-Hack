# backend/app/api/products.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.storage import storage

router = APIRouter(prefix="/api/products", tags=["products"])

class ProductCreate(BaseModel):
    name: str
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    country: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    characteristics: Optional[Dict[str, str]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    country: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    characteristics: Optional[Dict[str, str]] = None

@router.post("")
async def create_product(product_data: ProductCreate, target_group_id: Optional[str] = Query(default=None)):
    """Создание нового товара"""
    try:
        # Преобразуем характеристики в строку
        chars_str = ""
        if product_data.characteristics:
            chars_str = ";".join([f"{k}:{v}" for k, v in product_data.characteristics.items()])
        
        # Storage не имеет атрибута groups; original_id не обязателен для создания,
        # поэтому просто заполняем поля продукта без вычисления original_id
        product_dict = {
            'name': product_data.name,
            'model': product_data.model,
            'manufacturer': product_data.manufacturer,
            'country': product_data.country,
            'category_id': product_data.category_id,
            'category_name': product_data.category_name,
            'image_url': product_data.image_url,
            'characteristics': chars_str
        }
        
        product_id = storage.create_product(product_dict, target_group_id=target_group_id)
        return {"id": product_id, "status": "created"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")

@router.put("/{product_id}")
async def update_product(product_id: int, product_data: ProductUpdate):
    """Обновление товара"""
    try:
        # Получаем текущий продукт
        storage.cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = storage.cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Подготавливаем данные для обновления
        update_data = {}
        if product_data.name is not None:
            update_data['name'] = product_data.name
        if product_data.model is not None:
            update_data['model'] = product_data.model
        if product_data.manufacturer is not None:
            update_data['manufacturer'] = product_data.manufacturer
        if product_data.country is not None:
            update_data['country'] = product_data.country
        if product_data.category_id is not None:
            update_data['category_id'] = product_data.category_id
        if product_data.category_name is not None:
            update_data['category_name'] = product_data.category_name
        if product_data.image_url is not None:
            update_data['image_url'] = product_data.image_url
        if product_data.characteristics is not None:
            update_data['characteristics'] = ";".join([f"{k}:{v}" for k, v in product_data.characteristics.items()])
        
        storage.update_product(product_id, update_data)
        return {"status": "updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")

@router.delete("/{product_id}")
async def delete_product(product_id: int):
    """Удаление товара"""
    try:
        storage.delete_product(product_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

@router.get("/{product_id}")
async def get_product(product_id: int):
    """Получение информации о товаре"""
    try:
        storage.cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = storage.cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        columns = [desc[0] for desc in storage.cursor.description]
        product_dict = dict(zip(columns, product))
        
        # Парсим характеристики
        characteristics = {}
        if product_dict.get('characteristics'):
            for part in product_dict['characteristics'].split(';'):
                if ':' in part:
                    key, value = part.split(':', 1)
                    characteristics[key.strip()] = value.strip()
        
        product_dict['characteristics_dict'] = characteristics
        return product_dict
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting product: {str(e)}")