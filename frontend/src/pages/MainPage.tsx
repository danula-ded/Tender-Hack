// frontend/src/pages/MainPage.tsx
import * as React from 'react';
import { FileDrop } from '@/components/file/FileDrop';
import { ProductList } from '@/components/product/ProductList';
import { SearchInput } from '@/components/product/SearchInput';
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export default function MainPage() {
    const groups = useProductsStore((s) => s.groups);
    const loading = useProductsStore((s) => s.loading);
    const fetchGroups = useProductsStore((s) => s.fetchGroups);
    const reaggregate = useProductsStore((s) => s.reaggregate);
    const [strictness, setStrictness] = React.useState(70);

    React.useEffect(() => {
        void fetchGroups(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hasData = groups.length > 0;

    if (!hasData && !loading) {
        return (
            <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-8 px-4">
                <div className="max-w-2xl text-center">
                    <h1 className="mb-4 text-4xl font-bold">Загрузите файл с товарами</h1>
                    <p className="text-lg text-muted-foreground">
                        Поддерживается Drag&Drop. После загрузки начнётся обработка и появится список карточек.
                    </p>
                </div>
                <FileDrop className="w-full max-w-3xl" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            {/* Заголовок и управление */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Каталог товаров</h1>
                    <p className="text-muted-foreground">
                        {groups.length > 0 ? `${groups.length} групп товаров` : 'Загрузка...'}
                    </p>
                </div>
                <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">Строгость группировки:</span>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                value={strictness}
                                onChange={(e) => setStrictness(Number(e.target.value))}
                                className="w-48"
                            />
                            <span className="w-12 text-sm font-medium">{strictness}%</span>
                        </div>

                        <Button
                            onClick={() => reaggregate(strictness / 100)}
                            disabled={loading}
                            variant="secondary"
                        >
                            Переагрегировать
                        </Button>
                    </div>
                </div>
            </div>

            {/* Панель поиска и фильтров */}
            <div className="mb-6 space-y-4">
                <SearchInput />
            </div>

            {/* Список товаров */}
            <ProductList />
        </div>
    );
}