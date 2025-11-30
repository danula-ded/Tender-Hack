// frontend/src/components/product/ProductCard.tsx
import * as React from 'react';
import { Edit, Trash2, Package } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProductsStore } from '@/hooks/use-products-store';

type GroupFromBackend = {
    id: string;
    name: string;
    representative_id: number;
    product_ids: number[];
    representative_image_url?: string;
    score?: number;
    user_score?: number | null;
    significant_features?: string[];
};

export function ProductCard({ group }: { group: GroupFromBackend }) {
    const navigate = useNavigate();
    const deleteGroup = useProductsStore((s) => s.deleteGroup);
    const rateGroup = useProductsStore((s) => s.rateGroup);
    const [openDel, setOpenDel] = React.useState(false);
    const [localScore, setLocalScore] = React.useState(group.user_score || 0);

    const variantCount = group.product_ids.length;
    const isGoodGroup = variantCount > 1;

    const handleRate = (newScore: number) => {
        setLocalScore(newScore);
        rateGroup(group.id, newScore);
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg border-2 hover:border-blue-200 cursor-pointer">
            <div onClick={() => navigate(`/product/${group.id}`)} className="block">
                <div className="bg-gray-100 border-b h-48 flex items-center justify-center relative overflow-hidden">
                    {group.representative_image_url ? (
                        <img
                            src={group.representative_image_url}
                            alt={group.name || `Группа ${group.id}`}
                            className="object-contain w-full h-full"
                            loading="lazy"
                        />
                    ) : (
                        <Package className="w-16 h-16 text-black/50" />
                    )}
                    {isGoodGroup && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                            {variantCount} вариантов
                        </Badge>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {group.name || 'Без названия'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-black/70">
                        <span>ID: {group.id}</span>
                    </div>
                    {/* Оценка */}
                    <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`text-xs cursor-pointer ${star <= localScore ? 'text-yellow-500' : 'text-gray-300'}`}
                                onClick={(e) => { e.stopPropagation(); handleRate(star); }}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                </CardContent>
            </div>
            <div className="px-4 pb-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/product/${group.id}`); }}>
                    <Edit className="w-4 h-4 mr-1" /> Открыть
                </Button>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setOpenDel(true); }}>
                    <Trash2 className="w-4 h-4 text-black" />
                </Button>
            </div>
            <ConfirmDialog open={openDel} onOpenChange={setOpenDel} title="Удалить группу?" onConfirm={() => deleteGroup(group.id)} />
        </Card>
    );
}