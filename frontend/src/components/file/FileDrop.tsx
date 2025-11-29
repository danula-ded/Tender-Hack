import * as React from 'react';

import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useProductsStore } from '@/hooks/use-products-store';
import { cn } from '@/lib/utils';

export type FileDropProps = {
  onFile?: (file: File) => void | Promise<void>;
  accept?: string;
  className?: string;
};

export function FileDrop(props: FileDropProps) {
  const { accept = '*/*', className } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const uploading = useProductsStore((s) => s.uploading);
  const uploadProgress = useProductsStore((s) => s.uploadProgress);
  const upload = useProductsStore((s) => s.upload);
  const abortRef = React.useRef<AbortController | null>(null);

  // no-op

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    void upload(file as File, abortRef.current.signal);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (file) void upload(file, abortRef.current.signal);
  };

  return (
    <div className={cn('flex w-full flex-col items-center justify-center gap-6', className)}>
      {uploading ? (
        <ProgressBar
          value={uploadProgress}
          text="Uploading and processing..."
          onCancel={() => {
            abortRef.current?.abort();
          }}
        />
      ) : (
        <>
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'border-[3px] bg-[var(--pale-blue)]/40 text-center',
              'w-full max-w-2xl rounded-2xl p-10 transition-colors',
              dragOver
                ? 'border-dashed border-[var(--sea-clear)]'
                : 'border-dashed border-[var(--gray-blue)]',
            )}
          >
            <p className="mb-2 text-lg font-semibold" style={{ color: 'var(--black)' }}>
              Перетащите файл сюда
            </p>
            <p className="mb-6 text-sm" style={{ color: 'var(--pale-black)' }}>
              Либо выберите файл вручную
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={onChange}
            />
            <Button
              variant="default"
              onClick={() => inputRef.current?.click()}
              style={{ backgroundColor: 'var(--main-blue)' }}
            >
              Выбрать файл
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
