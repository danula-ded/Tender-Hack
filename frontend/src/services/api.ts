import axios from 'axios';

import type {
  CreateProductPayload,
  PagedResult,
  ProductFilters,
  ProductGroup,
  UpdateProductPayload,
} from '@/types/product';
import { PATHS } from '@/config/paths';

const apiClient = axios.create({ withCredentials: true });

export async function getProducts(
  filters: ProductFilters & { page: number; pageSize: number },
): Promise<PagedResult<ProductGroup>> {
  const { page, pageSize, query, ...rest } = filters as ProductFilters & {
    page: number;
    pageSize: number;
    query?: string;
  };
  const limit = pageSize;
  const offset = (page - 1) * pageSize;
  const { data } = await apiClient.get<PagedResult<ProductGroup>>(PATHS.products.list, {
    params: { q: query, limit, offset, ...rest },
  });
  return data;
}

export async function getProduct(id: string): Promise<ProductGroup> {
  const { data } = await apiClient.get<ProductGroup>(PATHS.products.get(id));
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductGroup> {
  const { data } = await apiClient.post<ProductGroup>(PATHS.products.list, payload);
  return data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductGroup> {
  const { data } = await apiClient.put<ProductGroup>(PATHS.products.update(id), payload);
  return data;
}

export async function deleteProduct(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.delete<{ success: true }>(PATHS.products.delete(id));
  return data;
}

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ taskId: string }>
{
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ taskId: string }>(PATHS.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!onProgress || !evt.total) return;
      const percent = Math.round((evt.loaded * 100) / evt.total);
      onProgress(percent);
    },
  });
  return data;
}

export { apiClient };

export async function fetchAggregated(fileId?: string): Promise<Blob> {
  const res = await apiClient.get(PATHS.download, {
    // backend expects optional query 'slice_ids', keep compatibility if passed
    params: fileId ? { slice_ids: fileId } : undefined,
    responseType: 'blob',
  });
  return res.data as Blob;
}
