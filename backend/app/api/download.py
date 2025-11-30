# backend/app/api/download.py
from fastapi import APIRouter, Response
from typing import Optional
from app.services.storage import storage
import pandas as pd
from io import BytesIO

router = APIRouter(prefix="/api", tags=["download"])

@router.get("/download")
def download(slice_ids: Optional[str] = None):   # например ?slice_ids=1,2,3,45
    if slice_ids:
        ids = [int(x) for x in slice_ids.split(',')]
        df = pd.read_sql(
            "SELECT * FROM products WHERE id IN ({})".format(','.join('?' for _ in ids)),
            storage.conn, params=ids
        )
    else:
        df = pd.read_sql("SELECT * FROM products", storage.conn)

    # Добавляем читаемые колонки
    df['group_size'] = df.groupby('group_id')['id'].transform('count')
    df['is_grouped'] = df['group_size'] > 1

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return Response(
        output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=aggregated_slice.xlsx"}
    )