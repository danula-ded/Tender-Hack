import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { ProductGroup } from '@/types/product';

export function SidebarItem({ group }: { group: ProductGroup }) {
  const location = useLocation();
  const firstVariant = group.variants?.[0];
  const active = location.pathname.startsWith(`/product/${group.id}`);
  const to = `/product/${group.id}${firstVariant ? `?card=${encodeURIComponent(firstVariant.id)}` : ''}`;

  return (
    <Link
      to={to}
      className={
        'block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--pale-blue)]/60' +
        (active ? ' bg-[var(--pale-blue)] font-medium' : '')
      }
      title={group.title}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{group.title}</span>
        <span className="text-xs opacity-60">{group.variants?.length ?? 0}</span>
      </div>
    </Link>
  );
}
