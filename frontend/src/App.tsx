import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { FileSwitcher } from './components/sidebar/FileSwitcher';
import MainPage from '@/pages/MainPage';
import ProductPage from '@/pages/ProductPage';
import CreateProduct from '@/pages/CreateProduct';
import { useProductsStore } from '@/hooks/use-products-store';

function AppShell() {
  const groups = useProductsStore((s) => s.groups);
  const hasData = Array.isArray(groups) && groups.length > 0;
  const loading = useProductsStore((s) => s.loading);
  const fetchGroups = useProductsStore((s) => s.fetchGroups);

  return (
    <div className="min-h-svh w-full flex flex-col">
      <header className="border-b bg-background/60 sticky top-0 z-10 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <FileSwitcher />
          <Link to="/" className="font-semibold">
            Каталог
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fetchGroups(true)}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route
            path="/product/:id"
            element={hasData || loading ? <ProductPage /> : <Navigate to="/" replace />}
          />
          <Route path="/create" element={<CreateProduct />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
