import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export function SearchInput() {
  const navigate = useNavigate();
  const setQuery = useProductsStore((s) => s.setQuery);
  const fetchGroups = useProductsStore((s) => s.fetchGroups);
  const storeQuery = useProductsStore((s) => s.query);

  const [value, setValue] = React.useState(storeQuery);

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (value !== storeQuery) {
        setQuery(value);
        void fetchGroups(true);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [value, storeQuery, setQuery, fetchGroups]);

  const onCreate = () => navigate('/create');

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-black/70" />
        <input
          className="w-full rounded-md border px-8 py-2 text-sm text-black"
          placeholder="Поиск..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button onClick={onCreate} variant="outline" className="text-black">
        <Plus className="mr-1 size-4 text-black" /> Создать карточку
      </Button>
    </div>
  );
}
