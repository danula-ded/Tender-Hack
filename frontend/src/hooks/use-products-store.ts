import { create } from 'zustand';

import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  getProduct as apiGetProduct,
  getProducts as apiGetProducts,
  updateProduct as apiUpdateProduct,
} from '@/services/api';
import { uploadFile as svcUploadFile } from '@/services/upload';
import type {
  CreateProductPayload,
  PagedResult,
  ProductFilters,
  ProductGroup,
  ProductVariant,
} from '@/types/product';

export type ProductsState = {
  products: ProductGroup[];
  total: number;
  page: number;
  pageSize: number;
  infinite: boolean;
  loading: boolean;
  loadingMore: boolean;
  query: string;
  filters: ProductFilters;
  currentGroup?: ProductGroup;
  uploading: boolean;
  uploadProgress: number;
  initialized: boolean;

  // actions
  fetchProducts: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchGroup: (id: string) => Promise<ProductGroup | undefined>;
  setQuery: (q: string) => void;
  setInfinite: (v: boolean) => void;
  setPageSize: (n: number) => void;
  createProduct: (payload: CreateProductPayload) => Promise<ProductGroup>;
  deleteProduct: (id: string) => Promise<void>;
  duplicateProduct: (group: ProductGroup) => Promise<ProductGroup>;
  updateVariant: (groupId: string, variant: ProductVariant) => Promise<void>;
  deleteVariant: (groupId: string, variantId: string) => Promise<void>;
  upload: (file: File, signal?: AbortSignal) => Promise<void>;
};

export const useProductsStore = create<ProductsState>()((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  pageSize: 20,
  infinite: true,
  loading: false,
  loadingMore: false,
  query: '',
  filters: {},
  currentGroup: undefined,
  uploading: false,
  uploadProgress: 0,
  initialized: false,

  async fetchProducts(reset = false) {
    const state = get();
    // Do not clear products immediately on reset to avoid hasData -> false flicker
    set({ loading: true, ...(reset ? { page: 1 } : {}) });
    const res: PagedResult<ProductGroup> = await apiGetProducts({
      ...(state.filters || {}),
      query: state.query || undefined,
      page: reset ? 1 : state.page,
      pageSize: state.pageSize,
    });
    set((s) => ({
      products: reset ? res.items : [...s.products, ...res.items],
      total: res.total,
      page: reset ? 1 : s.page,
      initialized: true,
      loading: false,
    }));
  },

  async fetchMore() {
    const s = get();
    if (s.loadingMore) return;
    const next = s.page + 1;
    if (s.products.length >= s.total) return;
    set({ loadingMore: true, page: next });
    const res = await apiGetProducts({
      ...(s.filters || {}),
      query: s.query || undefined,
      page: next,
      pageSize: s.pageSize,
    });
    set((prev) => ({
      products: [...prev.products, ...res.items],
      total: res.total,
      loadingMore: false,
    }));
  },

  async fetchGroup(id: string) {
    set({ loading: true });
    try {
      const grp = await apiGetProduct(id);
      set({ currentGroup: grp });
      return grp;
    } finally {
      set({ loading: false });
    }
  },

  setQuery(q: string) {
    set({ query: q });
  },

  setInfinite(v: boolean) {
    set({ infinite: v });
  },

  setPageSize(n: number) {
    set({ pageSize: n });
  },

  async createProduct(payload: CreateProductPayload) {
    const created = await apiCreateProduct(payload);
    set((s) => ({ products: [created, ...s.products], total: s.total + 1 }));
    return created;
  },

  async deleteProduct(id: string) {
    await apiDeleteProduct(id);
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
      total: Math.max(0, s.total - 1),
    }));
  },

  async duplicateProduct(group: ProductGroup) {
    const created = await apiCreateProduct({ title: `${group.title} (copy)` });
    set((s) => ({ products: [created, ...s.products], total: s.total + 1 }));
    return created;
  },

  async updateVariant(groupId: string, variant: ProductVariant) {
    // naive update by sending full group with replaced variant
    const s = get();
    const group = s.products.find((g) => g.id === groupId) || s.currentGroup;
    if (!group) return;
    const idx = group.variants.findIndex((v) => v.id === variant.id);
    const updatedGroup: ProductGroup = {
      ...group,
      variants:
        idx >= 0
          ? group.variants.map((v) => (v.id === variant.id ? { ...variant } : v))
          : [...group.variants, variant],
    };
    const saved = await apiUpdateProduct(groupId, { id: groupId, ...updatedGroup });
    // update in state
    set((s2) => ({
      currentGroup: s2.currentGroup?.id === groupId ? saved : s2.currentGroup,
      products: s2.products.map((g) => (g.id === groupId ? saved : g)),
    }));
  },

  async deleteVariant(groupId: string, variantId: string) {
    const s = get();
    const group = s.products.find((g) => g.id === groupId) || s.currentGroup;
    if (!group) return;
    const updatedGroup: ProductGroup = {
      ...group,
      variants: group.variants.filter((v) => v.id !== variantId),
    };
    const saved = await apiUpdateProduct(groupId, { id: groupId, ...updatedGroup });
    set((s2) => ({
      currentGroup: s2.currentGroup?.id === groupId ? saved : s2.currentGroup,
      products: s2.products.map((g) => (g.id === groupId ? saved : g)),
    }));
  },

  async upload(file: File, signal?: AbortSignal) {
    set({ uploading: true, uploadProgress: 0 });
    try {
      const res = await svcUploadFile(file, (p) => set({ uploadProgress: p }), signal);
      // optional: poll processing endpoint
      void res; // keep ts happy if not used
      // After upload, refresh list
      await get().fetchProducts(true);
    } catch (e) {
      // ignore abort errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = e as any;
      if (err?.name !== 'CanceledError' && err?.message !== 'canceled') {
        // swallow other errors, could add notification hook here
      }
    } finally {
      set({ uploading: false });
    }
  },
}));
