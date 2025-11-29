import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const groupId = params.get('groupId') || undefined;
  const createProduct = useProductsStore((s) => s.createProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [title, setTitle] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createProduct({ title, groupId });
      await fetchProducts(true);
      if (groupId) {
        navigate(`/product/${groupId}`);
      } else {
        navigate('/');
      }
    } finally {
      setSaving(false);
    }
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
