// frontend/src/components/sidebar/Sidebar.tsx
import * as React from 'react';
import {
    Sidebar as UISidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { Filters } from '@/components/sidebar/Filters';
import { FileSwitcher } from '@/components/sidebar/FileSwitcher';

export function Sidebar() {
    return (
        <UISidebar>
            <SidebarHeader>
                <FileSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <Filters />
                </SidebarGroup>
            </SidebarContent>
        </UISidebar>
    );
}