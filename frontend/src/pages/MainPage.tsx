import * as React from 'react';

import { FileDrop } from '@/components/file/FileDrop';
import { ProductList } from '@/components/product/ProductList';
import { SearchInput } from '@/components/product/SearchInput';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useProductsStore } from '@/hooks/use-products-store';

export default function MainPage() {
  const productsRaw = useProductsStore((s) => s.products);
  const products = productsRaw ?? [];
  const initialized = useProductsStore((s) => s.initialized);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const uploading = useProductsStore((s) => s.uploading);
  const uploadProgress = useProductsStore((s) => s.uploadProgress);

  const [askAgg, setAskAgg] = React.useState(false);

  React.useEffect(() => {
    if (!initialized) {
      void fetchProducts(true);
    }
  }, [initialized, fetchProducts]);

  React.useEffect(() => {
    if (!uploading && uploadProgress >= 100) {
      setAskAgg(true);
    }
  }, [uploading, uploadProgress]);

  const hasData = products.length > 0;

  if (!hasData) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8 px-4">
        <div className="max-w-xl text-center">
          <h1 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--black)' }}>
            Загрузите файл с товарами
          </h1>
          <p className="text-sm" style={{ color: 'var(--pale-black)' }}>
            Поддерживается Drag&Drop. После загрузки начнется обработка и появится список карточек.
          </p>
        </div>
        <FileDrop className="w-full" />

        <ConfirmDialog
          open={askAgg}
          onOpenChange={setAskAgg}
          title="Данные агрегированы?"
          description="Если данные не обработаны, то мы улучшим распределение карточек."
          confirmLabel="Да"
          cancelLabel="Нет"
          confirmVariant="default"
          onConfirm={() => setAskAgg(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4">
        <SearchInput />
      </div>
      <ProductList />
    </div>
  );
}
