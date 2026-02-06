import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only remove token, don't redirect (App.tsx handles routing based on token)
            localStorage.removeItem('admin_token');
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// Marketing Campaigns API
export const marketingApi = {
    // Campaigns
    getCampaigns: (params?: { type?: string; status?: string; skip?: number; take?: number }) =>
        api.get('/marketing/campaigns', { params }),

    getCampaign: (id: string) =>
        api.get(`/marketing/campaigns/${id}`),

    createCampaign: (data: any) =>
        api.post('/marketing/campaigns', data),

    deleteCampaign: (id: string) =>
        api.delete(`/marketing/campaigns/${id}`),

    sendCampaign: (id: string) =>
        api.post(`/marketing/campaigns/${id}/send`),

    sendTestCampaign: (id: string, recipient: string) =>
        api.post(`/marketing/campaigns/${id}/test`, { recipient }),

    getCampaignStats: (id: string) =>
        api.get(`/marketing/campaigns/${id}/stats`),

    // User Targeting
    previewTargetedUsers: (filters: any) =>
        api.post('/marketing/users/preview', filters),

    countTargetedUsers: (filters: any) =>
        api.post('/marketing/users/count', filters),

    // Templates
    getTemplates: (type?: string) =>
        api.get('/marketing/templates', { params: { type } }),

    createTemplate: (data: any) =>
        api.post('/marketing/templates', data),

    updateTemplate: (id: string, data: any) =>
        api.patch(`/marketing/templates/${id}`, data),

    deleteTemplate: (id: string) =>
        api.delete(`/marketing/templates/${id}`),
};

export default api;
