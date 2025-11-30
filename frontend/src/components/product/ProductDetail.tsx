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
  const moveProductToGroup = useProductsStore((s) => s.moveProductToGroup);

  const [selected, setSelected] = React.useState<ProductVariant | null>(null);
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  const [fields, setFields] = React.useState<Array<[string, string]>>([]);
  const [title, setTitle] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteVarOpen, setDeleteVarOpen] = React.useState(false);

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
        params.set('card', v.id);
        setParams(params, { replace: true });
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

  // функция перемещения товара между группами будет добавлена позже при необходимости

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
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-1 size-4" /> Удалить карточку
          </Button>
          <Button variant="destructive" onClick={() => setDeleteVarOpen(true)}>
            <Trash2 className="mr-1 size-4" /> Удалить вариант
          </Button>
          <Button onClick={onSave}>
            <Save className="mr-1 size-4" /> Сохранить
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
              params.set('card', e.target.value);
              setParams(params, { replace: true });
            }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.sku || v.id}
              </option>
            ))}
          </select>
          <Button
            className="mt-2 w-full"
            variant="outline"
            onClick={() => {
              void (async () => {
                const newId = await createProduct({ name: 'Новый вариант' });
                if (newId) {
                  await moveProductToGroup(groupId, newId, groupId);
                  const p = await getProduct(newId);
                  const newVar: ProductVariant = {
                    id: String(p.id),
                    name: p.name || 'Новый вариант',
                    attributes: p.characteristics_dict || {},
                    status: selected.status,
                    imageUrl: p.image_url,
                  };
                  setVariants((arr) => [...arr, newVar]);
                  params.set('card', newVar.id);
                  setParams(params, { replace: true });
                  setSelected(newVar);
                  setFields([]);
                }
              })();
            }}
          >
            <Plus className="mr-1 size-4" /> Создать вариант
          </Button>
        </div>

        <div className="flex-1">
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
          await deleteVariant(groupId, selected.id);
          const rest = variants.filter((v) => v.id !== selected.id);
          setVariants(rest);
          const next = rest[0];
          if (next) {
            params.set('card', next.id);
            setParams(params, { replace: true });
          } else {
            navigate('/');
          }
        }}
      />
    </div>
  );
}
