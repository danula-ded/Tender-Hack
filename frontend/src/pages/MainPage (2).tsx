// frontend/src/pages/MainPage.tsx
import * as React from 'react';
import { FileDrop } from '@/components/file/FileDrop';
import { ProductList } from '@/components/product/ProductList';
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export default function MainPage() {
    const groups = useProductsStore((s) => s.groups);
    const initialized = useProductsStore((s) => s.initialized);
    const fetchGroups = useProductsStore((s) => s.fetchGroups);
    const reaggregate = useProductsStore((s) => s.reaggregate);
    const [strictness, setStrictness] = React.useState(0.7);

    React.useEffect(() => {
        if (!initialized) void fetchGroups(true);
    }, [initialized, fetchGroups]);

    const hasData = groups.length > 0;

    if (!hasData) {
        return (
            <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8 px-4">
                <div className="max-w-xl text-center">
                    <h1 className="mb-2 text-2xl font-semibold">
                        Загрузите файл с товарами
                    </h1>
                    <p className="text-sm text-gray-600">
                        Поддерживается Drag&Drop. После загрузки начнется обработка и появится список карточек.
                    </p>
                </div>
                <FileDrop className="w-full max-w-2xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Button onClick={() => fetchGroups(true)} variant="outline">
                    Обновить
                </Button>
                <div className="flex items-center gap-3">
                    <span className="text-sm">Строгость:</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={strictness * 100}
                        onChange={(e) => setStrictness(e.target.valueAsNumber / 100)}
                        className="w-48"
                    />
                    <span className="text-sm w-12">{(strictness * 100).toFixed(0)}%</span>
                    <Button onClick={() => reaggregate(strictness)}>Переагрегировать</Button>
                </div>
            </div>

            <ProductList />   {/* ← теперь работает, потому что useProductsStore возвращает groups */}
        </div>
    );
}