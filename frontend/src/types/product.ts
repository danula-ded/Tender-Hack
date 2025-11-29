export type ProductStatus = 'new' | 'in_review' | 'approved' | 'rejected';

export type ProductVariant = {
  id: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  attributes: Record<string, string | number | boolean>;
  status: ProductStatus;
};

export type ProductGroup = {
  id: string; // group id
  title: string;
  mainImageUrl?: string;
  variants: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductFilters = {
  query?: string;
  status?: ProductStatus[];
  hasImage?: boolean;
};

export type Pagination = {
  page: number;
  pageSize: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateProductPayload = {
  title: string;
  variant?: Partial<ProductVariant>;
  groupId?: string; // optional to place into a specific group
};

export type UpdateProductPayload = Partial<ProductGroup> & {
  id: string;
};
