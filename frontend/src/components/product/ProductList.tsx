import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductsStore } from '@/hooks/use-products-store';
import { ProductCard } from '@/components/product/ProductCard';

export function ProductList() {
  const productsRaw = useProductsStore((s) => s.products);
  const products = productsRaw ?? [];
  const total = useProductsStore((s) => s.total) ?? 0;
  const loading = useProductsStore((s) => s.loading) ?? false;
  const loadingMore = useProductsStore((s) => s.loadingMore) ?? false;
  const infinite = useProductsStore((s) => s.infinite) ?? true;
  const pageSize = useProductsStore((s) => s.pageSize) ?? 20;
  const setPageSize = useProductsStore((s) => s.setPageSize);
  const setInfinite = useProductsStore((s) => s.setInfinite);
  const fetchMore = useProductsStore((s) => s.fetchMore);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!infinite) return;
    const el = sentinelRef.current;
    if (!el) return;
    const int = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          void fetchMore();
        }
      });
    });
    int.observe(el);
    return () => int.disconnect();
  }, [infinite, fetchMore]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          Показать на странице:
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={infinite}
            onChange={(e) => setInfinite(e.target.checked)}
          />
          Автоподгрузка
        </label>
      </div>

      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((g) => (
            <ProductCard key={g.id} group={g} />
          ))}
        </div>
      )}

      {!infinite ? (
        <div className="flex justify-center">
          <Button
            onClick={() => void fetchMore()}
            disabled={loadingMore || products.length >= total}
          >
            {products.length >= total
              ? 'Больше нет'
              : loadingMore
                ? 'Загрузка...'
                : 'Загрузить еще'}
          </Button>
        </div>
      ) : (
        <div ref={sentinelRef} />
      )}
    </div>
  );
}
