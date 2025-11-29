export const API_BASE = import.meta.env?.VITE_API_URL || '/api';

export const PATHS = {
  base: API_BASE,
  health: `${API_BASE}/health`,
  upload: `${API_BASE}/upload`,
  uploadStatus: (taskId: string) => `${API_BASE}/upload/status/${taskId}`,
  products: {
    list: `${API_BASE}/products`, // GET with q, limit, offset
    get: (id: string) => `${API_BASE}/products/${id}`,
    update: (id: string) => `${API_BASE}/products/${id}`,
    delete: (id: string) => `${API_BASE}/products/${id}`,
    variants: {
      create: (productId: string) => `${API_BASE}/products/${productId}/variants`,
      update: (productId: string, variantId: string) =>
        `${API_BASE}/products/${productId}/variants/${variantId}`,
      delete: (productId: string, variantId: string) =>
        `${API_BASE}/products/${productId}/variants/${variantId}`,
    },
  },
  groups: {
    generate: `${API_BASE}/groups/generate`,
    list: `${API_BASE}/groups`,
    get: (id: string) => `${API_BASE}/groups/${id}`,
  },
  aggregated: {
    // Adjust to your backend route when implemented
    download: `${API_BASE}/aggregated/download`,
  },
} as const;
