from typing import List, Optional
from pydantic import BaseModel

class ProductGroup(BaseModel):
    id: str                                      # card_123, fb_556 и т.д.
    name: str                                    # общее название группы
    representative_id: int                       # id продукта для превью
    product_ids: List[int]                       # все продукты в группе
    score: float = 0.0                           # автоматическая оценка качества (0-100)
    user_score: Optional[int] = None             # 1-5 от модератора
    significant_features: List[str] = []         # какие хар-ки были ключевыми