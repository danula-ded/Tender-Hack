// frontend/src/components/ReaggregateSliceModal.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import axios from 'axios';
import { PATHS } from '@/config/paths';

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    selectedProductIds: number[];
}

export function ReaggregateSliceModal({ open, onOpenChange, selectedProductIds }: Props) {
    const [strictness, setStrictness] = useState(0.7);
    const [loading, setLoading] = useState(false);

    const handle = async () => {
        setLoading(true);
        await axios.post(PATHS.groups.reaggregateSlice, { product_ids: selectedProductIds }, { params: { strictness } });
        setLoading(false);
        onOpenChange(false);
        window.location.reload(); // или обнови через store
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Переагрегировать выбранный пул ({selectedProductIds.length} товаров)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label>Строгость</label>
                        <input
                            type="range"
                            min="0" max="100" step="1"
                            value={strictness * 100}
                            onChange={e => setStrictness(e.target.valueAsNumber / 100)}
                            className="w-full"
                        />
                        <span>{(strictness * 100).toFixed(0)}%</span>
                    </div>
                    <Button onClick={handle} disabled={loading}>
                        {loading ? 'Обработка...' : 'Переагрегировать пул'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}