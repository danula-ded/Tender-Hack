// frontend/src/config/paths.ts
// Фиксим: базовый хост и путь '/api' разделены.
// VITE_API_URL должен быть базовым хостом (например, http://backend:8000)
// В дев-прокси значение может быть пустым, тогда используем относительный '/api'.
const API_HOST = (import.meta as any)?.env?.VITE_API_URL || '';
export const API_BASE = API_HOST ? `${API_HOST}/api` : '/api';
export const PATHS = {
    base: API_BASE,
    health: API_HOST ? `${API_HOST}/health` : '/health',
    upload: `${API_BASE}/upload`,
    download: `${API_BASE}/download`,
    groups: {
        aggregate: `${API_BASE}/groups/aggregate`,
        reaggregate: `${API_BASE}/groups/reaggregate`,
        reaggregateSlice: `${API_BASE}/groups/reaggregate-slice`,
        list: `${API_BASE}/groups`,
        get: (id: string) => `${API_BASE}/groups/${id}`,
        rate: (id: string) => `${API_BASE}/groups/${id}/rate`,
        delete: (id: string) => `${API_BASE}/groups/${id}`,
        move: (id: string) => `${API_BASE}/groups/${id}/move`,
    },
    products: {
        list: `${API_BASE}/products`,
        get: (id: string | number) => `${API_BASE}/products/${id}`,
        create: `${API_BASE}/products`,
        update: (id: string | number) => `${API_BASE}/products/${id}`,
        delete: (id: string | number) => `${API_BASE}/products/${id}`,
    },
    variants: {
        get: (groupId: string, variantId: string) => `${API_BASE}/products/${groupId}/variants/${variantId}`,
    },
    uploadStatus: (taskId: string) => `${API_BASE}/upload-status/${taskId}`,
} as const;