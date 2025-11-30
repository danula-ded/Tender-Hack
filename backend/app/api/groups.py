# backend/app/api/groups.py
from fastapi import APIRouter, Query, Request, Body, HTTPException
from app.services.storage import storage
from app.services.grouping_core import aggregate_df
import pandas as pd
from typing import Optional, List

router = APIRouter(prefix="/api/groups", tags=["groups"])

@router.post("/aggregate")
async def aggregate():
    df = storage.get_all_products_df()
    if df.empty:
        return {"error": "no data"}
    groups = aggregate_df(df)
    storage.apply_groups(groups)
    return {"status": "ok", "groups": len(groups)}

@router.post("/reaggregate")
def reaggregate(strictness: float = 0.7):
    df = storage.get_all_products_df()
    if df.empty:
        return {"error": "no data"}
    # Если есть плохие оценки, разбиваем
    bad_groups = [row[0] for row in storage.cursor.execute('SELECT group_id FROM groups WHERE user_score < 3').fetchall()]
    for gid in bad_groups:
        storage.delete_group(gid)
    groups = aggregate_df(df, strictness=strictness)
    storage.apply_groups(groups)
    return {"status": "ok", "strictness": strictness, "groups_created": len(groups)}

@router.get("")
def list_groups(
    request: Request,
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    offset: int = Query(0),
    limit: int = Query(20),
):
    filters = {k: v for k, v in request.query_params.items() if k not in ['query', 'category', 'offset', 'limit']}
    return storage.search_groups(query, category, filters, offset, limit)

@router.get("/{group_id}")
def get_group(group_id: str):
    return storage.get_group(group_id)

@router.delete("/{group_id}")
def delete_group(group_id: str):
    storage.delete_group(group_id)
    return {"status": "ok"}

@router.post("/{group_id}/rate")
def rate_group(group_id: str, score: int):
    storage.rate_group(group_id, score)
    return {"status": "ok"}

@router.post("/reaggregate-slice")
def reaggregate_slice(
    product_ids: List[int] = Body(..., embed=True),   # список id товаров из среза
    strictness: float = 0.7
):
    """Переагрегировать только выбранный пул товаров (даже из разных групп)"""
    df_slice = storage.cursor.execute(
        "SELECT * FROM products WHERE id IN ({})".format(','.join('?' for _ in product_ids)),
        product_ids
    ).fetchall()
    cols = [desc[0] for desc in storage.cursor.description]
    df = pd.DataFrame(df_slice, columns=cols)

    # Удаляем старые group_id у этих товаров
    storage.cursor.execute(
        "UPDATE products SET group_id = NULL WHERE id IN ({})".format(','.join('?' for _ in product_ids)),
        product_ids
    )
    storage.conn.commit()

    # Агрегируем только этот срез
    groups = aggregate_df(df, strictness=strictness)

    # Применяем новые группы (только для этих товаров)
    for gid, idxs in groups.items():
        rep_id = df.iloc[idxs[0]]['id']
        name = df.iloc[idxs[0]]['name']
        storage.cursor.execute(
            "INSERT OR REPLACE INTO groups (group_id, name, representative_id) VALUES (?, ?, ?)",
            (gid, name, rep_id)
        )
        storage.cursor.executemany(
            "UPDATE products SET group_id = ? WHERE id = ?",
            [(gid, df.iloc[i]['id']) for i in idxs]
        )
    storage.conn.commit()
    return {"status": "ok", "new_groups": len(groups)}

@router.post("/{group_id}/move")
def move_product_to_group(
    group_id: str,
    product_id: int,
    target_group_id: str = Body(..., embed=True)
):
    """Переместить одну СТЕ в другую группу (ручная правка)"""
    # Проверка существования
    storage.cursor.execute("SELECT 1 FROM products WHERE id = ?", (product_id,))
    if not storage.cursor.fetchone():
        raise HTTPException(404, "Product not found")
    storage.cursor.execute("SELECT 1 FROM groups WHERE group_id = ?", (target_group_id,))
    if not storage.cursor.fetchone():
        raise HTTPException(404, "Target group not found")

    storage.cursor.execute(
        "UPDATE products SET group_id = ? WHERE id = ?",
        (target_group_id, product_id)
    )
    storage.conn.commit()
    return {"status": "ok"}