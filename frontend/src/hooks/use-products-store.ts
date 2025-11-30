// frontend/src/hooks/use-products-store.ts
import { create } from 'zustand';
import axios from 'axios';
import { PATHS } from '@/config/paths';

export const useProductsStore = create((set, get) => ({
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
    fetchGroups: async (reset = false) => {
        set({ loading: true });
        const { query, pageSize, page } = get();
        const offset = (page - 1) * pageSize;
        const res = await axios.get(PATHS.groups.list, { params: { query, offset, limit: pageSize } });
        set({
            groups: reset ? res.data.groups : [...get().groups, ...res.data.groups],
            total: res.data.total,
            initialized: true,
            loading: false,
        });
    },
    fetchGroup: async (id) => {
        const res = await axios.get(PATHS.groups.get(id));
        set({ currentGroup: res.data });
        return res.data;
    },
    setQuery: (q) => set({ query: q }),

    async upload(file: File, signal?: AbortSignal) {
        set({ uploading: true, uploadProgress: 0 });
        const formData = new FormData();
        formData.append('file', file);               // ← важно именно имя "file"
        // aggregated=false по умолчанию (всегда агрегируем)
        formData.append('aggregated', 'false');

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
            // ← Вот здесь ловим warnings и передаём в FileDrop через store или напрямую
            if (response.data.warnings && response.data.warnings.length > 0) {
                // Можно добавить в store новое поле warnings, или использовать глобальный toast
                // Но пока просто пробросим через локальное состояние в FileDrop
                // Поэтому лучше — добавить в store:
                set({ lastUploadWarnings: response.data.warnings });
            }

            if (response.data.status === "ok") {
                await get().fetchGroups(true);
            }
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
    reaggregate: async (strictness) => {
        await axios.post(PATHS.groups.reaggregate, null, { params: { strictness } });
        get().fetchGroups(true);
    },
    rateGroup: async (groupId, score) => {
        await axios.post(PATHS.groups.rate(groupId), { score });
    },
    deleteGroup: async (groupId) => {
        await axios.delete(PATHS.groups.delete(groupId));
        get().fetchGroups(true);
    },
    createProduct: async (productData) => {
        const res = await axios.post(PATHS.products.create, productData);
        return res.data;
    },
    updateVariant: async (groupId, productData) => {
        await axios.put(PATHS.products.update(productData.id), productData);
    },
    deleteVariant: async (groupId, productId) => {
        await axios.delete(PATHS.products.delete(productId));
    },
}));