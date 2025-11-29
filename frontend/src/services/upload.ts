import { apiClient } from './api';

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ taskId: string }> {
  const form = new FormData();
  form.append('file', file);

  const { data } = await apiClient.post<{ taskId: string }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (evt) => {
      if (!onProgress || !evt.total) return;
      const percent = Math.round((evt.loaded * 100) / evt.total);
      onProgress(percent);
    },
  });

  return data;
}

export async function pollProcessing(
  taskId: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ done: boolean }> {
  // Optional polling endpoint if backend supports it
  const { data } = await apiClient.get<{ done: boolean; progress?: number }>(
    `/upload/status/${taskId}`,
    { signal },
  );
  if (onProgress && typeof data.progress === 'number') {
    onProgress(data.progress);
  }
  return { done: data.done };
}
