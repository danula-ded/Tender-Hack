import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/hooks/use-products-store';
import { Plus } from 'lucide-react';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const groupId = params.get('groupId') || undefined;
  const createProduct = useProductsStore((s) => s.createProduct);
  const fetchGroups = useProductsStore((s) => s.fetchGroups);
  const moveProductToGroup = useProductsStore((s) => s.moveProductToGroup);
  const [title, setTitle] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const newId = await createProduct({ name: title });
    // если передан target groupId — переносим созданный товар из manual_{id}
    if (newId && groupId) {
      const fromGroupId = `manual_${newId}`;
      await moveProductToGroup(fromGroupId, newId, groupId);
    }
    await fetchGroups(true);
    const destGroup = groupId ? groupId : `manual_${newId}`;
    navigate(`/product/${destGroup}?card=${newId}`);
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
          <Button type="submit" disabled={saving} variant="outline" className="text-black">
            <Plus className="mr-1 size-4 text-black" />
            {saving ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  );
}
