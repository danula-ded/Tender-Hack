// frontend/src/components/sidebar/Filters.tsx
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
    const fetchGroups = useProductsStore((s) => s.fetchGroups);
    const reaggregate = useProductsStore((s) => s.reaggregate);
    const storeQuery = useProductsStore((s) => s.query);
    const [localQuery, setLocalQuery] = React.useState(storeQuery);
    const [strictness, setStrictness] = React.useState(0.7);

    React.useEffect(() => {
        const id = setTimeout(() => {
            if (localQuery !== storeQuery) {
                setQuery(localQuery);
                fetchGroups(true);
            }
        }, 350);
        return () => clearTimeout(id);
    }, [localQuery, storeQuery, setQuery, fetchGroups]);

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="search">
                <AccordionTrigger>Поиск и фильтры</AccordionTrigger>
                <AccordionContent>
                    <input
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="Название, модель..."
                        className="w-full rounded-md border px-3 py-2 text-sm mb-2"
                    />
                    {/* Добавь другие фильтры по ТЗ, e.g. category */}
                    <Button variant="outline" onClick={() => setLocalQuery('')}>
                        Сбросить
                    </Button>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reaggregate">
                <AccordionTrigger>Переагрегация</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center gap-2 mb-2">
                        <span>Строгость:</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={strictness * 100}
                            onChange={(e) => setStrictness(e.target.valueAsNumber / 100)}
                            className="flex-1"
                        />
                        <span>{(strictness * 100).toFixed(0)}%</span>
                    </div>
                    <Button onClick={() => reaggregate(strictness)}>Переагрегировать</Button>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}