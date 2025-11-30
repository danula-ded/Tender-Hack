// frontend/src/components/file/FileDrop.tsx
import * as React from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';

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
    const { accept = '.xlsx,.xls', className } = props;
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);

    const uploading = useProductsStore((s) => s.uploading);
    const uploadProgress = useProductsStore((s) => s.uploadProgress);
    const upload = useProductsStore((s) => s.upload);

    const lastUploadWarnings = useProductsStore((s) => s.lastUploadWarnings);

    // ← Новое состояние для warnings
    const [uploadWarnings, setUploadWarnings] = React.useState<string[]>([]);
    const [uploadError, setUploadError] = React.useState<string | null>(null);

    const abortRef = React.useRef<AbortController | null>(null);

    const resetUploadState = () => {
        setUploadWarnings([]);
        setUploadError(null);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        resetUploadState();
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            resetUploadState();
            handleUpload(file);
        }
    };

    const handleUpload = async (file: File) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            await upload(file, abortRef.current.signal);
            // Успешно — предупреждения придут в store, если будут
            // Но мы их пока не читаем из store — лучше ловить прямо здесь
            // Поэтому модифицируем upload в store (см. ниже)
        } catch (err: any) {
            if (err?.name === 'CanceledError') return;
            setUploadError(err?.response?.data?.detail || err?.message || 'Неизвестная ошибка');
        }
    };

    //// ← Подписываемся на изменения в store (если upload вернёт warnings)
    //React.useEffect(() => {
    //    const unsubscribe = useProductsStore.subscribe((state) => {
    //        // Это сработает после успешного ответа от /api/upload
    //        // (если в store добавим поле lastUploadResponse)
    //        // Но проще — модифицировать upload в store
    //    });
    //    return unsubscribe;
    //}, []);
    React.useEffect(() => {
        if (lastUploadWarnings.length > 0) {
            setUploadWarnings(lastUploadWarnings);
            useProductsStore.setState({ lastUploadWarnings: [] }); // очистим
        }
    }, [lastUploadWarnings]);

    return (
        <div className={cn('flex w-full flex-col items-center justify-center gap-6', className)}>
            {/* === Ошибки и предупреждения === */}
            {uploadError && (
                <div className="w-full max-w-2xl rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                        <div>
                            <p className="font-medium">Ошибка загрузки</p>
                            <p className="mt-1">{uploadError}</p>
                        </div>
                        <button
                            onClick={() => setUploadError(null)}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {uploadWarnings.length > 0 && (
                <div className="w-full max-w-2xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                        <div>
                            <p className="font-medium">Предупреждения при загрузке</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {uploadWarnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => setUploadWarnings([])}
                            className="ml-auto text-amber-600 hover:text-amber-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* === Прогресс или дроп-зона === */}
            {uploading ? (
                <ProgressBar
                    value={uploadProgress}
                    text="Обработка файла и агрегация..."
                    onCancel={() => abortRef.current?.abort()}
                />
            ) : (
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
                        'w-full max-w-2xl cursor-pointer rounded-2xl p-10 transition-all',
                        dragOver
                            ? 'border-dashed border-[var(--sea-clear)] bg-[var(--sea-clear)]/10'
                            : 'border-dashed border-[var(--gray-blue)]',
                    )}
                >
                    <Upload className="mx-auto mb-4 h-12 w-12 text-[var(--main-blue)]" />
                    <p className="mb-2 text-lg font-semibold" style={{ color: 'var(--black)' }}>
                        Перетащите Excel-файл сюда
                    </p>
                    <p className="mb-6 text-sm" style={{ color: 'var(--pale-black)' }}>
                        или нажмите для выбора файла (.xlsx)
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
                        size="lg"
                        onClick={() => inputRef.current?.click()}
                        style={{ backgroundColor: 'var(--main-blue)' }}
                    >
                        Выбрать файл
                    </Button>
                </div>
            )}
        </div>
    );
}