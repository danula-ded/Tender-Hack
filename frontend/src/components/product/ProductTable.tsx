import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsStore } from '@/hooks/use-products-store';

export function ProductTable() {
  const groups = useProductsStore((s) => s.groups);
  const navigate = useNavigate();

  if (!Array.isArray(groups) || groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.id} className="rounded-lg border bg-white">
          <div
            className="flex items-center gap-3 border-b p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/product/${g.id}`)}
          >
            <div className="h-10 w-10 overflow-hidden rounded border bg-gray-50">
              {g.representative_image_url ? (
                <img
                  src={g.representative_image_url}
                  alt={g.name || String(g.id)}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-black/50">img</div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-black">{g.name || 'Без названия'}</div>
              <div className="text-xs text-black/60">ID: {g.id} • {g.product_ids.length} товаров</div>
            </div>
          </div>

          {/* Вложенный список товаров с отступом влево */}
          {Array.isArray(g.products) && g.products.length > 0 ? (
            <div className="p-3">
              <div className="space-y-2">
                {g.products.map((p: any, idx: number) => (
                  <div
                    key={p.product_id ?? p.id ?? `${g.id}-${idx}`}
                    className="flex items-center gap-3 pl-6"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded border bg-gray-50 flex-shrink-0">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name || String(p.product_id ?? p.id)}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-black/50">img</div>
                      )}
                    </div>
                    <button
                      className="text-left text-sm text-black hover:underline"
                      onClick={() => navigate(`/product/${g.id}?card=${p.product_id ?? p.id}`)}
                    >
                      {idx === 0 ? (
                        <span className="mr-2 rounded bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">Главная</span>
                      ) : null}
                      {p.name || p.model || `Товар ${p.product_id ?? p.id}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
