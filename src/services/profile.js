import { get, put } from './api/client';

export const fetchProfile = () => get('/profile');
export const updateProfile = (payload) => put('/profile', payload);
export const uploadProfilePhoto = (file) => {
    const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const API_BASE = `${API_ORIGIN || ''}/api`;
    const token = localStorage.getItem('authToken');

    const form = new FormData();
    form.append('photo', file);

    return fetch(`${API_BASE}/profile/photo`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
    }).then(async (resp) => {
        const body = await resp.json().catch(() => null);
        if (!resp.ok) {
            const message = body?.error?.message || body?.message || 'Erro ao enviar imagem';
            const error = new Error(message);
            error.status = resp.status;
            error.body = body;
            throw error;
        }

        return body;
    });
};

const profileService = {
    fetchProfile,
    updateProfile,
    uploadProfilePhoto,
};

export default profileService;
