import * as React from 'react';

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Filters } from '@/components/sidebar/Filters';
import { SidebarItem } from '@/components/sidebar/SidebarItem';
import { useProductsStore } from '@/hooks/use-products-store';

export function Sidebar() {
  const productsRaw = useProductsStore((s) => s.products);
  const products = productsRaw ?? [];

  return (
    <UISidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-semibold">Категории/Группы</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Filters />
        </SidebarGroup>
        <SidebarGroup className="min-h-0 overflow-auto">
          <div className="max-h-[calc(100vh-240px)] space-y-1 overflow-auto px-2">
            {products.map((g) => (
              <SidebarItem key={g.id} group={g} />
            ))}
          </div>
        </SidebarGroup>
      </SidebarContent>
    </UISidebar>
  );
}
