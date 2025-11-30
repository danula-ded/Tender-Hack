import * as React from 'react';
import { ChevronsUpDown, Download, Upload as UploadIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { PATHS } from '@/config/paths';
import { useProductsStore } from '@/hooks/use-products-store';

export function FileSwitcher() {
  const [downloading, setDownloading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const uploading = useProductsStore((s) => s.uploading);
  const upload = useProductsStore((s) => s.upload);

  const onDownload = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(PATHS.download, { responseType: 'blob' });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aggregated-data.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file);
    // store.upload уже обновит список групп на успех
    e.target.value = '';
  };

  return (
    <div className="p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-black">
            <div className="grid text-left text-sm leading-tight">
              <span className="truncate font-medium">Файлы</span>
              <span className="truncate text-xs opacity-70">Управление данными</span>
            </div>
            <ChevronsUpDown className="ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          align="start"
          side="right"
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Действия
          </DropdownMenuLabel>
          <DropdownMenuItem className="gap-2 p-2" onClick={onUploadClick} disabled={uploading}>
            <UploadIcon className="size-4" />
            {uploading ? 'Загрузка…' : 'Загрузить Excel (.xlsx)'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 p-2" onClick={onDownload} disabled={downloading}>
            <Download className="size-4" />
            {downloading ? 'Загрузка…' : 'Скачать агрегированные данные'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
