// frontend/src/components/product/ProductList.tsx
import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products-store';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export function ProductList() {
    const groups = useProductsStore(s => s.groups);
    const loading = useProductsStore(s => s.loading);
    const initialized = useProductsStore(s => s.initialized);
    const fetchGroups = useProductsStore(s => s.fetchGroups);
    const total = useProductsStore(s => s.total);
    const observer = React.useRef<IntersectionObserver | null>(null);
    const lastElementRef = React.useCallback((node: Element | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && groups.length < total) {
                const { page } = useProductsStore.getState();
                useProductsStore.setState({ page: page + 1 });
                void fetchGroups();
            }
        });
        if (node && observer.current) observer.current.observe(node);
    }, [loading, groups.length, total, fetchGroups]);

    // Если ещё ничего не загружено
    if (!initialized) {
        return (
            <div className="text-center py-12 text-gray-500">
                Загрузите файл для начала работы
            </div>
        );
    }

    // Пока грузим группы
    if (loading && groups.length === 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    // Если групп нет
    if (groups.length === 0) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Группы товаров не найдены</p>
                <p className="text-sm text-gray-500 mt-2">
                    Попробуйте переагрегировать с меньшей строгостью
                </p>
            </div>
        );
    }

    // Остальной код как был, в grid добавить ref на последний элемент
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group, index) => (
                <div key={group.id} ref={index === groups.length - 1 ? lastElementRef : null}>
                    <ProductCard group={group} />
                </div>
            ))}
        </div>
    );
}