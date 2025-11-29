import axios, { type AxiosInstance } from 'axios';

import type {
  CreateProductPayload,
  PagedResult,
  ProductFilters,
  ProductGroup,
  UpdateProductPayload,
} from '@/types/product';

const baseURL = import.meta.env?.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

export async function getProducts(
  filters: ProductFilters & { page: number; pageSize: number },
): Promise<PagedResult<ProductGroup>> {
  const { page, pageSize, ...rest } = filters;
  const { data } = await apiClient.get<PagedResult<ProductGroup>>('/products', {
    params: { ...rest, page, pageSize },
  });
  return data;
}

export async function getProduct(id: string): Promise<ProductGroup> {
  const { data } = await apiClient.get<ProductGroup>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductGroup> {
  const { data } = await apiClient.post<ProductGroup>('/products', payload);
  return data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductGroup> {
  const { data } = await apiClient.put<ProductGroup>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<{ success: true }> {
  const { data } = await apiClient.delete<{ success: true }>(`/products/${id}`);
  return data;
}

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ taskId: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ taskId: string }>('/upload', form, {
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
  const res = await apiClient.get('/aggregated/download', {
    params: fileId ? { fileId } : undefined,
    responseType: 'blob',
  });
  return res.data as Blob;
}
