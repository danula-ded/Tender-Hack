import * as React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import MainPage from '@/pages/MainPage';
import ProductPage from '@/pages/ProductPage';
import CreateProduct from '@/pages/CreateProduct';
import { useProductsStore } from '@/hooks/use-products-store';

function AppShell() {
  const productsRaw = useProductsStore((s) => s.products);
  const products = productsRaw ?? [];
  const hasData = (Array.isArray(products) ? products.length : 0) > 0;
  const loading = useProductsStore((s) => s.loading);


  return (
    <SidebarProvider>
      <div className="min-h-svh w-full">
        {hasData ? <Sidebar /> : null}
        <SidebarInset>
          <header className="border-b bg-background/60 sticky top-0 z-10 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
              {hasData ? <SidebarTrigger /> : null}
              <Link to="/" className="font-semibold">
                Каталог
              </Link>
              {hasData ? (
                <div className="ml-auto">
                  <Link to="/create" className="text-sm underline underline-offset-4">
                    Создать карточку
                  </Link>
                </div>
              ) : null}
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route
                path="/product/:id"
                element={hasData || loading ? <ProductPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/create"
                element={hasData || loading ? <CreateProduct /> : <Navigate to="/" replace />}
              />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
