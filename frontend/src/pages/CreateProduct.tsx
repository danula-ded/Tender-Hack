import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export default function CreateProduct() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const groupId = params.get('groupId') || undefined;
    const createProduct = useProductsStore((s) => s.createProduct);
    const fetchGroups = useProductsStore((s) => s.fetchGroups);
    const [productData, setProductData] = React.useState({ name: '', /* другие поля */ });
    const [saving, setSaving] = React.useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await createProduct({ ...productData, groupId });
        await fetchGroups(true);
        navigate(groupId ? `/product/${groupId}` : '/');
        setSaving(false);
    };

    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="mb-4 text-xl font-semibold">Создание карточки</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Название</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Название товара"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs opacity-70">
              {groupId
                ? 'Будет добавлено в текущую группу'
                : 'Автоматическое распределение по группе'}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    );
}
