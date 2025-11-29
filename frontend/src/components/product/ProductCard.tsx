import * as React from 'react';
import { Copy, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ProductGroup } from '@/types/product';
import { useProductsStore } from '@/hooks/use-products-store';

export function ProductCard({ group }: { group: ProductGroup }) {
  const navigate = useNavigate();
  const deleteProduct = useProductsStore((s) => s.deleteProduct);
  const duplicateProduct = useProductsStore((s) => s.duplicateProduct);
  const [openDel, setOpenDel] = React.useState(false);

  const v = group.variants?.[0];

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved':
        return 'var(--green)';
      case 'rejected':
        return 'var(--danger)';
      case 'in_review':
        return 'var(--orange)';
      default:
        return 'var(--sea-clear)';
    }
  };

  return (
    <div className="border-muted bg-card text-card-foreground group rounded-lg border p-3 transition-shadow hover:shadow-xs">
      <div className="flex items-start gap-3">
        <div className="size-16 overflow-hidden rounded-md bg-[var(--pale-blue)]">
          {v?.imageUrl ? (
            <img src={v.imageUrl} alt={group.title} className="size-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="truncate font-medium" title={group.title}>
              {group.title}
            </div>
            <div className="flex items-center gap-2">
              {v?.status ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs text-white"
                  style={{ backgroundColor: statusColor(v.status) }}
                >
                  {v.status}
                </span>
              ) : null}
              <span className="text-xs opacity-70">ID: {group.id}</span>
            </div>
          </div>
          <div className="text-xs opacity-80">
            {v && v.attributes
              ? Object.entries(v.attributes)
                  .slice(0, 3)
                  .map(([k, val]) => (
                    <span key={k} className="mr-2">
                      {k}: {String(val)}
                    </span>
                  ))
              : 'Нет параметров'}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/product/${group.id}${v ? `?card=${encodeURIComponent(v.id)}` : ''}`)
              }
            >
              <Edit className="mr-1 size-4" /> Редактировать
            </Button>
            <Button size="sm" variant="outline" onClick={async () => void duplicateProduct(group)}>
              <Copy className="mr-1 size-4" /> Дублировать
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setOpenDel(true)}>
              <Trash2 className="mr-1 size-4" /> Удалить
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title="Удалить карточку?"
        description="Действие необратимо."
        onConfirm={async () => {
          await deleteProduct(group.id);
        }}
      />
    </div>
  );
}
