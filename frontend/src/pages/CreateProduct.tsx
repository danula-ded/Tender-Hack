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
  const [title, setTitle] = React.useState('');
  const [model, setModel] = React.useState('');
  const [manufacturer, setManufacturer] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [categoryName, setCategoryName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [chars, setChars] = React.useState<Array<[string, string]>>([["", ""]]);
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const characteristics: Record<string, string> | null = (() => {
      const obj: Record<string, string> = {};
      for (const [k, v] of chars) {
        const key = k?.trim();
        if (key) obj[key] = v ?? '';
      }
      return Object.keys(obj).length ? obj : null;
    })();
    const newId = await createProduct({
      name: title,
      model: model || null,
      manufacturer: manufacturer || null,
      country: country || null,
      category_id: categoryId || null,
      category_name: categoryName || null,
      image_url: imageUrl || null,
      characteristics,
    }, groupId);
    await fetchGroups(true);
    const destGroup = groupId ? groupId : `manual_${newId}`;
    navigate(`/product/${destGroup}?card=${newId}`);
    setSaving(false);
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Создание карточки</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Название</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-black"
              placeholder="Название товара"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Модель</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Производитель</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Страна</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Категория (ID)</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Категория (название)</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Ссылка на изображение</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Характеристики</div>
          <div className="space-y-2">
            {chars.map(([k, v], idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="w-1/2 rounded-md border px-3 py-2 text-sm text-black"
                  placeholder="Ключ"
                  value={k}
                  onChange={(e) => {
                    const next = [...chars];
                    next[idx] = [e.target.value, v];
                    setChars(next);
                  }}
                />
                <input
                  className="w-1/2 rounded-md border px-3 py-2 text-sm text-black"
                  placeholder="Значение"
                  value={v}
                  onChange={(e) => {
                    const next = [...chars];
                    next[idx] = [k, e.target.value];
                    setChars(next);
                  }}
                />
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" className="text-black" onClick={() => setChars((arr) => [...arr, ["", ""]])}>
                <Plus className="mr-1 size-4 text-black" /> Добавить характеристику
              </Button>
            </div>
          </div>
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
