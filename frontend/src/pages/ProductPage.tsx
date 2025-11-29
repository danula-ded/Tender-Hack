import * as React from 'react';
import { useParams } from 'react-router-dom';

import { ProductDetail } from '@/components/product/ProductDetail';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <ProductDetail groupId={id} />
    </div>
  );
}
