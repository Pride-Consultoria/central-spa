const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN || ''}/api/v1`;
const CSRF_COOKIE_PATH = `${API_ORIGIN || ''}/sanctum/csrf-cookie`;
const XSRF_COOKIE_NAME = 'XSRF-TOKEN';

let csrfRequest = null;

function parseCookie(cookieString, name) {
    if (!cookieString) return null;
    const prefix = `${name}=`;
    return cookieString
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.startsWith(prefix))
        .map((part) => part.slice(prefix.length))
        .map((value) => decodeURIComponent(value))
        .shift() || null;
}

async function ensureCsrfCookie() {
    if (!CSRF_COOKIE_PATH) return;
    if (csrfRequest) {
        return csrfRequest;
    }

    csrfRequest = fetch(CSRF_COOKIE_PATH, {
        method: 'GET',
        credentials: 'include',
    }).then((resp) => {
        if (!resp.ok) {
            throw new Error('Não foi possível sincronizar o token CSRF.');
        }
        return resp;
    }).finally(() => {
        csrfRequest = null;
    });

    return csrfRequest;
}

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
    const { headers: customHeaders = {}, signal, ...rest } = options;

    if (method !== 'GET') {
        await ensureCsrfCookie();
    }

    const xsrfToken = parseCookie(typeof document !== 'undefined' ? document.cookie : '', XSRF_COOKIE_NAME);

    const resp = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            ...customHeaders,
        },
        signal,
        ...rest,
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

export const get = (path, options = {}) => request(path, { method: 'GET', ...options });
export const post = (path, data, options = {}) =>
    request(path, { method: 'POST', body: JSON.stringify(data || {}), ...options });
export const put = (path, data, options = {}) =>
    request(path, { method: 'PUT', body: JSON.stringify(data || {}), ...options });
export const del = (path, options = {}) => request(path, { method: 'DELETE', ...options });

export default request;
