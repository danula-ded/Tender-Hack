import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductsStore } from '@/hooks/use-products-store';
import type { ProductVariant } from '@/types/product';

export function ProductDetail({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const cardParam = params.get('card') || '';

  const currentGroup = useProductsStore((s) => s.currentGroup);
  const fetchGroup = useProductsStore((s) => s.fetchGroup);
  const updateVariant = useProductsStore((s) => s.updateVariant);
  const deleteProduct = useProductsStore((s) => s.deleteProduct);
  const deleteVariant = useProductsStore((s) => s.deleteVariant);
  const getProduct = useProductsStore((s) => s.getProduct);
  const createProduct = useProductsStore((s) => s.createProduct);

  const [selected, setSelected] = React.useState<ProductVariant | null>(null);
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  const [fields, setFields] = React.useState<Array<[string, string]>>([]);
  const [title, setTitle] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteVarOpen, setDeleteVarOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [cName, setCName] = React.useState('');
  const [cModel, setCModel] = React.useState('');
  const [cManufacturer, setCManufacturer] = React.useState('');
  const [cCountry, setCCountry] = React.useState('');
  const [cCategoryId, setCCategoryId] = React.useState('');
  const [cCategoryName, setCCategoryName] = React.useState('');
  const [cImageUrl, setCImageUrl] = React.useState('');
  const [cChars, setCChars] = React.useState<Array<[string, string]>>([["", ""]]);
  const [creatingSaving, setCreatingSaving] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const g = currentGroup?.id === groupId ? currentGroup : await fetchGroup(groupId);
      if (!g) return;
      setTitle(g.name);
      const details = await Promise.all((g.product_ids ?? []).map((pid: number) => getProduct(pid)));
      const list: ProductVariant[] = details.map((p: any) => ({
        id: String(p.id),
        name: p.name || String(p.id),
        imageUrl: p.image_url,
        attributes: p.characteristics_dict || {},
        status: 'in_review',
      }));
      setVariants(list);
      const v = list.find((x) => x.id === cardParam) || list[0];
      if (v && v.id !== cardParam) {
        const sp = new URLSearchParams(params);
        sp.set('card', v.id);
        setParams(sp, { replace: true });
      }
      setSelected(v ?? null);
      setFields(
        v
          ? Object.entries(v.attributes).map(([k, val]) => [k, String(val)] as [string, string])
          : [],
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, cardParam]);

  if (!selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Карточка</div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Перемещение товара между группами реализовано в store.moveProductToGroup

  const onSave = async () => {
    const attrs: Record<string, string> = {};
    for (const [k, v] of fields) {
      if (!k) continue;
      attrs[k] = v;
    }
    const updated: ProductVariant = { ...selected, attributes: attrs };
    await updateVariant(groupId, updated);
  };

  const addField = () => setFields((arr) => [...arr, ['', '']]);
  const removeField = (i: number) => setFields((arr) => arr.filter((_, idx) => idx !== i));

  // variants managed via local state above

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs opacity-60">Группа #{groupId}</div>
          <h2 className="text-xl font-semibold text-black">{selected?.name || title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-black" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1 size-4 text-black" /> Удалить карточку
          </Button>
          <Button variant="outline" className="text-black" onClick={() => setDeleteVarOpen(true)}>
            <Trash2 className="mr-1 size-4 text-black" /> Удалить вариант
          </Button>
          <Button variant="outline" className="text-black" onClick={onSave}>
            <Save className="mr-1 size-4 text-black" /> Сохранить
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="md:w-56">
          <label className="mb-1 block text-sm font-medium">Вариант</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={selected.id}
            onChange={(e) => {
              const nextId = e.target.value;
              const next = variants.find((x) => x.id === nextId) || null;
              if (next) {
                setSelected(next);
                setFields(
                  Object.entries(next.attributes).map(([k, val]) => [k, String(val)] as [string, string]),
                );
              }
              const sp = new URLSearchParams(params);
              sp.set('card', nextId);
              setParams(sp, { replace: true });
            }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.sku || v.id}
              </option>
            ))}
          </select>
          {/* Миниатюры вариантов для быстрого переключения */}
          {variants.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {variants.map((v) => (
                <button
                  key={v.id}
                  className={`h-14 w-14 flex-shrink-0 rounded border ${v.id === selected.id ? 'border-black' : 'border-gray-200'}`}
                  onClick={() => {
                    setSelected(v);
                    setFields(
                      Object.entries(v.attributes).map(([k, val]) => [k, String(val)] as [string, string]),
                    );
                    const sp = new URLSearchParams(params);
                    sp.set('card', v.id);
                    setParams(sp, { replace: true });
                  }}
                  title={v.name || v.id}
                >
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.name || v.id} className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-black/50">No img</div>
                  )}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            className="mt-2 w-full"
            variant="outline"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus className="mr-1 size-4 text-black" /> {creating ? 'Отмена' : 'Создать вариант'}
          </Button>
        </div>

        <div className="flex-1">
          {creating ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  setCreatingSaving(true);
                  const characteristics: Record<string, string> | null = (() => {
                    const obj: Record<string, string> = {};
                    for (const [k, v] of cChars) {
                      const key = k?.trim();
                      if (key) obj[key] = v ?? '';
                    }
                    return Object.keys(obj).length ? obj : null;
                  })();
                  const newId = await createProduct({
                    name: cName,
                    model: cModel || null,
                    manufacturer: cManufacturer || null,
                    country: cCountry || null,
                    category_id: cCategoryId || null,
                    category_name: cCategoryName || null,
                    image_url: cImageUrl || null,
                    characteristics,
                  }, groupId);
                  if (newId) {
                    const p = await getProduct(newId);
                    const newVar: ProductVariant = {
                      id: String(p.id),
                      name: p.name || 'Новый вариант',
                      attributes: p.characteristics_dict || {},
                      status: selected.status,
                      imageUrl: p.image_url,
                    };
                    setVariants((arr) => [...arr, newVar]);
                    setSelected(newVar);
                    setFields(Object.entries(newVar.attributes).map(([k, val]) => [k, String(val)] as [string, string]));
                    const sp = new URLSearchParams(params);
                    sp.set('card', newVar.id);
                    setParams(sp, { replace: true });
                    setCreating(false);
                    setCName(''); setCModel(''); setCManufacturer(''); setCCountry(''); setCCategoryId(''); setCCategoryName(''); setCImageUrl(''); setCChars([["", ""]]);
                    void fetchGroup(groupId);
                  }
                  setCreatingSaving(false);
                })();
              }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="col-span-1 md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Название</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" placeholder="Название товара" value={cName} onChange={(e) => setCName(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Модель</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cModel} onChange={(e) => setCModel(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Производитель</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cManufacturer} onChange={(e) => setCManufacturer(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Страна</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cCountry} onChange={(e) => setCCountry(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Категория (ID)</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cCategoryId} onChange={(e) => setCCategoryId(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Категория (название)</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cCategoryName} onChange={(e) => setCCategoryName(e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Ссылка на изображение</label>
                  <input className="w-full rounded-md border px-3 py-2 text-sm text-black" value={cImageUrl} onChange={(e) => setCImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Характеристики</div>
                <div className="space-y-2">
                  {cChars.map(([k, v], idx) => (
                    <div key={idx} className="flex gap-2">
                      <input className="w-1/2 rounded-md border px-3 py-2 text-sm text-black" placeholder="Ключ" value={k} onChange={(e) => { const next = [...cChars]; next[idx] = [e.target.value, v]; setCChars(next); }} />
                      <input className="w-1/2 rounded-md border px-3 py-2 text-sm text-black" placeholder="Значение" value={v} onChange={(e) => { const next = [...cChars]; next[idx] = [k, e.target.value]; setCChars(next); }} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="text-black" onClick={() => setCChars((arr) => [...arr, ["", ""]])}>
                    <Plus className="mr-1 size-4 text-black" /> Добавить характеристику
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" className="text-black" onClick={() => setCreating(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={creatingSaving} variant="outline" className="text-black">
                  {creatingSaving ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {selected.imageUrl ? (
                <div className="mb-3 h-48 w-full overflow-hidden rounded-md border bg-white">
                  <img
                    src={selected.imageUrl}
                    alt={selected.name || selected.id}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="mb-2 text-sm font-medium">Поля</div>
              <div className="space-y-2">
                {fields.map(([k, v], i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="w-48 rounded-md border px-3 py-2 text-sm"
                      placeholder="Ключ"
                      value={k}
                      onChange={(e) =>
                        setFields((arr) =>
                          arr.map((row, idx) => (idx === i ? [e.target.value, row[1]] : row)),
                        )
                      }
                    />
                    <input
                      className="flex-1 rounded-md border px-3 py-2 text-sm"
                      placeholder="Значение"
                      value={v}
                      onChange={(e) =>
                        setFields((arr) =>
                          arr.map((row, idx) => (idx === i ? [row[0], e.target.value] : row)),
                        )
                      }
                    />
                    <Button variant="outline" onClick={() => removeField(i)}>
                      Удалить
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addField}>
                  <Plus className="mr-1 size-4" /> Добавить поле
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить всю группу?"
        description="Это удалит все варианты."
        onConfirm={async () => {
          await deleteProduct(groupId);
          navigate('/');
        }}
      />

      <ConfirmDialog
        open={deleteVarOpen}
        onOpenChange={setDeleteVarOpen}
        title="Удалить вариант?"
        description="Действие необратимо."
        onConfirm={async () => {
          const deletingId = selected.id;
          await deleteVariant(groupId, deletingId);
          const rest = variants.filter((v) => v.id !== deletingId);
          setVariants(rest);
          const next = rest[0] ?? null;
          if (next) {
            setSelected(next);
            setFields(
              Object.entries(next.attributes).map(([k, val]) => [k, String(val)] as [string, string]),
            );
            const sp = new URLSearchParams(params);
            sp.set('card', next.id);
            setParams(sp, { replace: true });
          } else {
            navigate('/');
          }
        }}
      />
    </div>
  );
}
