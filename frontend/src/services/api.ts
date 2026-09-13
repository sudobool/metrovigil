import axios from 'axios';
import { User, Scan, ScanDetail, DashboardStats } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const apiService = {
  // ── Authentication ──
  login: async (username: string, password: string, role: string) => {
    // No more silent "pretend login succeeded" fallback when the backend
    // is unreachable — that used to let anyone in without checking
    // anything. If the request fails (wrong password, backend down,
    // etc.) the error is now surfaced to the caller instead.
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
      role,
    });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ── Scanning ──
  uploadScan: async (
    file: File,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<ScanDetail> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ScanDetail>('/scan/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  getScan: async (scanId: number): Promise<ScanDetail> => {
    const response = await api.get<ScanDetail>(`/scan/${scanId}`);
    return response.data;
  },

  getScans: async (
    skip: number = 0,
    limit: number = 20,
    status?: string
  ): Promise<{ scans: Scan[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (status && status !== 'all') params.append('status', status);

    const response = await api.get<{ scans: Scan[]; total: number }>(`/scan/?${params.toString()}`);
    return response.data;
  },

  deleteScan: async (scanId: number): Promise<void> => {
    await api.delete(`/scan/${scanId}`);
  },

  // ── Dashboard ──
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getRecentScans: async (): Promise<Scan[]> => {
    const response = await api.get<Scan[]>('/dashboard/recent');
    return response.data;
  },

  getViolationsBreakdown: async (): Promise<
    { rule_number: string; count: number }[]
  > => {
    const response = await api.get<{ rule_number: string; count: number }[]>(
      '/dashboard/violations-breakdown'
    );
    return response.data;
  },

  // ── Reports ──
  // These download endpoints require a logged-in user, so we can't just
  // window.open() the URL (a plain browser navigation carries no
  // Authorization header). Instead we fetch the file through axios (which
  // attaches the bearer token via the interceptor above) and turn the
  // response into a real file download.
  downloadPdfReport: async (scanId: number) => {
    const response = await api.get(`/reports/${scanId}/pdf`, { responseType: 'blob' });
    downloadBlob(response.data, `metrovigil_report_${scanId}.pdf`);
  },

  downloadDocxReport: async (scanId: number) => {
    const response = await api.get(`/reports/${scanId}/docx`, { responseType: 'blob' });
    downloadBlob(response.data, `metrovigil_report_${scanId}.docx`);
  },
};
