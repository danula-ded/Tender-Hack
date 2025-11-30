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
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    (async () => {
      for (const f of files) {
        try {
          await upload(f);
          console.log("Даные отправленны на агрегацию");
        } catch (err) {
          console.error(err);
        }
      }
    })();
  };

  return (
    <div className="p-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-black focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          >
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
          <DropdownMenuItem
            className="gap-2 p-2 focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={onUploadClick}
            disabled={uploading}
          >
            <Download className="size-4" />
            {uploading ? 'Загрузка…' : 'Загрузить Excel (.xlsx)'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 p-2 focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={onDownload}
            disabled={downloading}
          >
            <UploadIcon className="size-4" />
            {downloading ? 'Загрузка…' : 'Скачать агрегированные данные'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
