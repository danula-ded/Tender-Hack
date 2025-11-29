import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export function Filters() {
  const setQuery = useProductsStore((s) => s.setQuery);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [localQuery, setLocalQuery] = React.useState('');

  React.useEffect(() => {
    const id = setTimeout(() => {
      setQuery(localQuery);
      void fetchProducts(true);
    }, 350);
    return () => clearTimeout(id);
  }, [localQuery, setQuery, fetchProducts]);

  // Minimal filters placeholder; extend as backend supports
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="query">
        <AccordionTrigger>Поиск</AccordionTrigger>
        <AccordionContent>
          <input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Название, ID..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="actions">
        <AccordionTrigger>Действия</AccordionTrigger>
        <AccordionContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocalQuery('')}>
              Сбросить
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
