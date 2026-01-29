const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN || ''}/api/v1`;

let authToken = localStorage.getItem('authToken') || null;

export const setAuthToken = (token) => {
    authToken = token || null;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    const resp = await fetch(`${API_BASE}${path}`, {
        credentials: 'omit',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });

    let body = null;
    try {
        body = await resp.json();
    } catch (_) {
        body = null;
    }

    if (!resp.ok) {
        const message = body?.error?.message || body?.message || 'Erro ao chamar API';
        const error = new Error(message);
        error.status = resp.status;
        error.body = body;
        throw error;
    }

    return body;
}

export const get = (path) => request(path, { method: 'GET' });
export const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data || {}) });
export const del = (path) => request(path, { method: 'DELETE' });

export default request;
