import * as React from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export function SearchInput() {
  const setQuery = useProductsStore((s) => s.setQuery);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const createProduct = useProductsStore((s) => s.createProduct);
  const storeQuery = useProductsStore((s) => s.query);

  const [value, setValue] = React.useState(storeQuery);

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (value !== storeQuery) {
        setQuery(value);
        void fetchProducts(true);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [value, storeQuery, setQuery, fetchProducts]);

  const onCreate = async () => {
    const created = await createProduct({ title: 'Новая карточка' });
    // Redirect to list or product page could be handled here if needed
    void created;
    await fetchProducts(true);
  };

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50" />
        <input
          className="w-full rounded-md border px-8 py-2 text-sm"
          placeholder="Поиск..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button onClick={onCreate}>
        <Plus className="mr-1 size-4" /> Создать карточку
      </Button>
    </div>
  );
}
