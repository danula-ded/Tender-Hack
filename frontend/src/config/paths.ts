// frontend/src/config/paths.ts
// Фиксим: исправляем на реальные backend ручки (/api/groups, /api/upload etc.)
// Удаляем неиспользуемые (products.list → groups.list)
export const API_BASE = import.meta.env?.VITE_API_URL || '/api';
export const PATHS = {
    base: API_BASE,
    health: `${API_BASE}/health`,
    upload: `${API_BASE}/upload`,
    download: `${API_BASE}/download`,
    groups: {
        aggregate: `${API_BASE}/groups/aggregate`,
        reaggregate: `${API_BASE}/groups/reaggregate`,
        list: `${API_BASE}/groups`,
        get: (id: string) => `${API_BASE}/groups/${id}`,
        rate: (id: string) => `${API_BASE}/groups/${id}/rate`,
        delete: (id: string) => `${API_BASE}/groups/${id}`,
    },
    variants: {
        get: (groupId: string, variantId: string) => `${API_BASE}/products/${groupId}/variants/${variantId}`,
    },
} as const;