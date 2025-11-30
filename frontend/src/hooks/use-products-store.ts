// frontend/src/hooks/use-products-store.ts
import { create } from 'zustand';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { PATHS } from '@/config/paths';

type Group = {
  id: string;
  name: string;
  representative_id: number;
  product_ids: number[];
  representative_image_url?: string;
  score?: number;
  user_score?: number | null;
  significant_features?: string[];
  products?: any[];
};

type ProductsState = {
  groups: Group[];
  lastUploadWarnings: string[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  query: string;
  currentGroup?: Group;
  uploading: boolean;
  uploadProgress: number;
  initialized: boolean;
  viewMode: 'cards' | 'table';
  fetchGroups: (reset?: boolean) => Promise<void>;
  fetchGroup: (id: string) => Promise<Group | undefined>;
  getProduct: (productId: number | string) => Promise<any>;
  setQuery: (q: string) => void;
  setViewMode: (mode: 'cards' | 'table') => void;
  upload: (file: File, signal?: AbortSignal) => Promise<void>;
  reaggregate: (strictness: number) => Promise<void>;
  reaggregateSlice: (productIds: number[], strictness: number) => Promise<void>;
  rateGroup: (groupId: string, score: number) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  deleteProduct: (groupId: string) => Promise<void>;
  createProduct: (productData: any) => Promise<number>;
  updateVariant: (groupId: string, productData: any) => Promise<void>;
  deleteVariant: (groupId: string, productId: number | string) => Promise<void>;
  moveProductToGroup: (groupId: string, productId: number, targetGroupId: string) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  groups: [],
  lastUploadWarnings: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  query: '',
  currentGroup: undefined,
  uploading: false,
  uploadProgress: 0,
  initialized: false,
  viewMode: 'cards',
  async fetchGroups(reset = false) {
    set({ loading: true, ...(reset ? { page: 1 } : {}) });
    const { query, pageSize, page } = get();
    const pageToFetch = reset ? 1 : page;
    const offset = (pageToFetch - 1) * pageSize;
    try {
      const res = await axios.get<any[]>(PATHS.groups.list, { params: { query, offset, limit: pageSize } });
      // Map backend format to Group
      const data: Group[] = Array.isArray(res.data)
        ? res.data.map((g: any) => ({
          id: g.group_id ?? g.id ?? String(g.groupId ?? ''),
          name: g.name ?? '',
          representative_id: Array.isArray(g.products) && g.products.length > 0 ? Number(g.products[0].product_id) : 0,
          product_ids: Array.isArray(g.products) ? g.products.map((p: any) => Number(p.product_id)) : [],
          representative_image_url: Array.isArray(g.products) && g.products.length > 0 ? g.products[0]?.image_url : undefined,
          score: g.score,
          user_score: g.user_score,
          significant_features: g.significant_features,
          products: g.products ?? [],
        }))
        : [];
      const prev = get().groups;
      const merged = reset ? data : [...prev, ...data];
      const hasMore = data.length >= pageSize;
      set({
        groups: merged,
        total: hasMore ? merged.length + 1 : merged.length,
        initialized: true,
        loading: false,
      });
    } catch (_err) {
      // On error (e.g., backend down) stop loading so UI can render cold-start state
      set({ loading: false, initialized: true });
    }
  },
  async fetchGroup(id: string) {
    const res = await axios.get<Group | undefined>(PATHS.groups.get(id));
    set({ currentGroup: res.data });
    return res.data;
  },
  async getProduct(productId: number | string) {
    const res = await axios.get(PATHS.products.get(productId));
    return res.data;
  },
  setQuery: (q: string) => set({ query: q, page: 1 }),
  setViewMode: (mode) => set({ viewMode: mode }),

  async upload(file: File, signal?: AbortSignal) {
    set({ uploading: true, uploadProgress: 0 });
    const formData = new FormData();
    formData.append('file', file);               // ← важно именно имя "file"

    try {
      const response = await axios.post(PATHS.upload, formData, {
        signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            set({ uploadProgress: Math.round((evt.loaded * 100) / evt.total) });
          }
        },
      });
      if (response.data?.warnings && response.data.warnings.length > 0) {
        set({ lastUploadWarnings: response.data.warnings });
      }
      await get().fetchGroups(true);
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        return;
      }

      const error = err as AxiosError;
      throw error;
    } finally {
      set({ uploading: false, uploadProgress: 0 });
    }

  },
  async reaggregate(strictness: number) {
    await axios.post(PATHS.groups.reaggregate, null, { params: { strictness } });
    void get().fetchGroups(true);
  },
  async reaggregateSlice(productIds: number[], strictness: number) {
    await axios.post(PATHS.groups.reaggregateSlice, { product_ids: productIds }, { params: { strictness } });
    void get().fetchGroups(true);
  },
  async rateGroup(groupId: string, score: number) {
    await axios.post(PATHS.groups.rate(groupId), null, { params: { score } });
  },
  async deleteGroup(groupId: string) {
    await axios.delete(PATHS.groups.delete(groupId));
    void get().fetchGroups(true);
  },
  async deleteProduct(groupId: string) {
    await axios.delete(PATHS.groups.delete(groupId));
    void get().fetchGroups(true);
  },
  async createProduct(productData: any) {
    const payload = {
      name: productData?.name ?? '',
      model: productData?.model ?? null,
      manufacturer: productData?.manufacturer ?? null,
      country: productData?.country ?? null,
      category_id: productData?.category_id ?? null,
      category_name: productData?.category_name ?? null,
      image_url: productData?.image_url ?? productData?.imageUrl ?? null,
      characteristics: productData?.characteristics ?? productData?.attributes ?? null,
    };
    const res = await axios.post(PATHS.products.create, payload);
    return Number(res.data?.id ?? 0);
  },
  async updateVariant(_groupId: string, productData: any) {
    const id = (productData as any).id;
    const body: any = {};
    if (productData.name !== undefined) body.name = productData.name;
    if (productData.imageUrl !== undefined) body.image_url = productData.imageUrl;
    if (productData.attributes !== undefined) body.characteristics = productData.attributes;
    await axios.put(PATHS.products.update(id), body);
  },
  async deleteVariant(_groupId: string, productId: number | string) {
    await axios.delete(PATHS.products.delete(productId));
  },
  async moveProductToGroup(groupId: string, productId: number, targetGroupId: string) {
    await axios.post(PATHS.groups.move(groupId), { target_group_id: targetGroupId }, { params: { product_id: productId } });
  },
}));